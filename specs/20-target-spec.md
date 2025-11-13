# Target State Specification

## Document Information

**Version:** 1.0.0  
**Date:** November 13, 2025  
**Status:** Active Specification  
**Related Documents:** 
- [00-constitution.md](./00-constitution.md)
- [10-current-state-spec.md](./10-current-state-spec.md)

## Overview

This document defines the target state for the Educard Web Forum v1.0. It describes in detail what the system should do, how it should behave, and what quality attributes it must possess. This serves as the authoritative reference for all implementation work.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                          │
│                    (React/Vue Frontend)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                       │
│                    (Docker Container)                        │
└──────────┬────────────────────────────┬─────────────────────┘
           │                            │
           ↓                            ↓
┌──────────────────────┐    ┌──────────────────────┐
│   Frontend Server    │    │    Backend API       │
│  (Static Files)      │    │  (Node.js/Python)    │
│  Docker Container    │    │  Docker Container    │
└──────────────────────┘    └──────────┬───────────┘
                                       │
                            ┌──────────┴──────────┐
                            ↓                     ↓
                 ┌──────────────────┐  ┌─────────────────┐
                 │   PostgreSQL     │  │     Redis       │
                 │     Database     │  │  (Cache/Session)│
                 │ Docker Container │  │ Docker Container│
                 └──────────────────┘  └─────────────────┘
```

### Container Architecture

**Five Docker Containers:**

1. **nginx** - Reverse proxy and static file serving
2. **frontend** - Frontend application build/serve
3. **backend** - REST API server
4. **postgres** - PostgreSQL database
5. **redis** - Caching and session storage (optional for v1.0)

**Docker Compose Orchestration:**
- All containers defined in `docker-compose.yml`
- Environment-based configuration (`.env` files)
- Named volumes for data persistence
- Internal network for container communication
- Port mapping for external access

## Technology Stack Decisions

### Frontend
- **Framework:** React 18+ with Hooks
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **State Management:** React Context API + useReducer
- **HTTP Client:** Axios
- **Markdown:** react-markdown with syntax highlighting
- **Form Validation:** React Hook Form + Zod
- **Routing:** React Router v6

### Backend
- **Framework:** Node.js with Express
- **Language:** TypeScript
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Zod
- **Password Hashing:** bcrypt
- **API Documentation:** Swagger/OpenAPI
- **Rate Limiting:** express-rate-limit
- **CORS:** cors middleware

### Database
- **Primary Database:** PostgreSQL 15+
- **Caching/Sessions:** Redis 7+ (optional)
- **Migration Tool:** Prisma Migrate

### DevOps
- **Containerization:** Docker 24+
- **Orchestration:** Docker Compose v2
- **Reverse Proxy:** Nginx 1.25+
- **Environment Config:** dotenv

### Development Tools
- **Version Control:** Git
- **Code Quality:** ESLint, Prettier
- **Testing:** Jest (backend), Vitest (frontend), Supertest (API)
- **API Testing:** Postman/Insomnia collections

## Feature Specifications

### 1. User Authentication & Authorization

#### 1.1 User Registration
**Description:** Allow new users to create accounts

**Acceptance Criteria:**
- User provides: username, email, password, display name
- Username must be unique (3-20 characters, alphanumeric + underscore)
- Email must be valid and unique
- Password minimum 8 characters (must include uppercase, lowercase, number)
- Email verification required before full access
- Verification link expires after 24 hours
- Terms of service acceptance required

**API Endpoint:**
```
POST /api/auth/register
Request Body: {
  username: string,
  email: string,
  password: string,
  displayName: string,
  acceptedTerms: boolean
}
Response: {
  message: string,
  userId: string
}
```

**UI Requirements:**
- Registration form with validation
- Password strength indicator
- Terms checkbox
- Success message with email verification prompt

#### 1.2 User Login
**Description:** Allow registered users to authenticate

**Acceptance Criteria:**
- Login with username/email + password
- Returns JWT access token (expires 1 hour)
- Returns refresh token (expires 7 days)
- Failed login attempts rate limited (5 attempts per 15 minutes)
- Account locked after 10 failed attempts in 1 hour
- "Remember me" option for extended sessions

**API Endpoint:**
```
POST /api/auth/login
Request Body: {
  usernameOrEmail: string,
  password: string,
  rememberMe: boolean
}
Response: {
  accessToken: string,
  refreshToken: string,
  user: UserProfile
}
```

**UI Requirements:**
- Login form with validation
- "Forgot password" link
- "Remember me" checkbox
- Error messages for invalid credentials
- Loading state during authentication

#### 1.3 Password Reset
**Description:** Allow users to reset forgotten passwords

**Acceptance Criteria:**
- User requests reset via email
- Reset link sent with token (expires 1 hour)
- Token single-use only
- New password must meet strength requirements
- User logged out of all sessions after reset

**API Endpoints:**
```
POST /api/auth/forgot-password
Request Body: { email: string }

