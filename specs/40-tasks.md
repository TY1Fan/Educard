# Task Breakdown

## Document Information
- **Project:** Educard - Educational Web Forum
- **Document Type:** Task Breakdown
- **Version:** 1.0
- **Date:** November 13, 2025
- **Status:** Active
- **Related Documents:** 
  - [Constitution](./00-constitution.md)
  - [Current State](./10-current-state-spec.md)
  - [Target Specification](./20-target-spec.md)
  - [Implementation Plan](./30-plan.md)
  - [Traceability Matrix](./50-traceability.md)

## 1. Overview

This document breaks down the implementation plan into specific, actionable tasks. Each task includes:
- Clear description
- Acceptance criteria
- Estimated time
- Dependencies
- Priority level

Tasks are organized by phase, starting with Phase 1 (Setup & Foundation).

## 2. Task Status Legend

- 🔴 **Not Started** - Task not yet begun
- 🟡 **In Progress** - Task currently being worked on
- 🟢 **Completed** - Task finished and validated
- ⏸️ **Blocked** - Task blocked by dependencies
- ⚠️ **Needs Review** - Task complete but needs validation

## 3. Phase 1: Setup & Foundation

**Phase Duration:** 1 week  
**Phase Goal:** Set up development environment and project structure  
**Phase Priority:** Critical (blocks all other work)

---

### Task 1.1: Initialize Project Repository

**Status:** � Completed  
**Priority:** High  
**Estimated Time:** 30 minutes  
**Dependencies:** None  
**Assigned To:** Developer  
**Completed:** November 13, 2025

**Description:**
Set up Git repository and initialize npm project with basic configuration files.

**Steps:**
1. Create project directory `educard`
2. Initialize Git repository: `git init`
3. Create `.gitignore` file with Node.js template
4. Initialize npm: `npm init -y`
5. Create initial README.md with project description
6. Create `.env.example` template
7. Make initial commit

**Acceptance Criteria:**
- [x] Git repository initialized
- [x] `.gitignore` includes `node_modules/`, `.env`, `*.log`
- [x] `package.json` exists with project name "educard"
- [x] README.md has project title and brief description
- [x] `.env.example` file created (empty for now)
- [x] Initial commit made to repository

**Files to Create:**
- `.gitignore`
- `package.json`
- `README.md`
- `.env.example`

**Validation:**
```bash
git status  # Should show clean working tree
docker --version  # Verify Docker is installed
docker-compose --version  # Verify Docker Compose is installed
```

**Note:** Docker files added to support containerized development. This eliminates the need for local Node.js and PostgreSQL installations.

---

### Task 1.2: Start Docker Environment and Install Dependencies

**Status:** � Completed  
**Priority:** High  
**Estimated Time:** 15 minutes  
**Dependencies:** Task 1.1  
**Assigned To:** Developer  
**Completed:** November 13, 2025

**Description:**
Start the Docker containers and install all necessary npm packages within the container.

**Steps:**
1. Update `package.json` with all dependencies
2. Start Docker Compose: `docker-compose up -d`
3. Wait for containers to start and database to be ready
4. Verify application container is running
5. Verify database container is running
6. Check logs for any errors

**Acceptance Criteria:**
- [x] Docker containers start successfully
- [x] Application container is running
- [x] Database container is running and healthy
- [x] Dependencies installed in container (via Dockerfile)
- [x] No container errors in logs (error expected: server.js not created yet)
- [x] Can access application at `http://localhost:3000` (will show error until app is built)

**Required Commands:**
```bash
# Start containers
docker-compose up -d

# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Verify database is ready
docker-compose exec db pg_isready -U educard
```

**Dependencies to Add to package.json:**
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "ejs": "^3.1.0",
    "express-session": "^1.17.0",
    "sequelize": "^6.32.0",
    "pg": "^8.11.0",
    "pg-hstore": "^2.3.4",
    "bcrypt": "^5.1.0",
    "csurf": "^1.11.0",
    "dotenv": "^16.3.0",
    "express-validator": "^7.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "eslint": "^8.48.0",
    "prettier": "^3.0.0"
  }
}
```

**Validation:**
```bash
# Check containers are running
docker-compose ps

# View application logs
docker-compose logs app

# Check installed packages in container
docker-compose exec app npm list --depth=0
```

**Docker Benefits:**
- No local Node.js installation required
- No local PostgreSQL installation required
- Consistent environment across all developers
- Easy cleanup: `docker-compose down -v`

---

### Task 1.3: Create Project Directory Structure

**Status:** � Completed  
**Priority:** High  
**Estimated Time:** 15 minutes  
**Dependencies:** Task 1.1  
**Assigned To:** Developer  
**Completed:** November 13, 2025

**Description:**
Create the folder structure for the application following MVC pattern.

**Steps:**
1. Create `src/` directory
2. Create subdirectories:
   - `src/config/`
   - `src/models/`
   - `src/controllers/`
   - `src/routes/`
   - `src/middlewares/`
   - `src/utils/`
   - `src/views/`
3. Create view subdirectories:
   - `src/views/layouts/`
   - `src/views/partials/`
   - `src/views/pages/`
   - `src/views/errors/`
4. Create `public/` directory with:
   - `public/css/`
   - `public/js/`
   - `public/images/`
5. Create `tests/` directory with:
   - `tests/unit/`
   - `tests/integration/`

**Acceptance Criteria:**
- [x] All directories created
- [x] Directory structure matches plan
- [x] Empty `.gitkeep` files in empty directories (for Git tracking)
- [x] Structure visible in file explorer

**Directory Tree:**
```
educard/
├── src/
│   ├── config/
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   ├── utils/
│   └── views/
│       ├── layouts/
│       ├── partials/
│       ├── pages/
│       └── errors/
├── public/
│   ├── css/
│   ├── js/
│   └── images/
└── tests/
    ├── unit/
    └── integration/
```

**Validation:**
```bash
tree -L 3  # View directory structure
# Or manually verify all directories exist
```

---

### Task 1.4: Set Up Environment Configuration

**Status:** � Completed  
**Priority:** High  
**Estimated Time:** 20 minutes  
**Dependencies:** Task 1.2  
**Assigned To:** Developer  
**Completed:** November 13, 2025

**Description:**
Configure environment variables for development environment.

**Steps:**
1. Create `.env` file (copy from `.env.example`)
2. Add application configuration:
   - `NODE_ENV=development`
   - `PORT=3000`
   - `APP_URL=http://localhost:3000`
3. Add session configuration:
   - `SESSION_SECRET=` (generate random string)
4. Add database configuration:
   - `DB_HOST=db` (Docker service name)
   - `DB_PORT=5432`
   - `DB_NAME=educard_dev`
   - `DB_USER=educard`
   - `DB_PASSWORD=educard_dev_password`
5. Update `.env.example` with variable names (already done in Task 1.1)
6. Ensure `.env` is in `.gitignore` (already configured)

**Acceptance Criteria:**
- [x] `.env` file exists with all variables
- [x] `SESSION_SECRET` is random and secure (64 hex characters)
- [x] `.env.example` has all variable names (no sensitive values)
- [x] `.env` is listed in `.gitignore`
- [x] Database credentials are correct for Docker setup
- [x] Environment variables verified in Docker container
- [ ] Database credentials are correct for local setup

**Example `.env`:**
```
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

SESSION_SECRET=your-random-secret-key-here-change-this
SESSION_MAX_AGE=86400000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=educard_dev
DB_USER=postgres
DB_PASSWORD=your-password-here
```

**Example `.env.example`:**
```
NODE_ENV=
PORT=
APP_URL=

SESSION_SECRET=
SESSION_MAX_AGE=

DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
```

**Validation:**
- Verify `.env` file can be loaded
- Confirm sensitive data not in `.env.example`

---

### Task 1.5: Create Express Application Setup

**Status:** � Completed  
**Priority:** High  
**Estimated Time:** 45 minutes  
**Dependencies:** Tasks 1.2, 1.3, 1.4  
**Assigned To:** Developer  
**Completed:** November 13, 2025

**Description:**
Create the main Express application file with basic middleware configuration.

**Steps:**
1. Create `src/app.js` file
2. Import required packages (express, path, dotenv, etc.)
3. Load environment variables with dotenv
4. Create Express app instance
5. Configure view engine (EJS)
6. Set views directory
7. Configure static file serving (public folder)
8. Add body parsing middleware
9. Add basic middleware (logging, etc.)
10. Create placeholder route for homepage
11. Add 404 handler
12. Add error handler middleware
13. Export app

**Acceptance Criteria:**
- [x] `src/app.js` file created
- [x] Environment variables loaded
- [x] EJS configured as view engine
- [x] Static files served from `public/`
- [x] Body parser middleware configured
- [x] Homepage route returns styled landing page
- [x] Health check endpoint at `/health`
- [x] 404 handler in place with styled page
- [x] Error handler in place with environment-aware output
- [x] App exports properly

**File:** `src/app.js`

**Key Code Sections:**
```javascript
// Load environment variables
require('dotenv').config();

// Create Express app
const express = require('express');
const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Educard Forum - Coming Soon');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

module.exports = app;
```

**Validation:**
- File can be imported without errors
- No syntax errors

---

### Task 1.6: Create Server Entry Point

**Status:** � Completed  
**Priority:** High  
**Estimated Time:** 15 minutes  
**Dependencies:** Task 1.5  
**Assigned To:** Developer  
**Completed:** November 13, 2025

**Description:**
Create the server file that starts the Express application.

**Steps:**
1. Create `server.js` in project root
2. Import the app from `src/app.js`
3. Get port from environment variable
4. Start server listening on port
5. Add console log for server start
6. Add error handling for server startup

**Acceptance Criteria:**
- [x] `server.js` file created
- [x] Imports app correctly
- [x] Reads PORT from environment
- [x] Starts server on correct port
- [x] Logs startup message with URL and health check
- [x] Handles port-in-use errors
- [x] Graceful shutdown on SIGTERM/SIGINT
- [x] Server running successfully in Docker

**File:** `server.js`

**Code:**
```javascript
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Educard Forum running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});
```

**Validation:**
```bash
node server.js  # Should start without errors
# Should see: "🚀 Educard Forum running on http://localhost:3000"
```

---

### Task 1.7: Configure npm Scripts

**Status:** � Completed  
**Priority:** Medium  
**Estimated Time:** 10 minutes  
**Dependencies:** Task 1.6  
**Assigned To:** TBD

**Description:**
Add helpful npm scripts to package.json for development.

**Steps:**
1. Open `package.json`
2. Add `start` script: `"node server.js"`
3. Add `dev` script: `"nodemon server.js"`
4. Add `test` script placeholder: `"echo \"No tests yet\""`
5. Add `lint` script: `"eslint src/**/*.js"`
6. Add `format` script: `"prettier --write src/**/*.js"`

**Acceptance Criteria:**
- [ ] `npm start` runs the server
- [ ] `npm run dev` runs with nodemon (auto-restart)
- [ ] `npm test` shows placeholder message
- [ ] `npm run lint` checks code (even if no lint rules yet)
- [ ] `npm run format` formats code

**package.json scripts section:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no tests specified\" && exit 0",
    "lint": "eslint src/**/*.js",
    "format": "prettier --write src/**/*.js"
  }
}
```

**Validation:**
```bash
npm start  # Server starts
npm run dev  # Server starts with auto-reload
npm test  # Shows message (doesn't fail)
```

---

### Task 1.8: Verify PostgreSQL Container (Docker)

**Status:** � Completed  
**Priority:** High  
**Estimated Time:** 10 minutes  
**Dependencies:** Task 1.2  
**Assigned To:** TBD

**Description:**
Verify PostgreSQL is running in Docker container and database is accessible.

**Steps:**
1. Check database container is running: `docker-compose ps`
2. Check database health: `docker-compose exec db pg_isready -U educard`
3. Connect to database: `docker-compose exec db psql -U educard -d educard_dev`
4. List databases: `\l`
5. Exit psql: `\q`
6. Test connection from app container (once app is built)

**Acceptance Criteria:**
- [ ] PostgreSQL container is running
- [ ] Database `educard_dev` exists
- [ ] Can connect with user `educard`
- [ ] Database is healthy (pg_isready returns success)
- [ ] Can access database from both host and app container

**Docker Commands:**
```bash
# Check container status
docker-compose ps

# Check database health
docker-compose exec db pg_isready -U educard

# Connect to database
docker-compose exec db psql -U educard -d educard_dev

# Verify
psql -l  # List all databases, should see educard_dev
```

**For Local Development (without Docker):**
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15
psql postgres -c "CREATE DATABASE educard_dev;"

# Linux
sudo apt install postgresql-15
sudo systemctl start postgresql
sudo -u postgres createdb educard_dev

# Windows
# Download installer from postgresql.org
```

**Validation:**
```bash
# With Docker (recommended)
docker-compose exec db psql -U educard -d educard_dev -c "SELECT version();"

# Without Docker (local)
psql -d educard_dev -c "SELECT version();"
```

**Note:** When using Docker, PostgreSQL is automatically installed and configured. No manual installation needed!

---

### Task 1.9: Configure Sequelize Database Connection

**Status:** � Completed  
**Priority:** High  
**Estimated Time:** 30 minutes  
**Dependencies:** Tasks 1.2, 1.8  
**Assigned To:** TBD

**Description:**
Set up Sequelize ORM and configure database connection.

**Steps:**
1. Create `src/config/database.js`
2. Import Sequelize
3. Load database credentials from environment
4. Create Sequelize instance with configuration
5. Add connection options (pool, logging, etc.)
6. Export database instance
7. Create test connection function
8. Test database connection

**Acceptance Criteria:**
- [ ] `src/config/database.js` file created
- [ ] Sequelize instance configured
- [ ] Uses environment variables for credentials
- [ ] Connection pool configured
- [ ] Logging configured (console.log for dev)
- [ ] Test connection succeeds
- [ ] Exports sequelize instance

