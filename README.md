# Educard - Educational Web Forum

A simple, educational web forum application built with Node.js, Express.js, and PostgreSQL. This project follows a spec-driven development approach with a focus on simplicity and core functionality.

## 🎯 Project Overview

Educard is a 3-tier web forum that provides:
- User registration and authentication
- Forum categories, threads, and posts
- Full CRUD operations for forum content
- Basic user profiles
- Responsive web interface

## 🏗️ Architecture

**3-Tier Architecture:**
- **Presentation Tier:** Server-side rendered HTML with EJS templates
- **Application Tier:** Node.js with Express.js
- **Data Tier:** PostgreSQL database with Sequelize ORM

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

**Current Phase:** Phase 1 - Setup & Foundation  
**Status:** � Phase 1 Complete

Phase 1 is now complete with all foundational components in place. Ready to move to Phase 2 (Authentication System).

See [specs/40-tasks.md](./specs/40-tasks.md) for detailed task breakdown and progress.

## 📚 Documentation

Comprehensive project documentation is available in the `specs/` directory:

- [Constitution](./specs/00-constitution.md) - Project principles and governance
- [Current State](./specs/10-current-state-spec.md) - Baseline and gap analysis
- [Target Specification](./specs/20-target-spec.md) - Complete technical specifications
- [Implementation Plan](./specs/30-plan.md) - Phased development roadmap
- [Task Breakdown](./specs/40-tasks.md) - Detailed task list with acceptance criteria
- [Traceability Matrix](./specs/50-traceability.md) - Requirements to tasks mapping

## � Project Structure

```
educard/
├── src/
│   ├── app.js                 # Express application configuration
│   ├── config/
│   │   └── database.js        # Sequelize database configuration
│   ├── models/                # Sequelize models (to be added)
│   ├── controllers/           # Route controllers (to be added)
│   ├── routes/                # Route definitions (to be added)
│   ├── middlewares/           # Custom middleware (to be added)
│   ├── utils/                 # Utility functions (to be added)
│   └── views/                 # EJS templates
│       ├── layouts/
│       │   └── main.ejs       # Main layout template
│       ├── pages/
│       │   └── home.ejs       # Homepage view
│       ├── partials/          # Reusable components (to be added)
│       └── errors/            # Error pages (to be added)
├── public/
│   ├── css/
│   │   └── style.css          # Main stylesheet
│   ├── js/
│   │   └── main.js            # Client-side JavaScript
│   └── images/                # Static images
├── tests/                     # Test files (to be added)
├── specs/                     # Project documentation
├── server.js                  # Application entry point
├── package.json               # Dependencies and scripts
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Multi-container setup
├── .env                       # Environment variables (not committed)
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## �🛠️ Technology Stack

**Backend:**
- Node.js with Express.js framework
- PostgreSQL database
- Sequelize ORM
- EJS templating engine

**Authentication & Security:**
- express-session for session management
- bcrypt for password hashing
- csurf for CSRF protection
- express-validator for input validation

**Infrastructure:**
- Docker & Docker Compose for containerization
- PostgreSQL 15 Alpine image
- Node.js 18 Alpine image

**Development Tools:**
- nodemon for auto-reloading
- ESLint for code linting
- Prettier for code formatting

## 🎨 Features

### Phase 1 ✅ Completed
- [x] Project setup and configuration
- [x] Docker containerization (app + database)
- [x] Database connection (PostgreSQL + Sequelize)
- [x] Basic templates and styling (EJS layouts)
- [x] Responsive CSS framework
- [x] Development environment with hot-reload

### Phase 2 (Planned)
- [ ] User registration
- [ ] User login/logout
- [ ] Session management
- [ ] Authentication middleware

### Phase 3 (Planned)
- [ ] Forum categories
- [ ] Thread creation and listing
- [ ] Post creation and replies
- [ ] Edit and delete operations
- [ ] User profiles

### Phase 4 (Planned)
- [ ] UI/UX polish
- [ ] Security testing
- [ ] Performance optimization

### Phase 5 (Planned)
- [ ] Production deployment
- [ ] Monitoring setup

## 🧪 Testing

```bash
# Run tests (once implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 📝 Development Workflow

This project follows a spec-driven development approach:

1. Requirements are defined in specification documents
2. Tasks are broken down with clear acceptance criteria
3. Implementation follows the task breakdown
4. Each phase is tested before moving to the next
5. Traceability is maintained throughout

## 🤝 Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and development process.

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- Project Repository: [GitHub](https://github.com/TY1Fan/Educard)
- Issue Tracker: [GitHub Issues](https://github.com/TY1Fan/Educard/issues)
- Documentation: [specs/](./specs/)

## 👤 Author

Development Team

## 📊 Project Timeline

- **Phase 1:** Week 1 (Setup & Foundation)
- **Phase 2:** Weeks 1-2 (Authentication)
- **Phase 3:** Weeks 2-4 (Core Forum Features)
- **Phase 4:** Week 5 (Polish & Testing)
- **Phase 5:** Week 6 (Deployment)

**Estimated Total:** 4-6 weeks for single developer

---

*Built with ❤️ following spec-driven development principles*