POST /api/auth/reset-password
Request Body: { token: string, newPassword: string }
```

#### 1.4 Authorization Roles
**Roles:**
- **Guest** - Can view public content only
- **User** - Can create threads/posts, edit own content
- **Moderator** - Can edit/delete any content, ban users
- **Admin** - Full system access, user role management

### 2. User Profiles

#### 2.1 Profile View
**Description:** Display user information and activity

**Acceptance Criteria:**
- Shows: display name, username, join date, post count, avatar
- Shows: bio (500 character limit, markdown supported)
- Shows: recent posts (paginated, 10 per page)
- Shows: recent threads created
- Public profiles visible to all users
- Private data (email) only visible to owner

**API Endpoint:**
```
GET /api/users/:username
Response: {
  username: string,
  displayName: string,
  bio: string,
  avatarUrl: string,
  joinDate: string,
  postCount: number,
  threadCount: number,
  role: string,
  recentPosts: Post[],
  recentThreads: Thread[]
}
```

**UI Requirements:**
- Profile header with avatar and stats
- Bio section with markdown rendering
- Tabbed interface (Posts, Threads, About)
- Edit button visible to profile owner
- Pagination for post/thread lists

#### 2.2 Profile Editing
**Description:** Allow users to update their profiles

**Acceptance Criteria:**
- Can update: display name, bio, avatar
- Avatar upload (max 2MB, JPG/PNG only)
- Image resized to 200x200 automatically
- Bio supports markdown preview
- Changes saved with confirmation

**API Endpoint:**
```
PATCH /api/users/me
Request Body: {
  displayName?: string,
  bio?: string,
  avatar?: File
}
```

### 3. Category Management

#### 3.1 Forum Categories
**Description:** Organize threads into categories

**Acceptance Criteria:**
- Categories display on homepage
- Each category shows: name, description, icon, thread count, latest post
- Categories ordered by admin-defined position
- Clicking category shows threads in that category

**Data Model:**
```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // emoji or icon name
  position: number;
  threadCount: number;
  postCount: number;
  latestPost?: {
    id: string;
    threadTitle: string;
    author: string;
    createdAt: string;
  };
}
```

**API Endpoint:**
```
GET /api/categories
Response: Category[]
```

**UI Requirements:**
- Grid or list layout of categories
- Visual icons for each category
- Thread/post counts displayed
- Latest activity snippet
- Responsive design

#### 3.2 Category Administration
**Description:** Admin/moderators can manage categories

**Acceptance Criteria:**
- Create new categories
- Edit existing categories
- Reorder categories
- Delete empty categories only
- Cannot delete categories with threads

**API Endpoints:**
```
POST /api/admin/categories (Admin only)
PATCH /api/admin/categories/:id (Admin only)
DELETE /api/admin/categories/:id (Admin only)
```

### 4. Thread Management

#### 4.1 Thread Creation
**Description:** Users create new discussion threads

**Acceptance Criteria:**
- User selects category
- Provides title (10-150 characters)
- Provides initial post content (min 20 characters, markdown supported)
- Can add tags (3-5 tags, optional)
- Thread immediately published
- Creator receives notifications for replies

**API Endpoint:**
```
POST /api/threads
Request Body: {
  categoryId: string,
  title: string,
  content: string,
  tags?: string[]
}
Response: {
  threadId: string,
  slug: string
}
```

**UI Requirements:**
- Thread creation form
- Category dropdown selector
- Title input with character count
- Markdown editor with preview
- Tag input with autocomplete
- "Create Thread" button
- Validation errors displayed inline

#### 4.2 Thread Listing
**Description:** Display threads in a category or search results

**Acceptance Criteria:**
- Shows threads with: title, author, post count, view count, last activity
- Paginated (20 threads per page)
- Sort options: newest, oldest, most replies, most views
- Pinned threads always at top
- Locked threads indicated visually
- Hot/trending indicator for active threads

**API Endpoint:**
```
GET /api/threads?categoryId=&page=&sort=
Response: {
  threads: Thread[],
  totalCount: number,
  currentPage: number,
  totalPages: number
}
```

**Data Model:**
```typescript
interface Thread {
  id: string;
  slug: string;
  title: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  postCount: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  lastActivity: {
    postId: string;
    author: string;
    timestamp: string;
  };
  tags: string[];
}
```

**UI Requirements:**
- List view of threads
- Sort dropdown
- Pagination controls
- Visual indicators (pinned, locked, hot)
- Click thread to view full discussion
- Mobile-responsive table/cards

#### 4.3 Thread Viewing
**Description:** Display full thread with all posts

**Acceptance Criteria:**
- Shows thread title, author, tags, post count
- Shows all posts in chronological order
- Paginated (15 posts per page)
- View counter increments (once per user per session)
- Quick reply box at bottom
- Share thread button (copy link)
- Subscribe/unsubscribe to thread notifications

**API Endpoint:**
```
GET /api/threads/:slug?page=
Response: {
  thread: ThreadDetails,
  posts: Post[],
  totalPages: number
}
```

**UI Requirements:**
- Thread header with metadata
- Post list with proper formatting
- Pagination between pages
- Quick reply form
- Action buttons (edit, delete for owner/mods)
- Breadcrumb navigation
- Mobile-friendly layout

#### 4.4 Thread Editing
**Description:** Authors and moderators can edit threads

**Acceptance Criteria:**
- Author can edit title and tags within 24 hours
- Author can edit first post anytime
- Moderators can edit anytime
- Edit history tracked with timestamp
- "Edited by" indicator shown
- Cannot edit locked threads (unless moderator)

**API Endpoint:**
```
PATCH /api/threads/:id
Request Body: {
  title?: string,
  tags?: string[]
}
```

#### 4.5 Thread Moderation
**Description:** Moderators can manage threads

**Acceptance Criteria:**
- Pin/unpin threads
- Lock/unlock threads (prevents new posts)
- Move threads to different category
- Delete threads (soft delete, recoverable)
- Merge duplicate threads

**API Endpoints:**
```
POST /api/threads/:id/pin (Moderator+)
POST /api/threads/:id/lock (Moderator+)
PATCH /api/threads/:id/move (Moderator+)
DELETE /api/threads/:id (Moderator+)
```

### 5. Post Management

#### 5.1 Post Creation
**Description:** Users reply to threads with posts

**Acceptance Criteria:**
- Minimum 10 characters, maximum 10,000 characters
- Markdown formatting supported
- Code syntax highlighting supported
- Can quote previous posts
- Rate limit: 5 posts per minute
- Cannot post in locked threads

**API Endpoint:**
```
POST /api/posts
Request Body: {
  threadId: string,
  content: string,
  quotedPostId?: string
}
Response: {
  postId: string,
  createdAt: string
}
```

**UI Requirements:**
- Markdown editor with toolbar
- Preview tab
- Character counter
- Quote button on posts
- Submit button with loading state
- Error handling and display

#### 5.2 Post Display
**Description:** Render posts with formatting

**Data Model:**
```typescript
interface Post {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl: string;
    role: string;
    postCount: number;
    joinDate: string;
  };
  content: string; // markdown
  createdAt: string;
  editedAt?: string;
  editedBy?: string;
  quotedPost?: {
    id: string;
    author: string;
    excerpt: string;
  };
  isDeleted: boolean;
}
```

**UI Requirements:**
- Author sidebar with avatar and info
- Post content with markdown rendering
- Code blocks with syntax highlighting
- Quoted post display
- Timestamp with relative time
- Edit indicator if modified
- Action buttons (quote, edit, delete, report)

#### 5.3 Post Editing
**Description:** Authors can edit their posts

**Acceptance Criteria:**
- Edit own posts anytime (unless thread locked)
- Moderators can edit any post
- Edit history preserved
- "Edited at" timestamp shown
- Original content recoverable by moderators

**API Endpoint:**
```
PATCH /api/posts/:id
Request Body: {
  content: string
}
```

#### 5.4 Post Deletion
**Description:** Remove inappropriate or unwanted posts

**Acceptance Criteria:**
- Author can delete own posts within 1 hour
- Moderators can delete any post
- Soft delete (content hidden, metadata preserved)
- Shows "[Post deleted]" placeholder
- Hard delete only by admin
- Cannot delete first post in thread (must delete thread)

**API Endpoint:**
```
DELETE /api/posts/:id
```

### 6. Search Functionality

#### 6.1 Search Implementation
**Description:** Find threads and posts by keywords

**Acceptance Criteria:**
- Full-text search across thread titles and post content
- Search filters: category, author, date range, tags
- Results show: matching threads with excerpt highlights
- Paginated results (20 per page)
- Sort by: relevance, date, replies
- Minimum 3 characters to search

**API Endpoint:**
```
GET /api/search?q=&category=&author=&tags=&sort=&page=
Response: {
  results: SearchResult[],
  totalCount: number,
  currentPage: number
}
```

**Data Model:**
```typescript
interface SearchResult {
  type: 'thread' | 'post';
  id: string;
  threadId: string;
  threadTitle: string;
  excerpt: string; // with <mark> tags for highlights
  author: string;
  category: string;
  timestamp: string;
  matchScore: number;
}
```

**UI Requirements:**
- Search bar in header
- Advanced search page with filters
- Results page with highlighting
- Filter sidebar
- "No results" state with suggestions
- Loading state during search

### 7. Moderation Tools

#### 7.1 User Moderation
**Description:** Tools to manage user behavior

**Acceptance Criteria:**
- View user moderation history
- Issue warnings to users
- Temporary ban (1 day, 7 days, 30 days)
- Permanent ban
- Ban prevents login and displays message
- Unban capability
- Banned user data preserved

**API Endpoints:**
```
POST /api/moderation/warn/:userId (Moderator+)
POST /api/moderation/ban/:userId (Moderator+)
Request Body: {
  duration?: number, // days, omit for permanent
  reason: string
}
POST /api/moderation/unban/:userId (Moderator+)
```

#### 7.2 Content Reporting
**Description:** Users can report inappropriate content

**Acceptance Criteria:**
- Report button on threads and posts
- User selects reason: spam, harassment, inappropriate, other
- Optional additional details
- Reports go to moderation queue
- Moderators can review, dismiss, or take action
- Reporter notified of resolution

**API Endpoints:**
```
POST /api/reports
Request Body: {
  contentType: 'thread' | 'post',
  contentId: string,
  reason: string,
  details?: string
}