**File:** `src/config/database.js`

**Code:**
```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    return false;
  }
}

module.exports = { sequelize, testConnection };
```

**Validation:**
Create a test script or add to server.js:
```javascript
const { testConnection } = require('./src/config/database');
testConnection();
```

---

### Task 1.10: Create Basic Layout Template

**Status:** � Completed  
**Priority:** Medium  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 1.5  
**Assigned To:** TBD

**Description:**
Create the main EJS layout template with header, footer, and basic structure.

**Steps:**
1. Create `src/views/layouts/main.ejs`
2. Add HTML5 boilerplate structure
3. Add head section with meta tags
4. Link to CSS file
5. Create header section with site name and navigation placeholder
6. Add main content area with `<%- body %>`
7. Create footer section
8. Add viewport meta tag for responsive design
9. Include any client-side JavaScript

**Acceptance Criteria:**
- [ ] `src/views/layouts/main.ejs` file created
- [ ] Valid HTML5 structure
- [ ] Includes meta charset and viewport
- [ ] Links to `/css/style.css`
- [ ] Has header with site name "Educard"
- [ ] Has main content area
- [ ] Has footer with copyright
- [ ] Clean, semantic HTML

**File:** `src/views/layouts/main.ejs`

**Code:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title || 'Educard Forum' %></title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="container">
      <h1 class="site-title">
        <a href="/">Educard</a>
      </h1>
      <nav class="main-nav">
        <ul>
          <li><a href="/">Home</a></li>
          <!-- Auth links will go here -->
        </ul>
      </nav>
    </div>
  </header>

  <main class="main-content">
    <div class="container">
      <%- body %>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>&copy; 2025 Educard Forum. An educational discussion platform.</p>
    </div>
  </footer>

  <script src="/js/main.js"></script>
</body>
</html>
```

**Note:** This assumes use of EJS layouts. May need to adjust if using a different templating approach.

**Validation:**
- HTML validates (no syntax errors)
- Template can be rendered

---

### Task 1.11: Create Basic CSS Stylesheet

**Status:** � Completed  
**Priority:** Medium  
**Estimated Time:** 1 hour  
**Dependencies:** Task 1.10  
**Assigned To:** TBD

**Description:**
Create a basic CSS file with simple, clean styling and responsive design foundation.

**Steps:**
1. Create `public/css/style.css`
2. Add CSS reset/normalize
3. Define CSS variables for colors
4. Add base styles (body, typography)
5. Style header and navigation
6. Style main content area
7. Style footer
8. Add container and layout classes
9. Add basic form styles
10. Add button styles
11. Add responsive breakpoints
12. Test on different screen sizes

**Acceptance Criteria:**
- [ ] `public/css/style.css` file created
- [ ] Clean, modern design
- [ ] Responsive layout (mobile-first)
- [ ] Consistent spacing and typography
- [ ] Color scheme defined with CSS variables
- [ ] Header, main, footer styled
- [ ] Container max-width set (e.g., 1200px)
- [ ] Readable on mobile (320px+)
- [ ] Readable on desktop (1920px)

**File:** `public/css/style.css`

**Basic Structure:**
```css
/* CSS Variables */
:root {
  --primary-color: #2563eb;
  --secondary-color: #64748b;
  --text-color: #1e293b;
  --bg-color: #ffffff;
  --border-color: #e2e8f0;
  --hover-color: #1e40af;
  --error-color: #dc2626;
  --success-color: #16a34a;
}

/* Reset & Base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--bg-color);
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
.site-header {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* ... more styles ... */

/* Responsive */
@media (max-width: 768px) {
  /* Mobile styles */
}
```

**Validation:**
- CSS loads without errors
- Styles applied to page
- Responsive at different widths

---

### Task 1.12: Create Homepage View

**Status:** � Completed  
**Priority:** Medium  
**Estimated Time:** 30 minutes  
**Dependencies:** Tasks 1.10, 1.11  
**Assigned To:** TBD

**Description:**
Create a simple homepage view to test the template and routing system.

**Steps:**
1. Create `src/views/pages/home.ejs`
2. Add page title
3. Add welcome message
4. Add placeholder for categories (will be dynamic later)
5. Update `src/app.js` to render this view instead of plain text
6. Test page rendering

**Acceptance Criteria:**
- [ ] `src/views/pages/home.ejs` file created
- [ ] Page renders with layout
- [ ] Welcome message displays
- [ ] Page title is correct
- [ ] Styles from CSS applied
- [ ] No rendering errors

**File:** `src/views/pages/home.ejs`

**Code:**
```html
<div class="page-header">
  <h1>Welcome to Educard Forum</h1>
  <p>An educational discussion platform for learners and educators.</p>
</div>

<section class="categories">
  <h2>Forum Categories</h2>
  <p>Categories will appear here once the database is set up.</p>
  
  <!-- Placeholder for future category list -->
  <div class="category-list">
    <div class="category-item">
      <h3>Coming Soon</h3>
      <p>Forum categories will be available soon.</p>
    </div>
  </div>
</section>
```

**Update in `src/app.js`:**
```javascript
app.get('/', (req, res) => {
  res.render('pages/home', { 
    title: 'Home - Educard Forum'
  });
});
```

**Validation:**
```bash
npm run dev
# Visit http://localhost:3000
# Should see styled homepage
```

---

### Task 1.13: Create Minimal Client-Side JavaScript

**Status:** � Completed  
**Priority:** Low  
**Estimated Time:** 15 minutes  
**Dependencies:** Task 1.10  
**Assigned To:** TBD

**Description:**
Create a basic JavaScript file for minimal client-side functionality.

**Steps:**
1. Create `public/js/main.js`
2. Add DOMContentLoaded wrapper
3. Add placeholder for future functionality
4. Add form confirmation helper (for delete operations)
5. Keep it minimal (most logic server-side)

**Acceptance Criteria:**
- [ ] `public/js/main.js` file created
- [ ] No JavaScript errors in console
- [ ] Linked properly in layout
- [ ] Has basic structure for future enhancements

**File:** `public/js/main.js`

**Code:**
```javascript
// Educard Forum - Client-side JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Educard Forum loaded');

  // Confirmation for delete actions
  const deleteButtons = document.querySelectorAll('.delete-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      if (!confirm('Are you sure you want to delete this?')) {
        e.preventDefault();
      }
    });
  });

  // Form validation feedback (optional enhancement)
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function() {
      // Could add loading states here
    });
  });
});
```

**Validation:**
- No console errors
- Console shows "✅ Educard Forum loaded"

---

### Task 1.14: Update README with Setup Instructions

**Status:** � Completed  
**Priority:** Medium  
**Estimated Time:** 30 minutes  
**Dependencies:** All Phase 1 tasks  
**Assigned To:** TBD

**Description:**
Write comprehensive README with project description and setup instructions.

**Steps:**
1. Open `README.md`
2. Add project title and description
3. Add features list
4. Add prerequisites (Node.js, PostgreSQL)
5. Add installation instructions
6. Add configuration instructions
7. Add how to run the application
8. Add project structure overview
9. Add technology stack
10. Add license and contributing info

**Acceptance Criteria:**
- [ ] README is comprehensive
- [ ] Installation steps are clear
- [ ] Prerequisites listed
- [ ] Environment setup documented
- [ ] How to run documented
- [ ] Technology stack listed
- [ ] Professional formatting (headers, lists, code blocks)

**File:** `README.md`

**Structure:**
```markdown
# Educard Forum

A simple educational web forum built with Node.js, Express, and PostgreSQL.

## Features
- User authentication (registration, login, logout)
- Forum categories and threads
- Post creation and replies
- Edit and delete own content
- User profiles
- Responsive design

## Prerequisites
- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

## Installation
1. Clone repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database
4. Configure environment variables
5. Run database migrations
6. Start server

[Detailed instructions...]

## Technology Stack
- Backend: Node.js + Express
- Database: PostgreSQL + Sequelize
- Frontend: EJS templates + CSS
- Authentication: bcrypt + express-session

## License
[To be decided]
```

**Validation:**
- Follow instructions on fresh machine (if possible)
- Instructions work correctly

---

### Task 1.15: Phase 1 Testing and Validation

**Status:** � Completed  
**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** All Phase 1 tasks (1.1-1.14)  
**Assigned To:** TBD

**Description:**
Test and validate that all Phase 1 components are working correctly together.

**Steps:**
1. Start fresh terminal
2. Run `npm install` (verify dependencies)
3. Start PostgreSQL (verify database running)
4. Test database connection
5. Run `npm run dev` (verify server starts)
6. Visit `http://localhost:3000` (verify homepage loads)
7. Check browser console (no errors)
8. Check terminal logs (no errors)
9. Test responsive design (resize browser)
10. Verify CSS and JS files load
11. Review all created files
12. Run through acceptance criteria for each task

**Acceptance Criteria:**
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] Homepage loads and displays correctly
- [ ] CSS styles applied
- [ ] JavaScript loads without errors
- [ ] Responsive on mobile and desktop
- [ ] No console errors
- [ ] All Phase 1 tasks completed
- [ ] Project structure matches plan

**Phase 1 Completion Checklist:**
- [ ] ✅ Task 1.1: Repository initialized
- [ ] ✅ Task 1.2: Dependencies installed
- [ ] ✅ Task 1.3: Directory structure created
- [ ] ✅ Task 1.4: Environment configured
- [ ] ✅ Task 1.5: Express app created
- [ ] ✅ Task 1.6: Server entry point created
- [ ] ✅ Task 1.7: npm scripts configured
- [ ] ✅ Task 1.8: PostgreSQL installed
- [ ] ✅ Task 1.9: Sequelize configured
- [ ] ✅ Task 1.10: Layout template created
- [ ] ✅ Task 1.11: CSS stylesheet created
- [ ] ✅ Task 1.12: Homepage view created
- [ ] ✅ Task 1.13: Client JS created
- [ ] ✅ Task 1.14: README updated
- [ ] ✅ Task 1.15: All tests passing

**Deliverables:**
- Working web server on http://localhost:3000
- Styled homepage rendering
- Database connection established
- Clean, organized codebase
- Complete documentation

**Next Phase:**
Once Phase 1 is complete, proceed to Phase 2 (Authentication System).

---

## 4. Phase 1 Summary

**Total Tasks:** 15  
**Estimated Total Time:** 7-9 hours  
**Priority:** All tasks are critical for Phase 1  

**Completion Criteria:**
- All 15 tasks completed and validated
- Server runs without errors
- Homepage displays correctly
- Database connection works
- Code is clean and organized
- Documentation is complete

**Phase 1 Deliverables:**
1. ✅ Working Express server
2. ✅ PostgreSQL database configured
3. ✅ Project structure in place
4. ✅ Basic templates and styling
5. ✅ Development environment ready
6. ✅ Documentation complete

**Ready for Phase 2:** Once all Phase 1 tasks are complete, the foundation is ready for implementing the authentication system.

---

## 5. Phase 2: Authentication System

**Phase Duration:** 1-2 weeks  
**Phase Goal:** Implement complete user authentication and session management  
**Phase Priority:** Critical (required for all user-generated content)

**Prerequisites:** Phase 1 must be 100% complete

---

### Task 2.1: Create User Database Model

**Status:** � Completed  
**Priority:** High  
**Estimated Time:** 45 minutes  
**Dependencies:** Phase 1 complete (Task 1.9)  
**Assigned To:** TBD

**Description:**
Create the Sequelize User model with proper fields, validation, and password hashing.

**Steps:**
1. Create `src/models/User.js`
2. Import Sequelize DataTypes
3. Define User model with fields:
   - id (auto-increment primary key)
   - username (unique, 3-50 chars)
   - email (unique, valid email)
   - password (hashed, never returned)
   - displayName (optional)
   - createdAt, updatedAt (timestamps)
   - isActive (boolean, default true)
4. Add validation rules
5. Add model hooks for password hashing (beforeCreate, beforeUpdate)
6. Add instance method to compare passwords
7. Exclude password from JSON serialization
8. Export model

**Acceptance Criteria:**
- [ ] `src/models/User.js` file created
- [ ] All required fields defined
- [ ] Field validation rules added
- [ ] Password hashing hook implemented (bcrypt)
- [ ] Password comparison method added
- [ ] Password excluded from queries by default
- [ ] Model exports properly
- [ ] No syntax errors

**File:** `src/models/User.js`

**Code:**
```javascript
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [8, 255]
    }
  },
  displayName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] }
    }
  },
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
      if (!user.displayName) {
        user.displayName = user.username;
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Instance method to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
```

**Validation:**
Create a test script to verify model:
```javascript
const User = require('./src/models/User');
const { sequelize } = require('./src/config/database');

async function testUserModel() {
  await sequelize.sync({ force: true });
  const user = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  });
  console.log('User created:', user.toJSON());
  // Password should be hashed, not visible
}
```

---

### Task 2.2: Create Database Migration for Users Table

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 30 minutes  
**Dependencies:** Task 2.1  
**Assigned To:** TBD

**Description:**
Create and run database migration to create the users table.

**Steps:**
1. Initialize Sequelize CLI: `npx sequelize-cli init` (if not done)
2. Update `.sequelizerc` config file (optional)
3. Create migration: `npx sequelize-cli migration:generate --name create-users-table`
4. Edit migration file to define users table schema
5. Add indexes for username and email
6. Run migration: `npx sequelize-cli db:migrate`
7. Verify table created in database
8. Test rollback: `npx sequelize-cli db:migrate:undo`
9. Re-run migration

**Acceptance Criteria:**
- [ ] Migration file created
- [ ] Schema matches User model
- [ ] Includes all fields with correct types
- [ ] Indexes added for username and email
- [ ] Migration runs successfully
- [ ] Table created in database
- [ ] Rollback works correctly
- [ ] Migration committed to Git

**Migration File Example:**
```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['email']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
```

**Validation:**
```bash
psql -d educard_dev -c "\dt"  # List tables, should see users
psql -d educard_dev -c "\d users"  # Describe users table
```

