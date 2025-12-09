# Educard API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000`  
**Last Updated:** December 9, 2024

This document provides comprehensive API documentation for the Educard forum application.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Responses](#error-responses)
5. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [Forum](#forum-endpoints)
   - [Users](#user-endpoints)
   - [Notifications](#notification-endpoints)
   - [Search](#search-endpoints)
   - [Admin](#admin-endpoints)
6. [Response Format](#response-format)
7. [Examples](#examples)

---

## Overview

### API Type

Educard uses a traditional server-side rendered architecture with REST-style endpoints. Most endpoints return HTML pages, with some JSON endpoints for AJAX requests.

### Content Types

- **HTML Endpoints:** Return rendered HTML pages
- **JSON Endpoints:** Return JSON data (prefixed with `/api/`)

### Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

---

## Authentication

### Session-Based Authentication

Educard uses session-based authentication with cookies.

**Login Flow:**
1. POST to `/auth/login` with credentials
2. Session cookie set on success
3. Include cookie in subsequent requests
4. Authenticated endpoints require valid session

**Session Cookie:**
- Name: `connect.sid`
- HTTP-Only: Yes
- Secure: Yes (production)
- SameSite: Lax
- Max Age: 24 hours

### CSRF Protection

All state-changing requests (POST, PUT, DELETE) require a CSRF token.

**Getting CSRF Token:**
CSRF token is included in forms automatically via EJS templates:
```html
<input type="hidden" name="_csrf" value="<%= csrfToken %>">
```

**Including CSRF Token:**
- Forms: Include hidden input field `_csrf`
- AJAX: Include in request header `X-CSRF-Token`

---

## Rate Limiting

### Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/login` | 5 requests | 15 minutes |
| `/auth/register` | 3 requests | 1 hour |
| `/forum/*/new-thread` | 10 requests | 1 hour |
| `/*/reply` | 30 requests | 1 hour |
| `/search` | 100 requests | 1 hour |
| General | 1000 requests | 15 minutes |

### Rate Limit Headers

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1638360000
```

### Rate Limit Exceeded

**HTTP Status:** 429 Too Many Requests

**Response:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Too Many Requests</title>
</head>
<body>
    <h1>Too Many Requests</h1>
    <p>Please wait before trying again.</p>
</body>
</html>
```

---

## Error Responses

### Standard Error Pages

**404 Not Found:**
```html
<!DOCTYPE html>
<html>
<head><title>404 - Page Not Found</title></head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The page you requested could not be found.</p>
</body>
</html>
```

**403 Forbidden:**
```html
<h1>403 - Forbidden</h1>
<p>You don't have permission to access this resource.</p>
```

**500 Internal Server Error:**
```html
<h1>500 - Internal Server Error</h1>
<p>Something went wrong. Please try again later.</p>
```

### Flash Messages

Success and error messages are displayed via flash messages in the UI:
```javascript
{
  success: "Operation completed successfully",
  error: "Something went wrong"
}
```

---

## Endpoints

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`  
**Authentication:** Not required (guest only)  
**Rate Limit:** 3 requests per hour  

**Request Body (Form):**
```
username: string (required, 3-20 chars, alphanumeric)
email: string (required, valid email)
password: string (required, min 8 chars, must include uppercase, lowercase, number, special char)
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/auth/login`
- **Flash:** "Registration successful! Please log in."

**Error Response:**
- **Status:** 302 Found
- **Redirect:** `/auth/register`
- **Flash:** "Username already exists" or "Email already exists" or validation errors

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john doe&email=john@example.com&password=SecurePass123!&_csrf=TOKEN"
```

---

### Login

Authenticate a user and create a session.

**Endpoint:** `POST /auth/login`  
**Authentication:** Not required (guest only)  
**Rate Limit:** 5 requests per 15 minutes  

**Request Body (Form):**
```
username: string (required)
password: string (required)
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/` or returnTo URL
- **Set-Cookie:** `connect.sid=...`
- **Flash:** "Welcome back, username!"

**Error Response:**
- **Status:** 302 Found
- **Redirect:** `/auth/login`
- **Flash:** "Invalid credentials"

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -c cookies.txt \
  -d "username=johndoe&password=SecurePass123!&_csrf=TOKEN"
```

---

### Logout

End user session.

**Endpoint:** `POST /auth/logout` or `GET /auth/logout`  
**Authentication:** Required  

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/`
- **Flash:** "Logged out successfully"

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "_csrf=TOKEN"
```

---

## Forum Endpoints

### View Homepage

Display forum homepage with categories and recent threads.

**Endpoint:** `GET /`  
**Authentication:** Optional  

**Success Response:**
- **Status:** 200 OK
- **Content-Type:** text/html
- **Body:** HTML page with categories and threads

**Example (cURL):**
```bash
curl http://localhost:3000/
```

---

### View Category

Display threads in a specific category.

**Endpoint:** `GET /forum/category/:slug`  
**Authentication:** Optional  
**Caching:** 5 minutes  

**URL Parameters:**
- `slug`: Category slug (e.g., "computer-science")

**Query Parameters:**
- `page`: integer (optional, default: 1)
- `sort`: string (optional, values: "newest", "oldest", "popular")

**Success Response:**
- **Status:** 200 OK
- **Content-Type:** text/html
- **Body:** HTML page with thread list

**Example (cURL):**
```bash
curl http://localhost:3000/forum/category/computer-science?page=1&sort=newest
```

---

### View Thread

Display a single thread with all posts.

**Endpoint:** `GET /forum/thread/:slug`  
**Authentication:** Optional  
**Caching:** 2 minutes  

**URL Parameters:**
- `slug`: Thread slug (e.g., "how-to-learn-javascript")

**Success Response:**
- **Status:** 200 OK
- **Content-Type:** text/html
- **Body:** HTML page with thread and posts

**Example (cURL):**
```bash
curl http://localhost:3000/forum/thread/how-to-learn-javascript
```

---

### Create Thread

Create a new thread in a category.

**Endpoint:** `POST /forum/category/:slug/new-thread`  
**Authentication:** Required  
**Rate Limit:** 10 per hour  

**URL Parameters:**
- `slug`: Category slug

**Request Body (Form):**
```
title: string (required, 5-200 chars)
content: string (required, min 10 chars)
tags: string (optional, comma-separated)
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/forum/thread/{new-thread-slug}`
- **Flash:** "Thread created successfully"

**Error Response:**
- **Status:** 302 Found or 400
- **Flash:** Validation errors

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/forum/category/computer-science/new-thread \
  -b cookies.txt \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "title=How to learn JavaScript&content=I need advice on learning JS&tags=javascript,learning&_csrf=TOKEN"
```

---

### Reply to Thread

Add a post/reply to a thread.

**Endpoint:** `POST /forum/thread/:slug/reply`  
**Authentication:** Required  
**Rate Limit:** 30 per hour  

**URL Parameters:**
- `slug`: Thread slug

**Request Body (Form):**
```
content: string (required, min 5 chars)
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/forum/thread/:slug#post-{id}`
- **Flash:** "Reply posted successfully"

**Error Response:**
- **Status:** 302 Found or 400
- **Flash:** Validation errors

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/forum/thread/how-to-learn-javascript/reply \
  -b cookies.txt \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "content=Great question! I recommend FreeCodeCamp.&_csrf=TOKEN"
```

---

### Edit Post

Edit an existing post (own posts only).

**Endpoint:** `POST /forum/post/:id/edit`  
**Authentication:** Required (owner only)  

**URL Parameters:**
- `id`: Post ID

**Request Body (Form):**
```
content: string (required, min 5 chars)
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/forum/thread/:slug#post-{id}`
- **Flash:** "Post updated successfully"

**Error Response:**
- **Status:** 403 Forbidden
- **Flash:** "You can only edit your own posts"

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/forum/post/123/edit \
  -b cookies.txt \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "content=Updated content here&_csrf=TOKEN"
```

---

### Delete Post

Delete a post (own posts only).

**Endpoint:** `POST /forum/post/:id/delete`  
**Authentication:** Required (owner or admin)  

**URL Parameters:**
- `id`: Post ID

**Request Body (Form):**
```
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/forum/thread/:slug`
- **Flash:** "Post deleted successfully"

**Error Response:**
- **Status:** 403 Forbidden
- **Flash:** "You can only delete your own posts"

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/forum/post/123/delete \
  -b cookies.txt \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "_csrf=TOKEN"
```

---

### Delete Thread

Delete an entire thread (owner or admin only).

**Endpoint:** `POST /forum/thread/:slug/delete`  
**Authentication:** Required (owner or admin)  

**URL Parameters:**
- `slug`: Thread slug

**Request Body (Form):**
```
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/`
- **Flash:** "Thread deleted successfully"

**Error Response:**
- **Status:** 403 Forbidden
- **Flash:** "You can only delete your own threads"

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/forum/thread/how-to-learn-javascript/delete \
  -b cookies.txt \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "_csrf=TOKEN"
```

---

### Toggle Pin Thread

Pin or unpin a thread (admin/moderator only).

**Endpoint:** `POST /forum/thread/:slug/pin`  
**Authentication:** Required (admin/moderator)  

**URL Parameters:**
- `slug`: Thread slug

**Request Body (Form):**
```
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/forum/thread/:slug`
- **Flash:** "Thread pinned" or "Thread unpinned"

---

### Toggle Lock Thread

Lock or unlock a thread (admin/moderator only).

**Endpoint:** `POST /forum/thread/:slug/lock`  
**Authentication:** Required (admin/moderator)  

**URL Parameters:**
- `slug`: Thread slug

**Request Body (Form):**
```
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/forum/thread/:slug`
- **Flash:** "Thread locked" or "Thread unlocked"

---

## User Endpoints

### View Profile

Display user profile page.

**Endpoint:** `GET /profile/:username`  
**Authentication:** Optional  
**Caching:** 5 minutes  

**URL Parameters:**
- `username`: User's username

**Success Response:**
- **Status:** 200 OK
- **Content-Type:** text/html
- **Body:** HTML page with user profile

**Example (cURL):**
```bash
curl http://localhost:3000/profile/johndoe
```

---

### Edit Profile

Update user profile information.

**Endpoint:** `POST /profile/edit`  
**Authentication:** Required (own profile)  

**Request Body (Multipart Form):**
```
bio: string (optional, max 500 chars)
location: string (optional, max 100 chars)
website: string (optional, valid URL)
avatar: file (optional, image file, max 5MB)
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/profile/:username`
- **Flash:** "Profile updated successfully"

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/profile/edit \
  -b cookies.txt \
  -F "bio=Software developer and educator" \
  -F "location=San Francisco" \
  -F "website=https://example.com" \
  -F "_csrf=TOKEN"
```

---

## Notification Endpoints

### Get Notifications (HTML)

Display notifications page.

**Endpoint:** `GET /notifications`  
**Authentication:** Required  

**Success Response:**
- **Status:** 200 OK
- **Content-Type:** text/html
- **Body:** HTML page with notifications

---

### Get Notifications (JSON)

Get notifications as JSON for AJAX requests.

**Endpoint:** `GET /api/notifications`  
**Authentication:** Required  

**Success Response:**
- **Status:** 200 OK
- **Content-Type:** application/json
- **Body:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "type": "reply",
      "message": "John replied to your thread",
      "link": "/forum/thread/my-thread#post-123",
      "read": false,
      "createdAt": "2024-12-09T10:30:00Z"
    }
  ],
  "unreadCount": 5
}
```

**Example (cURL):**
```bash
curl http://localhost:3000/api/notifications \
  -b cookies.txt \
  -H "Accept: application/json"
```

---

### Get Unread Count

Get count of unread notifications.

**Endpoint:** `GET /api/unread-count`  
**Authentication:** Required  

**Success Response:**
- **Status:** 200 OK
- **Content-Type:** application/json
- **Body:**
```json
{
  "success": true,
  "count": 5
}
```

---

### Mark Notification as Read

Mark a specific notification as read.

**Endpoint:** `POST /notifications/:id/read`  
**Authentication:** Required  

**URL Parameters:**
- `id`: Notification ID

**Request Body (Form):**
```
_csrf: string (required)
```

**Success Response:**
- **Status:** 200 OK or 302 Found
- **Flash:** "Notification marked as read"

---

### Mark All as Read

Mark all notifications as read.

**Endpoint:** `POST /notifications/mark-all-read`  
**Authentication:** Required  

**Request Body (Form):**
```
_csrf: string (required)
```

**Success Response:**
- **Status:** 200 OK or 302 Found
- **Flash:** "All notifications marked as read"

---

## Search Endpoints

### Search

Search for threads, posts, users, or tags.

**Endpoint:** `GET /search`  
**Authentication:** Optional  
**Rate Limit:** 100 per hour  

**Query Parameters:**
- `q`: string (required, search query)
- `type`: string (optional, values: "all", "threads", "posts", "users", "tags")
- `page`: integer (optional, default: 1)

**Success Response:**
- **Status:** 200 OK
- **Content-Type:** text/html
- **Body:** HTML page with search results

**Example (cURL):**
```bash
curl "http://localhost:3000/search?q=javascript&type=threads&page=1"
```

---

## Admin Endpoints

**Note:** All admin endpoints require authentication with admin role.

### View Admin Dashboard

Display admin dashboard with statistics.

**Endpoint:** `GET /admin` or `GET /admin/dashboard`  
**Authentication:** Required (admin only)  

**Success Response:**
- **Status:** 200 OK
- **Content-Type:** text/html
- **Body:** HTML page with dashboard

---

### View Users List

Display list of all users.

**Endpoint:** `GET /admin/users`  
**Authentication:** Required (admin only)  

**Query Parameters:**
- `page`: integer (optional, default: 1)
- `search`: string (optional, search username/email)
- `role`: string (optional, filter by role)
- `status`: string (optional, filter by status)

**Success Response:**
- **Status:** 200 OK
- **Content-Type:** text/html
- **Body:** HTML page with user list

---

### Update User Role

Change a user's role.

**Endpoint:** `POST /admin/users/:id/role`  
**Authentication:** Required (admin only)  

**URL Parameters:**
- `id`: User ID

**Request Body (Form):**
```
role: string (required, values: "user", "moderator", "admin")
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/admin/users`
- **Flash:** "User role updated successfully"

---

### Ban User

Ban a user account.

**Endpoint:** `POST /admin/users/:id/ban`  
**Authentication:** Required (admin/moderator)  

**URL Parameters:**
- `id`: User ID

**Request Body (Form):**
```
reason: string (required)
duration: string (optional, values: "permanent", "7d", "30d")
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/admin/users`
- **Flash:** "User banned successfully"

---

### Unban User

Unban a user account.

**Endpoint:** `POST /admin/users/:id/unban`  
**Authentication:** Required (admin/moderator)  

**URL Parameters:**
- `id`: User ID

**Request Body (Form):**
```
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/admin/users`
- **Flash:** "User unbanned successfully"

---

### Delete User

Permanently delete a user account.

**Endpoint:** `POST /admin/users/:id/delete`  
**Authentication:** Required (admin only)  

**URL Parameters:**
- `id`: User ID

**Request Body (Form):**
```
confirm: string (required, must be username)
deleteContent: boolean (optional, delete user's threads/posts)
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/admin/users`
- **Flash:** "User deleted successfully"

---

### Clear Cache

Clear application cache.

**Endpoint:** `POST /admin/cache/clear`  
**Authentication:** Required (admin only)  

**Request Body (Form):**
```
_csrf: string (required)
```

**Success Response:**
- **Status:** 302 Found
- **Redirect:** `/admin/cache`
- **Flash:** "Cache cleared successfully"

---

## Response Format

### HTML Responses

Most endpoints return HTML pages for browser rendering.

**Success:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Page Title</title>
    ...
</head>
<body>
    <!-- Page content -->
</body>
</html>
```

### JSON Responses

API endpoints (prefixed with `/api/`) return JSON.

**Success:**
```json
{
  "success": true,
  "data": {
    ...
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "details": []
}
```

---

## Examples

### Complete Registration Flow

```bash
# 1. Get registration page (includes CSRF token)
curl -c cookies.txt http://localhost:3000/auth/register > register.html

# 2. Extract CSRF token from HTML
CSRF_TOKEN=$(grep -oP 'name="_csrf" value="\K[^"]+' register.html)

# 3. Register new user
curl -X POST http://localhost:3000/auth/register \
  -b cookies.txt -c cookies.txt \
  -d "username=newuser&email=new@example.com&password=SecurePass123!&_csrf=$CSRF_TOKEN"
```

### Complete Login and Post Flow

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -c cookies.txt \
  -d "username=johndoe&password=SecurePass123!&_csrf=$CSRF_TOKEN"

# 2. Create thread
curl -X POST http://localhost:3000/forum/category/computer-science/new-thread \
  -b cookies.txt \
  -d "title=My Question&content=Need help with JS&_csrf=$CSRF_TOKEN"

# 3. Reply to thread
curl -X POST http://localhost:3000/forum/thread/my-question/reply \
  -b cookies.txt \
  -d "content=Here is my answer&_csrf=$CSRF_TOKEN"
```

### Using JavaScript Fetch

```javascript
// Login
const login = async (username, password) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username,
      password,
      _csrf: document.querySelector('[name="_csrf"]').value
    }),
    credentials: 'include' // Important: include cookies
  });
  return response;
};

// Get notifications (JSON)
const getNotifications = async () => {
  const response = await fetch('/api/notifications', {
    credentials: 'include'
  });
  const data = await response.json();
  return data.notifications;
};

// Mark notification as read
const markAsRead = async (notificationId) => {
  await fetch(`/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      _csrf: document.querySelector('[name="_csrf"]').value
    }),
    credentials: 'include'
  });
};
```

---

## Versioning

**Current Version:** 1.0.0

API versioning may be introduced in future releases. Version will be specified in URL path:
```
/api/v2/notifications
```

---

## Support

For API questions or issues:
- **Email:** api@educard.example.com
- **Documentation:** https://docs.educard.example.com
- **GitHub Issues:** https://github.com/username/educard/issues

---

**Document Version:** 1.0.0  
**Last Updated:** December 9, 2024  
**Maintained By:** Educard Development Team