GET /api/moderation/reports (Moderator+)
PATCH /api/moderation/reports/:id (Moderator+)
```

#### 7.3 Moderation Dashboard
**Description:** Interface for moderators to manage content

**Acceptance Criteria:**
- View pending reports
- View recent moderation actions
- Quick access to ban/warn users
- Statistics: reports today, active bans, recent actions
- Filter and search reports

**UI Requirements:**
- Dashboard page (moderator/admin only)
- Reports table with actions
- User search
- Activity log
- Quick action buttons

### 8. Notification System

#### 8.1 In-App Notifications
**Description:** Notify users of activity

**Notification Types:**
- Reply to your thread
- Reply to your post (direct reply/quote)
- Mention (@username)
- Moderation action on your content
- New post in subscribed thread

**Acceptance Criteria:**
- Notification bell icon in header
- Badge shows unread count
- Dropdown shows recent 10 notifications
- "Mark all as read" option
- Link to notification source
- Notifications persist across sessions

**API Endpoints:**
```
GET /api/notifications?page=&unreadOnly=
PATCH /api/notifications/:id/read
POST /api/notifications/mark-all-read
```

**Data Model:**
```typescript
interface Notification {
  id: string;
  type: 'reply' | 'mention' | 'quote' | 'moderation';
  isRead: boolean;
  createdAt: string;
  actor: {
    username: string;
    avatarUrl: string;
  };
  content: {
    threadId: string;
    threadTitle: string;
    postId?: string;
    excerpt: string;
  };
}
```

#### 8.2 Email Notifications (Optional v1.0)
**Description:** Send email for important events

**Acceptance Criteria:**
- User can opt in/out per notification type
- Daily digest option
- Email contains: event summary, link to content, unsubscribe link
- HTML and plain text versions
- Sent asynchronously (queue)

### 9. User Settings

#### 9.1 Account Settings
**Description:** User preferences and configuration

**Settings Available:**
- Change password
- Change email (requires verification)
- Notification preferences
- Privacy settings (show/hide email)
- Theme preference (light/dark)
- Posts per page (15/25/50)
- Delete account (with confirmation)

**API Endpoint:**
```
GET /api/users/me/settings
PATCH /api/users/me/settings
Request Body: {
  emailNotifications?: boolean,
  theme?: 'light' | 'dark' | 'auto',
  postsPerPage?: number,
  showEmail?: boolean
}
```

**UI Requirements:**
- Settings page with sections
- Forms for each setting category
- Save buttons with confirmation
- Dangerous actions (delete account) require password

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(500),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  email_verified BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  ban_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

### Categories Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories(slug);
```