---

### Task 2.3: Configure Session Management

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 45 minutes  
**Dependencies:** Phase 1 complete  
**Assigned To:** TBD

**Description:**
Set up express-session middleware with secure configuration.

**Steps:**
1. Create `src/config/session.js`
2. Configure session options:
   - Secret from environment variable
   - Secure cookie settings
   - Session store (memory for dev, database for production)
   - Cookie max age
3. Export session middleware
4. Add session middleware to `src/app.js`
5. Test session persistence
6. Add session variables to templates (res.locals)

**Acceptance Criteria:**
- [ ] `src/config/session.js` file created
- [ ] Session secret from environment variable
- [ ] Cookie configured with httpOnly and secure flags
- [ ] Session middleware added to app
- [ ] Sessions persist across requests
- [ ] Session data accessible in views
- [ ] Development configuration working

**File:** `src/config/session.js`

**Code:**
```javascript
const session = require('express-session');

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'educard.sid' // Custom session cookie name
};

// For production, use database session store
// const SequelizeStore = require('connect-session-sequelize')(session.Store);
// sessionConfig.store = new SequelizeStore({ db: sequelize });

module.exports = session(sessionConfig);
```

**Update `src/app.js`:**
```javascript
const sessionMiddleware = require('./config/session');

// Add after body parser
app.use(sessionMiddleware);

// Make session user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  next();
});
```

**Validation:**
- Set session variable in route
- Verify it persists across requests
- Check cookie in browser dev tools

---

### Task 2.4: Create Registration Form View

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 2.3  
**Assigned To:** TBD

**Description:**
Create the user registration form page with proper validation and CSRF protection.

**Steps:**
1. Create `src/views/pages/register.ejs`
2. Add page title and heading
3. Create form with fields:
   - Username
   - Email
   - Password
   - Confirm Password
4. Add field validation attributes (HTML5)
5. Add CSRF token field (will implement in Task 2.9)
6. Display error messages (if any)
7. Add "Already have an account?" link to login
8. Style form with CSS

**Acceptance Criteria:**
- [ ] `src/views/pages/register.ejs` file created
- [ ] Form has all required fields
- [ ] HTML5 validation attributes added
- [ ] Form uses POST method
- [ ] Error display area included
- [ ] Link to login page included
- [ ] Form styled and user-friendly
- [ ] Mobile responsive

**File:** `src/views/pages/register.ejs`

**Code:**
```html
<div class="auth-container">
  <div class="auth-card">
    <h1>Register</h1>
    <p class="subtitle">Create your Educard account</p>

    <% if (errors && errors.length > 0) { %>
      <div class="alert alert-error">
        <ul>
          <% errors.forEach(error => { %>
            <li><%= error.msg %></li>
          <% }) %>
        </ul>
      </div>
    <% } %>

    <form action="/auth/register" method="POST" class="auth-form">
      <div class="form-group">
        <label for="username">Username</label>
        <input 
          type="text" 
          id="username" 
          name="username" 
          value="<%= locals.formData?.username || '' %>"
          required 
          minlength="3"
          maxlength="50"
          pattern="[a-zA-Z0-9_]+"
          placeholder="Choose a username">
        <small>3-50 characters, letters, numbers, and underscores only</small>
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          value="<%= locals.formData?.email || '' %>"
          required
          placeholder="your.email@example.com">
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          required
          minlength="8"
          placeholder="At least 8 characters">
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input 
          type="password" 
          id="confirmPassword" 
          name="confirmPassword" 
          required
          minlength="8"
          placeholder="Re-enter your password">
      </div>

      <button type="submit" class="btn btn-primary">Register</button>
    </form>

    <p class="auth-footer">
      Already have an account? <a href="/auth/login">Login here</a>
    </p>
  </div>
</div>
```

**Add to CSS (`public/css/style.css`):**
```css
.auth-container {
  max-width: 500px;
  margin: 2rem auto;
}

.auth-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: var(--secondary-color);
  font-size: 0.875rem;
}

.alert {
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
}

.alert-error {
  background: #fee;
  border: 1px solid var(--error-color);
  color: var(--error-color);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--hover-color);
}
```

**Validation:**
- Form displays correctly
- Responsive on mobile
- HTML5 validation works

---

### Task 2.5: Create Registration Controller and Route

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** Tasks 2.1, 2.2, 2.4  
**Assigned To:** TBD

**Description:**
Implement the registration logic with validation and user creation.

**Steps:**
1. Create `src/controllers/authController.js`
2. Import User model and express-validator
3. Create `showRegister` function to display form
4. Create `register` function with validation:
   - Validate username (3-50 chars, alphanumeric)
   - Validate email format
   - Validate password (min 8 chars)
   - Confirm passwords match
   - Check username uniqueness
   - Check email uniqueness
5. Create user in database
6. Log user in (set session)
7. Redirect to homepage
8. Handle errors appropriately
9. Create `src/routes/auth.js` with routes
10. Mount routes in `src/app.js`

**Acceptance Criteria:**
- [ ] `src/controllers/authController.js` file created
- [ ] `src/routes/auth.js` file created
- [ ] Registration form displays (GET /auth/register)
- [ ] Registration validation works
- [ ] Duplicate username/email prevented
- [ ] User created in database
- [ ] Password hashed automatically
- [ ] User logged in after registration
- [ ] Redirects to homepage
- [ ] Error messages display correctly
- [ ] Form data preserved on error

**File:** `src/controllers/authController.js`

**Code:**
```javascript
const { validationResult, body } = require('express-validator');
const User = require('../models/User');

// Show registration form
exports.showRegister = (req, res) => {
  res.render('pages/register', {
    title: 'Register - Educard Forum',
    errors: null,
    formData: null
  });
};

// Registration validation rules
exports.registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers')
    .custom(async (value) => {
      const user = await User.findOne({ where: { username: value } });
      if (user) {
        throw new Error('Username already taken');
      }
      return true;
    }),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (value) => {
      const user = await User.findOne({ where: { email: value } });
      if (user) {
        throw new Error('Email already registered');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Process registration
exports.register = async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('pages/register', {
      title: 'Register - Educard Forum',
      errors: errors.array(),
      formData: req.body
    });
  }

  try {
    const { username, email, password } = req.body;
    
    // Create user (password will be hashed by model hook)
    const user = await User.create({
      username,
      email,
      password
    });

    // Log user in
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    // Redirect to homepage
    res.redirect('/');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('pages/register', {
      title: 'Register - Educard Forum',
      errors: [{ msg: 'An error occurred during registration. Please try again.' }],
      formData: req.body
    });
  }
};
```

**File:** `src/routes/auth.js`

**Code:**
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration routes
router.get('/register', authController.showRegister);
router.post('/register', authController.registerValidation, authController.register);

module.exports = router;
```

**Update `src/app.js`:**
```javascript
const authRoutes = require('./routes/auth');

// Mount routes (after session middleware)
app.use('/auth', authRoutes);
```

**Validation:**
- Visit http://localhost:3000/auth/register
- Test validation errors
- Register a new user
- Check database for new user
- Verify password is hashed
- Verify redirect to homepage

---

### Task 2.6: Create Login Form View

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 30 minutes  
**Dependencies:** Task 2.4  
**Assigned To:** TBD

**Description:**
Create the login form page.

**Steps:**
1. Create `src/views/pages/login.ejs`
2. Add page title and heading
3. Create form with fields:
   - Username or Email
   - Password
4. Add "Remember me" checkbox (optional)
5. Add error display area
6. Add "Don't have an account?" link to register
7. Style consistently with registration form

**Acceptance Criteria:**
- [ ] `src/views/pages/login.ejs` file created
- [ ] Form has username/email and password fields
- [ ] Form uses POST method
- [ ] Error display area included
- [ ] Link to registration page included
- [ ] Styled consistently
- [ ] Mobile responsive

**File:** `src/views/pages/login.ejs`

**Code:**
```html
<div class="auth-container">
  <div class="auth-card">
    <h1>Login</h1>
    <p class="subtitle">Welcome back to Educard</p>

    <% if (error) { %>
      <div class="alert alert-error">
        <%= error %>
      </div>
    <% } %>

    <form action="/auth/login" method="POST" class="auth-form">
      <div class="form-group">
        <label for="usernameOrEmail">Username or Email</label>
        <input 
          type="text" 
          id="usernameOrEmail" 
          name="usernameOrEmail" 
          value="<%= locals.usernameOrEmail || '' %>"
          required
          placeholder="Enter your username or email">
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          required
          placeholder="Enter your password">
      </div>

      <button type="submit" class="btn btn-primary">Login</button>
    </form>

    <p class="auth-footer">
      Don't have an account? <a href="/auth/register">Register here</a>
    </p>
  </div>
</div>
```

**Validation:**
- Form displays correctly
- Styled consistently with register page

---

### Task 2.7: Create Login Controller

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 45 minutes  
**Dependencies:** Tasks 2.1, 2.6  
**Assigned To:** TBD

**Description:**
Implement login logic with authentication.

**Steps:**
1. Add to `src/controllers/authController.js`
2. Create `showLogin` function
3. Create `login` function:
   - Find user by username or email
   - Verify password using comparePassword method
   - Create session on success
   - Show generic error on failure (security)
4. Add route to `src/routes/auth.js`
5. Test login functionality

**Acceptance Criteria:**
- [ ] Login form displays (GET /auth/login)
- [ ] Can login with username
- [ ] Can login with email
- [ ] Password verified correctly
- [ ] Session created on success
- [ ] Redirects to homepage
- [ ] Generic error message on failure
- [ ] No user enumeration possible

**Add to `src/controllers/authController.js`:**

**Code:**
```javascript
// Show login form
exports.showLogin = (req, res) => {
  res.render('pages/login', {
    title: 'Login - Educard Forum',
    error: null,
    usernameOrEmail: ''
  });
};

// Process login
exports.login = async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  try {
    // Find user by username or email
    const user = await User.scope('withPassword').findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });

    // Generic error message (don't reveal if user exists)
    if (!user) {
      return res.render('pages/login', {
        title: 'Login - Educard Forum',
        error: 'Invalid credentials',
        usernameOrEmail
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      return res.render('pages/login', {
        title: 'Login - Educard Forum',
        error: 'Invalid credentials',
        usernameOrEmail
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.render('pages/login', {
        title: 'Login - Educard Forum',
        error: 'Account is deactivated',
        usernameOrEmail
      });
    }

    // Create session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    // Redirect to homepage
    res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    res.render('pages/login', {
      title: 'Login - Educard Forum',
      error: 'An error occurred. Please try again.',
      usernameOrEmail
    });
  }
};
```

**Add to top of `src/controllers/authController.js`:**
```javascript
const { Op } = require('sequelize');
```

**Add to `src/routes/auth.js`:**
```javascript
// Login routes
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
```

**Validation:**
- Visit http://localhost:3000/auth/login
- Login with valid credentials
- Verify session created
- Try invalid credentials
- Try non-existent user

---

### Task 2.8: Create Logout Functionality

**Status:** 🔴 Not Started  
**Priority:** Medium  
**Estimated Time:** 15 minutes  
**Dependencies:** Task 2.7  
**Assigned To:** TBD

**Description:**
Implement logout functionality that destroys the session.

**Steps:**
1. Add `logout` function to `src/controllers/authController.js`
2. Destroy session
3. Redirect to homepage
4. Add route to `src/routes/auth.js`
5. Test logout

**Acceptance Criteria:**
- [ ] Logout route created (POST /auth/logout)
- [ ] Session destroyed on logout
- [ ] Redirects to homepage
- [ ] User cannot access protected pages after logout
- [ ] Success message displayed (optional)

**Add to `src/controllers/authController.js`:**

**Code:**
```javascript
// Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/');
    }
    res.redirect('/');
  });
};
```

**Add to `src/routes/auth.js`:**
```javascript
// Logout route
router.post('/logout', authController.logout);
router.get('/logout', authController.logout); // Also allow GET for convenience
```

**Validation:**
- Login first
- Click logout
- Verify session destroyed
- Cannot access protected pages

---

### Task 2.9: Add CSRF Protection

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 2.3  
**Assigned To:** TBD

**Description:**
Implement CSRF protection for all forms using csurf middleware.

**Steps:**
1. Configure csurf middleware in `src/app.js`
2. Add CSRF token to res.locals for templates
3. Update all forms to include CSRF token:
   - Registration form
   - Login form
4. Test CSRF protection
5. Handle CSRF errors

**Acceptance Criteria:**
- [ ] csurf middleware configured
- [ ] CSRF tokens generated for all forms
- [ ] Forms include hidden CSRF token field
- [ ] Forms submit successfully with valid token
- [ ] Forms rejected with invalid token
- [ ] CSRF errors handled gracefully

**Update `src/app.js`:**

**Code:**
```javascript
const csrf = require('csurf');

// CSRF protection (add after session middleware)
const csrfProtection = csrf({ cookie: false }); // Use session
app.use(csrfProtection);

// Make CSRF token available to all views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  next();
});

// CSRF error handler (add before general error handler)
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('errors/403', {
      title: 'Forbidden',
      message: 'Invalid security token. Please try again.'
    });
  }
  next(err);
});
```

**Update `src/views/pages/register.ejs`:**
```html
<form action="/auth/register" method="POST" class="auth-form">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <!-- rest of form -->
</form>
```

**Update `src/views/pages/login.ejs`:**
```html
<form action="/auth/login" method="POST" class="auth-form">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <!-- rest of form -->
</form>
```

**Create `src/views/errors/403.ejs`:**
```html
<div class="error-container">
  <h1>403 - Forbidden</h1>
  <p><%= message || 'You do not have permission to access this resource.' %></p>
  <a href="/" class="btn btn-primary">Go Home</a>
