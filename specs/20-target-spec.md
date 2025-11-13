# Target Specification

## Document Information
- **Project:** Educard - Educational Web Forum
- **Document Type:** Target State Specification
- **Version:** 1.0
- **Date:** November 13, 2025
- **Status:** Active
- **Related Documents:** 
  - [Constitution](./00-constitution.md)
  - [Current State](./10-current-state-spec.md)
  - [Implementation Plan](./30-plan.md)

## 1. Executive Summary

This document defines the target state for Educard v1.0, a simple 3-tier educational web forum application. The system will provide basic CRUD (Create, Read, Update, Delete) operations for forum content and fundamental user authentication features, adhering to the simplicity-first principle established in the project constitution.

### 1.1 Target Architecture
**3-Tier Architecture:**
1. **Presentation Tier** - Web-based user interface
2. **Application Tier** - Business logic and API layer
3. **Data Tier** - Database for persistent storage

### 1.2 Core Capabilities
- User registration and authentication
- Forum structure (Categories → Threads → Posts)
- Full CRUD operations for forum content
- Basic user profiles
- Responsive web interface

## 2. System Architecture

### 2.1 Overall Architecture

```
┌─────────────────────────────────────────┐
│      PRESENTATION TIER (Tier 1)         │
│  ┌─────────────────────────────────┐    │
│  │   Web Browser (Client)          │    │
│  │   - HTML/CSS/JavaScript         │    │
│  │   - Responsive UI               │    │
│  └─────────────────────────────────┘    │
└──────────────┬──────────────────────────┘
               │ HTTP/HTTPS
               ▼
┌─────────────────────────────────────────┐
│      APPLICATION TIER (Tier 2)          │
│  ┌─────────────────────────────────┐    │
│  │   Web Application Server        │    │
│  │   - Authentication Logic        │    │
│  │   - Business Rules              │    │
│  │   - Request Routing             │    │
│  │   - Session Management          │    │
│  │   - Input Validation            │    │
│  └─────────────────────────────────┘    │
└──────────────┬──────────────────────────┘
               │ Database Protocol
               ▼
┌─────────────────────────────────────────┐
│         DATA TIER (Tier 3)              │
│  ┌─────────────────────────────────┐    │
│  │   Database Server               │    │
│  │   - User Data                   │    │
│  │   - Forum Content               │    │
│  │   - Relationships               │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 2.2 Technology Stack (Recommended)

**Presentation Tier:**
- HTML5 for structure
- CSS3 for styling (with responsive design)
- Vanilla JavaScript or lightweight framework for interactivity
- Server-side rendering preferred for simplicity

**Application Tier:**
- Backend Framework: Node.js with Express / Python with Flask or Django / PHP with Laravel (to be decided in planning phase)
- Template Engine: EJS / Jinja2 / Blade (based on chosen framework)
- Authentication: Passport.js / Flask-Login / Laravel Auth (or similar)
- Password Hashing: bcrypt library
- Session Management: Express-session / Flask-Session / Laravel Sessions

**Data Tier:**
- Database: PostgreSQL (recommended) or MySQL
- ORM/Query Builder: Sequelize / SQLAlchemy / Eloquent (or raw SQL)
- Migration Tool: Built-in framework migrations

**Development Tools:**
- Version Control: Git
- Package Manager: npm / pip / composer
- Environment Management: .env files
- Code Formatting: Prettier / Black / PHP-CS-Fixer

## 3. Data Model

### 3.1 Database Schema

#### 3.1.1 Users Table
```sql
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active       BOOLEAN DEFAULT TRUE
);
```

**Fields:**
- `id`: Primary key, auto-incrementing
- `username`: Unique identifier for login (3-50 characters)
- `email`: User email address (for password recovery)
- `password_hash`: Hashed password (never store plaintext)
- `display_name`: Optional display name (defaults to username)
- `created_at`: Account creation timestamp
- `updated_at`: Last profile update timestamp
- `is_active`: Account status (for soft deletion)

#### 3.1.2 Categories Table
```sql
CREATE TABLE categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    display_order   INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: Primary key, auto-incrementing
- `name`: Category display name
- `description`: Brief description of category purpose
- `slug`: URL-friendly identifier
- `display_order`: Order for display (lower numbers first)
- `created_at`: Category creation timestamp

#### 3.1.3 Threads Table
```sql
CREATE TABLE threads (
    id              SERIAL PRIMARY KEY,
    category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL,
    is_pinned       BOOLEAN DEFAULT FALSE,
    is_locked       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, slug)
);
```