### Threads Table
```sql
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(150) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  view_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 1,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_threads_category ON threads(category_id);
CREATE INDEX idx_threads_author ON threads(author_id);
CREATE INDEX idx_threads_slug ON threads(slug);
CREATE INDEX idx_threads_last_activity ON threads(last_activity_at DESC);
```

### Posts Table
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  quoted_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT false,
  edited_at TIMESTAMP,
  edited_by_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_thread ON posts(thread_id);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at);
```

### Tags Table
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0
);

CREATE TABLE thread_tags (
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (thread_id, tag_id)
);

CREATE INDEX idx_thread_tags_thread ON thread_tags(thread_id);
CREATE INDEX idx_thread_tags_tag ON thread_tags(tag_id);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
```

### Reports Table
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content_type VARCHAR(10) CHECK (content_type IN ('thread', 'post')),
  content_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_content ON reports(content_type, content_id);
```

### Sessions Table (for refresh tokens)
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token);
```

## API Specification

### API Conventions

**Base URL:** `http://localhost:3000/api` (development)

**Authentication:** JWT Bearer Token
```
Authorization: Bearer <access_token>
```

**Response Format:**
```typescript
// Success
{
  success: true,
  data: any
}

// Error
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 204: No Content
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Validation Error
- 429: Too Many Requests
- 500: Internal Server Error

**Pagination:**
```typescript
{
  data: T[],
  pagination: {
    currentPage: number,
    totalPages: number,
    totalItems: number,
    itemsPerPage: number
  }
}
```

### API Endpoints Summary

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email with token

#### Users
- `GET /api/users/:username` - Get user profile
- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update current user
- `GET /api/users/me/settings` - Get user settings
- `PATCH /api/users/me/settings` - Update user settings
- `DELETE /api/users/me` - Delete account

#### Categories
- `GET /api/categories` - List all categories
- `GET /api/categories/:slug` - Get category details
- `POST /api/admin/categories` - Create category (Admin)
- `PATCH /api/admin/categories/:id` - Update category (Admin)
- `DELETE /api/admin/categories/:id` - Delete category (Admin)

#### Threads
- `GET /api/threads` - List threads (with filters)
- `GET /api/threads/:slug` - Get thread details
- `POST /api/threads` - Create thread
- `PATCH /api/threads/:id` - Update thread
- `DELETE /api/threads/:id` - Delete thread
- `POST /api/threads/:id/pin` - Pin thread (Moderator)
- `POST /api/threads/:id/lock` - Lock thread (Moderator)
- `PATCH /api/threads/:id/move` - Move thread (Moderator)
- `POST /api/threads/:id/subscribe` - Subscribe to thread
- `DELETE /api/threads/:id/subscribe` - Unsubscribe from thread

#### Posts
- `GET /api/posts` - List posts (by thread)
- `GET /api/posts/:id` - Get post details
- `POST /api/posts` - Create post
- `PATCH /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

