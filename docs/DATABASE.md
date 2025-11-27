# Database Documentation

This document provides comprehensive documentation of the Educard database schema, relationships, and data model.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Entity Relationship Diagram](#entity-relationship-diagram)
4. [Table Descriptions](#table-descriptions)
5. [Relationships](#relationships)
6. [Indexes and Performance](#indexes-and-performance)
7. [Migrations](#migrations)
8. [Seeding Data](#seeding-data)
9. [Database Maintenance](#database-maintenance)

---

## Overview

### Technology Stack

- **Database:** PostgreSQL 12+
- **ORM:** Sequelize 6.x
- **Connection Pooling:** Configured in Sequelize
- **Migrations:** Sequelize CLI

### Connection Configuration

Database connection is configured in `src/config/database.js`:

```javascript
{
  development: {
    username: process.env.DB_USER || 'educard',
    password: process.env.DB_PASSWORD || 'educard_dev_password',
    database: process.env.DB_NAME || 'educard_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  },
  production: {
    // Similar config with production values
    logging: false, // Disable query logging in production
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
}
```

---

## Database Schema

### Core Tables

The database consists of the following core tables:

1. **users** - User accounts and authentication
2. **categories** - Forum categories/sections
3. **threads** - Discussion threads/topics
4. **posts** - Individual posts/replies
5. **post_reactions** - Vote system (upvotes/downvotes)
6. **notifications** - User notifications
7. **reports** - Content moderation reports

### Supporting Tables (if implemented)

- **tags** - Content tagging system
- **bookmarks** - User bookmarks
- **attachments** - File attachments
- **sessions** - User sessions (via connect-pg-simple)

---

## Entity Relationship Diagram

```
┌─────────────┐
│    users    │
│             │
│ id (PK)     │───┐
│ username    │   │
│ email       │   │
│ password    │   │
│ role        │   │
│ isBanned    │   │
└─────────────┘   │
                  │
    ┌─────────────┼─────────────────────────────┐
    │             │                             │
    │             │                             │
    ▼             ▼                             ▼
┌──────────────┐ ┌──────────────┐       ┌──────────────┐
│ categories   │ │   threads    │       │    posts     │
│              │ │              │       │              │
│ id (PK)      │◄┤ id (PK)      │◄──────┤ id (PK)      │
│ name         │ │ category_id  │       │ thread_id    │
│ slug         │ │ user_id      │       │ user_id      │
│ description  │ │ title        │       │ content      │
└──────────────┘ │ slug         │       │ isFirstPost  │
                 │ isPinned     │       │ isHidden     │
                 │ isLocked     │       └──────────────┘
                 └──────────────┘              │
                                               │
                       ┌───────────────────────┼────────────────┐
                       │                       │                │
                       ▼                       ▼                ▼
                ┌──────────────┐      ┌───────────────┐  ┌───────────┐
                │post_reactions│      │notifications  │  │  reports  │
                │              │      │               │  │           │
                │ id (PK)      │      │ id (PK)       │  │ id (PK)   │
                │ post_id      │      │ user_id       │  │ user_id   │
                │ user_id      │      │ type          │  │ post_id   │
                │ reaction_type│      │ content       │  │ reason    │
                └──────────────┘      │ isRead        │  │ status    │
                                      └───────────────┘  └───────────┘
```

---

## Table Descriptions

### users

Stores user account information and authentication data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| username | VARCHAR(50) | NOT NULL, UNIQUE | Unique username (alphanumeric) |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User email address |
| password | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| display_name | VARCHAR(100) | NULL | Optional display name |
| role | ENUM | NOT NULL, DEFAULT 'user' | User role: user, moderator, admin |
| is_active | BOOLEAN | DEFAULT true | Account active status |
| is_banned | BOOLEAN | DEFAULT false | Ban status |
| banned_at | TIMESTAMP | NULL | When user was banned |
| banned_by | INTEGER | NULL, FK to users | Admin who banned user |
| ban_reason | TEXT | NULL | Reason for ban |
| created_at | TIMESTAMP | NOT NULL | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `username`
- UNIQUE on `email`
- INDEX on `role` for admin queries
- INDEX on `is_banned` for filtering

**Validations:**
- username: 3-50 characters, alphanumeric
- email: Valid email format
- password: Minimum 8 characters (pre-hash)

---

### categories

Forum categories that contain threads.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique category identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Category display name |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL-friendly identifier |
| description | TEXT | NULL | Category description |
| display_order | INTEGER | DEFAULT 0 | Sort order for display |
| is_active | BOOLEAN | DEFAULT true | Whether category is visible |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `name`
- UNIQUE on `slug`
- INDEX on `display_order` for sorting
- INDEX on `is_active` for filtering

---

### threads

Discussion threads/topics within categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique thread identifier |
| category_id | INTEGER | NOT NULL, FK to categories | Parent category |
| user_id | INTEGER | NOT NULL, FK to users | Thread creator |
| title | VARCHAR(255) | NOT NULL | Thread title |
| slug | VARCHAR(255) | NOT NULL | URL-friendly identifier |
| is_pinned | BOOLEAN | DEFAULT false | Sticky thread at top |
| is_locked | BOOLEAN | DEFAULT false | Prevent new posts |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on (`category_id`, `slug`) composite
- INDEX on `category_id` for listings
- INDEX on `user_id` for user threads
- INDEX on `created_at` DESC for sorting
- INDEX on `is_pinned` for filtering

---

### posts

Individual posts/replies within threads.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique post identifier |
| thread_id | INTEGER | NOT NULL, FK to threads | Parent thread |
| user_id | INTEGER | NOT NULL, FK to users | Post author |
| content | TEXT | NOT NULL | Post content (Markdown) |
| is_first_post | BOOLEAN | DEFAULT false | First post in thread |
| edited_at | TIMESTAMP | NULL | Last edit timestamp |
| is_hidden | BOOLEAN | DEFAULT false | Moderator hidden |
| hidden_by | INTEGER | NULL, FK to users | Moderator who hid |
| hidden_reason | TEXT | NULL | Reason for hiding |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `thread_id` for thread posts
- INDEX on `user_id` for user posts
- INDEX on `created_at` for sorting
- INDEX on `is_hidden` for filtering

**Validations:**
- content: 1-10,000 characters

---

### post_reactions

Vote system for posts (upvotes/downvotes).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique reaction identifier |
| post_id | INTEGER | NOT NULL, FK to posts | Target post |
| user_id | INTEGER | NOT NULL, FK to users | User who reacted |
| reaction_type | ENUM | NOT NULL | 'upvote' or 'downvote' |
| created_at | TIMESTAMP | NOT NULL | Reaction timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on (`post_id`, `user_id`) - one reaction per user per post
- INDEX on `post_id` for counting votes
- INDEX on `user_id` for user reactions

**Constraints:**
- One reaction per user per post (composite unique)
- reaction_type must be 'upvote' or 'downvote'

---

### notifications

User notifications for various events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique notification identifier |
| user_id | INTEGER | NOT NULL, FK to users | Recipient user |
| type | VARCHAR(50) | NOT NULL | Notification type |
| content | TEXT | NOT NULL | Notification message |
| link | VARCHAR(255) | NULL | Related content URL |
| is_read | BOOLEAN | DEFAULT false | Read status |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Notification Types:**
- `new_reply`: New reply to user's thread
- `mention`: User mentioned in post
- `upvote`: Post received upvote
- `thread_locked`: User's thread was locked
- `post_hidden`: User's post was hidden
- `ban`: User was banned

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id` for user notifications
- INDEX on `is_read` for filtering unread
- INDEX on `created_at` DESC for sorting

---

### reports

Content moderation reports from users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique report identifier |
| user_id | INTEGER | NOT NULL, FK to users | Reporter user |
| post_id | INTEGER | NOT NULL, FK to posts | Reported post |
| reason | TEXT | NOT NULL | Report reason |
| status | ENUM | DEFAULT 'pending' | pending, reviewed, resolved |
| reviewed_by | INTEGER | NULL, FK to users | Moderator who reviewed |
| reviewed_at | TIMESTAMP | NULL | Review timestamp |
| notes | TEXT | NULL | Moderator notes |
| created_at | TIMESTAMP | NOT NULL | Report timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `status` for filtering
- INDEX on `post_id` for post reports
- INDEX on `created_at` DESC for sorting

---

## Relationships

### One-to-Many Relationships

**User → Threads**
- One user can create many threads
- Foreign Key: `threads.user_id` → `users.id`
- ON DELETE: CASCADE (delete user's threads when user deleted)

**User → Posts**
- One user can create many posts
- Foreign Key: `posts.user_id` → `users.id`
- ON DELETE: CASCADE

**Category → Threads**
- One category contains many threads
- Foreign Key: `threads.category_id` → `categories.id`
- ON DELETE: CASCADE

**Thread → Posts**
- One thread contains many posts
- Foreign Key: `posts.thread_id` → `threads.id`
- ON DELETE: CASCADE

**User → Notifications**
- One user can have many notifications
- Foreign Key: `notifications.user_id` → `users.id`
- ON DELETE: CASCADE

### One-to-One Relationships

**Thread → First Post**
- Each thread has exactly one first post
- Identified by `posts.is_first_post = true`
- Relationship maintained by application logic

### Many-to-Many Relationships (via junction tables)

**User ↔ Post (via post_reactions)**
- Users can react to many posts
- Posts can have reactions from many users
- Junction: `post_reactions` with composite unique key

---

## Indexes and Performance

### Primary Indexes

All tables have auto-incrementing integer primary keys for optimal join performance.

### Foreign Key Indexes

All foreign keys have indexes for efficient joins and cascade deletes:
- `threads.category_id`
- `threads.user_id`
- `posts.thread_id`
- `posts.user_id`
- `post_reactions.post_id`
- `post_reactions.user_id`

### Query Optimization Indexes

**Categories:**
- `display_order` - For sorted category listings
- `is_active` - Filter active categories

**Threads:**
- `(category_id, slug)` UNIQUE - Unique slugs per category
- `created_at DESC` - Recent threads
- `is_pinned` - Pinned thread filtering

**Posts:**
- `created_at` - Chronological post ordering
- `is_hidden` - Filter hidden posts

**Notifications:**
- `(user_id, is_read)` - Unread notifications per user
- `created_at DESC` - Recent notifications

### Composite Indexes

**Unique Constraints:**
- `users(username)` - Unique usernames
- `users(email)` - Unique emails
- `categories(slug)` - Unique category slugs
- `threads(category_id, slug)` - Unique thread slugs per category
- `post_reactions(post_id, user_id)` - One reaction per user per post

### Performance Considerations

1. **Eager Loading:** Use Sequelize `include` to avoid N+1 queries
2. **Pagination:** Always paginate large result sets
3. **Indexes:** Add indexes for frequently queried fields
4. **Caching:** Cache frequently accessed data (categories, user profiles)
5. **Connection Pooling:** Configure appropriate pool size for load

---

## Migrations

### Running Migrations

```bash
# Run all pending migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Undo all migrations
npm run db:migrate:undo:all

# Check migration status
npx sequelize-cli db:migrate:status
```

### Creating New Migrations

```bash
# Generate new migration
npx sequelize-cli migration:generate --name migration-name

# Example: Add column
npx sequelize-cli migration:generate --name add-avatar-to-users
```

### Migration Best Practices

1. **Always Test Migrations:**
   - Test on development database first
   - Test both `up` and `down` methods
   - Verify data integrity after migration

2. **Never Modify Existing Migrations:**
   - Create new migration to fix issues
   - Existing migrations may have run in production

3. **Use Transactions:**
   ```javascript
   module.exports = {
     up: async (queryInterface, Sequelize) => {
       const transaction = await queryInterface.sequelize.transaction();
       try {
         await queryInterface.addColumn('users', 'avatar', {
           type: Sequelize.STRING
         }, { transaction });
         
         await transaction.commit();
       } catch (error) {
         await transaction.rollback();
         throw error;
       }
     }
   };
   ```

4. **Document Complex Migrations:**
   - Add comments explaining why changes are needed
   - Document data transformations
   - Note any manual steps required

### Example Migration

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('user', 'moderator', 'admin'),
        defaultValue: 'user',
        allowNull: false
      },
      is_banned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['email']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
```

---

## Seeding Data

### Creating Seeds

```bash
# Generate seed file
npx sequelize-cli seed:generate --name demo-users

# Run all seeds
npx sequelize-cli db:seed:all

# Undo most recent seed
npx sequelize-cli db:seed:undo

# Undo specific seed
npx sequelize-cli db:seed:undo --seed filename.js
```

### Example Seed File

```javascript
'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
```

---

## Database Maintenance

### Backup

```bash
# Full database backup
pg_dump -U educard -d educard_prod > backup.sql

# Compressed backup
pg_dump -U educard -d educard_prod | gzip > backup.sql.gz

# Schema only
pg_dump -U educard -d educard_prod --schema-only > schema.sql

# Data only
pg_dump -U educard -d educard_prod --data-only > data.sql
```

### Restore

```bash
# Restore from backup
psql -U educard -d educard_prod < backup.sql

# Restore compressed backup
gunzip < backup.sql.gz | psql -U educard -d educard_prod
```

### Optimization

```bash
# Analyze tables (update statistics)
psql -U educard -d educard_prod -c "ANALYZE;"

# Vacuum database (reclaim storage)
psql -U educard -d educard_prod -c "VACUUM;"

# Full vacuum with analyze
psql -U educard -d educard_prod -c "VACUUM ANALYZE;"

# Reindex database
psql -U educard -d educard_prod -c "REINDEX DATABASE educard_prod;"
```

### Monitoring

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('educard_prod'));

-- Check table sizes
SELECT 
  tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

---

## Common Queries

### User Statistics

```sql
-- Total users
SELECT COUNT(*) FROM users;

-- Active users (last 30 days)
SELECT COUNT(*) FROM users 
WHERE updated_at > NOW() - INTERVAL '30 days';

-- Banned users
SELECT COUNT(*) FROM users WHERE is_banned = true;
```

### Content Statistics

```sql
-- Total threads
SELECT COUNT(*) FROM threads;

-- Total posts
SELECT COUNT(*) FROM posts;

-- Posts per category
SELECT c.name, COUNT(p.id) as post_count
FROM categories c
LEFT JOIN threads t ON t.category_id = c.id
LEFT JOIN posts p ON p.thread_id = t.id
GROUP BY c.id, c.name
ORDER BY post_count DESC;

-- Most active users
SELECT u.username, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
GROUP BY u.id, u.username
ORDER BY post_count DESC
LIMIT 10;
```

---

**Last Updated:** November 2025  
**Version:** 1.0.0  
**Database Version:** PostgreSQL 12+  
**ORM Version:** Sequelize 6.x
