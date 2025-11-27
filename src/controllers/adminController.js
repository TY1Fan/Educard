const { User, Category, Thread, Post, Notification } = require('../models');
const { Op } = require('sequelize');
const { getStats: getCacheStats, resetStats: resetCacheStats, cache } = require('../config/cache');

/**
 * Admin Controller
 * Handles admin dashboard and management operations
 */

/**
 * Show Admin Dashboard
 * Displays site statistics and recent activity
 */
exports.showDashboard = async (req, res) => {
  try {
    // Get site statistics
    const stats = await Promise.all([
      User.count(),
      Thread.count(),
      Post.count(),
      Category.count(),
      // Users registered in last 7 days
      User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Threads created in last 7 days
      Thread.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Posts created in last 7 days
      Post.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    const [
      totalUsers,
      totalThreads,
      totalPosts,
      totalCategories,
      newUsersThisWeek,
      newThreadsThisWeek,
      newPostsThisWeek
    ] = stats;

    // Get recent users (last 10)
    const recentUsers = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'username', 'displayName', 'email', 'role', 'createdAt']
    });

    // Get recent threads (last 10)
    const recentThreads = await Thread.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'displayName', 'role']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    // Get recent posts (last 10)
    const recentPosts = await Post.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'displayName', 'role']
        },
        {
          model: Thread,
          as: 'thread',
          attributes: ['id', 'title', 'slug']
        }
      ]
    });

    // Get category statistics
    const categoryStats = await Category.findAll({
      attributes: [
        'id',
        'name',
        'slug',
        [require('../config/database').sequelize.fn('COUNT', require('../config/database').sequelize.col('threads.id')), 'threadCount']
      ],
      include: [{
        model: Thread,
        as: 'threads',
        attributes: [],
        duplicating: false
      }],
      group: ['Category.id'],
      order: [[require('../config/database').sequelize.literal('threadCount'), 'DESC']],
      limit: 5,
      subQuery: false
    });

    res.render('pages/admin/dashboard', {
      title: 'Admin Dashboard',
      isAuthenticated: true,
      user: req.session.user,
      csrfToken: req.csrfToken(),
      stats: {
        totalUsers,
        totalThreads,
        totalPosts,
        totalCategories,
        newUsersThisWeek,
        newThreadsThisWeek,
        newPostsThisWeek
      },
      recentUsers,
      recentThreads,
      recentPosts,
      categoryStats
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    req.flash('error', 'Failed to load admin dashboard');
    res.redirect('/');
  }
};

/**
 * Show Users Management Page
 * Lists all users with filtering and actions
 */
exports.showUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;
    const role = req.query.role || null;
    const search = req.query.search || '';

    const where = {};
    if (role && ['user', 'moderator', 'admin'].includes(role)) {
      where.role = role;
    }

    // Add search filter for username or email
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { displayName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'username', 'displayName', 'email', 'role', 'isActive', 'isBanned', 'bannedAt', 'banReason', 'createdAt']
    });

    const totalPages = Math.ceil(count / limit);

    res.render('pages/admin/users', {
      title: 'User Management',
      isAuthenticated: true,
      user: req.session.user,
      csrfToken: req.csrfToken(),
      users,
      currentPage: page,
      totalPages,
      totalUsers: count,
      currentRole: role,
      searchQuery: search
    });
  } catch (error) {
    console.error('Error loading users:', error);
    req.flash('error', 'Failed to load users');
    res.redirect('/admin');
  }
};

/**
 * Show Threads Management Page
 * Lists all threads with filtering and actions
 */
exports.showThreads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    const { count, rows: threads } = await Thread.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'displayName', 'role']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    const totalPages = Math.ceil(count / limit);

    res.render('pages/admin/threads', {
      title: 'Thread Management',
      isAuthenticated: true,
      user: req.session.user,
      csrfToken: req.csrfToken(),
      threads,
      currentPage: page,
      totalPages,
      totalThreads: count
    });
  } catch (error) {
    console.error('Error loading threads:', error);
    req.flash('error', 'Failed to load threads');
    res.redirect('/admin');
  }
};

/**
 * Update User Role
 * Changes a user's role (admin action)
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      req.flash('error', 'Invalid role');
      return res.redirect('back');
    }

    const user = await User.findByPk(id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('back');
    }

    // Prevent self-demotion
    if (user.id === req.session.user.id && role !== 'admin') {
      req.flash('error', 'You cannot change your own role');
      return res.redirect('back');
    }

    await user.update({ role });
    req.flash('success', `User role updated to ${role}`);
    res.redirect('back');
  } catch (error) {
    console.error('Error updating user role:', error);
    req.flash('error', 'Failed to update user role');
    res.redirect('back');
  }
};

/**
 * Toggle User Active Status
 * Activates or deactivates a user account
 */