#### Search
- `GET /api/search` - Search threads and posts
- `GET /api/search/suggestions` - Get search suggestions

#### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read

#### Moderation
- `GET /api/moderation/reports` - List reports (Moderator)
- `POST /api/reports` - Create report
- `PATCH /api/moderation/reports/:id` - Resolve report (Moderator)
- `POST /api/moderation/warn/:userId` - Warn user (Moderator)
- `POST /api/moderation/ban/:userId` - Ban user (Moderator)
- `POST /api/moderation/unban/:userId` - Unban user (Moderator)
- `GET /api/moderation/logs` - Get moderation logs (Moderator)

#### Admin
- `GET /api/admin/stats` - Get system statistics (Admin)
- `GET /api/admin/users` - List all users (Admin)
- `PATCH /api/admin/users/:id/role` - Change user role (Admin)

## UI/UX Specifications

### Design Principles
1. **Clean and Minimal** - Focus on content, reduce clutter
2. **Mobile First** - Responsive design for all screen sizes
3. **Accessible** - WCAG 2.1 Level AA compliance
4. **Fast** - Optimized loading and interactions
5. **Intuitive** - Clear navigation and actions

### Page Layout Structure

**Header:**
- Logo/site name (links to homepage)
- Search bar
- Notifications icon with badge
- User menu dropdown (or login button)

