const { User, Thread, Post, Category } = require('../models');

/**
 * User Controller
 * Handles user profile and profile-related operations
 */

/**
 * Show User Profile
 * Displays a user's profile with their activity
 */
exports.showProfile = async (req, res) => {
  try {
    const { username } = req.params;

    // Find user
    const user = await User.findOne({
      where: { username },
      attributes: ['id', 'username', 'displayName', 'createdAt']
    });

    if (!user) {
      return res.status(404).render('errors/404', {
        title: 'User Not Found',
        message: 'The requested user does not exist.'
      });
    }

    // Get counts
    const threadCount = await Thread.count({ where: { userId: user.id } });
    const postCount = await Post.count({ where: { userId: user.id } });

    // Get recent threads
    const recentThreads = await Thread.findAll({
      where: { userId: user.id },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name', 'slug']
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Get recent posts
    const recentPosts = await Post.findAll({
      where: { 
        userId: user.id,
        isFirstPost: false // Don't duplicate threads
      },
      include: [{
        model: Thread,
        as: 'thread',
        attributes: ['id', 'title', 'slug'],
        include: [{
          model: Category,
          as: 'category',
          attributes: ['slug']
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const isOwnProfile = req.session.user && req.session.user.id === user.id;

    res.render('pages/profile', {
      title: `${user.username}'s Profile`,
      profileUser: user,
      threadCount,
      postCount,
      recentThreads,
      recentPosts,
      isOwnProfile
    });
  } catch (error) {
    console.error('Error showing profile:', error);
    res.status(500).render('errors/500', {
      title: 'Error',
      message: 'Failed to load profile'
    });
  }
};

/**
 * Show Edit Profile Form
 * Displays form for user to edit their own profile
 */
exports.showEditProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'displayName']
    });

    res.render('pages/edit-profile', {
      title: 'Edit Profile',
      profileUser: user,
      errors: null
    });
  } catch (error) {
    console.error('Error showing edit profile:', error);
    res.status(500).render('errors/500', {
      title: 'Error',
      message: 'Failed to load edit form'
    });
  }
};
