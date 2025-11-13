const { sequelize } = require('../config/database');
const { Category, Thread, Post, User } = require('../models');

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