**Main Content:**
- Breadcrumb navigation
- Page title
- Content area
- Sidebar (optional, category filters/stats)

**Footer:**
- Links: About, Terms, Privacy, Contact
- Copyright notice
- Version number

### Key Pages

#### 1. Homepage
- List of categories with stats
- Recent activity feed (optional)
- Welcome message for guests
- Quick stats (users online, total threads, total posts)

#### 2. Category Page
- Category header (name, description)
- Thread list with pagination
- "New Thread" button (authenticated users)
- Sort and filter options

#### 3. Thread Page
- Thread title and metadata
- Post list with pagination
- Quick reply form at bottom
- Thread actions (edit, delete, pin, lock)
- Subscribe button

#### 4. User Profile Page
- Profile header (avatar, name, stats)
- Bio section
- Tabs: Recent Posts, Threads Created, About
- Edit profile button (own profile)

#### 5. Settings Page
- Tabbed interface
- Account settings
- Notification preferences
- Privacy settings
- Danger zone (delete account)

#### 6. Moderation Dashboard
- Pending reports table
- Quick action buttons
- Statistics cards
- Recent activity log

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Color Scheme (Suggested)
**Light Mode:**
- Primary: #3B82F6 (blue)
- Background: #FFFFFF
- Text: #1F2937 (dark gray)
- Border: #E5E7EB (light gray)
- Accent: #10B981 (green)

