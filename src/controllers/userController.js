const { User, Thread, Post, Category } = require('../models');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');

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

/**
 * Update Profile Validation
 * Validation rules for updating user profile
 */
exports.updateProfileValidation = [
  body('displayName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Display name must be 100 characters or less'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const userId = req.session.user.id;
      const user = await User.findOne({ 
        where: { 
          email: value,
          id: { [Op.ne]: userId }
        } 
      });
      if (user) {
        throw new Error('Email already in use');
      }
      return true;
    })
];

/**
 * Update Profile
 * Handles updating user profile information
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const errors = validationResult(req);

    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'displayName']
    });

    if (!errors.isEmpty()) {
      return res.render('pages/edit-profile', {
        title: 'Edit Profile',
        profileUser: user,
        errors: errors.array()
      });
    }

    const { displayName, email } = req.body;

    // Update user
    await user.update({
      displayName: displayName || user.username,
      email
    });

    // Update session
    req.session.user.email = email;

    req.flash('success', 'Profile updated successfully!');
    res.redirect(`/profile/${user.username}`);
  } catch (error) {
    console.error('Error updating profile:', error);
    req.flash('error', 'Failed to update profile.');
    res.redirect('/profile/edit');
  }
};
