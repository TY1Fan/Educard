# System Architecture

This document describes the architecture, design patterns, and technical decisions behind Educard.

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Three-Tier Architecture](#three-tier-architecture)
4. [Design Patterns](#design-patterns)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Performance Optimization](#performance-optimization)
8. [Scalability Considerations](#scalability-considerations)
9. [Technology Decisions](#technology-decisions)

---

## Overview

Educard follows a classic **three-tier architecture** with clear separation of concerns:

- **Presentation Tier:** EJS templates with server-side rendering
- **Application Tier:** Node.js/Express.js with MVC pattern
- **Data Tier:** PostgreSQL with Sequelize ORM

### Key Architectural Principles

1. **Separation of Concerns:** Clear boundaries between layers
2. **MVC Pattern:** Models, Views, Controllers organization
3. **RESTful Design:** HTTP methods map to CRUD operations
4. **Security by Design:** Multiple layers of security controls
5. **Performance First:** Caching, indexing, query optimization
6. **Maintainability:** Clear code structure, documentation, standards

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  (Web Browser - Chrome, Firefox, Safari, Edge)              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         │ (Port 443)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    REVERSE PROXY LAYER                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Nginx                                               │   │
│  │  - SSL/TLS Termination                              │   │
│  │  - Load Balancing                                   │   │
│  │  - Static File Serving                              │   │
│  │  - Rate Limiting (Layer 7)                          │   │
│  │  - Request Routing                                  │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP
                         │ (Port 3000)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION TIER                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Node.js + Express.js                               │   │
│  │                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ Middleware   │  │  Session     │                │   │
│  │  │              │  │  Management  │                │   │
│  │  │ • Auth       │  │              │                │   │
│  │  │ • CSRF       │  │ • Express    │                │   │
│  │  │ • Rate Limit │  │   Session    │                │   │
│  │  │ • Security   │  │ • Cookie     │                │   │
│  │  │ • Validation │  │   Parser     │                │   │
│  │  └──────────────┘  └──────────────┘                │   │
│  │                                                      │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │         MVC COMPONENTS                        │ │   │
│  │  │                                               │ │   │
│  │  │  ┌────────────┐  ┌─────────────┐            │ │   │
│  │  │  │ Controllers│  │   Routes    │            │ │   │
│  │  │  │            │  │             │            │ │   │
│  │  │  │ • Auth     │  │ • /auth     │            │ │   │
│  │  │  │ • Forum    │  │ • /forum    │            │ │   │
│  │  │  │ • User     │  │ • /users    │            │ │   │
│  │  │  │ • Admin    │  │ • /admin    │            │ │   │
│  │  │  │ • Search   │  │ • /search   │            │ │   │
│  │  │  └────────────┘  └─────────────┘            │ │   │
│  │  │                                               │ │   │
│  │  │  ┌────────────────────────────────────────┐ │ │   │
│  │  │  │           Models (ORM)                 │ │ │   │
│  │  │  │  • User                                │ │ │   │
│  │  │  │  • Category                            │ │ │   │
│  │  │  │  • Thread                              │ │ │   │
│  │  │  │  • Post                                │ │ │   │
│  │  │  │  • PostReaction                        │ │ │   │
│  │  │  │  • Notification                        │ │ │   │
│  │  │  └────────────────────────────────────────┘ │ │   │
│  │  │                                               │ │   │
│  │  │  ┌─────────────┐  ┌──────────────┐         │ │   │
│  │  │  │   Views     │  │   Caching    │         │ │   │
│  │  │  │             │  │              │         │ │   │
│  │  │  │ • EJS       │  │ • node-cache │         │ │   │
│  │  │  │ • Layouts   │  │ • Categories │         │ │   │
│  │  │  │ • Partials  │  │ • User Data  │         │ │   │
│  │  │  └─────────────┘  └──────────────┘         │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ SQL
                         │ (Port 5432)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA TIER                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                 │   │
│  │                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │   Tables     │  │   Indexes    │                │   │
│  │  │              │  │              │                │   │
│  │  │ • users      │  │ • Primary    │                │   │
│  │  │ • categories │  │ • Foreign    │                │   │
│  │  │ • threads    │  │ • Unique     │                │   │
│  │  │ • posts      │  │ • Composite  │                │   │
│  │  │ • reactions  │  │ • B-tree     │                │   │
│  │  └──────────────┘  └──────────────┘                │   │
│  │                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ Constraints  │  │    Backups   │                │   │
│  │  │              │  │              │                │   │
│  │  │ • UNIQUE     │  │ • Daily      │                │   │
│  │  │ • NOT NULL   │  │ • Automated  │                │   │
│  │  │ • FK CASCADE │  │ • Retention  │                │   │
│  │  └──────────────┘  └──────────────┘                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Three-Tier Architecture

### Presentation Tier

**Purpose:** Render HTML and handle user interactions

**Components:**
- **EJS Templates:** Server-side rendering
- **CSS:** Responsive styling with mobile-first approach
- **JavaScript:** Client-side interactivity (form validation, dark mode)
- **Static Assets:** Images, fonts, vendor libraries

**Key Files:**
```
src/views/
├── layouts/          # Template inheritance
│   └── main.ejs      # Base layout with nav/footer
├── pages/            # Individual pages
│   ├── home.ejs
│   ├── category.ejs
│   ├── thread.ejs
│   └── profile.ejs
├── partials/         # Reusable components
│   ├── nav.ejs
│   ├── footer.ejs
│   └── flash-messages.ejs
└── errors/           # Error pages
    ├── 404.ejs
    ├── 429.ejs
    └── 500.ejs
```

**Design Decisions:**
- **Server-side rendering** for better SEO and initial page load
- **Progressive enhancement** - works without JavaScript
- **Responsive design** - mobile-first CSS
- **Accessibility** - WCAG 2.1 AA compliant

### Application Tier

**Purpose:** Business logic, request processing, data validation

**Components:**

1. **Express.js Middleware Stack:**
   ```javascript
   app.use(helmet());                    // Security headers
   app.use(express.urlencoded());        // Parse form data
   app.use(express.json());              // Parse JSON
   app.use(session());                   // Session management
   app.use(csrf());                      // CSRF protection
   app.use(rateLimiter);                 // Rate limiting
   app.use(authMiddleware);              // Authentication
   ```

2. **MVC Pattern:**
   - **Models:** Data structure and database operations (Sequelize)
   - **Views:** EJS templates for rendering HTML
   - **Controllers:** Business logic and request handling

3. **Routing:**
   ```
   /                     → Home page (category listing)
   /auth/login           → Login page
   /auth/register        → Registration page
   /categories/:slug     → Category threads
   /threads/:slug        → Thread detail with posts
   /posts/:id/edit       → Edit post
   /users/:username      → User profile
   /admin                → Admin dashboard
   /search               → Search functionality
   ```

**Key Design Patterns:**
- **MVC (Model-View-Controller):** Separation of concerns
- **Repository Pattern:** Data access abstraction via Sequelize
- **Middleware Chain:** Request processing pipeline
- **Factory Pattern:** Model associations and relationships

### Data Tier

**Purpose:** Persistent data storage and retrieval

**Components:**
- **PostgreSQL:** Relational database management system
- **Sequelize ORM:** Object-relational mapping
- **Migrations:** Version-controlled schema changes
- **Connection Pool:** Efficient database connection management

**Data Model:**
```
User 1───∞ Thread 1───∞ Post 1───∞ PostReaction
         ↓                     ↓
      Category            Notification
                               ↓
                            Report
```

---

## Design Patterns

### 1. MVC (Model-View-Controller)

**Model:**
```javascript
// src/models/Thread.js
const Thread = sequelize.define('Thread', {
  title: DataTypes.STRING,
  slug: DataTypes.STRING,
  isPinned: DataTypes.BOOLEAN
});
```

**Controller:**
```javascript
// src/controllers/threadController.js
exports.showThread = async (req, res) => {
  const thread = await Thread.findOne({
    where: { slug: req.params.slug },
    include: [User, Category, Post]
  });
  res.render('pages/thread', { thread });
};
```

**View:**
```ejs
<!-- src/views/pages/thread.ejs -->
<h1><%= thread.title %></h1>
<% thread.Posts.forEach(post => { %>
  <div class="post"><%= post.content %></div>
<% }); %>
```

### 2. Middleware Pattern

Modular request processing:

```javascript
// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  next();
};

// Authorization middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send('Forbidden');
  }
  next();
};

// Usage
app.get('/admin', requireAuth, requireAdmin, adminController.dashboard);
```

### 3. Factory Pattern

Model associations:

```javascript
// src/models/index.js
User.hasMany(Thread, { foreignKey: 'userId' });
Thread.belongsTo(User, { foreignKey: 'userId' });
Thread.hasMany(Post, { foreignKey: 'threadId' });
Category.hasMany(Thread, { foreignKey: 'categoryId' });
```

### 4. Repository Pattern

Data access abstraction via Sequelize:

```javascript
// Instead of SQL:
// SELECT * FROM threads WHERE category_id = ? ORDER BY created_at DESC

// Use Sequelize:
const threads = await Thread.findAll({
  where: { categoryId: categoryId },
  order: [['createdAt', 'DESC']],
  include: [User, Category]
});
```

---

## Data Flow

### User Registration Flow

```
1. User submits registration form
   ↓
2. POST /auth/register
   ↓
3. Express middleware chain:
   - Parse form data
   - CSRF token verification
   - Input validation (express-validator)
   ↓
4. authController.register()
   - Check if username/email exists
   - Hash password with bcrypt
   - Create user in database
   ↓
5. Create session
   ↓
6. Redirect to home page
   ↓
7. Render welcome message
```

### Thread Viewing Flow

```
1. User clicks thread link
   ↓
2. GET /threads/:slug
   ↓
3. Middleware:
   - Session check (optional)
   - Rate limiting check
   ↓
4. threadController.showThread()
   ↓
5. Database query:
   - Find thread by slug
   - Eager load: User, Category, Posts
   - Count reactions, bookmarks
   ↓
6. Check cache for category data
   ↓
7. Render thread.ejs with data
   ↓
8. Browser displays thread
```

### Post Creation Flow

```
1. User submits post form
   ↓
2. POST /posts
   ↓
3. Middleware:
   - Authentication check (requireAuth)
   - CSRF token verification
   - Rate limiting (content creation limiter)
   - Input validation
   ↓
4. postController.createPost()
   - Sanitize content (DOMPurify)
   - Process Markdown (marked.js)
   - Create post in database
   - Create notification for thread author
   - Clear related caches
   ↓
5. Redirect to thread page
   ↓
6. Flash success message
```

---

## Security Architecture

### Defense in Depth

Multiple layers of security:

1. **Network Layer:**
   - HTTPS/TLS encryption
   - Firewall rules
   - Rate limiting (Nginx + Express)

2. **Application Layer:**
   - Helmet.js security headers
   - CSRF token protection
   - Input validation (express-validator)
   - XSS sanitization (DOMPurify)
   - SQL injection prevention (Sequelize ORM)
   - Session security (httpOnly, secure cookies)

3. **Authentication Layer:**
   - Bcrypt password hashing
   - Session-based authentication
   - Account lockout after failed attempts
   - Password strength requirements

4. **Authorization Layer:**
   - Role-based access control (user, moderator, admin)
   - Resource ownership checks
   - Permission middleware

5. **Data Layer:**
   - Database user with limited permissions
   - Encrypted connections
   - Regular backups
   - Query parameterization

### Security Headers (Helmet.js)

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));
```

---

## Performance Optimization

### 1. Database Optimization

- **Indexes:** B-tree indexes on frequently queried columns
- **Eager Loading:** Avoid N+1 queries with `include`
- **Connection Pooling:** Reuse database connections
- **Query Optimization:** Select only needed columns

### 2. Caching Strategy

**In-Memory Cache (node-cache):**
```javascript
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Cache categories (rarely change)
let categories = cache.get('categories');
if (!categories) {
  categories = await Category.findAll();
  cache.set('categories', categories);
}
```

**Cache Invalidation:**
- Manual invalidation on data changes
- TTL-based expiration
- Clear cache after updates

### 3. Static Asset Optimization

- **Gzip Compression:** Enabled in Express
- **CDN:** Serve static assets from CDN (optional)
- **Browser Caching:** Cache-Control headers
- **Image Optimization:** Lazy loading, responsive images

### 4. Query Performance

```javascript
// Bad: N+1 query problem
const threads = await Thread.findAll();
for (let thread of threads) {
  thread.user = await User.findByPk(thread.userId);
}

// Good: Eager loading
const threads = await Thread.findAll({
  include: [{ model: User, attributes: ['id', 'username'] }]
});
```

---

## Scalability Considerations

### Horizontal Scaling

To scale beyond a single server:

1. **Load Balancer:** Nginx/HAProxy to distribute traffic
2. **Stateless Application:** Session stored in Redis/database
3. **Database Replication:** Read replicas for queries
4. **CDN:** Static assets served from edge locations

### Vertical Scaling

Optimize single-server performance:

1. **Increase Node.js memory:** `--max-old-space-size`
2. **Database tuning:** shared_buffers, work_mem
3. **Connection pool size:** Increase max connections
4. **Worker processes:** PM2 cluster mode

### Future Enhancements

- **Message Queue:** Background job processing (email, notifications)
- **Microservices:** Separate search, notifications, media processing
- **Caching Layer:** Redis for sessions and frequently accessed data
- **Full-text Search:** Elasticsearch for advanced search

---

## Technology Decisions

### Why Node.js + Express?

**Pros:**
- JavaScript full-stack (same language frontend/backend)
- Large ecosystem (npm packages)
- Non-blocking I/O for concurrent requests
- Easy to get started, fast development

**Cons:**
- Single-threaded (mitigated with cluster mode)
- CPU-intensive tasks block event loop
- Callback/promise management complexity

### Why PostgreSQL?

**Pros:**
- ACID compliance (data integrity)
- Rich feature set (JSON, full-text search, arrays)
- Open source, mature, stable
- Excellent performance for relational data

**Cons:**
- More complex than NoSQL for simple use cases
- Requires schema migrations

### Why Sequelize ORM?

**Pros:**
- SQL injection protection
- Database abstraction (can switch databases)
- Migrations and seeding
- Associations and eager loading

**Cons:**
- Abstraction overhead
- Learning curve
- Can generate inefficient queries if misused

### Why Server-Side Rendering (EJS)?

**Pros:**
- Better SEO (search engines see content)
- Faster initial page load
- Works without JavaScript
- Simple template syntax

**Cons:**
- Full page reloads for navigation
- Less interactive than SPAs
- Server load for rendering

### Why Session-Based Auth (vs JWT)?

**Pros:**
- Easy to invalidate sessions (logout, ban)
- Session data stored server-side
- Built-in Express support
- Secure by default (httpOnly cookies)

**Cons:**
- Requires server-side storage
- Harder to scale horizontally (needs shared storage)
- Cookie-based (CSRF protection needed)

---

**Last Updated:** November 2025  
**Version:** 1.0.0