**Dark Mode:**
- Primary: #60A5FA (lighter blue)
- Background: #111827 (near black)
- Text: #F9FAFB (off white)
- Border: #374151 (dark gray)
- Accent: #34D399 (lighter green)

### Typography
- Headings: System font stack (system-ui, -apple-system, etc.)
- Body: Same as headings for consistency
- Code: Monospace (Consolas, Monaco, 'Courier New')
- Sizes: 14px base, scale up for headings

## Non-Functional Requirements

### Performance
- **Page Load Time:** < 3 seconds on 3G connection
- **Time to Interactive:** < 5 seconds
- **API Response Time:** < 500ms for 95th percentile
- **Database Query Time:** < 100ms for common queries
- **Concurrent Users:** Support 100+ simultaneous users
- **Search Response:** < 1 second for typical queries

### Security
- **HTTPS Only** in production
- **Password Storage:** bcrypt with salt rounds ≥ 10
- **JWT Security:** Short-lived access tokens (1 hour), HTTP-only refresh tokens
- **SQL Injection:** Prevented via parameterized queries (ORM)
- **XSS Protection:** Content sanitization, CSP headers
- **CSRF Protection:** CSRF tokens for state-changing operations
- **Rate Limiting:** Applied to auth, posting, search endpoints
- **Input Validation:** All user input validated server-side
- **File Upload:** Type and size restrictions, virus scanning (if implemented)
- **Session Management:** Secure session handling, logout invalidates tokens

### Scalability
- **Horizontal Scaling:** Stateless backend allows multiple instances
- **Database:** Connection pooling, query optimization, indexes
- **Caching:** Redis for sessions, frequently accessed data
- **Static Assets:** CDN-ready (future enhancement)
- **Background Jobs:** Queue system for emails, notifications

### Reliability
- **Uptime Target:** 99% (allows ~7 hours downtime/month for v1.0)
- **Error Handling:** Graceful degradation, meaningful error messages
- **Data Backup:** Daily automated backups with 30-day retention
- **Database Transactions:** ACID compliance for critical operations
- **Logging:** Structured logging for debugging and monitoring

### Maintainability
- **Code Quality:** ESLint/Prettier enforced, consistent style
- **Documentation:** Inline comments, API docs, README files
- **Testing:** Unit tests (70%+ coverage), integration tests for APIs
- **Version Control:** Git with meaningful commits, branching strategy
- **Dependency Management:** Regular updates, security audits

### Accessibility
- **WCAG 2.1 Level AA** compliance
- **Keyboard Navigation:** All actions accessible via keyboard
- **Screen Readers:** Proper ARIA labels, semantic HTML
- **Color Contrast:** Minimum 4.5:1 for text
- **Focus Indicators:** Visible focus states
- **Alt Text:** Images have descriptive alt attributes
- **Form Labels:** All inputs properly labeled

### Usability
- **Intuitive Navigation:** Clear paths to all features
- **Consistent UI:** Same patterns throughout application
- **Helpful Errors:** Clear error messages with guidance
- **Loading States:** Visual feedback during operations
- **Confirmation Dialogs:** For destructive actions
- **Mobile Friendly:** Touch-friendly targets (min 44x44px)

### Browser Support
- **Chrome:** Latest 2 versions
- **Firefox:** Latest 2 versions
- **Safari:** Latest 2 versions
- **Edge:** Latest 2 versions
- **Mobile:** iOS Safari, Chrome Android (latest versions)

### Localization (Future)
- **v1.0:** English only
- **Architecture:** i18n-ready structure for future multi-language support

## Docker Configuration

### Development docker-compose.yml
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - backend
      - frontend
    networks:
      - educard-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - VITE_API_URL=http://localhost:3000/api
    networks:
      - educard-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://educard:password@postgres:5432/educard
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - postgres
      - redis
    networks:
      - educard-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=educard
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=educard
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - educard-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    networks:
      - educard-network