</div>
```

**Validation:**
- Forms submit successfully
- Try submitting without token (should fail)
- Try tampering with token (should fail)

---

### Task 2.10: Create Authentication Middleware

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 30 minutes  
**Dependencies:** Task 2.7  
**Assigned To:** TBD

**Description:**
Create middleware to protect routes that require authentication.

**Steps:**
1. Create `src/middlewares/auth.js`
2. Create `requireAuth` middleware:
   - Check if user is logged in
   - Allow access if authenticated
   - Redirect to login if not
   - Store original URL for redirect after login
3. Create `requireGuest` middleware (optional):
   - Redirect to home if already logged in
4. Export middlewares
5. Test with protected routes

**Acceptance Criteria:**
- [ ] `src/middlewares/auth.js` file created
- [ ] `requireAuth` middleware works
- [ ] Redirects to login with return URL
- [ ] Allows access when authenticated
- [ ] `requireGuest` prevents authenticated access (optional)
- [ ] Middleware exports properly

**File:** `src/middlewares/auth.js`

**Code:**
```javascript
// Require user to be authenticated
exports.requireAuth = (req, res, next) => {
  if (!req.session.user) {
    // Store the original URL to redirect back after login
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  next();
};

// Require user to be a guest (not logged in)
exports.requireGuest = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
};

// Optional: Check if user owns a resource
exports.checkOwnership = (getUserId) => {
  return (req, res, next) => {
    const resourceUserId = getUserId(req);
    const currentUserId = req.session.user?.id;

    if (currentUserId !== resourceUserId) {
      return res.status(403).render('errors/403', {
        title: 'Forbidden',
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};
```

**Usage Example (future routes):**
```javascript
const { requireAuth } = require('../middlewares/auth');

// Protected route
router.get('/new-thread', requireAuth, threadController.showNewThread);

// Guest-only route
router.get('/login', requireGuest, authController.showLogin);
```

**Validation:**
- Test requireAuth on a test route
- Access while logged out (should redirect)
- Access while logged in (should allow)

---

### Task 2.11: Update Navigation for Authenticated Users

**Status:** 🔴 Not Started  
**Priority:** Medium  
**Estimated Time:** 30 minutes  
**Dependencies:** Tasks 2.7, 2.8  
**Assigned To:** TBD

**Description:**
Update the site header/navigation to show different options for logged-in vs. guest users.

**Steps:**
1. Update `src/views/layouts/main.ejs` or create `src/views/partials/nav.ejs`
2. Add conditional rendering:
   - If not logged in: Show Login | Register
   - If logged in: Show username | Profile | Logout
3. Style navigation appropriately
4. Make sure logout is a POST form (not just a link)
5. Test both states

**Acceptance Criteria:**
- [ ] Navigation shows Login/Register when logged out
- [ ] Navigation shows username/Profile/Logout when logged in
- [ ] Logout uses POST method
- [ ] Navigation styled appropriately
- [ ] Mobile responsive
- [ ] No layout shifts between states

**Create `src/views/partials/nav.ejs`:**

**Code:**
```html
<nav class="main-nav">
  <ul class="nav-list">
    <li><a href="/">Home</a></li>
    
    <% if (isAuthenticated) { %>
      <!-- Logged in navigation -->
      <li class="nav-user">
        Welcome, <strong><%= user.username %></strong>
      </li>
      <li>
        <a href="/profile/<%= user.username %>">Profile</a>
      </li>
      <li>
        <form action="/auth/logout" method="POST" style="display: inline;">
          <input type="hidden" name="_csrf" value="<%= csrfToken %>">
          <button type="submit" class="btn-link">Logout</button>
        </form>
      </li>
    <% } else { %>
      <!-- Guest navigation -->
      <li><a href="/auth/login">Login</a></li>
      <li><a href="/auth/register">Register</a></li>
    <% } %>
  </ul>
</nav>
```

**Update `src/views/layouts/main.ejs`:**
```html
<header class="site-header">
  <div class="container">
    <h1 class="site-title">
      <a href="/">Educard</a>
    </h1>
    <%- include('../partials/nav') %>
  </div>
</header>
```

**Add to `public/css/style.css`:**
```css
.main-nav {
  display: flex;
  align-items: center;
}

.nav-list {
  list-style: none;
  display: flex;
  gap: 1.5rem;
  align-items: center;
  margin: 0;
  padding: 0;
}

.nav-list a {
  color: white;
  text-decoration: none;
}

.nav-list a:hover {
  text-decoration: underline;
}

.btn-link {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
}

.btn-link:hover {
  text-decoration: underline;
}

.nav-user {
  color: white;
}

@media (max-width: 768px) {
  .site-header .container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-list {
    flex-direction: column;
    gap: 0.5rem;
  }
}
```

**Validation:**
- Log out and check navigation
- Log in and check navigation
- Click logout and verify it works
- Test on mobile

---

### Task 2.12: Add Flash Messages for User Feedback

**Status:** 🔴 Not Started  
**Priority:** Medium  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 2.3  
**Assigned To:** TBD

**Description:**
Implement flash messages to show success/error notifications after actions.

**Steps:**
1. Install connect-flash: `npm install connect-flash`
2. Configure flash middleware in `src/app.js`
3. Make flash messages available in views
4. Create flash message partial
5. Add flash messages to authentication flows:
   - "Successfully registered!"
   - "Successfully logged in!"
   - "Successfully logged out!"
6. Include partial in layout
7. Style flash messages

**Acceptance Criteria:**
- [ ] connect-flash installed
- [ ] Flash middleware configured
- [ ] Flash messages available in all views
- [ ] Partial created for displaying messages
- [ ] Success messages show for auth actions
- [ ] Messages styled (success, error, info)
- [ ] Messages auto-dismiss or closeable

**Update `src/app.js`:**
```javascript
const flash = require('connect-flash');

// Flash messages (after session middleware)
app.use(flash());

// Make flash messages available to all views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.successMessage = req.flash('success');
  res.locals.errorMessage = req.flash('error');
  res.locals.infoMessage = req.flash('info');
  next();
});
```

**Create `src/views/partials/flash.ejs`:**
```html
<% if (successMessage && successMessage.length > 0) { %>
  <div class="alert alert-success">
    <%= successMessage %>
  </div>
<% } %>

<% if (errorMessage && errorMessage.length > 0) { %>
  <div class="alert alert-error">
    <%= errorMessage %>
  </div>
<% } %>

<% if (infoMessage && infoMessage.length > 0) { %>
  <div class="alert alert-info">
    <%= infoMessage %>
  </div>
<% } %>
```

**Update `src/views/layouts/main.ejs`:**
```html
<main class="main-content">
  <div class="container">
    <%- include('../partials/flash') %>
    <%- body %>
  </div>
</main>
```

**Update controllers to use flash:**

In `src/controllers/authController.js`:
```javascript
// After successful registration
req.flash('success', 'Welcome to Educard! Your account has been created.');
res.redirect('/');

// After successful login
req.flash('success', 'Welcome back!');
res.redirect('/');

// In logout function
req.session.destroy((err) => {
  if (err) {
    console.error('Logout error:', err);
  }
  // Clear cookie and redirect
  res.clearCookie('educard.sid');
  res.redirect('/');
});
```

**Add to CSS:**
```css
.alert {
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
  border-left: 4px solid;
}

.alert-success {
  background: #d1fae5;
  border-color: var(--success-color);
  color: #065f46;
}

.alert-error {
  background: #fee2e2;
  border-color: var(--error-color);
  color: #991b1b;
}

.alert-info {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #1e40af;
}
```

**Validation:**
- Register and see success message
- Login and see success message
- Logout and verify (message optional)
- Messages display correctly

---

### Task 2.13: Phase 2 Testing and Validation

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 1-2 hours  
**Dependencies:** All Phase 2 tasks (2.1-2.12)  
**Assigned To:** TBD

**Description:**
Comprehensive testing of the authentication system.

**Steps:**
1. Test user registration flow
2. Test login flow
3. Test logout flow
4. Test validation errors
5. Test security measures
6. Test edge cases
7. Review all code
8. Fix any discovered bugs

**Acceptance Criteria:**
- [ ] All registration scenarios tested
- [ ] All login scenarios tested
- [ ] Logout works correctly
- [ ] Form validation working
- [ ] CSRF protection working
- [ ] Passwords properly hashed
- [ ] Sessions persistent
- [ ] No security vulnerabilities
- [ ] Error messages appropriate
- [ ] Flash messages working
- [ ] Navigation updates correctly
- [ ] Mobile responsive
- [ ] No console errors

**Testing Checklist:**

**Registration:**
- [ ] Register with valid data → Success
- [ ] Register with short username → Error
- [ ] Register with invalid email → Error
- [ ] Register with short password → Error
- [ ] Register with mismatched passwords → Error
- [ ] Register with duplicate username → Error
- [ ] Register with duplicate email → Error
- [ ] Password is hashed in database
- [ ] Auto-login after registration
- [ ] Flash message displayed

**Login:**
- [ ] Login with username → Success
- [ ] Login with email → Success
- [ ] Login with wrong password → Error (generic)
- [ ] Login with non-existent user → Error (generic)
- [ ] Session created on success
- [ ] Redirect to homepage
- [ ] Flash message displayed

**Logout:**
- [ ] Logout destroys session
- [ ] Cannot access protected routes after logout
- [ ] Redirect to homepage

**Security:**
- [ ] Passwords hashed (not plaintext)
- [ ] CSRF tokens on all forms
- [ ] Invalid CSRF token rejected
- [ ] SQL injection prevented
- [ ] XSS prevented (test with `<script>alert('xss')</script>`)
- [ ] No user enumeration (generic error messages)
- [ ] Sessions secure (httpOnly cookie)

**UI/UX:**
- [ ] Forms styled consistently
- [ ] Error messages clear
- [ ] Success messages visible
- [ ] Navigation updates correctly
- [ ] Responsive on mobile
- [ ] No layout issues

**Phase 2 Completion Checklist:**
- [ ] ✅ Task 2.1: User model created
- [ ] ✅ Task 2.2: Database migration run
- [ ] ✅ Task 2.3: Session management configured
- [ ] ✅ Task 2.4: Registration form created
- [ ] ✅ Task 2.5: Registration controller implemented
- [ ] ✅ Task 2.6: Login form created
- [ ] ✅ Task 2.7: Login controller implemented
- [ ] ✅ Task 2.8: Logout functionality working
- [ ] ✅ Task 2.9: CSRF protection added
- [ ] ✅ Task 2.10: Auth middleware created
- [ ] ✅ Task 2.11: Navigation updated
- [ ] ✅ Task 2.12: Flash messages working
- [ ] ✅ Task 2.13: All tests passing

**Deliverables:**
- Complete authentication system
- User registration working
- User login/logout working
- Secure session management
- CSRF protection
- Authentication middleware
- Updated navigation
- Flash messages

**Next Phase:**
Once Phase 2 is complete, proceed to Phase 3 (Core Forum Features).

---

## 6. Phase 2 Summary

**Total Tasks:** 13  
**Estimated Total Time:** 10-14 hours  
**Priority:** All tasks critical for Phase 2  

**Completion Criteria:**
- All 13 tasks completed and validated
- Users can register successfully
- Users can login/logout
- Sessions working properly
- Forms protected with CSRF
- Authentication middleware ready
- All tests passing

**Phase 2 Deliverables:**
1. ✅ User model and database table
2. ✅ Complete registration system
3. ✅ Complete login system
4. ✅ Logout functionality
5. ✅ Session management
6. ✅ CSRF protection
7. ✅ Authentication middleware
8. ✅ Flash messages
9. ✅ Updated navigation

**Ready for Phase 3:** Authentication complete, ready to build forum features.

---

## 7. Phase 3: Core Forum Features

**Phase Duration:** 2-3 weeks  
**Phase Goal:** Build complete forum functionality with CRUD operations  
**Phase Priority:** Critical (core application features)

**Prerequisites:** Phase 2 must be 100% complete

Phase 3 is divided into 5 sub-phases for better organization:
- **3.1:** Database Models & Categories (2 days)
- **3.2:** Thread Listing & Creation (3 days)
- **3.3:** Post Display & Replies (3 days)
- **3.4:** Edit & Delete Operations (3 days)
- **3.5:** User Profiles (2 days)

---

## 7.1 Phase 3.1: Database Models & Categories

### Task 3.1.1: Create Category Model

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 30 minutes  
**Dependencies:** Phase 2 complete  
**Assigned To:** TBD

**Description:**
Create the Sequelize Category model for forum organization.

**Steps:**
1. Create `src/models/Category.js`
2. Define Category model with fields:
   - id (primary key)
   - name (string, 100 chars)
   - description (text)
   - slug (unique, URL-friendly)
   - displayOrder (integer, for sorting)
   - createdAt (timestamp)
3. Add validation rules
4. Export model

**Acceptance Criteria:**
- [ ] `src/models/Category.js` file created
- [ ] All fields defined with proper types
- [ ] Validation rules added
- [ ] Slug field unique
- [ ] Model exports properly

**File:** `src/models/Category.js`

**Code:**
```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-z0-9-]+$/
    }
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'display_order'
  }
}, {
  tableName: 'categories',
  timestamps: true,
  updatedAt: false // Categories don't need updatedAt
});

module.exports = Category;
```

**Validation:**
- Model can be imported without errors
- Fields defined correctly

---

### Task 3.1.2: Create Thread Model

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 3.1.1  
**Assigned To:** TBD

**Description:**
Create the Sequelize Thread model for discussion topics.

**Steps:**
1. Create `src/models/Thread.js`
2. Define Thread model with fields:
   - id, categoryId, userId, title, slug
   - isPinned, isLocked (boolean flags)
   - createdAt, updatedAt
3. Add validation rules
4. Add foreign key constraints
5. Export model

**Acceptance Criteria:**
- [ ] `src/models/Thread.js` file created
- [ ] All fields defined
- [ ] Foreign keys defined (categoryId, userId)
- [ ] Validation rules added
- [ ] Slug generation handled
- [ ] Model exports properly

**File:** `src/models/Thread.js`

**Code:**
```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Thread = sequelize.define('Thread', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'category_id',
    references: {
      model: 'categories',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      is: /^[a-z0-9-]+$/
    }
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_pinned'
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_locked'
  }
}, {
  tableName: 'threads',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['category_id', 'slug']
    },
    {
      fields: ['category_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['updated_at']
    }
  ]
});