**Fields:**
- `id`: Primary key, auto-incrementing
- `category_id`: Foreign key to categories
- `user_id`: Thread creator (foreign key to users)
- `title`: Thread title/subject
- `slug`: URL-friendly identifier (unique within category)
- `is_pinned`: Whether thread is pinned to top (admin feature for future)
- `is_locked`: Whether thread is locked from new posts (admin feature for future)
- `created_at`: Thread creation timestamp
- `updated_at`: Last activity timestamp

#### 3.1.4 Posts Table
```sql
CREATE TABLE posts (
    id              SERIAL PRIMARY KEY,
    thread_id       INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    is_first_post   BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at       TIMESTAMP NULL
);
```

**Fields:**
- `id`: Primary key, auto-incrementing
- `thread_id`: Foreign key to threads
- `user_id`: Post author (foreign key to users)
- `content`: Post content (plain text or markdown)
- `is_first_post`: Whether this is the thread's opening post
- `created_at`: Post creation timestamp
- `updated_at`: System update timestamp
- `edited_at`: User edit timestamp (null if never edited)

### 3.2 Entity Relationships

```
┌──────────┐
│  users   │
└────┬─────┘
     │
     │ 1:N (creates)
     │
     ├─────────────┐
     │             │
     ▼             ▼
┌─────────┐   ┌───────┐
│ threads │   │ posts │
└────┬────┘   └───┬───┘
     │            │
     │ 1:N        │
     │            │
     ▼            │
┌────────────┐   │
│ categories │   │
└────────────┘   │
                 │
     ┌───────────┘
     │ N:1 (belongs to thread)
     │
┌────┴────┐
│ threads │
└─────────┘
```

**Relationships:**
- One User can create many Threads (1:N)
- One User can create many Posts (1:N)
- One Category contains many Threads (1:N)
- One Thread belongs to one Category (N:1)
- One Thread contains many Posts (1:N)
- One Post belongs to one Thread (N:1)
- One Post belongs to one User (N:1)

### 3.3 Data Integrity Rules

**Constraints:**
- Usernames must be unique and 3-50 characters
- Emails must be unique and valid format
- Passwords must be hashed before storage
- Thread titles must be 1-255 characters
- Post content cannot be empty
- Cascade deletes: Deleting a category deletes its threads; deleting a thread deletes its posts
- User deletion sets user_id to a "deleted user" placeholder OR cascades (to be decided)

**Indexes:**
- Primary keys on all id fields
- Index on users.username and users.email for login
- Index on threads.category_id for listing
- Index on posts.thread_id for display
- Index on threads.updated_at for "latest activity" sorting
- Index on categories.display_order for ordering

## 4. Functional Requirements

### 4.1 User Authentication

#### 4.1.1 User Registration
**Functionality:**
- Users can create a new account
- Registration form with fields: username, email, password, confirm password
- Server-side validation of all inputs
- Password strength requirements (minimum 8 characters)
- Email format validation
- Username uniqueness check
- Email uniqueness check
- Automatic login after successful registration

**Business Rules:**
- Username: 3-50 characters, alphanumeric and underscores only
- Email: Valid email format, unique in system
- Password: Minimum 8 characters, hashed with bcrypt (10+ rounds)
- Display name: Optional, defaults to username

**Success Criteria:**
- User account created in database
- User automatically logged in
- Redirect to forum homepage or profile
- Welcome message displayed

**Error Handling:**
- Display validation errors inline
- Prevent duplicate username/email registration
- Clear error messages for user correction

#### 4.1.2 User Login
**Functionality:**
- Login form with username/email and password fields
- "Remember me" checkbox (optional, extends session)
- Server-side authentication
- Session creation on successful login
- Redirect to previous page or homepage

**Business Rules:**
- Accept either username or email for login
- Case-insensitive username/email matching
- Password must match hash in database
- Account must be active (is_active = true)

**Success Criteria:**
- Session created and stored
- User redirected to intended destination
- User sees their username in navigation

**Error Handling:**
- Generic error message for security ("Invalid credentials")
- No indication whether username or password is wrong
- Rate limiting to prevent brute force (optional for v1.0)

#### 4.1.3 User Logout
**Functionality:**
- Logout button in navigation (when logged in)
- Destroys user session
- Redirect to homepage or login page

**Success Criteria:**
- Session destroyed on server
- User cannot access protected pages
- Confirmation message displayed