volumes:
  postgres-data:
  redis-data:

networks:
  educard-network:
    driver: bridge
```

### Environment Variables
**Backend (.env):**
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://educard:password@postgres:5432/educard
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Educard Forum
```

## Testing Requirements

### Unit Tests
- **Backend:** 70%+ code coverage
  - Models and database operations
  - Business logic and utilities
  - Authentication and authorization
  - Input validation

- **Frontend:** 60%+ code coverage
  - Component logic
  - State management
  - Utilities and helpers
  - Form validation

### Integration Tests
- **API Endpoints:** All endpoints tested
  - Authentication flow
  - CRUD operations
  - Authorization checks
  - Error handling
  - Rate limiting

### End-to-End Tests (Optional for v1.0)
- Critical user flows:
  - User registration and login
  - Create thread and post
  - Edit and delete content
  - Moderation actions

### Test Data
- Seed scripts for development database
- Test fixtures for automated tests
- Mock data generators

## Deployment

### Development Environment
- **Setup:** `docker-compose up`
- **Database Migrations:** Run automatically on startup
- **Hot Reload:** Enabled for frontend and backend
- **Access:** http://localhost (nginx forwards to services)

### Production Considerations (Future)
- Environment-specific docker-compose files
- Secrets management (not in .env files)
- Database backups automated
- SSL/TLS certificates
- Monitoring and logging
- Health checks and auto-restart

## Success Metrics

### Technical Metrics
- ✅ All API endpoints implemented and documented
- ✅ 70%+ test coverage
- ✅ Page load < 3 seconds
- ✅ API response < 500ms (p95)
- ✅ Zero critical security vulnerabilities
- ✅ WCAG 2.1 AA compliant
- ✅ Works on all target browsers

### Feature Completeness
- ✅ User registration and authentication
- ✅ Thread and post management
- ✅ Category organization
- ✅ Search functionality
- ✅ User profiles
- ✅ Moderation tools
- ✅ Notification system
- ✅ Responsive design

### User Experience
- ✅ Intuitive navigation
- ✅ Clear error messages
- ✅ Fast interactions
- ✅ Mobile-friendly
- ✅ Accessible to all users

## Out of Scope (Post v1.0)

Features deferred to future versions:
- Real-time chat/messaging
- Direct messaging between users
- Advanced gamification (reputation, badges)
- Rich media embeds (YouTube, Twitter, etc.)
- Multi-language support
- OAuth social login
- Advanced analytics dashboard
- Export/import functionality
- API rate limiting per user
- Webhooks for integrations
- Mobile native apps
- Advanced theming/customization
- Plugin/extension system

## Constraints and Assumptions

### Constraints
- **Budget:** $0 - All open source tools
- **Team:** Small team or solo developer
- **Time:** Timeline TBD in planning phase
- **Infrastructure:** Must run on commodity hardware
- **Complexity:** Keep it simple, avoid over-engineering

### Assumptions
- Docker installed and working on development machines
- Basic understanding of web development
- PostgreSQL knowledge for database management
- Git for version control
- Modern browser usage by end users
- Reasonable hardware specs (8GB+ RAM)

## Appendix

### Glossary
- **Thread:** A discussion topic started by a user
- **Post:** A reply/message within a thread
- **Category:** A grouping for related threads
- **Tag:** A keyword label applied to threads
- **Slug:** URL-friendly identifier (e.g., "my-first-thread")
- **Markdown:** Lightweight markup language for formatting
- **JWT:** JSON Web Token for authentication
- **Rate Limiting:** Restricting request frequency to prevent abuse
- **Soft Delete:** Marking as deleted without removing from database

### References
- Docker Documentation: https://docs.docker.com/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- React Documentation: https://react.dev/
- Express Documentation: https://expressjs.com/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/

---

**Document Status:** Complete  
**Next Step:** Create implementation plan (30-plan.md)  
**Last Updated:** November 13, 2025  
**Version:** 1.0.0
