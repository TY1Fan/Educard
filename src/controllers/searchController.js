const { Op } = require('sequelize');
const { Thread, Post, User, Category } = require('../models');

/**
 * Display search results
 */
exports.search = async (req, res) => {
  try {
    const query = req.query.q || '';
    const category = req.query.category || '';
    const author = req.query.author || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    // If no search query, show empty search page
    if (!query.trim()) {
      return res.render('pages/search', {
        title: 'Search - Educard Forum',
        query: '',
        threads: [],
        posts: [],
        totalResults: 0,
        currentPage: page,
        totalPages: 0,
        category: '',
        author: '',
        categories: await Category.findAll({ order: [['displayOrder', 'ASC']] })
      });
    }

    // Build search conditions
    const searchConditions = {
      [Op.or]: [
        { title: { [Op.iLike]: `%${query}%` } }
      ]
    };

    // Add category filter if provided
    if (category) {
      searchConditions.categoryId = category;
    }

    // Add author filter if provided
    let authorCondition = {};
    if (author) {
      const authorUser = await User.findOne({
        where: { username: { [Op.iLike]: `%${author}%` } }
      });
      if (authorUser) {
        authorCondition = { userId: authorUser.id };
      }
    }

    // Search threads
    const threadResults = await Thread.findAndCountAll({
      where: { ...searchConditions, ...authorCondition },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'displayName']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Post,
          as: 'posts',
          attributes: ['id'],
          required: false
        }
      ],
      limit,
      offset,
      order: [['updatedAt', 'DESC']],
      distinct: true
    });

    // Search posts
    const postSearchConditions = {
      content: { [Op.iLike]: `%${query}%` }
    };

    if (author) {
      const authorUser = await User.findOne({
        where: { username: { [Op.iLike]: `%${author}%` } }
      });
      if (authorUser) {
        postSearchConditions.userId = authorUser.id;
      }
    }

    const postResults = await Post.findAll({
      where: postSearchConditions,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'displayName']
        },
        {
          model: Thread,
          as: 'thread',
          attributes: ['id', 'title', 'slug', 'categoryId'],
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name', 'slug']
            }
          ],
          where: category ? { categoryId: category } : undefined
        }
      ],
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    // Calculate pagination
    const totalResults = threadResults.count;
    const totalPages = Math.ceil(totalResults / limit);

    // Get all categories for filter dropdown
    const categories = await Category.findAll({
      order: [['displayOrder', 'ASC']]
    });

    res.render('pages/search', {
      title: `Search: ${query} - Educard Forum`,
      query,
      threads: threadResults.rows,
      posts: postResults,
      totalResults,
      currentPage: page,
      totalPages,
      category,
      author,
      categories
    });

  } catch (error) {
    console.error('Search error:', error);
    req.flash('error', 'An error occurred during search');
    res.redirect('/');
  }
};

/**
 * Helper function to highlight search terms in text
 */
exports.highlightSearchTerms = (text, query) => {
  if (!text || !query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

/**
 * Helper function to create excerpt from post content
 */
exports.createExcerpt = (content, query, maxLength = 200) => {
  if (!content) return '';
  
  // Try to find the search term and show context around it
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);
  
  if (index !== -1) {
    // Show context around the search term
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 150);
    let excerpt = content.substring(start, end);
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';
    
    return excerpt;
  }
  
  // If query not found, just show beginning
  return content.length > maxLength 
    ? content.substring(0, maxLength) + '...' 
    : content;
};
