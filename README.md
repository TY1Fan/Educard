# Educard - Educational Web Forum

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](./LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL Version](https://img.shields.io/badge/postgresql-%3E%3D12.0-blue)](https://www.postgresql.org/)

A feature-rich, educational web forum application built with Node.js, Express.js, and PostgreSQL. This project follows a spec-driven development approach with a focus on security, accessibility, and modern web standards.

## 🎯 Project Overview

Educard is a production-ready 3-tier web forum that provides:
- **User Management:** Registration, authentication, profiles, and notifications
- **Forum System:** Categories, threads, posts with full CRUD operations
- **Rich Content:** Markdown support, code syntax highlighting, file attachments
- **Search & Discovery:** Advanced search, tags, content recommendations
- **Moderation:** Admin dashboard, user management, content moderation tools
- **User Experience:** Responsive design, dark mode, accessibility features (WCAG 2.1 AA)
- **Security:** Rate limiting, CSRF protection, XSS prevention, secure headers
- **Performance:** Caching, optimized queries, lazy loading, SEO optimization

## 🏗️ Architecture

**3-Tier Architecture:**
- **Presentation Tier:** Server-side rendered HTML with EJS templates, responsive CSS
- **Application Tier:** Node.js with Express.js, middleware, authentication, caching
- **Data Tier:** PostgreSQL database with Sequelize ORM, optimized indexes

**Key Design Patterns:**
- MVC (Model-View-Controller) architecture
- Repository pattern for data access
- Middleware chain for request processing
- Session-based authentication
- Template inheritance with layouts and partials

## 🚀 Getting Started

### Prerequisites

**Option 1: Using Docker (Recommended)**
- Docker Desktop or Docker Engine
- Docker Compose

**Option 2: Local Development**
- Node.js 18.x or higher
- PostgreSQL 12.x or higher
- npm or yarn package manager

### Installation

#### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd educard
```

2. Start the application with Docker Compose:
```bash
docker-compose up
```

That's it! The application and database will start automatically.
- Application: `http://localhost:3000`
- Database: `localhost:5432`

**Useful Docker Commands:**
```bash
# Start in detached mode (background)
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers (after dependency changes)
docker-compose up --build

# Run database migrations (once implemented)
docker-compose exec app npm run migrate

# Access application shell
docker-compose exec app sh

# Access database shell
docker-compose exec db psql -U educard -d educard_dev
```

#### Local Development (Without Docker)

1. Clone the repository:
```bash
git clone <repository-url>
cd educard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env: Change DB_HOST from 'db' to 'localhost'
```

4. Set up the database:
```bash
# Create PostgreSQL database
createdb educard_dev

# Run migrations (once implemented)
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser to `http://localhost:3000`

## 🎯 Available npm Scripts

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Run tests (once tests are implemented)
npm test

# Lint code with ESLint
npm run lint

# Format code with Prettier
npm run format
```

**Docker Commands:**
```bash
# Run npm scripts in Docker container
docker-compose exec app npm run dev
docker-compose exec app npm test
docker-compose exec app npm run lint
```

## 🌐 Accessing the Application

Once the application is running:

- **Homepage:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

The application will automatically reload when you make changes to the code (thanks to nodemon).

**Database Access:**
- **Host:** localhost
- **Port:** 5432
- **Database:** educard_dev
- **User:** educard
- **Password:** (see .env file)

## 📋 Project Status

**Current Phase:** Phase 4 - Enhancement & Polish  
**Status:** ✅ Phase 4 Near Complete (Task 4.5.4 in progress)

**Completion Summary:**
- ✅ Phase 1: Setup & Foundation (100%)
- ✅ Phase 2: Authentication System (100%)
- ✅ Phase 3: Core Forum Features (100%)
- ✅ Phase 4.1-4.4: Enhancements (100%)
- 🔄 Phase 4.5: Quality Assurance (75% - documentation in progress)

See [specs/40-tasks.md](./specs/40-tasks.md) for detailed task breakdown and progress.

## 📚 Documentation

Comprehensive project documentation is organized in multiple locations:

**Specification Documents** (`specs/`):
- [Constitution](./specs/00-constitution.md) - Project principles and governance
- [Current State](./specs/10-current-state-spec.md) - Baseline and gap analysis
- [Target Specification](./specs/20-target-spec.md) - Complete technical specifications
- [Implementation Plan](./specs/30-plan.md) - Phased development roadmap
- [Task Breakdown](./specs/40-tasks.md) - Detailed task list with acceptance criteria
- [Traceability Matrix](./specs/50-traceability.md) - Requirements to tasks mapping

**Technical Documentation:**
- [docs/README.md](./docs/README.md) - **📚 Documentation index and navigation**
- [SECURITY.md](./SECURITY.md) - Security policy, authentication, and vulnerability reporting
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Developer contribution guidelines and workflow
- [docs/DATABASE.md](./docs/DATABASE.md) - Database schema, relationships, and migrations
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture and design decisions
- [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md) - Environment variables reference
- [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [docs/ACCESSIBILITY.md](./docs/ACCESSIBILITY.md) - Accessibility features and WCAG compliance
- [docs/CROSS_BROWSER_TESTING.md](./docs/CROSS_BROWSER_TESTING.md) - Browser compatibility testing

**Deployment Documentation:**
- [docs/deployment/DOCKER.md](./docs/deployment/DOCKER.md) - Docker setup and container management
- [docs/deployment/DEPLOYMENT.md](./docs/deployment/DEPLOYMENT.md) - Production deployment guide
- [k8s/README.md](./k8s/README.md) - Kubernetes deployment guide

## � Project Structure

```
educard/
├── src/
│   ├── app.js                        # Express application configuration
│   ├── config/
│   │   └── database.js               # Sequelize database configuration
│   ├── models/                       # Sequelize models (User, Category, Thread, Post, etc.)
│   ├── controllers/                  # Route controllers (auth, forum, admin, search)
│   ├── routes/                       # Route definitions
│   ├── middleware/                   # Custom middleware (auth, rate limiting, security)
│   ├── utils/                        # Utility functions (caching, helpers)
│   └── views/                        # EJS templates
│       ├── layouts/                  # Layout templates
│       ├── pages/                    # Main page views
│       ├── partials/                 # Reusable components
│       └── errors/                   # Error pages (404, 429, 500)
├── public/
│   ├── css/
│   │   └── style.css                 # Main stylesheet (~2000 lines)
│   ├── js/
│   │   └── main.js                   # Client-side JavaScript
│   ├── images/                       # Static images
│   └── uploads/                      # User uploaded files
├── docs/                             # Technical documentation
│   ├── README.md                     # Documentation index
│   ├── phases/                       # Phase completion docs
│   ├── deployment/                   # Deployment guides
│   ├── k8s-tasks/                    # Kubernetes task summaries
│   ├── DATABASE.md
│   ├── ARCHITECTURE.md
│   ├── ENVIRONMENT.md
│   ├── TROUBLESHOOTING.md
│   ├── ACCESSIBILITY.md
│   └── CROSS_BROWSER_TESTING.md
├── k8s/                              # Kubernetes deployment files
├── specs/                            # Project specifications
├── tests/                            # Test files and scripts
├── server.js                         # Application entry point
├── package.json                      # Dependencies and scripts
├── Dockerfile                        # Development Docker configuration
├── Dockerfile.production             # Production Docker configuration
├── docker-compose.yml                # Multi-container setup
├── SECURITY.md                       # Security policy
├── CONTRIBUTING.md                   # Contribution guidelines
├── .env                              # Environment variables (not committed)
├── .env.example                      # Environment template
└── README.md                         # This file
```

## �🛠️ Technology Stack

**Backend:**
- Node.js 18+ with Express.js 4.18 framework
- PostgreSQL 12+ database
- Sequelize 6 ORM with migrations
- EJS templating engine
- express-session with connect-flash

**Content & Formatting:**
- Marked.js for Markdown parsing
- Highlight.js for code syntax highlighting
- DOMPurify + jsdom for XSS sanitization
- express-validator for input validation

**Security:**
- helmet.js 8.x for security headers (CSP, HSTS, etc.)
- express-rate-limit 8.x for rate limiting
- bcrypt for password hashing
- CSRF token protection
- SQL injection prevention via Sequelize ORM

**Performance:**
- node-cache for in-memory caching
- Database query optimization with indexes
- Lazy loading for images

**Infrastructure:**
- Docker & Docker Compose for containerization
- PostgreSQL 15 Alpine image
- Node.js 18 Alpine image

**Development Tools:**
- nodemon for auto-reloading
- ESLint for code linting
- Prettier for code formatting
- sequelize-cli for database migrations

## 🎨 Features

### Phase 1 ✅ Completed
- [x] Project setup and configuration
- [x] Docker containerization (app + database)
- [x] Database connection (PostgreSQL + Sequelize)
- [x] EJS templates with responsive layouts
- [x] Responsive CSS framework
- [x] Development environment with hot-reload

### Phase 2 ✅ Completed
- [x] User registration with validation
- [x] User login/logout with session management
- [x] Password hashing with bcrypt
- [x] Authentication middleware
- [x] Flash messages for user feedback
- [x] CSRF protection

### Phase 3 ✅ Completed
- [x] Forum categories with descriptions
- [x] Thread creation and listing
- [x] Post creation with replies
- [x] Edit and delete operations with authorization
- [x] User profiles with avatar support
- [x] Pagination for threads and posts
- [x] Vote system (upvotes/downvotes)
- [x] Bookmarking system
- [x] Notification system
- [x] File attachments for posts

### Phase 4.1 ✅ Search & Discovery
- [x] Advanced search (users, threads, posts, tags)
- [x] Tag system with auto-suggestions
- [x] Content recommendations
- [x] Popular threads and active users
- [x] Search result highlighting

### Phase 4.2 ✅ User Experience
- [x] Markdown support with preview
- [x] Code syntax highlighting (highlight.js)
- [x] Dark mode toggle
- [x] Responsive navigation
- [x] Rich text editor
- [x] Image upload and preview
- [x] Loading states and animations

### Phase 4.3 ✅ Admin Features
- [x] Admin dashboard with statistics
- [x] User management (ban/unban/role changes)
- [x] Content moderation tools
- [x] Reported content review
- [x] Activity logs
- [x] System health monitoring

### Phase 4.4 ✅ Performance & SEO
- [x] Database query optimization
- [x] In-memory caching (node-cache)
- [x] Lazy loading for images
- [x] SEO meta tags and Open Graph
- [x] Sitemap generation
- [x] Performance monitoring

### Phase 4.5 ✅ Quality Assurance (In Progress)
- [x] Comprehensive security audit
- [x] Rate limiting on sensitive endpoints
- [x] Security headers (helmet.js)
- [x] XSS and SQL injection protection
- [x] Accessibility audit (WCAG 2.1 AA)
- [x] Cross-browser and mobile testing
- [x] Responsive design (320px to 4K)
- [🔄] Comprehensive documentation (this task)

## 🧪 Testing

```bash
# Run tests (once implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 📝 Development Workflow

This project follows a spec-driven development approach:

1. **Requirements Definition:** Clear specifications in `specs/` directory
2. **Task Breakdown:** Detailed tasks with acceptance criteria in `specs/40-tasks.md`
3. **Implementation:** Incremental development following task order
4. **Testing:** Each feature tested before moving to the next
5. **Documentation:** Comprehensive docs maintained throughout
6. **Traceability:** Full mapping from requirements to implementation

### Code Standards

- **Style Guide:** ESLint configuration for code quality
- **Formatting:** Prettier for consistent code style
- **Security:** Regular `npm audit` checks, dependency updates
- **Accessibility:** WCAG 2.1 AA compliance for all UI components
- **Performance:** Lighthouse scores 85+ for all pages
- **Browser Support:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed development guidelines.

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on:
- Code of conduct
- Development process and workflow
- Pull request guidelines
- Code style and standards
- Testing requirements

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following code standards
4. Test thoroughly (run `npm test`, `npm run lint`)
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request with detailed description

## 🔒 Security

Security is a top priority. We implement:
- **Rate Limiting:** Protection against brute force and DDoS attacks
- **Security Headers:** CSP, HSTS, X-Frame-Options via helmet.js
- **Input Validation:** express-validator for all user inputs
- **XSS Protection:** DOMPurify sanitization and EJS auto-escaping
- **SQL Injection Protection:** Sequelize ORM with parameterized queries
- **CSRF Protection:** Token-based verification for state-changing requests
- **Password Security:** bcrypt hashing with salt rounds

Found a security vulnerability? Please email security@educard.example.com or see [SECURITY.md](./SECURITY.md) for responsible disclosure.

## ♿ Accessibility

Educard is committed to accessibility (WCAG 2.1 Level AA):
- Semantic HTML structure with proper ARIA labels
- Keyboard navigation support for all interactive elements
- Screen reader compatibility tested with NVDA/JAWS/VoiceOver
- Color contrast ratio 8.4:1 minimum (exceeds AA requirement)
- Focus indicators visible on all interactive elements
- Skip navigation links for keyboard users
- Touch targets minimum 44x44px
- Reduced motion support for animations

See [docs/ACCESSIBILITY.md](./docs/ACCESSIBILITY.md) for detailed accessibility documentation.

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- Project Repository: [GitHub](https://github.com/TY1Fan/Educard)
- Issue Tracker: [GitHub Issues](https://github.com/TY1Fan/Educard/issues)
- Documentation: [specs/](./specs/)

## 👤 Author

Development Team

## 📊 Project Timeline

**Actual Development Progress:**

- **Phase 1:** ✅ Complete (Setup & Foundation)
- **Phase 2:** ✅ Complete (Authentication System)
- **Phase 3:** ✅ Complete (Core Forum Features)
- **Phase 4.1-4.4:** ✅ Complete (Search, UX, Admin, Performance)
- **Phase 4.5:** 🔄 In Progress (Quality Assurance - 75% complete)
- **Phase 5:** 📋 Planned (Production Deployment)

**Total Development Time:** ~6-8 weeks with continuous iteration and refinement

## 🚀 Production Deployment

For production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

**Quick Production Checklist:**
- [ ] Set `NODE_ENV=production` in environment
- [ ] Use strong `SESSION_SECRET` (32+ character random string)
- [ ] Configure production database with strong credentials
- [ ] Enable HTTPS/TLS encryption
- [ ] Set up database backups
- [ ] Configure log aggregation and monitoring
- [ ] Review and apply security headers
- [ ] Test with production-like data volume
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure CDN for static assets (optional)

## 🐛 Troubleshooting

Common issues and solutions are documented in [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md).

**Quick Fixes:**
- Database connection errors: Check `DB_HOST`, `DB_PORT`, and credentials in `.env`
- Port already in use: Change `PORT` in `.env` or stop conflicting service
- npm install errors: Delete `node_modules/` and `package-lock.json`, run `npm install` again
- Docker issues: Run `docker-compose down -v` to reset containers and volumes

## 🌟 Acknowledgments

Built following modern web development best practices:
- MVC architecture pattern
- RESTful API design principles
- OWASP security guidelines
- WCAG accessibility standards
- Responsive web design principles

## 📈 Statistics

**Codebase Metrics:**
- ~15,000+ lines of application code
- 50+ database tables and relationships
- 30+ routes and API endpoints
- 40+ EJS templates and partials
- 20+ middleware functions
- 2,000+ lines of CSS
- 1,700+ lines of documentation

---

*Built with ❤️ following spec-driven development principles*