#### 4.1.4 Session Management
**Functionality:**
- Server-side session storage
- Session timeout after inactivity (e.g., 24 hours)
- Session validation on each request
- Secure session cookies

**Business Rules:**
- Session expires after 24 hours of inactivity
- "Remember me" extends to 30 days
- Secure and httpOnly cookie flags
- Session regeneration after login (prevent fixation)

### 4.2 Forum Structure

#### 4.2.1 Categories
**Functionality:**
- Display list of forum categories
- Show category name and description
- Display thread count per category
- Order categories by display_order field

**View Requirements:**
- Categories displayed on homepage
- Click category to view its threads
- Show last activity timestamp (optional for v1.0)

**Business Rules:**
- Categories are pre-created by admin/system
- Users cannot create categories (v1.0 limitation)
- Empty categories are still displayed

#### 4.2.2 Thread Listing
**Functionality:**
- Display threads within a category
- Show thread title, author, creation date
- Show post count per thread
- Show last activity timestamp
- Pagination (e.g., 20 threads per page)

**View Requirements:**
- Threads sorted by last activity (most recent first)
- Click thread title to view posts
- Show thread author username
- Display "by [username] on [date]"
- Pagination controls at bottom

**Business Rules:**
- Only threads in selected category shown
- Deleted threads not displayed
- Pinned threads at top (if implemented)

#### 4.2.3 Post Display
**Functionality:**
- Display all posts in a thread
- Show post author, content, timestamp
- First post highlighted as original post
- Pagination (e.g., 10-20 posts per page)
- Display edit indicator if post was edited

**View Requirements:**
- Posts sorted chronologically (oldest first)
- Post author info on left or top
- Post content with preserved formatting
- Edit timestamp if applicable
- Pagination controls

**Business Rules:**
- All posts in thread displayed (no filtering)
- Deleted posts show "[deleted]" placeholder OR removed entirely (TBD)
- User must be logged in to see "Reply" button

### 4.3 CRUD Operations

#### 4.3.1 Create Thread
**Access:** Logged-in users only

**Functionality:**
- "New Thread" button in category view
- Form with fields: title, content (first post)
- Server-side validation
- Slug generation from title
- Automatic first post creation

**Business Rules:**
- Title: 1-255 characters, required
- Content: Minimum 10 characters, required
- Slug: Auto-generated, URL-friendly, unique within category
- Thread creator is first post author
- Thread updated_at set to creation time

**Success Criteria:**
- Thread created in database
- First post created and linked
- User redirected to new thread
- Success message displayed

**Error Handling:**
- Validation errors displayed inline
- Form data preserved on error
- Duplicate slug handled with numeric suffix

#### 4.3.2 Read Thread/Posts
**Access:** All users (including guests)

**Functionality:**
- View thread and all its posts
- Navigate between pages if paginated
- View user profiles by clicking username (optional)

**Business Rules:**
- No login required for reading
- Thread view increments view counter (optional for v1.0)
- Posts displayed in chronological order

#### 4.3.3 Create Post (Reply)
**Access:** Logged-in users only

**Functionality:**
- "Reply" button or form at bottom of thread
- Text area for post content
- Preview function (optional for v1.0)
- Server-side validation

**Business Rules:**
- Content: Minimum 1 character, required
- Post linked to current thread and user
- Thread updated_at timestamp updated
- User cannot post to locked threads (if locking implemented)

**Success Criteria:**
- Post created in database
- Page reloads or scrolls to new post
- Success message or highlight new post
- Thread bumped to top of category listing

**Error Handling:**
- Validation errors displayed
- Content preserved on error
- Check thread still exists and not locked

#### 4.3.4 Update Post
**Access:** Post author only

**Functionality:**
- "Edit" button on user's own posts
- Pre-filled form with current content
- Save changes with validation
- Track edit timestamp

