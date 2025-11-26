const { sequelize } = require('../config/database');
const { Category, Thread, Post, User } = require('../models');
const { body, validationResult } = require('express-validator');
const { uniqueSlugFromDB } = require('../utils/slugify');

/**
 * Forum Controller
 * Handles forum-related operations including homepage, categories, threads, and posts
 */

/**
 * Show Homepage
 * Displays all forum categories with thread counts
 */
exports.showHome = async (req, res) => {
  try {
    // Fetch all categories with thread counts
    const categories = await Category.findAll({
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
      include: [{
        model: Thread,
        as: 'threads',
        attributes: [],
        required: false
      }],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('threads.id')), 'threadCount']
        ]
      },
      group: ['Category.id'],
      raw: false // Ensure we get model instances, not raw data
    });

    // Convert threadCount from string to number for each category
    const categoriesWithCounts = categories.map(category => {
      const categoryData = category.toJSON();
      categoryData.threadCount = parseInt(categoryData.threadCount) || 0;
      return categoryData;
    });

    res.render('pages/home', {
      title: 'Home - Educard Forum',
      categories: categoriesWithCounts
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      message: 'Failed to load categories. Please try again later.'
    });
  }
};

/**
 * Show Category Threads
 * Displays all threads within a specific category with pagination
 */
exports.showCategoryThreads = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    // Find category by slug
    const category = await Category.findOne({ where: { slug } });
    
    if (!category) {
      return res.status(404).render('errors/404', {
        title: 'Category Not Found',
        message: 'The requested category does not exist.'
      });
    }

    // Fetch threads with pagination and post counts
    const { count, rows: threads } = await Thread.findAndCountAll({
      where: { categoryId: category.id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'displayName']
        },
        {
          model: Post,
          as: 'posts',
          attributes: [],
          required: false
        }
      ],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('posts.id')), 'postCount']
        ]
      },
      group: ['Thread.id', 'author.id'],
      order: [
        ['isPinned', 'DESC'], // Pinned threads first
        ['updatedAt', 'DESC']  // Then by last activity
      ],
      limit,
      offset,
      subQuery: false,
      distinct: true
    });

    // Convert postCount from string to number
    const threadsWithCounts = threads.map(thread => {
      const threadData = thread.toJSON();
      threadData.postCount = parseInt(threadData.postCount) || 0;
      return threadData;
    });

    const totalPages = Math.ceil(count.length / limit);

    res.render('pages/category', {
      title: `${category.name} - Educard Forum`,
      category: category.toJSON(),
      threads: threadsWithCounts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      message: 'Failed to load threads. Please try again later.'
    });
  }
};

/**
 * Thread Creation Validation Rules
 * Validates title and content for new threads
 */
exports.createThreadValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Thread title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Thread content is required')
    .isLength({ min: 10, max: 10000 })
    .withMessage('Content must be between 10 and 10,000 characters')
];

/**
 * Show New Thread Form
 * Displays the form to create a new thread (requires authentication)
 */
exports.showNewThread = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Find category by slug
    const category = await Category.findOne({ where: { slug } });
    
    if (!category) {
      return res.status(404).render('errors/404', {
        title: 'Category Not Found',
        message: 'The requested category does not exist.'
      });
    }

    res.render('pages/new-thread', {
      title: `New Thread - ${category.name}`,
      category: category.toJSON(),
      errors: null,
      formData: {}
    });
  } catch (error) {
    console.error('Error showing new thread form:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      message: 'Failed to load the form. Please try again later.'
    });
  }
};

/**
 * Create New Thread
 * Handles the submission of a new thread (requires authentication)
 */
