const { User, Thread, Post, Report, Category } = require('../models');
const { Op } = require('sequelize');

/**
 * Moderation Controller
 * Handles content moderation and report management
 */

/**
 * Show Moderation Queue
 * Displays all pending reports for moderators
 */
exports.showQueue = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'pending';

    const where = {};
    if (status && ['pending', 'resolved', 'dismissed'].includes(status)) {
      where.status = status;
    }

    const { count, rows: reports } = await Report.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'username', 'displayName', 'role']
        },
        {
          model: User,
          as: 'resolver',
          attributes: ['id', 'username', 'displayName', 'role'],
          required: false
        }
      ]
    });

    // Fetch the reported items based on type
    for (const report of reports) {
      if (report.reportType === 'post') {
        report.reportedItem = await Post.findByPk(report.reportedItemId, {
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
      } else if (report.reportType === 'thread') {
        report.reportedItem = await Thread.findByPk(report.reportedItemId, {
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
      } else if (report.reportType === 'user') {
        report.reportedItem = await User.findByPk(report.reportedItemId, {
          attributes: ['id', 'username', 'displayName', 'role', 'email']
        });
      }
    }

    const totalPages = Math.ceil(count / limit);

    res.render('pages/moderation/queue', {
      title: 'Moderation Queue',
      isAuthenticated: true,
      user: req.session.user,
      csrfToken: req.csrfToken(),
      reports,
      currentPage: page,
      totalPages,
      totalReports: count,
      currentStatus: status
    });
  } catch (error) {
    console.error('Error loading moderation queue:', error);
    req.flash('error', 'Failed to load moderation queue');
    res.redirect('/');
  }
};

/**
 * Submit a Report
 * Allows users to report content
 */
exports.submitReport = async (req, res) => {
  try {
    const { reportType, reportedItemId, reason } = req.body;

    if (!['post', 'thread', 'user'].includes(reportType)) {
      req.flash('error', 'Invalid report type');
      return res.redirect('back');
    }

    if (!reason || reason.trim().length < 10) {
      req.flash('error', 'Please provide a detailed reason (at least 10 characters)');
      return res.redirect('back');
    }

    // Check if item exists
    let itemExists = false;
    if (reportType === 'post') {
      itemExists = await Post.findByPk(reportedItemId);
    } else if (reportType === 'thread') {
      itemExists = await Thread.findByPk(reportedItemId);
    } else if (reportType === 'user') {
      itemExists = await User.findByPk(reportedItemId);
    }

    if (!itemExists) {
      req.flash('error', 'The reported item does not exist');
      return res.redirect('back');
    }

    // Check if user already reported this item
    const existingReport = await Report.findOne({
      where: {
        reportType,
        reportedItemId,
        reporterId: req.session.user.id,
        status: 'pending'
      }
    });

    if (existingReport) {
      req.flash('info', 'You have already reported this content');
      return res.redirect('back');
    }

    await Report.create({
      reportType,
      reportedItemId,
      reporterId: req.session.user.id,
      reason: reason.trim()
    });

    req.flash('success', 'Report submitted successfully. Moderators will review it soon.');
    res.redirect('back');
  } catch (error) {
    console.error('Error submitting report:', error);
    req.flash('error', 'Failed to submit report');
    res.redirect('back');
  }
};

/**
 * Resolve Report
 * Moderator marks a report as resolved or dismissed
 */
exports.resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    if (!['resolved', 'dismissed'].includes(action)) {
      req.flash('error', 'Invalid action');
      return res.redirect('back');
    }

    const report = await Report.findByPk(id);
    if (!report) {
      req.flash('error', 'Report not found');
      return res.redirect('back');
    }

    await report.update({
      status: action,
      resolvedBy: req.session.user.id,
      resolvedAt: new Date(),
      moderatorNotes: notes || null
    });

    req.flash('success', `Report ${action} successfully`);
    res.redirect('/moderation/queue');
  } catch (error) {
    console.error('Error resolving report:', error);
    req.flash('error', 'Failed to resolve report');
    res.redirect('back');
  }
};

/**
 * Hide Post
 * Moderator hides a post from public view
 */
exports.hidePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const post = await Post.findByPk(id);
    if (!post) {
      req.flash('error', 'Post not found');
      return res.redirect('back');
    }

    // Don't hide if already hidden
    if (post.isHidden) {
      req.flash('info', 'Post is already hidden');
      return res.redirect('back');
    }

    await post.update({
      isHidden: true,
      hiddenBy: req.session.user.id,
      hiddenAt: new Date(),
      hiddenReason: reason || 'No reason provided'
    });

    req.flash('success', 'Post hidden successfully');
    res.redirect('back');
  } catch (error) {
    console.error('Error hiding post:', error);
    req.flash('error', 'Failed to hide post');
    res.redirect('back');
  }
};

/**
 * Unhide Post
 * Moderator makes a hidden post visible again
 */
exports.unhidePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByPk(id);
    if (!post) {
      req.flash('error', 'Post not found');
      return res.redirect('back');
    }

    await post.update({
      isHidden: false,
      hiddenBy: null,
      hiddenAt: null,
      hiddenReason: null
    });

    req.flash('success', 'Post unhidden successfully');
    res.redirect('back');
  } catch (error) {
    console.error('Error unhiding post:', error);
    req.flash('error', 'Failed to unhide post');
    res.redirect('back');
  }
};

/**
 * Move Thread
 * Moderator moves a thread to a different category
 */
exports.moveThread = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId } = req.body;

    const thread = await Thread.findByPk(id);
    if (!thread) {
      req.flash('error', 'Thread not found');
      return res.redirect('back');
    }

    const category = await Category.findByPk(categoryId);
    if (!category) {
      req.flash('error', 'Target category not found');
      return res.redirect('back');
    }

    const oldCategoryId = thread.categoryId;
    await thread.update({ categoryId });

    req.flash('success', `Thread moved to ${category.name}`);
    res.redirect(`/thread/${thread.id}`);
  } catch (error) {
    console.error('Error moving thread:', error);
    req.flash('error', 'Failed to move thread');
    res.redirect('back');
  }
};

/**
 * Get Pending Report Count
 * Returns the number of pending reports for badge display
 */
exports.getPendingCount = async () => {
  try {
    const count = await Report.count({
      where: { status: 'pending' }
    });
    return count;
  } catch (error) {
    console.error('Error getting pending report count:', error);
    return 0;
  }
};

/**
 * API: Get Pending Report Count
 * JSON endpoint for AJAX polling
 */
exports.apiPendingCount = async (req, res) => {
  try {
    const count = await Report.count({
      where: { status: 'pending' }
    });
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error getting pending report count:', error);
    res.json({ success: false, count: 0 });
  }
};

module.exports = exports;