**Business Rules:**
- Only post author can edit
- Thread title editable only by thread creator (and only the first post's content is the thread description)
- Edit time limit: None for v1.0 (can edit anytime)
- edited_at timestamp updated on save

**Success Criteria:**
- Post content updated in database
- edited_at timestamp set
- Edit indicator displayed ("Edited on [date]")
- User redirected to post location

**Error Handling:**
- Validation errors displayed
- Check user still owns post
- Content preserved on error

#### 4.3.5 Delete Post
**Access:** Post author only

**Functionality:**
- "Delete" button on user's own posts
- Confirmation prompt ("Are you sure?")
- Soft delete or hard delete (to be decided)

**Business Rules:**
- Only post author can delete
- Cannot delete first post without deleting entire thread
- Deleting thread deletes all posts (cascade)
- Confirmation required

**Success Criteria:**
- Post removed from database (or marked deleted)
- User redirected to thread or category
- Success message displayed
- Post count updated

**Error Handling:**
- Prevent deleting first post if other posts exist
- Confirmation before deletion
- Check user still owns post

#### 4.3.6 Delete Thread
**Access:** Thread creator only

**Functionality:**
- "Delete Thread" button for thread creator
- Confirmation prompt with warning about all posts
- Cascade delete all posts

**Business Rules:**
- Only thread creator can delete
- All posts in thread are deleted (cascade)
- Category thread count updated
- Confirmation required

**Success Criteria:**
- Thread and all posts deleted
- User redirected to category
- Success message displayed

**Error Handling:**
- Strong confirmation ("This will delete all posts")
- Check user still owns thread
- Handle foreign key constraints properly

### 4.4 User Profile

#### 4.4.1 View Profile
**Access:** All users

**Functionality:**
- View user profile page
- Display username, display name, join date
- List recent posts by user (paginated)
- List recent threads created by user (paginated)
- Show total post count and thread count

**Business Rules:**
- Public profile viewable by all
- Shows only public information
- Links to user's content

#### 4.4.2 Edit Profile
**Access:** Profile owner only

**Functionality:**
- Edit display name
- Change email address
- Change password
- Form validation

**Business Rules:**
- Username cannot be changed (v1.0 limitation)
- Email must be unique
- Password change requires current password
- New password must meet requirements

**Success Criteria:**
- Profile updated in database
- Success message displayed
- User remains logged in

**Error Handling:**
- Validation errors displayed
- Email uniqueness checked
- Current password verification for password change

## 5. Non-Functional Requirements

### 5.1 Performance

**Response Time:**
- Page load time: < 2 seconds on average connection
- Form submission: < 1 second for success response
- Database queries: < 500ms per query

**Scalability:**
- Support at least 100 concurrent users
- Handle up to 10,000 threads
- Handle up to 100,000 posts
- Pagination prevents large data retrieval

**Resource Usage:**
- Optimize database queries (use indexes)
- Implement query result caching where appropriate
- Minimize JavaScript bundle size

### 5.2 Security

**Authentication Security:**
- Passwords hashed with bcrypt (cost factor 10-12)
- Secure session cookies (httpOnly, secure flags)
- Session regeneration after login
- CSRF protection on all forms
- Input sanitization to prevent XSS

**Data Security:**
- SQL injection prevention (use parameterized queries/ORM)
- Validate all user inputs server-side
- Escape output to prevent XSS
- HTTPS in production (enforce)
- Secure password reset mechanism (optional for v1.0)

**Authorization:**
- Verify user authentication before write operations
- Check resource ownership before edit/delete
- Prevent access to other users' edit forms
- No privilege escalation vulnerabilities

### 5.3 Usability

**User Interface:**
- Clean, uncluttered design
- Intuitive navigation
- Clear visual hierarchy
- Readable typography (minimum 14px body text)
- Adequate color contrast (WCAG AA minimum)

**Responsive Design:**
- Mobile-friendly layout (responsive breakpoints)
- Touch-friendly buttons (minimum 44x44px)
- Readable on screens from 320px to 1920px wide
- No horizontal scrolling on mobile

**Accessibility:**
- Semantic HTML structure
- Proper heading hierarchy (h1-h6)
- Alt text for images (if any)
- Keyboard navigation support
- Form labels properly associated
- ARIA labels where appropriate

**User Feedback:**
- Success messages for actions
- Clear error messages
- Loading indicators for slow operations
- Form validation feedback
- Confirmation prompts for destructive actions

### 5.4 Reliability

**Availability:**
- Target 99% uptime (reasonable for v1.0)
- Graceful error handling
- Database connection retry logic

**Data Integrity:**
- Database transactions for multi-step operations
- Foreign key constraints enforced
- Data validation at database level
- Regular backups (deployment dependent)

**Error Handling:**
- User-friendly error pages (404, 500, etc.)
- Errors logged to server log file
- No sensitive information in error messages
- Fallback mechanisms for non-critical features

### 5.5 Maintainability

**Code Quality:**
- Clear, consistent naming conventions
- Modular code structure (MVC or similar)
- Comments for complex logic
- DRY principle (Don't Repeat Yourself)
- Consistent code formatting

**Documentation:**
- README with setup instructions
- API documentation (if applicable)
- Database schema documentation
- Deployment guide
- Development environment setup guide

**Testing:**
- Unit tests for critical functions (authentication, authorization)
- Integration tests for main workflows (optional for v1.0)
- Manual testing checklist
- Test data generation scripts

## 6. User Interface Specifications

### 6.1 Page Structure

#### 6.1.1 Common Elements (All Pages)

**Header:**
- Site logo/name (links to homepage)
- Navigation menu
  - Home
  - Categories (if not on home)
  - Profile (if logged in)
- User section
  - If logged out: "Login" | "Register" links
  - If logged in: "Welcome, [username]" | "Logout"

**Footer:**
- Copyright notice
- Links: About, Terms, Privacy (optional for v1.0)
- Powered by information (optional)

**Main Content Area:**
- Breadcrumb navigation
- Page title
- Content area
- Action buttons (contextual)

#### 6.1.2 Homepage/Category List
**URL:** `/`

**Content:**
- Page title: "Forum Categories" or site name
- List of categories:
  - Category name (linked)
  - Category description
  - Thread count
  - Optional: Last post info
- Call-to-action for guests to register

**Actions:**
- Click category to view threads
- Login/Register (if not logged in)

#### 6.1.3 Thread Listing Page
**URL:** `/category/{slug}` or `/category/{id}`

**Content:**
- Breadcrumb: Home > Category Name
- Page title: Category Name
- Category description
- "New Thread" button (if logged in)
- Thread list:
  - Thread title (linked)
  - Author username
  - Created date
  - Post count
  - Last activity date
- Pagination controls

**Actions:**
- Click thread to view posts
- Click "New Thread" to create thread
- Navigate pages

#### 6.1.4 Thread View / Posts Page
**URL:** `/thread/{slug}` or `/thread/{id}`

**Content:**
- Breadcrumb: Home > Category > Thread Title
- Thread title as page heading
- List of posts:
  - Post author info (username, join date, post count)
  - Post content
  - Post timestamp
  - Edit/Delete buttons (if user owns post)
  - "Edited on [date]" indicator if edited
- Reply form at bottom (if logged in)
- Pagination controls

**Actions:**
- Reply to thread (if logged in)
- Edit post (if owner)
- Delete post (if owner)
- Delete thread (if creator, with confirmation)

#### 6.1.5 New Thread Page
**URL:** `/category/{slug}/new-thread`

**Access:** Logged-in users only

**Content:**
- Breadcrumb: Home > Category > New Thread
- Page title: "Create New Thread"
- Form:
  - Thread title field (text input)
  - Post content field (textarea)
  - Submit button
  - Cancel button
- Preview area (optional)

**Actions:**
- Submit form to create thread
- Cancel returns to category

#### 6.1.6 User Profile Page
**URL:** `/user/{username}` or `/profile/{id}`

**Content:**
- Page title: Username's Profile
- User information:
  - Username
  - Display name
  - Member since date
  - Total posts count
  - Total threads count
- Recent activity:
  - Recent posts (5-10, paginated)
  - Recent threads (5-10, paginated)
- "Edit Profile" button (if viewing own profile)

**Actions:**
- View user's posts/threads
- Edit profile (if own profile)

#### 6.1.7 Edit Profile Page
**URL:** `/profile/edit`

**Access:** Logged-in users (own profile only)

**Content:**
- Page title: "Edit Profile"
- Form:
  - Display name field
  - Email field
  - Current password field (for email/password change)
  - New password field (optional)
  - Confirm new password field (optional)
  - Save button
  - Cancel button

**Actions:**
- Save profile changes
- Cancel returns to profile

#### 6.1.8 Registration Page
**URL:** `/register`

**Content:**
- Page title: "Register"
- Registration form:
  - Username field
  - Email field
  - Password field (with strength indicator optional)
  - Confirm password field
  - Register button
  - Link to login page
- Terms/Privacy acceptance checkbox (optional)

**Actions:**
- Submit registration
- Navigate to login

#### 6.1.9 Login Page
**URL:** `/login`

**Content:**
- Page title: "Login"
- Login form:
  - Username/Email field
  - Password field
  - "Remember me" checkbox (optional)
  - Login button
  - Link to registration page
  - Link to password reset (optional for v1.0)

**Actions:**
- Submit login
- Navigate to registration

### 6.2 Visual Design Guidelines

**Color Scheme:**
- Primary color for links and buttons
- Secondary color for accents
- Neutral colors for text and backgrounds
- Success/error/warning colors for feedback
- Good contrast ratios for readability

**Typography:**
- Clear, readable font family (system fonts or web-safe)
- Consistent font sizes
- Appropriate line height (1.5-1.6 for body text)
- Bold for emphasis, not underline (except links)

**Spacing:**
- Consistent padding and margins
- Whitespace for visual breathing room
- Clear separation between sections
- Alignment and grid structure

**Forms:**
- Clear labels above or beside fields
- Placeholder text for guidance
- Validation feedback inline
- Required field indicators
- Adequate field sizes

**Buttons:**
- Clear, action-oriented labels ("Create Thread" not "Submit")
- Primary vs. secondary button styling
- Disabled state for invalid forms
- Hover and active states
- Adequate size for touch targets

### 6.3 Responsive Breakpoints

**Mobile (< 768px):**
- Single column layout
- Hamburger menu for navigation
- Stacked form fields
- Full-width buttons
- Reduced spacing

**Tablet (768px - 1024px):**
- Two column layout where appropriate
- Standard navigation
- Optimized spacing

**Desktop (> 1024px):**
- Multi-column layout
- Maximum content width (e.g., 1200px)
- Optimal spacing and typography

## 7. Security Specifications

### 7.1 Authentication Security

**Password Requirements:**
- Minimum 8 characters
- No maximum length (within reason, e.g., 128 chars)
- No complexity requirements for v1.0 (but recommended)
- Stored as bcrypt hash (cost factor 10-12)

**Session Security:**
- Server-side session storage
- Secure session cookies (httpOnly, secure, sameSite)
- Session regeneration after login
- Session expiration after inactivity
- Session validation on each request

**Login Protection:**
- Generic error messages ("Invalid credentials")
- Rate limiting (optional for v1.0, recommended)
- No user enumeration through error messages
- Account lockout after failed attempts (optional for v1.0)

### 7.2 Input Validation

**Server-Side Validation:**
- All user inputs validated on server
- Client-side validation for UX only (not security)
- Whitelist approach where possible
- Length limits enforced
- Type checking (email format, etc.)

**Sanitization:**
- HTML special characters escaped in output
- SQL injection prevention via parameterized queries
- No eval() or similar dangerous functions
- File upload validation (if implemented later)

**Content Security:**
- XSS prevention through output encoding
- Content-Security-Policy headers (optional for v1.0)
- No inline JavaScript in user content
- Markdown parser if markdown supported (safe mode)

### 7.3 Authorization

**Access Control:**
- Authentication required for create/update/delete operations
- Resource ownership verified before edit/delete
- No direct object reference vulnerabilities
- Privilege checks on server side

**CSRF Protection:**
- CSRF tokens on all forms
- Verify tokens on form submission
- Framework's built-in CSRF protection enabled

### 7.4 Data Protection

**Database Security:**
- Parameterized queries or ORM
- Principle of least privilege for database user
- No sensitive data in logs
- Database connection credentials in environment variables

**HTTPS:**
- Required for production deployment
- Redirect HTTP to HTTPS
- Secure flag on cookies
- HSTS header (optional for v1.0)

**Privacy:**
- Minimal data collection
- No sharing of user data
- Clear privacy policy (optional for v1.0)
- User data export/deletion (optional for v1.0, GDPR consideration)

## 8. API Specifications (If Applicable)

**Note:** For v1.0, a traditional server-rendered application is recommended for simplicity. If a REST API is implemented, follow these guidelines:

### 8.1 Endpoints

**Authentication:**
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/logout` - Logout user
- GET `/api/auth/session` - Check session status

**Categories:**
- GET `/api/categories` - List all categories
- GET `/api/categories/{id}` - Get category details

**Threads:**
- GET `/api/categories/{id}/threads` - List threads in category
- GET `/api/threads/{id}` - Get thread details
- POST `/api/categories/{id}/threads` - Create new thread
- PUT `/api/threads/{id}` - Update thread (title)
- DELETE `/api/threads/{id}` - Delete thread

**Posts:**
- GET `/api/threads/{id}/posts` - List posts in thread
- GET `/api/posts/{id}` - Get post details
- POST `/api/threads/{id}/posts` - Create post (reply)
- PUT `/api/posts/{id}` - Update post
- DELETE `/api/posts/{id}` - Delete post

**Users:**
- GET `/api/users/{id}` - Get user profile
- PUT `/api/users/{id}` - Update user profile
- GET `/api/users/{id}/posts` - Get user's posts
- GET `/api/users/{id}/threads` - Get user's threads

### 8.2 Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Resource data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### 8.3 Status Codes
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (not logged in)
- 403: Forbidden (not authorized)
- 404: Not Found
- 500: Internal Server Error

## 9. Testing Requirements

### 9.1 Unit Testing

**Priority Test Cases:**
- Password hashing and verification
- User authentication logic
- Authorization checks (ownership verification)
- Input validation functions
- Slug generation
- Timestamp handling

**Coverage Goal:** Minimum 70% code coverage for critical functions

### 9.2 Integration Testing

**Priority Test Flows:**
- User registration → login → create thread → create post → logout
- User edits own post
- User deletes own post
- User tries to edit/delete others' content (should fail)
- Guest tries to create content (should redirect to login)

### 9.3 Manual Testing Checklist

**Authentication:**
- [ ] Register with valid data
- [ ] Register with duplicate username
- [ ] Register with duplicate email
- [ ] Register with weak password
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout successfully
- [ ] Session persists across page reloads
- [ ] Session expires after timeout

**Forum Operations:**
- [ ] View categories as guest
- [ ] View thread listing as guest
- [ ] View posts as guest
- [ ] Create thread as logged-in user
- [ ] Reply to thread as logged-in user
- [ ] Edit own post
- [ ] Delete own post
- [ ] Delete own thread
- [ ] Cannot edit others' posts
- [ ] Cannot delete others' posts

**User Interface:**
- [ ] Responsive on mobile (320px wide)
- [ ] Responsive on tablet (768px wide)
- [ ] Responsive on desktop (1920px wide)
- [ ] Navigation works correctly
- [ ] Forms validate properly
- [ ] Error messages display
- [ ] Success messages display
- [ ] Pagination works

**Security:**
- [ ] Passwords are hashed in database
- [ ] CSRF protection works
- [ ] XSS attempts are escaped
- [ ] SQL injection attempts are blocked
- [ ] Unauthorized access is prevented
- [ ] Sessions are secure

### 9.4 Performance Testing

**Load Testing:**
- Test with 50 concurrent users (minimum)
- Monitor response times
- Check database query performance
- Verify pagination prevents timeouts

**Stress Testing:**
- Test with long thread (1000+ posts)
- Test with long post content
- Test with special characters in content

## 10. Deployment Specifications

### 10.1 Environment Configuration

**Environment Variables:**
```
# Application
APP_ENV=production
APP_URL=https://educard.example.com
APP_PORT=3000
SECRET_KEY=<random-secret-key>

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=educard_production
DB_USER=educard_user
DB_PASSWORD=<secure-password>

# Session
SESSION_SECRET=<random-session-secret>
SESSION_TIMEOUT=86400

# Security
BCRYPT_ROUNDS=12
HTTPS_ONLY=true
```

### 10.2 Production Requirements

**Server Requirements:**
- Operating System: Linux (Ubuntu 20.04+ or similar)
- RAM: Minimum 1GB, recommended 2GB
- Storage: Minimum 10GB
- Node.js/Python/PHP (based on chosen stack)
- PostgreSQL or MySQL database
- Web server: Nginx or Apache (reverse proxy)

**Services:**
- Application server (PM2, systemd, or similar)
- Database server
- Web server (reverse proxy)
- SSL/TLS certificate (Let's Encrypt)

**Monitoring:**
- Application logs
- Error logs
- Access logs
- Database logs
- Uptime monitoring (optional for v1.0)

### 10.3 Backup Strategy

**Database Backups:**
- Daily automated backups
- Retain 7 days of backups
- Off-site backup storage (recommended)
- Test restore procedure

**Application Backups:**
- Version control (Git) for code
- Configuration backups
- User-uploaded content backups (if applicable)

### 10.4 Deployment Process

**Steps:**
1. Run tests (automated if available)
2. Build application (if needed)
3. Backup current database
4. Run database migrations
5. Deploy new code
6. Restart application server
7. Verify deployment
8. Monitor for errors

**Rollback Plan:**
- Keep previous version deployable
- Restore database backup if needed
- Documented rollback procedure

## 11. Success Criteria

### 11.1 Functional Completeness

**Must Have (All Required):**
- ✅ User registration works correctly
- ✅ User login/logout works correctly
- ✅ Users can create threads
- ✅ Users can reply to threads
- ✅ Users can edit their own posts
- ✅ Users can delete their own posts
- ✅ Users can delete their own threads
- ✅ Categories display correctly
- ✅ Thread listing displays correctly
- ✅ Post display works correctly
- ✅ User profiles display correctly
- ✅ Navigation works intuitively

### 11.2 Quality Metrics

**Performance:**
- ✅ Page load time < 2 seconds
- ✅ Form submissions < 1 second
- ✅ Database queries < 500ms
- ✅ Works with 100 concurrent users

**Security:**
- ✅ Passwords properly hashed
- ✅ XSS protection implemented
- ✅ SQL injection prevented
- ✅ CSRF protection enabled
- ✅ Authorization checks work
- ✅ HTTPS enforced in production

**Usability:**
- ✅ Mobile-friendly (responsive)
- ✅ Intuitive navigation
- ✅ Clear error messages
- ✅ Success feedback provided
- ✅ Keyboard accessible

**Code Quality:**
- ✅ Code follows style guide
- ✅ Critical functions have tests
- ✅ Documentation complete
- ✅ No critical bugs
- ✅ Maintainable structure

### 11.3 Acceptance Criteria

**User Acceptance:**
- A new user can register, create a thread, and reply within 5 minutes
- Navigation is intuitive without instructions
- Error messages are clear and helpful
- The forum feels fast and responsive
- Mobile experience is usable

**Technical Acceptance:**
- All automated tests pass
- Manual testing checklist complete
- Security audit passed (basic)
- Performance benchmarks met
- Documentation complete

## 12. Out of Scope (Not in v1.0)

**Explicitly Excluded Features:**
- Private messaging between users
- File/image uploads
- Rich text editor (WYSIWYG)
- User avatars
- Signature functionality
- User reputation/karma system
- Vote/like system for posts
- Moderator roles and permissions
- Admin dashboard
- Thread/post search functionality
- Email notifications
- User mentions (@username)
- Thread subscription/watching
- Real-time updates (WebSockets)
- Multi-language support
- Social media integration
- Analytics and reporting
- Thread tagging/labeling
- Advanced BB code or markdown
- User blocking/ignoring
- Report abuse functionality

**May Be Considered for v2.0:**
- Basic search functionality
- Email notifications
- User avatars
- Moderator roles
- Report abuse system
- Thread locking/pinning (UI for admins)
- Better formatting support

## 13. Migration and Versioning

### 13.1 Version Numbering
- v1.0.0 - Initial release (this specification)
- Follow semantic versioning (MAJOR.MINOR.PATCH)

### 13.2 Future Compatibility
- Database schema designed for extension
- Code structure modular for feature additions
- API versioning if REST API implemented
- Configuration externalized for flexibility

## 14. Assumptions and Dependencies

### 14.1 Assumptions
- Users have modern browsers (last 2 versions of major browsers)
- Users have JavaScript enabled
- Users have stable internet connection
- Educational context (generally respectful users)
- English language only for v1.0
- Single timezone (UTC) for timestamps

### 14.2 Dependencies
- Database server (PostgreSQL or MySQL)
- Web hosting or VPS
- Domain name (for production)
- SSL certificate
- Email service (if password reset implemented)
- Version control (Git)
- Development environment setup

### 14.3 Constraints
- Budget constraints (use free/open-source tools)
- Time constraints (prioritize MVP features)
- Resource constraints (optimize for smaller servers)
- Skill constraints (choose familiar technologies)

## 15. Glossary

**Terms:**
- **Thread**: A discussion topic containing multiple posts
- **Post**: A single message/reply within a thread
- **Category**: A grouping of related threads
- **Slug**: URL-friendly identifier (e.g., "my-first-thread")
- **CRUD**: Create, Read, Update, Delete operations
- **3-Tier Architecture**: Presentation, Application, and Data layers
- **Session**: Server-side storage of user login state
- **Hash**: One-way encryption of passwords
- **CSRF**: Cross-Site Request Forgery attack
- **XSS**: Cross-Site Scripting attack
- **ORM**: Object-Relational Mapping (database abstraction)

## 16. Approval and Sign-off

**Document Status:** Ready for Review

**Approval Required From:**
- [ ] Project Owner
- [ ] Lead Developer
- [ ] Security Reviewer (if applicable)

**Approval Date:** _________________

**Next Steps:**
1. Review and approve this specification
2. Create Implementation Plan (30-plan.md)
3. Break down into tasks (40-tasks.md)
4. Begin development

---

**Document Version:** 1.0  
**Last Updated:** November 13, 2025  
**Status:** Active - Ready for Implementation Planning  
**Next Review:** Upon completion of implementation or significant scope change
