const { sequelize } = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Thread = require('./Thread');
const Post = require('./Post');
const PostReaction = require('./PostReaction');
const Notification = require('./Notification');
const Report = require('./Report');

/**
 * Define Model Associations
 * 
 * This file establishes the relationships between all models:
 * - Users can create many Threads and Posts
 * - Categories contain many Threads
 * - Threads belong to a Category and a User, and contain many Posts
 * - Posts belong to a Thread and a User
 */

// User associations
// A user can create many threads
User.hasMany(Thread, { 
  foreignKey: 'userId', 
  as: 'threads',
  onDelete: 'CASCADE'
});

// A user can create many posts
User.hasMany(Post, { 
  foreignKey: 'userId', 
  as: 'posts',
  onDelete: 'CASCADE'
});

// Category associations
// A category can contain many threads
Category.hasMany(Thread, { 
  foreignKey: 'categoryId', 
  as: 'threads',
  onDelete: 'CASCADE'
});

// Thread associations
// A thread belongs to one category
Thread.belongsTo(Category, { 
  foreignKey: 'categoryId', 
  as: 'category'
});

// A thread belongs to one user (the author)
Thread.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'author'
});

// A thread can have many posts
Thread.hasMany(Post, { 
  foreignKey: 'threadId', 
  as: 'posts',
  onDelete: 'CASCADE'
});

// Post associations
// A post belongs to one thread
Post.belongsTo(Thread, { 
  foreignKey: 'threadId', 
  as: 'thread'
});

// A post belongs to one user (the author)
Post.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'author'
});

// PostReaction associations
// A post can have many reactions
Post.hasMany(PostReaction, {
  foreignKey: 'postId',
  as: 'reactions',
  onDelete: 'CASCADE'
});

// A reaction belongs to one post
PostReaction.belongsTo(Post, {
  foreignKey: 'postId',
  as: 'post'
});

// A user can have many reactions
User.hasMany(PostReaction, {
  foreignKey: 'userId',
  as: 'reactions',
  onDelete: 'CASCADE'
});

// A reaction belongs to one user
PostReaction.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Notification associations
// A user can have many notifications
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
  onDelete: 'CASCADE'
});

// A notification belongs to one user (recipient)
Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'recipient'
});

// A notification can have an actor (user who triggered it)
Notification.belongsTo(User, {
  foreignKey: 'actorId',
  as: 'actor'
});

// Report associations
// A report belongs to one user (reporter)
Report.belongsTo(User, {
  foreignKey: 'reporterId',
  as: 'reporter'
});

// A report can be resolved by a moderator
Report.belongsTo(User, {
  foreignKey: 'resolvedBy',
  as: 'resolver'
});

// A user can have many reports (as reporter)
User.hasMany(Report, {
  foreignKey: 'reporterId',
  as: 'submittedReports'
});

// A user can resolve many reports (as moderator)
User.hasMany(Report, {
  foreignKey: 'resolvedBy',
  as: 'resolvedReports'
});

/**
 * Export all models and sequelize instance
 */
module.exports = {
  sequelize,
  User,
  Category,
  Thread,
  Post,
  PostReaction,
  Notification,
  Report
};