module.exports = Thread;
```

**Validation:**
- Model imports without errors
- Foreign keys defined correctly

---

### Task 3.1.3: Create Post Model

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 3.1.2  
**Assigned To:** TBD

**Description:**
Create the Sequelize Post model for thread replies.

**Steps:**
1. Create `src/models/Post.js`
2. Define Post model with fields:
   - id, threadId, userId, content
   - isFirstPost (boolean)
   - createdAt, updatedAt, editedAt
3. Add validation rules
4. Add foreign key constraints
5. Export model

**Acceptance Criteria:**
- [ ] `src/models/Post.js` file created
- [ ] All fields defined
- [ ] Foreign keys defined (threadId, userId)
- [ ] Content validation added
- [ ] Edit tracking with editedAt
- [ ] Model exports properly

**File:** `src/models/Post.js`

**Code:**
```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  threadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'thread_id',
    references: {
      model: 'threads',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 10000] // Max 10k characters
    }
  },
  isFirstPost: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_first_post'
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'edited_at'
  }
}, {
  tableName: 'posts',
  timestamps: true,
  indexes: [
    {
      fields: ['thread_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = Post;
```

**Validation:**
- Model imports without errors
- Content validation works

---

### Task 3.1.4: Define Model Associations

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 30 minutes  
**Dependencies:** Tasks 3.1.1, 3.1.2, 3.1.3  
**Assigned To:** TBD

**Description:**
Define relationships between all models (User, Category, Thread, Post).

**Steps:**
1. Create or update `src/models/index.js`
2. Import all models
3. Define associations:
   - User hasMany Threads
   - User hasMany Posts
   - Category hasMany Threads
   - Thread belongsTo Category
   - Thread belongsTo User
   - Thread hasMany Posts
   - Post belongsTo Thread
   - Post belongsTo User
4. Export all models
5. Update app.js to sync models

**Acceptance Criteria:**
- [ ] `src/models/index.js` file created/updated
- [ ] All models imported
- [ ] All associations defined
- [ ] Models export properly
- [ ] No circular dependency errors

**File:** `src/models/index.js`

**Code:**
```javascript
const { sequelize } = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Thread = require('./Thread');
const Post = require('./Post');

// Define associations
// User associations
User.hasMany(Thread, { foreignKey: 'userId', as: 'threads' });
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });

// Category associations
Category.hasMany(Thread, { foreignKey: 'categoryId', as: 'threads' });

// Thread associations
Thread.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Thread.belongsTo(User, { foreignKey: 'userId', as: 'author' });
Thread.hasMany(Post, { foreignKey: 'threadId', as: 'posts' });

// Post associations
Post.belongsTo(Thread, { foreignKey: 'threadId', as: 'thread' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

module.exports = {
  sequelize,
  User,
  Category,
  Thread,
  Post
};
```

**Update `src/app.js` or `server.js`:**
```javascript
const { sequelize } = require('./src/models');

// Sync database (development only)
if (process.env.NODE_ENV === 'development') {
  sequelize.sync({ alter: false }).then(() => {
    console.log('✅ Database synced');
  }).catch(err => {
    console.error('❌ Database sync error:', err);
  });
}
```

**Validation:**
- All models import without errors
- Associations defined correctly
- Can query with includes

---

### Task 3.1.5: Create Database Migrations for Forum Tables

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** Task 3.1.4  
**Assigned To:** TBD

**Description:**
Create and run migrations for categories, threads, and posts tables.

**Steps:**
1. Create migration for categories table
2. Create migration for threads table
3. Create migration for posts table
4. Run all migrations
5. Verify tables created
6. Test rollback
7. Re-run migrations

**Acceptance Criteria:**
- [ ] Three migration files created
- [ ] All schemas match models
- [ ] Foreign keys defined
- [ ] Indexes added
- [ ] Migrations run successfully
- [ ] Tables created in database
- [ ] Rollback works

**Commands:**
```bash
npx sequelize-cli migration:generate --name create-categories-table
npx sequelize-cli migration:generate --name create-threads-table
npx sequelize-cli migration:generate --name create-posts-table
```

**Migration files provided in full in the actual implementation.**

**Validation:**
```bash
psql -d educard_dev -c "\dt"  # Should see all tables
```

---

### Task 3.1.6: Create Category Seed Data

**Status:** 🔴 Not Started  
**Priority:** Medium  
**Estimated Time:** 30 minutes  
**Dependencies:** Task 3.1.5  
**Assigned To:** TBD

**Description:**
Create seed data for initial forum categories.

**Steps:**
1. Create seeder file
2. Add 3-5 initial categories:
   - General Discussion
   - Questions & Answers
   - Announcements
   - Study Groups
   - Off-Topic (optional)
3. Run seeder
4. Verify categories in database

**Acceptance Criteria:**
- [ ] Seeder file created
- [ ] Initial categories defined
- [ ] Seeder runs successfully
- [ ] Categories visible in database
- [ ] Slugs are URL-friendly

**Command:**
```bash
npx sequelize-cli seed:generate --name demo-categories
```

**Seeder file:** `seeders/XXXXXX-demo-categories.js`

**Code:**
```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('categories', [
      {
        name: 'General Discussion',
        description: 'General topics and conversations about education',
        slug: 'general-discussion',
        display_order: 1,
        created_at: new Date()
      },
      {
        name: 'Questions & Answers',
        description: 'Ask questions and get help from the community',
        slug: 'questions-answers',
        display_order: 2,
        created_at: new Date()
      },
      {
        name: 'Study Groups',
        description: 'Find and organize study groups',
        slug: 'study-groups',
        display_order: 3,
        created_at: new Date()
      },
      {
        name: 'Announcements',
        description: 'Important announcements and updates',
        slug: 'announcements',
        display_order: 0,
        created_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
```

**Run seeder:**
```bash
npx sequelize-cli db:seed:all
```

**Validation:**
```bash
psql -d educard_dev -c "SELECT * FROM categories;"
```

---

### Task 3.1.7: Update Homepage to Display Categories

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** Task 3.1.6  
**Assigned To:** TBD

**Description:**
Update the homepage to fetch and display categories from the database.

**Steps:**
1. Create or update `src/controllers/forumController.js`
2. Create `showHome` function to fetch categories
3. Include thread count for each category
4. Update homepage route in `src/app.js`
5. Update `src/views/pages/home.ejs` to display categories
6. Style category listing
7. Test display

**Acceptance Criteria:**
- [ ] Controller fetches categories from database
- [ ] Categories sorted by displayOrder
- [ ] Thread count displayed per category
- [ ] Categories link to thread listing
- [ ] Styled attractively
- [ ] Empty state handled
- [ ] Mobile responsive

**File:** `src/controllers/forumController.js`

**Code:**
```javascript
const { Category, Thread } = require('../models');

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
      group: ['Category.id']
    });

    res.render('pages/home', {
      title: 'Educard Forum - Home',
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).render('errors/500', {
      title: 'Error',
      message: 'Failed to load categories'
    });
  }
};
```

**Update `src/app.js`:**
```javascript
const forumController = require('./controllers/forumController');

// Homepage route
app.get('/', forumController.showHome);
```

**Update `src/views/pages/home.ejs`:**

**Code:**
```html
<div class="page-header">
  <h1>Welcome to Educard Forum</h1>
  <p class="subtitle">An educational discussion platform for learners and educators.</p>
</div>

<section class="categories-section">
  <h2>Forum Categories</h2>
  
  <% if (categories && categories.length > 0) { %>
    <div class="category-list">
      <% categories.forEach(category => { %>
        <div class="category-card">
          <div class="category-header">
            <h3>
              <a href="/category/<%= category.slug %>"><%= category.name %></a>
            </h3>
          </div>
          <div class="category-body">
            <p class="category-description"><%= category.description %></p>
          </div>
          <div class="category-footer">
            <span class="thread-count">
              <%= category.threadCount || 0 %> 
              <%= (category.threadCount === 1) ? 'thread' : 'threads' %>
            </span>
          </div>
        </div>
      <% }) %>
    </div>
  <% } else { %>
    <div class="empty-state">
      <p>No categories available yet.</p>
    </div>
  <% } %>
</section>
```

**Add to `public/css/style.css`:**
```css
.categories-section {
  margin-top: 2rem;
}

.category-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.category-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  transition: box-shadow 0.2s;
}

.category-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.category-header h3 {
  margin: 0 0 0.5rem 0;
}

.category-header h3 a {
  color: var(--primary-color);
  text-decoration: none;
}

.category-header h3 a:hover {
  text-decoration: underline;
}

.category-description {
  color: var(--secondary-color);
  margin: 0.5rem 0;
}

.category-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.875rem;
  color: var(--secondary-color);
}

@media (max-width: 768px) {
  .category-list {
    grid-template-columns: 1fr;
  }
}
```

**Validation:**
- Homepage displays categories
- Thread counts show (even if 0)
- Links work (even if target page not created yet)
- Responsive on mobile

---

## 7.2 Phase 3.2: Thread Listing & Creation

### Task 3.2.1: Create Thread Listing Page

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 3.1.7  
**Assigned To:** TBD

**Description:**
Create the page that lists all threads within a category.

**Steps:**
1. Add `showCategoryThreads` function to `src/controllers/forumController.js`
2. Fetch category by slug
3. Fetch threads in category with pagination
4. Include author info and post count
5. Sort by updated_at (newest first)
6. Create `src/views/pages/category.ejs`
7. Add pagination controls
8. Create route
9. Style thread listing

**Acceptance Criteria:**
- [ ] Category page displays correctly
- [ ] Threads listed with title, author, date
- [ ] Post count displayed per thread
- [ ] Pagination works (20 threads per page)
- [ ] Sorted by last activity
- [ ] "New Thread" button visible (if logged in)
- [ ] Breadcrumb navigation
- [ ] 404 if category not found

**Add to `src/controllers/forumController.js`:**

**Code:**
```javascript
exports.showCategoryThreads = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    // Find category
    const category = await Category.findOne({ where: { slug } });
    
    if (!category) {
      return res.status(404).render('errors/404', {
        title: 'Category Not Found',
        message: 'The requested category does not exist.'
      });
    }

    // Fetch threads with pagination
    const { count, rows: threads } = await Thread.findAndCountAll({
      where: { categoryId: category.id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username']
        },
        {
          model: Post,
          as: 'posts',
          attributes: [],
          required: false
        }
      ],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('posts.id')), 'postCount']
        ]
      },
      group: ['Thread.id', 'author.id'],
      order: [['updatedAt', 'DESC']],
      limit,
      offset,
      subQuery: false
    });

    const totalPages = Math.ceil(count.length / limit);

    res.render('pages/category', {
      title: `${category.name} - Educard Forum`,
      category,
      threads,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).render('errors/500', {
      title: 'Error',
      message: 'Failed to load threads'
    });
  }
};
```

**Create `src/views/pages/category.ejs`:**

**Code:**
```html
<nav class="breadcrumb">
  <a href="/">Home</a> &raquo; 
  <span><%= category.name %></span>
</nav>

<div class="category-header">
  <h1><%= category.name %></h1>
  <p class="category-description"><%= category.description %></p>
  
  <% if (isAuthenticated) { %>
    <a href="/category/<%= category.slug %>/new-thread" class="btn btn-primary">
      + New Thread
    </a>
  <% } %>
</div>

<section class="thread-list">
  <% if (threads && threads.length > 0) { %>
    <div class="threads">
      <% threads.forEach(thread => { %>
        <div class="thread-item">
          <div class="thread-main">
            <h3 class="thread-title">
              <a href="/thread/<%= thread.slug %>"><%= thread.title %></a>
            </h3>
            <div class="thread-meta">
              by <a href="/profile/<%= thread.author.username %>"><%= thread.author.username %></a>
              on <%= new Date(thread.createdAt).toLocaleDateString() %>
            </div>
          </div>
          <div class="thread-stats">
            <span class="post-count">
              <%= thread.postCount || 0 %> 
              <%= (thread.postCount === 1) ? 'post' : 'posts' %>
            </span>
          </div>
        </div>
      <% }) %>
    </div>

    <% if (totalPages > 1) { %>
      <nav class="pagination">
        <% if (hasPrevPage) { %>
          <a href="?page=<%= currentPage - 1 %>" class="btn btn-secondary">&laquo; Previous</a>
        <% } %>
        
        <span class="page-info">Page <%= currentPage %> of <%= totalPages %></span>
        
        <% if (hasNextPage) { %>
          <a href="?page=<%= currentPage + 1 %>" class="btn btn-secondary">Next &raquo;</a>
        <% } %>
      </nav>
    <% } %>
  <% } else { %>
    <div class="empty-state">
      <p>No threads in this category yet.</p>
      <% if (isAuthenticated) { %>
        <p><a href="/category/<%= category.slug %>/new-thread">Be the first to start a discussion!</a></p>
      <% } else { %>
        <p><a href="/auth/login">Login</a> to start a discussion.</p>
      <% } %>
    </div>
  <% } %>
</section>
```

**Add route to `src/routes/forum.js` (create if needed):**
```javascript
const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');

router.get('/category/:slug', forumController.showCategoryThreads);

module.exports = router;
```

**Mount in `src/app.js`:**
```javascript
const forumRoutes = require('./routes/forum');
app.use('/', forumRoutes);
```

**Add CSS:**
```css
.breadcrumb {
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: var(--secondary-color);
}

