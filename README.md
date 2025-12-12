# Getting Started with Educard

A comprehensive guide to understanding, starting, and testing the Educard Educational Forum system.

---

## Table of Contents

1. [How the System Works](#how-the-system-works)
2. [How to Start the System](#how-to-start-the-system)
   - [Quick Start with Docker](#quick-start-with-docker-recommended)
   - [Production Deployment with Vagrant + K3s](#production-deployment-with-vagrant--k3s)
   - [Local Development](#alternative-local-development-without-docker)
3. [How to Test the System](#how-to-test-the-system)
4. [Troubleshooting](#troubleshooting)

---

## How the System Works

### System Overview

Educard is a **3-tier web forum application** that provides a complete platform for educational discussions with user management, content creation, and moderation capabilities.

```
┌──────────────┐
│   BROWSER    │ ← Users interact here
│  (Frontend)  │   (View pages, submit forms)
└──────┬───────┘
       │ HTTP/HTTPS Requests
       ▼
┌──────────────┐
│  NODE.JS     │ ← Application logic runs here
│  EXPRESS.JS  │   (Routing, authentication, business logic)
│  (Backend)   │
└──────┬───────┘
       │ SQL Queries
       ▼
┌──────────────┐
│  POSTGRESQL  │ ← Data is stored here
│  (Database)  │   (Users, threads, posts, etc.)
└──────────────┘
```

### Architecture Explained

#### 1. **Presentation Tier (Frontend)**
What users see and interact with:
- **HTML Pages:** Server-rendered using EJS templates
- **CSS Styling:** Responsive design that works on mobile, tablet, and desktop
- **JavaScript:** Client-side interactions (form validation, dark mode, animations)

#### 2. **Application Tier (Backend)**
The brains of the operation:
- **Express.js Server:** Handles all HTTP requests
- **Controllers:** Process requests and coordinate responses
- **Middleware:** Authentication, security, rate limiting, validation
- **Models:** Define data structure using Sequelize ORM
- **Routes:** Map URLs to controller functions

#### 3. **Data Tier (Database)**
Where everything is stored:
- **PostgreSQL Database:** Stores all application data
- **Tables:** Users, categories, threads, posts, notifications, etc.
- **Relationships:** Foreign keys connect related data
- **Indexes:** Speed up data retrieval

### How a Request Flows Through the System

**Example: User creates a new thread**

```
1. USER ACTION
   └─> User fills out "Create Thread" form
   └─> Clicks "Submit" button
       │
2. BROWSER
   └─> Sends POST request to /forum/category/:slug/new-thread
       │
3. EXPRESS.JS MIDDLEWARE CHAIN
   ├─> helmet.js: Applies security headers
   ├─> express-session: Checks user session
   ├─> isAuthenticated: Verifies user is logged in
   ├─> CSRF protection: Validates CSRF token
   ├─> Rate limiting: Checks if user exceeded limits
   └─> express-validator: Validates form data
       │
4. CONTROLLER (forumController.createThread)
   ├─> Sanitizes input (prevents XSS attacks)
   ├─> Checks user permissions
   ├─> Processes data (title, content, tags)
   │
5. MODEL (Thread.create + Post.create)
   └─> Sequelize generates SQL queries
       │
6. DATABASE
   ├─> Inserts new thread record
   ├─> Inserts first post record
   └─> Creates notifications for followers
       │
7. RESPONSE
   ├─> Redirect to new thread page
   └─> Flash success message
       │
8. BROWSER
   └─> Displays new thread to user
```

### Key Features Explained

#### Authentication System
- **Sessions:** User login state stored in encrypted cookies
- **Password Security:** bcrypt hashing (never store plain passwords)
- **CSRF Protection:** Tokens prevent cross-site request forgery
- **Rate Limiting:** Prevents brute force attacks

#### Forum Features
- **Categories:** Top-level organization (e.g., "General", "Help", "Announcements")
- **Threads:** Discussion topics within categories
- **Posts:** Individual messages within threads
- **Reactions:** Upvotes/downvotes on posts
- **Tags:** Keywords for content discovery

#### Content Features
- **Markdown Support:** Rich text formatting (bold, italic, lists, code)
- **Code Highlighting:** Syntax highlighting for programming languages
- **File Attachments:** Upload images and files
- **Search:** Find users, threads, posts, and tags

#### Admin Features
- **User Management:** Ban, unban, change roles
- **Content Moderation:** Delete threads/posts, pin/lock threads
- **System Monitoring:** View statistics and health metrics
- **Cache Management:** Clear cache when needed

### Security Layers

```
┌─────────────────────────────────────────┐
│ 1. Helmet.js Security Headers           │
│    • CSP (Content Security Policy)      │
│    • HSTS (Force HTTPS)                 │
│    • X-Frame-Options (Prevent clickjack)│
└─────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────┐
│ 2. Rate Limiting                        │
│    • Login: 5 attempts/15min            │
│    • API: 100 requests/15min            │
│    • Post Creation: 10/hour             │
└─────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────┐
│ 3. Authentication & Authorization       │
│    • Session validation                 │
│    • CSRF token verification            │
│    • Permission checks                  │
└─────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────┐
│ 4. Input Validation                     │
│    • express-validator                  │
│    • Type checking                      │
│    • Length limits                      │
└─────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────┐
│ 5. XSS Prevention                       │
│    • DOMPurify sanitization             │
│    • EJS auto-escaping                  │
│    • Content Security Policy            │
└─────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────┐
│ 6. SQL Injection Prevention             │
│    • Sequelize ORM parameterization     │
│    • No raw SQL queries                 │
└─────────────────────────────────────────┘
```

#### Kubernetes Architecture

When deployed to K3s, Educard runs with high availability:

```
┌─────────────────────────────────────────────┐
│           Vagrant Ubuntu VM                  │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │         K3s Cluster                     │ │
│  │                                         │ │
│  │  ┌──────────────────────────────────┐  │ │
│  │  │   Namespace: educard-prod        │  │ │
│  │  │                                  │  │ │
│  │  │  ┌──────────┐  ┌──────────┐    │  │ │
│  │  │  │ App Pod  │  │ App Pod  │    │  │ │
│  │  │  │ Replica 1│  │ Replica 2│    │  │ │
│  │  │  └────┬─────┘  └────┬─────┘    │  │ │
│  │  │       └──────┬───────┘          │  │ │
│  │  │              ▼                  │  │ │
│  │  │     ┌─────────────────┐        │  │ │
│  │  │     │ Service (LB)    │        │  │ │
│  │  │     │ Port: 80        │        │  │ │
│  │  │     └────────┬────────┘        │  │ │
│  │  │              │                 │  │ │
│  │  │  ┌───────────▼───────────┐    │  │ │
│  │  │  │ PostgreSQL StatefulSet│    │  │ │
│  │  │  │ Persistent Storage    │    │  │ │
│  │  │  └───────────────────────┘    │  │ │
│  │  └──────────────────────────────┘  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Port Forwarding:                        │
│  - 6443 → K3s API                        │
│  - 8080 → HTTP (80)                      │
│  - 8443 → HTTPS (443)                    │
└─────────────────────────────────────────┘
            ▲
            │ kubectl / browser
            │
    ┌───────┴────────┐
    │   Your Mac     │
    └────────────────┘
```

#### Production Features

The K3s deployment includes:

- ✅ **High Availability:** 2 application replicas with load balancing
- ✅ **Persistent Storage:** Database data survives pod restarts
- ✅ **Health Checks:** Automatic pod restart on failures
- ✅ **Resource Limits:** CPU and memory constraints
- ✅ **Secrets Management:** Secure credential storage
- ✅ **Database Backups:** Automated CronJob backups
- ✅ **Zero-Downtime Updates:** Rolling deployments
- ✅ **Session Persistence:** ClientIP-based session affinity

### Performance Optimization

- **Caching:** Frequently accessed data stored in memory (node-cache)
- **Database Indexes:** Speed up queries on frequently searched columns
- **Lazy Loading:** Images load as user scrolls
- **Query Optimization:** Use JOIN instead of N+1 queries
- **Connection Pooling:** Reuse database connections

---

## How to Start the System

### Prerequisites Check

Before starting, ensure you have:

**Option 1: Using Docker (Recommended - Easiest)**
- ✅ Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop))
- ✅ Docker Compose installed (included with Docker Desktop)

**Option 2: Using Vagrant + K3s (Production-like Environment)**
- ✅ Vagrant installed ([Download here](https://www.vagrantup.com/downloads))
- ✅ VirtualBox installed ([Download here](https://www.virtualbox.org/wiki/Downloads))
- ✅ kubectl installed ([Install guide](https://kubernetes.io/docs/tasks/tools/))

**Option 3: Local Development**
- ✅ Node.js 18.x or higher ([Download here](https://nodejs.org/))
- ✅ PostgreSQL 12.x or higher ([Download here](https://www.postgresql.org/download/))
- ✅ npm (comes with Node.js)

### Quick Start with Docker (Recommended)

**Step 1: Clone the Repository**
```bash
git clone https://github.com/TY1Fan/Educard.git
cd Educard
```

**Step 2: Start Everything**
```bash
docker-compose up
```

That's it! Docker will:
- Download Node.js and PostgreSQL images
- Install all dependencies automatically
- Create the database
- Start the application

**Step 3: Access the Application**
Open your browser to: **http://localhost:3000**

You should see the Educard homepage!

#### Docker Commands Reference

```bash
# Start in background (detached mode)
docker-compose up -d

# Stop the application
docker-compose down

# View logs
docker-compose logs -f

# View only app logs
docker-compose logs -f app

# Restart after code changes
docker-compose restart app

# Rebuild after dependency changes
docker-compose up --build

# Stop and remove everything (including database data)
docker-compose down -v

# Access application shell
docker-compose exec app sh

# Access database shell
docker-compose exec db psql -U educard -d educard_dev

# Run database migrations
docker-compose exec app npm run migrate

# Run tests inside container
docker-compose exec app npm test
```

### Production Deployment with Vagrant + K3s

This option creates a production-like Kubernetes environment on your local machine using Vagrant and K3s. Perfect for testing production deployments before going live.

**Step 1: Clone the Repository**
```bash
git clone https://github.com/TY1Fan/Educard.git
cd Educard
```

**Step 2: Start the Vagrant VM**
```bash
# Start the Ubuntu VM with K3s
vagrant up

# This will:
# - Create an Ubuntu 22.04 VM (4GB RAM, 2 CPUs)
# - Install K3s (lightweight Kubernetes)
# - Configure networking and port forwarding
# - Take 5-10 minutes on first run
```

**Step 3: Configure kubectl on Your Mac**
```bash
# Set kubeconfig to connect to the VM
export KUBECONFIG=$PWD/k8s/kubeconfig-local

# Verify connection
kubectl get nodes

# You should see:
# NAME          STATUS   ROLES                  AGE   VERSION
# educard-k3s   Ready    control-plane,master   1m    v1.33.6+k3s1
```

**Step 4: Deploy to Kubernetes**
```bash
# Run the automated deployment script
./deploy-to-k3s.sh

# This will:
# 1. Create namespace (educard-prod)
# 2. Deploy PostgreSQL StatefulSet
# 3. Run database migrations
# 4. Seed the database with categories
# 5. Deploy the application (2 replicas)
# 6. Create services and load balancer
```

**Step 5: Access the Application**
```bash
# Forward the service port to your local machine
kubectl port-forward -n educard-prod svc/educard-app 3000:80

# Keep this terminal open, then open browser to:
# http://localhost:3000
```

#### Kubernetes Commands Reference

```bash
# View all pods
kubectl get pods -n educard-prod

# View pod logs
kubectl logs -f -n educard-prod deployment/educard

# View services
kubectl get svc -n educard-prod

# Access the database
kubectl exec -it -n educard-prod educard-postgres-0 -- psql -U educard -d educard_prod

# Restart application
kubectl rollout restart deployment/educard -n educard-prod

# Scale application (add more replicas)
kubectl scale deployment/educard -n educard-prod --replicas=3

# Check deployment status
kubectl get all -n educard-prod

# View application environment
kubectl describe deployment/educard -n educard-prod

# Delete everything (clean slate)
kubectl delete namespace educard-prod

# SSH into the VM
vagrant ssh

# Inside VM, use kubectl:
sudo k3s kubectl get pods -A

# Stop the VM
vagrant halt

# Restart the VM
vagrant up

# Destroy the VM completely
vagrant destroy
```

#### Troubleshooting Vagrant/K3s

**VM won't start:**
```bash
# Check VirtualBox is installed
VBoxManage --version

# Check Vagrant version
vagrant version

# Destroy and recreate
vagrant destroy -f
vagrant up
```

**kubectl can't connect:**
```bash
# Make sure kubeconfig is set
export KUBECONFIG=$PWD/k8s/kubeconfig-local

# Verify kubeconfig file exists
ls -la k8s/kubeconfig-local

# Test connection
kubectl cluster-info
```

**Pods won't start:**
```bash
# Check pod status
kubectl get pods -n educard-prod

# View pod details
kubectl describe pod <pod-name> -n educard-prod

# Check logs
kubectl logs <pod-name> -n educard-prod

# Common issue: Image not available
# Solution: Build and load image into VM
docker build -t educard:latest .
docker save educard:latest | gzip > educard.tar.gz
vagrant ssh -c "sudo k3s ctr images import /vagrant/educard.tar.gz"
```

**Database connection issues:**
```bash
# Check if PostgreSQL is running
kubectl get pods -n educard-prod -l app=educard-postgres

# Verify service exists
kubectl get svc -n educard-prod educard-postgres

# Test connection from app pod
kubectl exec -it -n educard-prod deployment/educard -- sh
nc -zv educard-postgres 5432
```

### Alternative: Local Development (Without Docker)

**Step 1: Clone the Repository**
```bash
git clone https://github.com/TY1Fan/Educard.git
cd Educard
```

**Step 2: Install Dependencies**
```bash
npm install
```

**Step 3: Set Up Environment Variables**
```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
nano .env  # or use your favorite editor
```

**Important:** Change `DB_HOST=db` to `DB_HOST=localhost` in `.env`

**Step 4: Create PostgreSQL Database**
```bash
# Using psql command
createdb educard_dev

# Or using PostgreSQL client
psql -U postgres
CREATE DATABASE educard_dev;
\q
```

**Step 5: Configure Database Connection**
Update `.env` with your PostgreSQL credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=educard_dev
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
```

**Step 6: Run Database Migrations (if available)**
```bash
npm run migrate
```

**Step 7: Start the Application**
```bash
# Development mode (auto-reload on changes)
npm run dev

# Or production mode
npm start
```

**Step 8: Access the Application**
Open your browser to: **http://localhost:3000**

### Verify Installation

**1. Check Health Endpoint**
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-09T12:00:00.000Z",
  "uptime": 123.45
}
```

**2. Check Database Connection**
- Application logs should show: `✓ Database connected successfully`
- No error messages about database connection

**3. Test Basic Functionality**
- Homepage loads: http://localhost:3000
- Can view categories
- Can access registration page: http://localhost:3000/auth/register
- Can access login page: http://localhost:3000/auth/login

### Environment Variables Explained

```env
# Application Settings
NODE_ENV=development              # 'development' or 'production'
PORT=3000                          # Port to run the application on

# Database Configuration
DB_HOST=db                         # 'db' for Docker, 'localhost' for local
DB_PORT=5432                       # PostgreSQL default port
DB_NAME=educard_dev               # Database name
DB_USER=educard                   # Database username
DB_PASSWORD=educard_dev_pass      # Database password

# Session Configuration
SESSION_SECRET=your-secret-key-here-change-in-production
                                  # Must be 32+ characters in production
SESSION_MAX_AGE=86400000          # Session duration in ms (24 hours)

# Application URLs
BASE_URL=http://localhost:3000    # Full URL for the application
```

### Directory Structure After Setup

```
Educard/
├── node_modules/          ← Dependencies installed by npm
├── public/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── uploads/           ← User uploaded files (created at runtime)
├── src/
│   ├── app.js            ← Express app configuration
│   ├── config/           ← Database and other configs
│   ├── controllers/      ← Request handlers
│   ├── middleware/       ← Authentication, validation, etc.
│   ├── models/           ← Database models
│   ├── routes/           ← URL routing
│   ├── utils/            ← Helper functions
│   └── views/            ← EJS templates
├── tests/                ← Test files
├── server.js             ← Application entry point
├── package.json          ← Dependencies and scripts
├── .env                  ← Environment variables (you create this)
└── docker-compose.yml    ← Docker configuration
```

### First Time Setup Steps

**1. Create an Admin Account**
```bash
# Register through the UI at /auth/register
# First user or manually set in database:
docker-compose exec db psql -U educard -d educard_dev
UPDATE users SET role = 'admin' WHERE username = 'your_username';
\q
```

**2. Seed Initial Data (Optional)**
Create some initial categories and test data:
```bash
# If seed script exists
npm run seed

# Or manually through admin dashboard at /admin
```

**3. Configure Application Settings**
Visit `/admin` to configure:
- Site settings
- Default categories
- System parameters

---

## How to Test the System

### Testing Overview

Educard has multiple levels of testing:
1. **Automated Tests** - Unit and integration tests (Jest)
2. **Manual Testing** - Step-by-step user workflows
3. **Cross-Browser Testing** - Compatibility across browsers
4. **Load Testing** - Performance under stress

### 1. Automated Testing

#### Run All Tests
```bash
# Using Docker
docker-compose exec app npm test

# Local development
npm test
```

#### Run Specific Test Suites
```bash
# Test authentication
npm test -- tests/unit/auth.test.js

# Test forum features
npm test -- tests/unit/forum.test.js

# Test with coverage report
npm test -- --coverage

# Watch mode (re-run on file changes)
npm test -- --watch
```

#### Test Results
Current test status: **42/42 tests passing ✅**

```
Test Suites: 8 passed, 8 total
Tests:       42 passed, 42 total
Coverage:    85%+
```

#### Understanding Test Output

```bash
PASS tests/unit/auth.test.js
  ✓ should hash password correctly (45ms)
  ✓ should validate email format (12ms)
  ✓ should reject weak passwords (8ms)
  
PASS tests/integration/forum.test.js
  ✓ should create thread when authenticated (123ms)
  ✓ should prevent thread creation when not logged in (34ms)
  
Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
Time:        4.532s
```

### 2. Manual Testing

#### Quick Manual Test Script

We provide an interactive testing menu:

```bash
# Start interactive testing
./scripts/start-testing.sh
```

This opens a menu with options:
```
┌─────────────────────────────────────┐
│    Educard Testing Menu             │
├─────────────────────────────────────┤
│ 1. Setup test data                  │
│ 2. Test user registration           │
│ 3. Test thread creation             │
│ 4. Test posting and replies         │
│ 5. Test search functionality        │
│ 6. Test admin features              │
│ 7. Clear test data                  │
│ 8. Exit                             │
└─────────────────────────────────────┘
```

#### Manual Testing Checklist

**Phase 1: User Registration & Authentication**
- [ ] Register new account at `/auth/register`
- [ ] Verify email validation
- [ ] Verify password strength requirements
- [ ] Login with new account
- [ ] Logout successfully

**Phase 2: Forum Navigation**
- [ ] View homepage with categories
- [ ] Click into a category
- [ ] View thread list in category
- [ ] Click into a thread
- [ ] View posts in thread
- [ ] Test pagination (if many threads/posts)

**Phase 3: Content Creation**
- [ ] Create a new thread
- [ ] Upload an image
- [ ] Preview before posting
- [ ] Submit thread

**Phase 4: Content Interaction**
- [ ] Reply to a thread
- [ ] Edit your own post
- [ ] Delete your own post
- [ ] Upvote/downvote posts

**Phase 5: User Features**
- [ ] View your profile
- [ ] Edit profile information
- [ ] Upload avatar
- [ ] View notifications
- [ ] Mark notifications as read
- [ ] Search for threads/posts/users

**Phase 7: Edge Cases**
- [ ] Try SQL injection in search: `' OR '1'='1`
- [ ] Try XSS in post: `<script>alert('XSS')</script>`
- [ ] Test rate limiting (login 6+ times quickly)
- [ ] Test with invalid CSRF token
- [ ] Upload very large file
- [ ] Create very long post/thread

**Phase 8: Responsive Design**
- [ ] Test on mobile (320px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Test dark mode toggle
- [ ] Test keyboard navigation (Tab key)

### 3. Cross-Browser Testing

**Browsers to Test:**
- ✅ Google Chrome 90+
- ✅ Mozilla Firefox 88+
- ✅ Safari 14+
- ✅ Microsoft Edge 90+

**Test in Each Browser:**
```bash
# Open application in each browser
http://localhost:3000
```

**What to Verify:**
- [ ] Pages render correctly
- [ ] Forms submit properly
- [ ] JavaScript works (dark mode, validation)
- [ ] CSS styling is consistent
- [ ] No console errors
- [ ] File uploads work
- [ ] Session persistence works

**Cross-Browser Test Report:** 100% compatible ✅
See: `docs/k8s-tasks/TASK-6.8-CROSS-BROWSER-TESTING-REPORT.md`

### 4. Performance Testing

#### Quick Load Test

```bash
# Install Apache Bench (if not installed)
# macOS: brew install httpd
# Ubuntu: sudo apt-get install apache2-utils

# Test homepage
ab -n 1000 -c 10 http://localhost:3000/

# Test login endpoint
ab -n 100 -c 5 -p login.json -T application/json http://localhost:3000/auth/login
```

#### Interpret Results

```
Requests per second:    156.23 [#/sec] (mean)
Time per request:       6.401 [ms] (mean)
Transfer rate:          1234.56 [Kbytes/sec] received
```

**Good Performance:**
- Homepage: 100+ requests/second
- Database queries: < 50ms average
- Page load time: < 2 seconds

### 5. Security Testing

#### Test CSRF Protection
```bash
# Try to submit form without CSRF token (should fail)
curl -X POST http://localhost:3000/forum/category/general/new-thread \
  -d "title=Test&content=Test"
```

Expected: 403 Forbidden or CSRF token error

#### Test Rate Limiting
```bash
# Try rapid login attempts (should block after 5)
for i in {1..10}; do
  curl -X POST http://localhost:3000/auth/login \
    -d "email=test@test.com&password=wrong"
done
```

Expected: "Too many requests" after 5 attempts

#### Test XSS Prevention
1. Create post with: `<script>alert('XSS')</script>`
2. Expected: Script tag should be stripped/escaped
3. Verify in browser: No alert popup, raw text shown

#### Test SQL Injection Prevention
1. Search for: `' OR '1'='1`
2. Expected: No database error, treated as literal string
3. Should return no results or error message

### 6. Accessibility Testing

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible
- [ ] Can submit forms with Enter key
- [ ] Can close modals with Escape key

#### Screen Reader Testing
```bash
# Test with built-in screen readers:
# macOS: VoiceOver (Cmd + F5)
# Windows: NVDA or JAWS
```

Verify:
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Headings in logical order
- [ ] ARIA labels where needed

#### Color Contrast
Use browser DevTools:
1. Right-click element → Inspect
2. Check contrast ratio in Styles panel
3. Should be ≥ 4.5:1 for normal text
4. Should be ≥ 3:1 for large text

### Test Data Management

#### Create Test Data
```bash
# Setup script
./scripts/setup-test-data.sh

# Or manually
docker-compose exec app npm run seed
```

Creates:
- 5 test users (user1@test.com through user5@test.com)
- 10 categories
- 50 threads
- 200 posts
- Various reactions and notifications

#### Clear Test Data
```bash
# Remove all test data
./scripts/clear-test-data.sh

# Or reset database completely
docker-compose down -v
docker-compose up
```

### Testing Documentation

**Detailed Testing Guides:**
- [Testing Checklist](./docs/TESTING_CHECKLIST.md) - Complete E2E scenarios
- [Manual Testing Guide](./docs/MANUAL_TESTING_GUIDE.md) - Step-by-step instructions
- [Testing Quick Reference](./docs/TESTING_QUICK_REFERENCE.md) - Quick commands

**Testing Reports:**
- [Automated Testing Summary](./docs/k8s-tasks/TASK-6.7-SUMMARY.md)
- [Cross-Browser Testing Report](./docs/k8s-tasks/TASK-6.8-CROSS-BROWSER-TESTING-REPORT.md)
- [Manual Testing Results](./docs/BUGS_FOUND.md)

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Cannot connect to database"

**Symptoms:**
```
Error: Connection refused
Error: ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

**Using Docker:**
```bash
# Check if database container is running
docker-compose ps

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Verify DB_HOST in .env is set to 'db' (not 'localhost')
```

**Local Development:**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
# macOS: brew services start postgresql
# Ubuntu: sudo service postgresql start

# Verify DB_HOST in .env is set to 'localhost' (not 'db')
```

#### Issue: "Port 3000 already in use"

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

**Option 1: Stop the conflicting process**
```bash
# Find process using port 3000
# macOS/Linux:
lsof -i :3000

# Kill the process
kill -9 <PID>
```

**Option 2: Use a different port**
```bash
# Change PORT in .env
PORT=3001

# Restart application
```

#### Issue: "npm install fails"

**Symptoms:**
```
npm ERR! code ERESOLVE
npm ERR! peer dependency errors
```

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still fails, use legacy peer deps
npm install --legacy-peer-deps
```

#### Issue: "Session not persisting / keeps logging out"

**Symptoms:**
- User logs in but immediately logged out
- Session lost on page refresh

**Solutions:**

1. Check SESSION_SECRET in .env is set
2. Verify session store configuration
3. Clear cookies in browser
4. Check if using HTTPS in production (secure cookies)

```bash
# Verify session settings in .env
SESSION_SECRET=your-long-secret-key-here-minimum-32-characters
SESSION_MAX_AGE=86400000
```

#### Issue: "CSS or JavaScript not loading"

**Symptoms:**
- Page looks unstyled
- Console shows 404 errors for CSS/JS files

**Solutions:**

1. Check if public folder is being served:
```javascript
// In src/app.js
app.use(express.static(path.join(__dirname, '../public')));
```

2. Verify file paths in HTML:
```html
<!-- Should be: -->
<link rel="stylesheet" href="/css/style.css">

<!-- Not: -->
<link rel="stylesheet" href="./css/style.css">
```

3. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)

#### Issue: "Tests failing"

**Symptoms:**
```
FAIL tests/unit/auth.test.js
Expected: true, Received: false
```

**Solutions:**

1. Check if test database is configured
2. Verify test environment variables
3. Run tests with verbose output:
```bash
npm test -- --verbose

# Run single test file to isolate
npm test -- tests/unit/auth.test.js
```

4. Check if database is in correct state:
```bash
# Reset test database
NODE_ENV=test npm run migrate:reset
NODE_ENV=test npm run migrate
```

#### Issue: "Images/files not uploading"

**Symptoms:**
- Upload fails silently
- 413 Payload Too Large error

**Solutions:**

1. Check upload directory permissions:
```bash
chmod 755 public/uploads
```

2. Check file size limit in app.js:
```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

3. Verify Nginx/reverse proxy limits (if using):
```nginx
client_max_body_size 10M;
```

#### Issue: "Admin dashboard not accessible"

**Symptoms:**
- 403 Forbidden when accessing /admin
- "Insufficient permissions" message

**Solutions:**

1. Verify user role in database:
```bash
docker-compose exec db psql -U educard -d educard_dev
SELECT id, username, email, role FROM users WHERE username = 'your_username';
```

2. Update user role to admin:
```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

3. Logout and login again to refresh session

#### Issue: "Docker containers keep restarting"

**Symptoms:**
```
Restarting (1) 5 seconds ago
```

**Solutions:**

1. Check container logs:
```bash
docker-compose logs app
docker-compose logs db
```

2. Common causes:
   - Database not ready when app starts (add healthcheck/wait)
   - Environment variables missing
   - Port conflicts
   - Syntax errors in code

3. Debug by running container interactively:
```bash
docker-compose run app sh
npm start
```

### Getting Help

**1. Check Documentation:**
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
- [Environment Variables](./docs/ENVIRONMENT.md)
- [Database Setup](./docs/DATABASE.md)

**2. Check Logs:**
```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f db

# System logs
tail -f /var/log/educard.log
```

**3. Health Check:**
```bash
curl http://localhost:3000/health
```

**4. Database Connection Test:**
```bash
docker-compose exec db psql -U educard -d educard_dev -c "SELECT version();"
```

**5. Community Support:**
- GitHub Issues: https://github.com/TY1Fan/Educard/issues
- Documentation: [docs/](./docs/)

---

## Quick Reference Commands

### Docker Commands
```bash
# Start everything
docker-compose up

# Start in background
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose up --build

# Reset everything
docker-compose down -v && docker-compose up
```

### npm Commands
```bash
# Development mode
npm run dev

# Production mode
npm start

# Run tests
npm test

# Test coverage
npm test -- --coverage

# Lint code
npm run lint

# Format code
npm run format
```

### Database Commands
```bash
# Access database
docker-compose exec db psql -U educard -d educard_dev

# Run migrations
npm run migrate

# Rollback migration
npm run migrate:undo

# Seed data
npm run seed
```

### Testing Commands
```bash
# All tests
npm test

# Specific test file
npm test -- tests/unit/auth.test.js

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Manual testing
./scripts/start-testing.sh
```

---

## Next Steps

1. **For First-Time Users:**
   - ✅ Start the system (Docker or local)
   - ✅ Create an account
   - ✅ Explore the interface
   - ✅ Create your first thread
   - ✅ Read [User Guide](./docs/USER_GUIDE.md)

2. **For Administrators:**
   - ✅ Set up admin account
   - ✅ Configure system settings
   - ✅ Read [Admin Guide](./docs/ADMIN_GUIDE.md)
   - ✅ Set up monitoring
   - ✅ Configure backups

3. **For Developers:**
   - ✅ Review [Architecture](./docs/ARCHITECTURE.md)
   - ✅ Study [Database Schema](./docs/DATABASE.md)
   - ✅ Read [API Documentation](./docs/API_DOCUMENTATION.md)
   - ✅ Review [Contributing Guidelines](./CONTRIBUTING.md)
   - ✅ Run test suite

4. **For Production Deployment:**
   - ✅ Review [K3s Deployment Guide](./docs/K3S_DEPLOYMENT.md)
   - ✅ Follow [Deployment Testing](./docs/DEPLOYMENT_TESTING.md)
   - ✅ Set up [Monitoring](./docs/MONITORING.md)
   - ✅ Configure [Backups](./docs/BACKUP_RESTORE.md)
   - ✅ Review [Operations Runbook](./docs/OPERATIONS_RUNBOOK.md)

---

**Need more help?** Check the [full documentation index](./docs/README.md) or open an [issue on GitHub](https://github.com/TY1Fan/Educard/issues).

**Version:** 1.0.0  
**Last Updated:** December 9, 2024  
**Status:** ✅ Production Ready
