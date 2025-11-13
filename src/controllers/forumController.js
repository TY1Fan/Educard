const { sequelize } = require('../config/database');
const { Category, Thread } = require('../models');

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