exports.createThread = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.session.user.id;
    
    // Find category by slug
    const category = await Category.findOne({ where: { slug } });
    
    if (!category) {
      return res.status(404).render('errors/404', {
        title: 'Category Not Found',
        message: 'The requested category does not exist.'
      });
    }

    // Check for validation errors from express-validator
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).render('pages/new-thread', {
        title: `New Thread - ${category.name}`,
        category: category.toJSON(),
        errors: errors.array(),
        formData: req.body
      });
    }

    const { title, content } = req.body;

    // Generate unique slug for the thread
    const threadSlug = await uniqueSlugFromDB(title, Thread, { categoryId: category.id });

    // Create thread and first post in a transaction
    const result = await sequelize.transaction(async (t) => {
      // Create the thread
      const thread = await Thread.create({
        categoryId: category.id,
        userId: userId,
        title: title.trim(),
        slug: threadSlug,
        isPinned: false,
        isLocked: false
      }, { transaction: t });

      // Create the first post
      await Post.create({
        threadId: thread.id,
        userId: userId,
        content: content.trim(),
        isFirstPost: true
      }, { transaction: t });

      return thread;
    });

    // Success - redirect to the new thread
    req.flash('success', 'Thread created successfully!');
    res.redirect(`/thread/${result.slug}`);
    
  } catch (error) {
    console.error('Error creating thread:', error);
    
    // Try to get category for error page
    let category;
    try {
      category = await Category.findOne({ where: { slug: req.params.slug } });
    } catch (err) {
      // If we can't get category, render 500 error
      return res.status(500).render('errors/500', {
        title: 'Server Error',
        message: 'Failed to create thread. Please try again later.'
      });
    }
    
    // If it's a validation error from Sequelize
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({ msg: err.message }));
      return res.status(400).render('pages/new-thread', {
        title: `New Thread - ${category.name}`,
        category: category.toJSON(),
        errors,
        formData: req.body
      });
    }
    
    // Generic error
    res.status(500).render('pages/new-thread', {
      title: `New Thread - ${category.name}`,
      category: category.toJSON(),
      errors: [{ msg: 'Failed to create thread. Please try again.' }],
      formData: req.body
    });
  }
};

/**
 * Show Thread
 * Displays a thread with all its posts, paginated
 */
exports.showThread = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const offset = (page - 1) * limit;

    // Find thread with category and author
    const thread = await Thread.findOne({
      where: { slug },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'createdAt']
        }
      ]
    });

    if (!thread) {
      return res.status(404).render('errors/404', {
        title: 'Thread Not Found',
        message: 'The requested thread does not exist.'
      });
    }

    // Fetch posts with pagination
    const { count, rows: posts } = await Post.findAndCountAll({
      where: { threadId: thread.id },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'createdAt']
      }],
      order: [['createdAt', 'ASC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.render('pages/thread', {
      title: `${thread.title} - Educard Forum`,
      thread,
      posts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).render('errors/500', {
      title: 'Error',
      message: 'Failed to load thread'
    });
  }
};

/**
 * Create Reply Validation
 * Validation rules for creating a reply to a thread
 */
exports.createReplyValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Reply must be 1-10,000 characters')
];

/**
 * Create Reply
 * Handles posting a reply to an existing thread
 */
exports.createReply = async (req, res) => {
  try {
    const { slug } = req.params;
    const errors = validationResult(req);
    
    // Find thread
    const thread = await Thread.findOne({ 
      where: { slug },
      include: [{ model: Category, as: 'category' }]
    });
    
    if (!thread) {
      return res.status(404).render('errors/404', {
        title: 'Thread Not Found',
        message: 'The requested thread does not exist.'
      });
    }

    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect(`/thread/${slug}`);
    }

    const { content } = req.body;
    const userId = req.session.user.id;

    // Create post
    await Post.create({
      threadId: thread.id,
      userId,
      content,
      isFirstPost: false
    });

    // Update thread's updatedAt to bump it to top
    await thread.update({ updatedAt: new Date() });

    req.flash('success', 'Reply posted successfully!');
    res.redirect(`/thread/${slug}`);
  } catch (error) {
    console.error('Error creating reply:', error);
    req.flash('error', 'Failed to post reply. Please try again.');
    res.redirect(`/thread/${req.params.slug}`);
  }
};

/**
 * Show Edit Post Form
 * Displays form for editing an existing post
 */
exports.showEditPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    const post = await Post.findByPk(id, {
      include: [{
        model: Thread,
        as: 'thread',
        include: [{ model: Category, as: 'category' }]
      }]
    });

    if (!post) {
      return res.status(404).render('errors/404', {
        title: 'Post Not Found',
        message: 'The requested post does not exist.'
      });
    }

    // Check ownership
    if (post.userId !== userId) {
      return res.status(403).render('errors/403', {
        title: 'Forbidden',
        message: 'You can only edit your own posts.'
      });
    }

    res.render('pages/edit-post', {
      title: 'Edit Post',
      post,
      errors: null
    });
  } catch (error) {
    console.error('Error showing edit post:', error);
    res.status(500).render('errors/500', {
      title: 'Error',
      message: 'Failed to load edit form'
    });
  }
};