.breadcrumb a {
  color: var(--primary-color);
  text-decoration: none;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.thread-list {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.thread-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.thread-item:last-child {
  border-bottom: none;
}

.thread-item:hover {
  background: #f8f9fa;
}

.thread-title {
  margin: 0 0 0.5rem 0;
}

.thread-title a {
  color: var(--text-color);
  text-decoration: none;
}

.thread-title a:hover {
  color: var(--primary-color);
}

.thread-meta {
  font-size: 0.875rem;
  color: var(--secondary-color);
}

.thread-stats {
  text-align: right;
  color: var(--secondary-color);
  font-size: 0.875rem;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: white;
  margin-top: 1rem;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .thread-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
```

**Validation:**
- Click category from homepage
- Thread listing displays
- Empty state shows if no threads
- Pagination works (if enough threads)

---

### Task 3.2.2: Create Slug Generation Utility

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 30 minutes  
**Dependencies:** None (can be done anytime)  
**Assigned To:** TBD

**Description:**
Create a utility function to generate URL-friendly slugs from titles.

**Steps:**
1. Create `src/utils/slugify.js`
2. Implement slug generation:
   - Convert to lowercase
   - Replace spaces with hyphens
   - Remove special characters
   - Handle duplicates
3. Export function
4. Test with various inputs

**Acceptance Criteria:**
- [ ] `src/utils/slugify.js` file created
- [ ] Converts strings to URL-friendly slugs
- [ ] Handles special characters
- [ ] Handles duplicates
- [ ] Exports properly
- [ ] Works with Unicode

**File:** `src/utils/slugify.js`

**Code:**
```javascript
/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to slugify
 * @returns {string} - URL-friendly slug
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

/**
 * Generate a unique slug by checking against existing slugs
 * @param {string} text - The text to slugify
 * @param {Array} existingSlugs - Array of existing slugs to check against
 * @returns {string} - Unique slug
 */
function uniqueSlug(text, existingSlugs = []) {
  let slug = slugify(text);
  let counter = 1;
  let originalSlug = slug;

  while (existingSlugs.includes(slug)) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Generate a unique slug using database model
 * @param {string} text - The text to slugify  
 * @param {Object} Model - Sequelize model to check against
 * @param {Object} whereClause - Additional where conditions (e.g., categoryId)
 * @returns {Promise<string>} - Unique slug
 */
async function uniqueSlugFromDB(text, Model, whereClause = {}) {
  let slug = slugify(text);
  let counter = 1;
  let originalSlug = slug;

  while (true) {
    const existing = await Model.findOne({ 
      where: { slug, ...whereClause }
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${originalSlug}-${counter}`;
    counter++;
  }
}

module.exports = {
  slugify,
  uniqueSlug,
  uniqueSlugFromDB
};
```

**Validation:**
```javascript
const { slugify } = require('./src/utils/slugify');

console.log(slugify('Hello World'));  // 'hello-world'
console.log(slugify('My First Thread!'));  // 'my-first-thread'
console.log(slugify('Questions & Answers'));  // 'questions-answers'
```

---

### Task 3.2.3: Create New Thread Form

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 3.2.2  
**Assigned To:** TBD

**Description:**
Create the form for creating new threads.

**Steps:**
1. Add `showNewThread` function to controller
2. Verify user is authenticated (middleware)
3. Create `src/views/pages/new-thread.ejs`
4. Add form with title and content fields
5. Add CSRF protection
6. Create route (protected with requireAuth)
7. Style form

**Acceptance Criteria:**
- [ ] Form displays correctly
- [ ] Requires authentication
- [ ] Has title and content fields
- [ ] CSRF token included
- [ ] Category name displayed
- [ ] Cancel button returns to category
- [ ] Styled consistently
- [ ] Mobile responsive

**Add to `src/controllers/forumController.js`:**

**Code:**
```javascript
const { requireAuth } = require('../middlewares/auth');

exports.showNewThread = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = await Category.findOne({ where: { slug } });
    
    if (!category) {
      return res.status(404).render('errors/404', {
        title: 'Category Not Found'
      });
    }

    res.render('pages/new-thread', {
      title: `New Thread - ${category.name}`,
      category,
      errors: null,
      formData: null
    });
  } catch (error) {
    console.error('Error showing new thread form:', error);
    res.status(500).render('errors/500', {
      title: 'Error'
    });
  }
};
```

**Create `src/views/pages/new-thread.ejs`:**

**Code:**
```html
<nav class="breadcrumb">
  <a href="/">Home</a> &raquo; 
  <a href="/category/<%= category.slug %>"><%= category.name %></a> &raquo;
  <span>New Thread</span>
</nav>

<div class="page-header">
  <h1>Create New Thread</h1>
  <p class="subtitle">in <%= category.name %></p>
</div>

<% if (errors && errors.length > 0) { %>
  <div class="alert alert-error">
    <ul>
      <% errors.forEach(error => { %>
        <li><%= error.msg %></li>
      <% }) %>
    </ul>
  </div>
<% } %>

<form action="/category/<%= category.slug %>/new-thread" method="POST" class="thread-form">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  
  <div class="form-group">
    <label for="title">Thread Title *</label>
    <input 
      type="text" 
      id="title" 
      name="title" 
      value="<%= locals.formData?.title || '' %>"
      required 
      maxlength="255"
      placeholder="What's your thread about?">
    <small>Be clear and descriptive</small>
  </div>

  <div class="form-group">
    <label for="content">First Post *</label>
    <textarea 
      id="content" 
      name="content" 
      rows="10"
      required
      maxlength="10000"
      placeholder="Start the discussion..."><%= locals.formData?.content || '' %></textarea>
    <small>Minimum 10 characters</small>
  </div>

  <div class="form-actions">
    <button type="submit" class="btn btn-primary">Create Thread</button>
    <a href="/category/<%= category.slug %>" class="btn btn-secondary">Cancel</a>
  </div>
</form>
```

**Add route:**
```javascript
const { requireAuth } = require('../middlewares/auth');

router.get('/category/:slug/new-thread', requireAuth, forumController.showNewThread);
```

**Add CSS:**
```css
.thread-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 800px;
}

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-secondary {
  background: var(--secondary-color);
  color: white;
}

.btn-secondary:hover {
  background: #475569;
}
```

**Validation:**
- Click "New Thread" button (must be logged in)
- Form displays correctly
- Cancel returns to category

---

### Task 3.2.4: Implement Thread Creation Logic

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 3.2.3  
**Assigned To:** TBD

**Description:**
Implement the backend logic to create threads and first posts.

**Steps:**
1. Add `createThread` function to controller
2. Validate title and content
3. Generate unique slug
4. Create thread in database
5. Create first post automatically
6. Mark post as isFirstPost = true
7. Redirect to new thread
8. Handle errors
9. Add route

**Acceptance Criteria:**
- [ ] Thread created in database
- [ ] Slug generated automatically
- [ ] First post created and linked
- [ ] isFirstPost flag set correctly
- [ ] Redirects to thread view
- [ ] Validation errors displayed
- [ ] Form data preserved on error
- [ ] User must be authenticated

**Add to `src/controllers/forumController.js`:**

**Code:**
```javascript
const { body, validationResult } = require('express-validator');
const { uniqueSlugFromDB } = require('../utils/slugify');

exports.createThreadValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be 1-255 characters'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Content must be 10-10,000 characters')
];

exports.createThread = async (req, res) => {
  try {
    const { slug } = req.params;
    const errors = validationResult(req);
    
    // Find category
    const category = await Category.findOne({ where: { slug } });
    
    if (!category) {
      return res.status(404).render('errors/404', {
        title: 'Category Not Found'
      });
    }

    if (!errors.isEmpty()) {
      return res.render('pages/new-thread', {
        title: `New Thread - ${category.name}`,
        category,
        errors: errors.array(),
        formData: req.body
      });
    }

    const { title, content } = req.body;
    const userId = req.session.user.id;

    // Generate unique slug
    const threadSlug = await uniqueSlugFromDB(title, Thread, { 
      categoryId: category.id 
    });

    // Start transaction
    const result = await sequelize.transaction(async (t) => {
      // Create thread
      const thread = await Thread.create({
        categoryId: category.id,
        userId,
        title,
        slug: threadSlug
      }, { transaction: t });

      // Create first post
      await Post.create({
        threadId: thread.id,
        userId,
        content,
        isFirstPost: true
      }, { transaction: t });

      return thread;
    });

    req.flash('success', 'Thread created successfully!');
    res.redirect(`/thread/${result.slug}`);
  } catch (error) {
    console.error('Error creating thread:', error);
    
    const category = await Category.findOne({ where: { slug: req.params.slug } });
    
    res.render('pages/new-thread', {
      title: `New Thread - ${category.name}`,
      category,
      errors: [{ msg: 'Failed to create thread. Please try again.' }],
      formData: req.body
    });
  }
};
```

**Add route:**
```javascript
router.post('/category/:slug/new-thread', 
  requireAuth, 
  forumController.createThreadValidation,
  forumController.createThread
);
```

**Validation:**
- Create a thread with valid data
- Check database for thread and post
- Verify slug is unique
- Test validation errors
- Test duplicate titles (should get unique slugs)

---

## 7.3 Phase 3.3: Post Display & Replies

### Task 3.3.1: Create Thread View (Post Display)

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 3.2.4  
**Assigned To:** TBD

**Description:**
Create the page that displays a thread with all its posts.

**Steps:**
1. Add `showThread` function to controller
2. Fetch thread by slug with category and author
3. Fetch all posts with pagination
4. Include author info for each post
5. Sort posts chronologically
6. Create `src/views/pages/thread.ejs`
7. Display thread title and posts
8. Add reply form (if logged in)
9. Add breadcrumb navigation
10. Style post display

**Acceptance Criteria:**
- [ ] Thread displays with all posts
- [ ] Posts sorted chronologically
- [ ] First post highlighted
- [ ] Author info displayed
- [ ] Timestamps displayed
- [ ] Edit indicators if edited
- [ ] Pagination works (10-20 posts/page)
- [ ] Reply form at bottom (if logged in)
- [ ] Breadcrumb navigation
- [ ] 404 if thread not found

**Add to `src/controllers/forumController.js`:**

**Code:**
```javascript
exports.showThread = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const offset = (page - 1) * limit;

    // Find thread with category and author
    const thread = await Thread.findOne({
      where: { slug },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'createdAt']
        }
      ]
    });

    if (!thread) {
      return res.status(404).render('errors/404', {
        title: 'Thread Not Found',
        message: 'The requested thread does not exist.'
      });
    }

    // Fetch posts with pagination
    const { count, rows: posts } = await Post.findAndCountAll({
      where: { threadId: thread.id },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'createdAt']
      }],
      order: [['createdAt', 'ASC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.render('pages/thread', {
      title: `${thread.title} - Educard Forum`,
      thread,
      posts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).render('errors/500', {
      title: 'Error',
      message: 'Failed to load thread'
    });
  }
};
```

**Create `src/views/pages/thread.ejs`:**

**Code:**
```html
<nav class="breadcrumb">
  <a href="/">Home</a> &raquo; 
  <a href="/category/<%= thread.category.slug %>"><%= thread.category.name %></a> &raquo;
  <span><%= thread.title %></span>
</nav>

<div class="thread-header">
  <h1><%= thread.title %></h1>
  <div class="thread-actions">
    <% if (isAuthenticated && user.id === thread.userId) { %>
      <form action="/thread/<%= thread.slug %>/delete" method="POST" style="display: inline;">
        <input type="hidden" name="_csrf" value="<%= csrfToken %>">
        <button type="submit" class="btn btn-danger delete-btn">Delete Thread</button>
      </form>
    <% } %>
  </div>
</div>

<section class="posts-section">
  <% posts.forEach((post, index) => { %>
    <article class="post <%= post.isFirstPost ? 'first-post' : '' %>">
      <aside class="post-author">
        <div class="author-info">
          <strong><a href="/profile/<%= post.author.username %>"><%= post.author.username %></a></strong>
          <small>Member since <%= new Date(post.author.createdAt).toLocaleDateString() %></small>
        </div>
      </aside>
      
      <div class="post-content">
        <div class="post-body">
          <%= post.content %>
        </div>
        
        <footer class="post-footer">
          <time datetime="<%= post.createdAt %>">
            Posted <%= new Date(post.createdAt).toLocaleString() %>
          </time>
          
          <% if (post.editedAt) { %>
            <span class="edited-indicator">
              (Edited <%= new Date(post.editedAt).toLocaleString() %>)
            </span>
          <% } %>
          
          <% if (isAuthenticated && user.id === post.userId) { %>
            <div class="post-actions">
              <a href="/post/<%= post.id %>/edit" class="btn btn-sm">Edit</a>
              <% if (!post.isFirstPost) { %>
                <form action="/post/<%= post.id %>/delete" method="POST" style="display: inline;">
                  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                  <button type="submit" class="btn btn-sm btn-danger delete-btn">Delete</button>
                </form>
              <% } %>
            </div>
          <% } %>
        </footer>
      </div>
    </article>
  <% }) %>
</section>

<% if (totalPages > 1) { %>
  <nav class="pagination">
    <% if (hasPrevPage) { %>
      <a href="?page=<%= currentPage - 1 %>" class="btn btn-secondary">&laquo; Previous</a>
    <% } %>
    
    <span class="page-info">Page <%= currentPage %> of <%= totalPages %></span>
    
    <% if (hasNextPage) { %>
      <a href="?page=<%= currentPage + 1 %>" class="btn btn-secondary">Next &raquo;</a>
    <% } %>
  </nav>
<% } %>

<% if (isAuthenticated) { %>
  <section class="reply-section">
    <h3>Reply to Thread</h3>
    <%- include('../partials/reply-form', { threadSlug: thread.slug }) %>
  </section>
<% } else { %>
  <div class="guest-message">
    <p><a href="/auth/login">Login</a> or <a href="/auth/register">Register</a> to reply to this thread.</p>
  </div>
<% } %>
```

**Add CSS:**
```css
.posts-section {
  margin-top: 2rem;
}

.post {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
  background: white;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.post.first-post {
  border-left: 4px solid var(--primary-color);
}

.post-author {
  text-align: center;
}

.author-info strong {
  display: block;
  margin-bottom: 0.5rem;
}

.author-info a {
  color: var(--primary-color);
  text-decoration: none;
}

.author-info small {
  display: block;
  color: var(--secondary-color);
  font-size: 0.8rem;
}

.post-content {
  min-width: 0; /* Allow text to wrap */
}

.post-body {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin-bottom: 1rem;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.875rem;
  color: var(--secondary-color);
}

.edited-indicator {
  font-style: italic;
}

.post-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.btn-danger {
  background: var(--error-color);
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.reply-section {
  margin-top: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 8px;
}

.guest-message {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .post {
    grid-template-columns: 1fr;
  }
  
  .post-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
```

**Add route:**
```javascript
router.get('/thread/:slug', forumController.showThread);
```

**Validation:**
- Click thread from category listing
- Thread displays with posts
- Posts in chronological order
- Author info shows
- Pagination works (if enough posts)

---

### Task 3.3.2: Create Reply Form Partial

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 30 minutes  
**Dependencies:** Task 3.3.1  
**Assigned To:** TBD

**Description:**
Create a reusable reply form partial for posting replies.

**Steps:**
1. Create `src/views/partials/reply-form.ejs`
2. Add textarea for content
3. Add CSRF token
4. Add submit and cancel buttons
5. Add character counter (optional)

**Acceptance Criteria:**
- [ ] Partial created
- [ ] Form has content textarea
- [ ] CSRF token included
- [ ] Submit button styled
- [ ] Mobile responsive

**File:** `src/views/partials/reply-form.ejs`

**Code:**
```html
<form action="/thread/<%= threadSlug %>/reply" method="POST" class="reply-form">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  
  <div class="form-group">
    <label for="content">Your Reply</label>
    <textarea 
      id="content" 
      name="content" 
      rows="6"
      required
      minlength="1"
      maxlength="10000"
      placeholder="Write your reply..."></textarea>
    <small>Be respectful and constructive</small>
  </div>

  <div class="form-actions">
    <button type="submit" class="btn btn-primary">Post Reply</button>
  </div>
</form>
```

**Validation:**
- Form renders in thread view
- Styled consistently

---

### Task 3.3.3: Implement Reply Creation Logic

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** Task 3.3.2  
**Assigned To:** TBD

**Description:**
Implement backend logic to create post replies.

**Steps:**
1. Add `createReply` function to controller
2. Validate content
3. Find thread
4. Create post
5. Update thread's updatedAt timestamp
6. Redirect to thread (last page or new post)
7. Handle errors

**Acceptance Criteria:**
- [ ] Reply created in database
- [ ] Thread updatedAt updated
- [ ] Redirects to thread
- [ ] Validation works
- [ ] Must be authenticated
- [ ] Flash message on success

**Add to `src/controllers/forumController.js`:**

**Code:**
```javascript
exports.createReplyValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Reply must be 1-10,000 characters')
];

exports.createReply = async (req, res) => {
  try {
    const { slug } = req.params;
    const errors = validationResult(req);
    
    // Find thread
    const thread = await Thread.findOne({ 
      where: { slug },
      include: [{ model: Category, as: 'category' }]
    });
    
    if (!thread) {
      return res.status(404).render('errors/404', {
        title: 'Thread Not Found'
      });
    }

    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect(`/thread/${slug}`);
    }

    const { content } = req.body;
    const userId = req.session.user.id;

    // Create post
    await Post.create({
      threadId: thread.id,
      userId,
      content,
      isFirstPost: false
    });

    // Update thread's updatedAt to bump it to top
    await thread.update({ updatedAt: new Date() });

    req.flash('success', 'Reply posted successfully!');
    res.redirect(`/thread/${slug}`);
  } catch (error) {
    console.error('Error creating reply:', error);
    req.flash('error', 'Failed to post reply. Please try again.');
    res.redirect(`/thread/${req.params.slug}`);
  }
};
```

**Add route:**
```javascript
router.post('/thread/:slug/reply', 
  requireAuth,
  forumController.createReplyValidation,
  forumController.createReply
);
```

**Validation:**
- Post a reply to a thread
- Check database for new post
- Verify thread updatedAt changed
- Test validation errors
- Verify redirect works

---

## 7.4 Phase 3.4: Edit & Delete Operations

### Task 3.4.1: Create Edit Post Form

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 3.3.3  
**Assigned To:** TBD

**Description:**
Create form for editing existing posts.

**Steps:**
1. Add `showEditPost` function to controller
2. Fetch post by ID
3. Verify ownership (user can only edit own posts)
4. Create `src/views/pages/edit-post.ejs`
5. Pre-fill form with current content
6. Add route with auth middleware

**Acceptance Criteria:**
- [ ] Edit form displays
- [ ] Content pre-filled
- [ ] Only post owner can access
- [ ] 403 error if not owner
- [ ] 404 if post not found
- [ ] Styled consistently

**Add to `src/controllers/forumController.js`:**

**Code:**
```javascript
exports.showEditPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    const post = await Post.findByPk(id, {
      include: [{
        model: Thread,
        as: 'thread',
        include: [{ model: Category, as: 'category' }]
      }]
    });

    if (!post) {
      return res.status(404).render('errors/404', {
        title: 'Post Not Found'
      });
    }

    // Check ownership
    if (post.userId !== userId) {
      return res.status(403).render('errors/403', {
        title: 'Forbidden',
        message: 'You can only edit your own posts.'
      });
    }

    res.render('pages/edit-post', {
      title: 'Edit Post',
      post,
      errors: null
    });
  } catch (error) {
    console.error('Error showing edit post:', error);
    res.status(500).render('errors/500', {
      title: 'Error'
    });
  }
};
```

**Create `src/views/pages/edit-post.ejs`:**

**Code:**
```html
<nav class="breadcrumb">
  <a href="/">Home</a> &raquo; 
  <a href="/category/<%= post.thread.category.slug %>"><%= post.thread.category.name %></a> &raquo;
  <a href="/thread/<%= post.thread.slug %>"><%= post.thread.title %></a> &raquo;
  <span>Edit Post</span>
</nav>

<div class="page-header">
  <h1>Edit Post</h1>
</div>

<% if (errors && errors.length > 0) { %>
  <div class="alert alert-error">
    <ul>
      <% errors.forEach(error => { %>
        <li><%= error.msg %></li>
      <% }) %>
    </ul>
  </div>
<% } %>

<form action="/post/<%= post.id %>/edit" method="POST" class="edit-form">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  
  <div class="form-group">
    <label for="content">Post Content *</label>
    <textarea 
      id="content" 
      name="content" 
      rows="10"
      required
      maxlength="10000"><%= post.content %></textarea>
  </div>

  <div class="form-actions">
    <button type="submit" class="btn btn-primary">Save Changes</button>
    <a href="/thread/<%= post.thread.slug %>" class="btn btn-secondary">Cancel</a>
  </div>
</form>
```

**Add route:**
```javascript
router.get('/post/:id/edit', requireAuth, forumController.showEditPost);
```

**Validation:**
- Click edit on own post
- Form shows with content
- Try accessing edit for others' post (should 403)

---

### Task 3.4.2: Implement Post Update Logic

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 3.4.1  
**Assigned To:** TBD

**Description:**
Implement backend logic to update posts.

**Steps:**
1. Add `updatePost` function
2. Validate content
3. Verify ownership
4. Update post content
5. Set editedAt timestamp
6. Redirect to thread
7. Handle errors

**Acceptance Criteria:**
- [ ] Post updated in database
- [ ] editedAt timestamp set
- [ ] Only owner can update
- [ ] Validation works
- [ ] Redirects to thread
- [ ] Flash message shown

**Add to `src/controllers/forumController.js`:**

**Code:**
```javascript
exports.updatePostValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be 1-10,000 characters')
];

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;
    const errors = validationResult(req);

    const post = await Post.findByPk(id, {
      include: [{
        model: Thread,
        as: 'thread'
      }]
    });

    if (!post) {
      return res.status(404).render('errors/404', {
        title: 'Post Not Found'
      });
    }

    // Check ownership
    if (post.userId !== userId) {
      return res.status(403).render('errors/403', {
        title: 'Forbidden',
        message: 'You can only edit your own posts.'
      });
    }

    if (!errors.isEmpty()) {
      return res.render('pages/edit-post', {
        title: 'Edit Post',
        post,
        errors: errors.array()
      });
    }

    const { content } = req.body;

    // Update post
    await post.update({
      content,
      editedAt: new Date()
    });

    req.flash('success', 'Post updated successfully!');
    res.redirect(`/thread/${post.thread.slug}`);
  } catch (error) {
    console.error('Error updating post:', error);
    req.flash('error', 'Failed to update post.');
    res.redirect('back');
  }
};
```

**Add route:**
```javascript
router.post('/post/:id/edit', 
  requireAuth,
  forumController.updatePostValidation,
  forumController.updatePost
);
```

**Validation:**
- Edit a post successfully
- Verify content updated
- Verify editedAt set
- Check "Edited" indicator displays

---

### Task 3.4.3: Implement Post Deletion

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 3.4.2  
**Assigned To:** TBD

**Description:**
Implement post deletion with ownership verification.

**Steps:**
1. Add `deletePost` function
2. Verify ownership
3. Prevent deleting first post if others exist
4. Delete post
5. Redirect to thread
6. Handle errors

**Acceptance Criteria:**
- [ ] Post deleted from database
- [ ] Only owner can delete
- [ ] Cannot delete first post if replies exist
- [ ] Confirmation required (client-side)
- [ ] Redirects appropriately
- [ ] Flash message shown

**Add to `src/controllers/forumController.js`:**

**Code:**
```javascript
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    const post = await Post.findByPk(id, {
      include: [{
        model: Thread,
        as: 'thread',
        include: [{
          model: Category,
          as: 'category'
        }]
      }]
    });

    if (!post) {
      return res.status(404).render('errors/404', {
        title: 'Post Not Found'
      });
    }

    // Check ownership
    if (post.userId !== userId) {
      return res.status(403).render('errors/403', {
        title: 'Forbidden',
        message: 'You can only delete your own posts.'
      });
    }

    // If it's the first post, check if there are other posts
    if (post.isFirstPost) {
      const otherPosts = await Post.count({
        where: {
          threadId: post.threadId,
          id: { [Op.ne]: post.id }
        }
      });

      if (otherPosts > 0) {
        req.flash('error', 'Cannot delete the first post while replies exist. Delete the entire thread instead.');
        return res.redirect(`/thread/${post.thread.slug}`);
      }
    }

    const threadSlug = post.thread.slug;
    const categorySlug = post.thread.category.slug;

    // Delete post
    await post.destroy();

    // If it was the first post (and no replies), the thread is gone too
    req.flash('success', 'Post deleted successfully!');
    
    // Try to redirect to thread, if it exists
    const threadStillExists = await Thread.findByPk(post.threadId);
    if (threadStillExists) {
      res.redirect(`/thread/${threadSlug}`);
    } else {
      res.redirect(`/category/${categorySlug}`);
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    req.flash('error', 'Failed to delete post.');
    res.redirect('back');
  }
};
```

**Add route:**
```javascript
router.post('/post/:id/delete', requireAuth, forumController.deletePost);
```

**Validation:**
- Delete a regular post (not first)
- Verify deleted from database
- Try deleting first post with replies (should fail)
- Delete confirmation works (JavaScript)

---

### Task 3.4.4: Implement Thread Deletion

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 30 minutes  
**Dependencies:** Task 3.4.3  
**Assigned To:** TBD

**Description:**
Implement thread deletion (cascades to all posts).

**Steps:**
1. Add `deleteThread` function
2. Verify ownership (thread creator)
3. Delete thread (cascades to posts)
4. Redirect to category
5. Add strong confirmation

**Acceptance Criteria:**
- [ ] Thread deleted from database
- [ ] All posts cascade deleted
- [ ] Only thread creator can delete
- [ ] Strong confirmation required
- [ ] Redirects to category
- [ ] Flash message shown

**Add to `src/controllers/forumController.js`:**

**Code:**
```javascript
exports.deleteThread = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.session.user.id;

    const thread = await Thread.findOne({
      where: { slug },
      include: [{
        model: Category,
        as: 'category'
      }]
    });

    if (!thread) {
      return res.status(404).render('errors/404', {
        title: 'Thread Not Found'
      });
    }

    // Check ownership
    if (thread.userId !== userId) {
      return res.status(403).render('errors/403', {
        title: 'Forbidden',
        message: 'You can only delete your own threads.'
      });
    }

    const categorySlug = thread.category.slug;

    // Delete thread (cascades to posts)
    await thread.destroy();

    req.flash('success', 'Thread and all its posts deleted successfully.');
    res.redirect(`/category/${categorySlug}`);
  } catch (error) {
    console.error('Error deleting thread:', error);
    req.flash('error', 'Failed to delete thread.');
    res.redirect('back');
  }
};
```

**Add route:**
```javascript
router.post('/thread/:slug/delete', requireAuth, forumController.deleteThread);
```

**Update `public/js/main.js` for strong confirmation:**
```javascript
// Strong confirmation for thread deletion
const threadDeleteButtons = document.querySelectorAll('.delete-thread-btn');
threadDeleteButtons.forEach(button => {
  button.addEventListener('click', function(e) {
    if (!confirm('Are you sure you want to delete this thread? This will delete ALL posts in the thread and cannot be undone!')) {
      e.preventDefault();
    }
  });
});
```

**Validation:**
- Delete a thread as owner
- Verify thread and all posts deleted
- Try as non-owner (should 403)
- Confirmation displays

---

## 7.5 Phase 3.5: User Profiles

### Task 3.5.1: Create User Profile Page

**Status:** 🔴 Not Started  
**Priority:** Medium  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 3.4.4  
**Assigned To:** TBD

**Description:**
Create user profile pages showing user info and activity.

**Steps:**
1. Create `src/controllers/userController.js`
2. Add `showProfile` function
3. Fetch user by username
4. Get user's threads and posts
5. Calculate counts
6. Create `src/views/pages/profile.ejs`
7. Display user info
8. List recent activity
9. Add "Edit Profile" button (if own profile)
10. Create routes

**Acceptance Criteria:**
- [ ] Profile displays user info
- [ ] Shows join date
- [ ] Shows thread count
- [ ] Shows post count
- [ ] Lists recent threads (5-10)
- [ ] Lists recent posts (5-10)
- [ ] Edit button for own profile
- [ ] 404 if user not found

**File:** `src/controllers/userController.js`

**Code:**
```javascript
const { User, Thread, Post, Category } = require('../models');
const { Op } = require('sequelize');

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
      title: 'Error'
    });
  }
};
```

**Create `src/views/pages/profile.ejs`:**

**Code:**
```html
<div class="profile-header">
  <div class="profile-info">
    <h1><%= profileUser.displayName || profileUser.username %></h1>
    <p class="username">@<%= profileUser.username %></p>
    <p class="member-since">
      Member since <%= new Date(profileUser.createdAt).toLocaleDateString() %>
    </p>
  </div>
  
  <% if (isOwnProfile) { %>
    <div class="profile-actions">
      <a href="/profile/edit" class="btn btn-primary">Edit Profile</a>
    </div>
  <% } %>
</div>

<div class="profile-stats">
  <div class="stat-card">
    <div class="stat-number"><%= threadCount %></div>
    <div class="stat-label">Threads</div>
  </div>
  <div class="stat-card">
    <div class="stat-number"><%= postCount %></div>
    <div class="stat-label">Posts</div>
  </div>
</div>

<section class="profile-section">
  <h2>Recent Threads</h2>
  <% if (recentThreads && recentThreads.length > 0) { %>
    <div class="activity-list">
      <% recentThreads.forEach(thread => { %>
        <div class="activity-item">
          <h3>
            <a href="/thread/<%= thread.slug %>"><%= thread.title %></a>
          </h3>
          <p class="activity-meta">
            in <a href="/category/<%= thread.category.slug %>"><%= thread.category.name %></a>
            • <%= new Date(thread.createdAt).toLocaleDateString() %>
          </p>
        </div>
      <% }) %>
    </div>
  <% } else { %>
    <p class="empty-state">No threads yet.</p>
  <% } %>
</section>

<section class="profile-section">
  <h2>Recent Posts</h2>
  <% if (recentPosts && recentPosts.length > 0) { %>
    <div class="activity-list">
      <% recentPosts.forEach(post => { %>
        <div class="activity-item">
          <p class="post-excerpt"><%= post.content.substring(0, 150) %>...</p>
          <p class="activity-meta">
            in <a href="/thread/<%= post.thread.slug %>"><%= post.thread.title %></a>
            • <%= new Date(post.createdAt).toLocaleDateString() %>
          </p>
        </div>
      <% }) %>
    </div>
  <% } else { %>
    <p class="empty-state">No posts yet.</p>
  <% } %>
</section>
```

**Add CSS:**
```css
.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.profile-info h1 {
  margin: 0 0 0.5rem 0;
}

.username {
  color: var(--secondary-color);
  margin: 0.25rem 0;
}

.member-since {
  color: var(--secondary-color);
  font-size: 0.875rem;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
}

.stat-label {
  color: var(--secondary-color);
  margin-top: 0.5rem;
}

.profile-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.profile-section h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.activity-item h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.activity-item h3 a {
  color: var(--text-color);
  text-decoration: none;
}

.activity-item h3 a:hover {
  color: var(--primary-color);
}

.activity-meta {
  font-size: 0.875rem;
  color: var(--secondary-color);
  margin: 0;
}

.post-excerpt {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
```

**Create routes file `src/routes/users.js`:**
```javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/profile/:username', userController.showProfile);

module.exports = router;
```

**Mount in `src/app.js`:**
```javascript
const userRoutes = require('./routes/users');
app.use('/', userRoutes);
```

**Validation:**
- Click username link
- Profile displays correctly
- Stats are accurate
- Recent activity shows
- Edit button appears for own profile

---

### Task 3.5.2: Create Edit Profile Page

**Status:** 🔴 Not Started  
**Priority:** Medium  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 3.5.1  
**Assigned To:** TBD

**Description:**
Create page for users to edit their profile information.

**Steps:**
1. Add `showEditProfile` function
2. Verify authentication
3. Create `src/views/pages/edit-profile.ejs`
4. Pre-fill with current data
5. Add form fields (displayName, email)
6. Add route (protected)

**Acceptance Criteria:**
- [ ] Edit form displays
- [ ] Current data pre-filled
- [ ] Requires authentication
- [ ] Only accessible to profile owner
- [ ] Styled consistently

**Add to `src/controllers/userController.js`:**

**Code:**
```javascript
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
      title: 'Error'
    });
  }
};
```

**Create `src/views/pages/edit-profile.ejs`:**

**Code:**
```html
<div class="page-header">
  <h1>Edit Profile</h1>
</div>

<% if (errors && errors.length > 0) { %>
  <div class="alert alert-error">
    <ul>
      <% errors.forEach(error => { %>
        <li><%= error.msg %></li>
      <% }) %>
    </ul>
  </div>
<% } %>

<form action="/profile/edit" method="POST" class="profile-form">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  
  <div class="form-group">
    <label for="username">Username</label>
    <input 
      type="text" 
      id="username" 
      value="<%= profileUser.username %>"
      disabled>
    <small>Username cannot be changed</small>
  </div>

  <div class="form-group">
    <label for="displayName">Display Name</label>
    <input 
      type="text" 
      id="displayName" 
      name="displayName" 
      value="<%= profileUser.displayName || profileUser.username %>"
      maxlength="100"
      placeholder="How others see your name">
    <small>Optional - defaults to username</small>
  </div>

  <div class="form-group">
    <label for="email">Email</label>
    <input 
      type="email" 
      id="email" 
      name="email" 
      value="<%= profileUser.email %>"
      required>
    <small>Must be unique</small>
  </div>

  <div class="form-actions">
    <button type="submit" class="btn btn-primary">Save Changes</button>
    <a href="/profile/<%= profileUser.username %>" class="btn btn-secondary">Cancel</a>
  </div>
</form>

<section class="change-password-section">
  <h2>Change Password</h2>
  <p>Password change functionality coming soon.</p>
</section>
```

**Add route:**
```javascript
const { requireAuth } = require('../middlewares/auth');

router.get('/profile/edit', requireAuth, userController.showEditProfile);
```

**Validation:**
- Click "Edit Profile" button
- Form displays with current data
- Username field is disabled

---

### Task 3.5.3: Implement Profile Update Logic

**Status:** 🔴 Not Started  
**Priority:** Medium  
**Estimated Time:** 1 hour  
**Dependencies:** Task 3.5.2  
**Assigned To:** TBD

**Description:**
Implement backend logic to update user profiles.

**Steps:**
1. Add `updateProfile` function
2. Validate display name and email
3. Check email uniqueness (if changed)
4. Update user in database
5. Update session data
6. Redirect to profile
7. Handle errors

**Acceptance Criteria:**
- [ ] Profile updated in database
- [ ] Email uniqueness enforced
- [ ] Session updated
- [ ] Validation works
- [ ] Redirects to profile
- [ ] Flash message shown

**Add to `src/controllers/userController.js`:**

**Code:**
```javascript
const { body, validationResult } = require('express-validator');

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

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const errors = validationResult(req);

    const user = await User.findByPk(userId);

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
```

**Add route:**
```javascript
router.post('/profile/edit', 
  requireAuth,
  userController.updateProfileValidation,
  userController.updateProfile
);
```

**Validation:**
- Update display name
- Update email
- Try duplicate email (should fail)
- Verify session updated
- Check flash message

---

### Task 3.5.4: Phase 3 Testing and Validation

**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Time:** 2-3 hours  
**Dependencies:** All Phase 3 tasks  
**Assigned To:** TBD

**Description:**
Comprehensive testing of all forum features.

**Steps:**
1. Test category listing
2. Test thread creation
3. Test post creation (replies)
4. Test edit operations
5. Test delete operations
6. Test user profiles
7. Test authorization
8. Test pagination
9. Fix bugs

**Acceptance Criteria:**
- [ ] All CRUD operations working
- [ ] Authorization checks working
- [ ] Pagination working
- [ ] No security issues
- [ ] Mobile responsive
- [ ] No console errors
- [ ] All Phase 3 tasks complete

**Testing Checklist:**

**Categories & Threads:**
- [ ] Homepage lists categories
- [ ] Category page lists threads
- [ ] Thread count accurate
- [ ] Can create new thread (logged in)
- [ ] Cannot create thread (logged out)
- [ ] Thread slug generated correctly
- [ ] Duplicate titles get unique slugs
- [ ] First post created automatically
- [ ] Pagination works (20+ threads)

**Posts & Replies:**
- [ ] Thread displays all posts
- [ ] First post highlighted
- [ ] Can post reply (logged in)
- [ ] Cannot post reply (logged out)
- [ ] Posts in chronological order
- [ ] Author info displayed
- [ ] Timestamps displayed
- [ ] Pagination works (15+ posts)

**Edit Operations:**
- [ ] Can edit own post
- [ ] Cannot edit others' posts
- [ ] Edit form pre-filled
- [ ] Edit saves correctly
- [ ] editedAt timestamp updated
- [ ] Edit indicator displays
- [ ] Validation works

**Delete Operations:**
- [ ] Can delete own post
- [ ] Cannot delete others' posts
- [ ] Cannot delete first post with replies
- [ ] Can delete thread
- [ ] Thread deletion cascades to posts
- [ ] Confirmations work
- [ ] Redirects work

**User Profiles:**
- [ ] Profile displays correctly
- [ ] Stats are accurate
- [ ] Recent activity shows
- [ ] Can edit own profile
- [ ] Cannot edit others' profiles
- [ ] Email uniqueness enforced
- [ ] Session updated after edit

**Authorization:**
- [ ] Guest cannot create content
- [ ] Guest redirected to login
- [ ] User can only edit own content
- [ ] User can only delete own content
- [ ] 403 errors for unauthorized access

**UI/UX:**
- [ ] Responsive on mobile
- [ ] Breadcrumb navigation works
- [ ] Flash messages display
- [ ] Forms styled consistently
- [ ] No layout issues
- [ ] Loading states work

**Phase 3 Completion Checklist:**
- [ ] ✅ Task 3.1.1-3.1.7: Models & Categories (7 tasks)
- [ ] ✅ Task 3.2.1-3.2.4: Thread Listing & Creation (4 tasks)
- [ ] ✅ Task 3.3.1-3.3.3: Post Display & Replies (3 tasks)
- [ ] ✅ Task 3.4.1-3.4.4: Edit & Delete (4 tasks)
- [ ] ✅ Task 3.5.1-3.5.3: User Profiles (3 tasks)
- [ ] ✅ Task 3.5.4: Phase 3 Testing

**Total Phase 3 Tasks:** 22 tasks

**Deliverables:**
- Complete forum functionality
- All CRUD operations working
- User profiles working
- Authorization enforced
- Mobile responsive
- All tests passing

**Next Phase:**
Once Phase 3 is complete, proceed to Phase 4 (Polish & Testing).

---

## 8. Phase 3 Summary

**Total Tasks:** 22  
**Estimated Total Time:** 20-25 hours  
**Priority:** All tasks critical for core functionality  

**Sub-Phases:**
- **3.1:** Models & Categories (7 tasks, 5-6 hours)
- **3.2:** Thread Listing & Creation (4 tasks, 4-5 hours)
- **3.3:** Post Display & Replies (3 tasks, 3-4 hours)
- **3.4:** Edit & Delete Operations (4 tasks, 3-4 hours)
- **3.5:** User Profiles (4 tasks, 4-5 hours)

**Completion Criteria:**
- All 22 tasks completed
- Full forum functionality working
- All CRUD operations implemented
- Authorization working
- Mobile responsive
- All tests passing

**Phase 3 Deliverables:**
1. ✅ Database models for forum
2. ✅ Category system
3. ✅ Thread creation and listing
4. ✅ Post creation and display
5. ✅ Edit and delete operations
6. ✅ User profiles
7. ✅ Complete authorization system
8. ✅ Pagination
9. ✅ Mobile responsive design

**Ready for Phase 4:** Core forum features complete, ready for polish and testing.

---

## 9. Notes for Phases 4 & 5

**Phase 4 Preview (Polish & Testing):**
- UI/UX improvements and refinements
- Comprehensive security testing
- Performance optimization
- Bug fixes
- Code cleanup
- Documentation updates

**Phase 5 Preview (Deployment):**
- Production environment setup
- Database configuration
- Server deployment
- SSL/HTTPS setup
- Monitoring configuration
- Backup procedures

---

## 10. Task Management Tips

**How to Use This Document:**
1. Start with Task 1.1 and work sequentially
2. Update task status as you progress
3. Check off acceptance criteria as completed
4. Validate each task before moving to next
5. Commit code after completing each task
6. Update this document with any deviations

**Task Status Updates:**
- Change status emoji as you work
- Add notes for any issues encountered
- Document any deviations from plan
- Track actual time spent vs. estimated

**Git Commit Strategy:**
- Commit after each task completion
- Use descriptive commit messages
- Reference task number in commits
- Example: "feat: Task 1.5 - Create Express app setup"

**Quality Checks:**
- Run linter after each task
- Test in browser after UI changes
- Check console for errors
- Verify mobile responsiveness

---

**Document Status:** Phase 1 Complete  
**Last Updated:** November 13, 2025  
**Next Update:** When starting Phase 2  
**Progress:** 0/15 tasks completed (0%)