exports.toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('back');
    }

    // Prevent self-deactivation
    if (user.id === req.session.user.id) {
      req.flash('error', 'You cannot deactivate your own account');
      return res.redirect('back');
    }

    await user.update({ isActive: !user.isActive });
    req.flash('success', `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
    res.redirect('back');
  } catch (error) {
    console.error('Error toggling user active status:', error);
    req.flash('error', 'Failed to update user status');
    res.redirect('back');
  }
};

/**
 * Ban User
 * Bans a user from accessing the platform
 */
exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('back');
    }

    // Prevent self-ban
    if (user.id === req.session.user.id) {
      req.flash('error', 'You cannot ban yourself');
      return res.redirect('back');
    }

    // Prevent banning other admins (optional protection)
    if (user.role === 'admin' && req.user.role === 'admin') {
      req.flash('error', 'You cannot ban other administrators');
      return res.redirect('back');
    }

    await user.update({
      isBanned: true,
      bannedAt: new Date(),
      bannedBy: req.session.user.id,
      banReason: reason || 'No reason provided'
    });

    req.flash('success', `User ${user.username} has been banned`);
    res.redirect('back');
  } catch (error) {
    console.error('Error banning user:', error);
    req.flash('error', 'Failed to ban user');
    res.redirect('back');
  }
};

/**
 * Unban User
 * Removes ban from a user account
 */
exports.unbanUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('back');
    }

    await user.update({
      isBanned: false,
      bannedAt: null,
      bannedBy: null,
      banReason: null
    });

    req.flash('success', `User ${user.username} has been unbanned`);
    res.redirect('back');
  } catch (error) {
    console.error('Error unbanning user:', error);
    req.flash('error', 'Failed to unban user');
    res.redirect('back');
  }
};

/**
 * Show Edit User Page
 * Display form to edit user details
 */
exports.showEditUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.scope('withPassword').findByPk(id, {
      attributes: ['id', 'username', 'displayName', 'email', 'role', 'isActive', 'isBanned', 'bannedAt', 'bannedBy', 'banReason', 'createdAt', 'updatedAt']
    });

    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    // Get banner info if user is banned
    let bannerInfo = null;
    if (user.isBanned && user.bannedBy) {
      bannerInfo = await User.findByPk(user.bannedBy, {
        attributes: ['id', 'username', 'displayName']
      });
    }

    res.render('pages/admin/edit-user', {
      title: `Edit User: ${user.username}`,
      isAuthenticated: true,
      user: req.session.user,
      csrfToken: req.csrfToken(),
      editUser: user,
      bannerInfo
    });
  } catch (error) {
    console.error('Error loading user for edit:', error);
    req.flash('error', 'Failed to load user');
    res.redirect('/admin/users');
  }
};

/**
 * Update User
 * Update user details from edit form
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, displayName, email, role, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    // Prevent self-demotion
    if (user.id === req.session.user.id && role !== 'admin') {
      req.flash('error', 'You cannot change your own role');
      return res.redirect('back');
    }

    // Check if username is already taken by another user
    if (username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        req.flash('error', 'Username already taken');
        return res.redirect('back');
      }
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        req.flash('error', 'Email already in use');
        return res.redirect('back');
      }
    }

    await user.update({
      username,
      displayName: displayName || username,
      email,
      role,
      isActive: isActive === 'true' || isActive === true
    });

    // Update session if admin edited themselves
    if (user.id === req.session.user.id) {
      req.session.user.username = username;
      req.session.user.displayName = displayName || username;
      req.session.user.email = email;
    }

    req.flash('success', 'User updated successfully');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error updating user:', error);
    req.flash('error', 'Failed to update user');
    res.redirect('back');
  }
};

/**
 * Delete User
 * Permanently deletes a user account (use with caution)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('back');
    }

    // Prevent self-deletion
    if (user.id === req.session.user.id) {
      req.flash('error', 'You cannot delete your own account');
      return res.redirect('back');
    }

    await user.destroy();
    req.flash('success', 'User deleted successfully');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error deleting user:', error);
    req.flash('error', 'Failed to delete user');
    res.redirect('back');
  }
};

/**
 * Show Cache Statistics
 * Display cache performance metrics
 */
exports.showCacheStats = async (req, res) => {
  try {
    const stats = getCacheStats();
    const keys = cache.keys();
    
    res.render('pages/admin/cache-stats', {
      title: 'Cache Statistics - Admin',
      stats,
      cacheKeys: keys,
      cacheSize: keys.length
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    req.flash('error', 'Failed to fetch cache statistics');
    res.redirect('/admin');
  }
};

/**
 * Clear Cache
 * Clear all cache entries
 */
exports.clearCache = async (req, res) => {
  try {
    cache.flushAll();
    resetCacheStats();
    req.flash('success', 'Cache cleared successfully');
    res.redirect('/admin/cache');
  } catch (error) {
    console.error('Error clearing cache:', error);
    req.flash('error', 'Failed to clear cache');
    res.redirect('/admin/cache');
  }
};

module.exports = exports;
