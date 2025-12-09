/**
 * Phase 3 Comprehensive Testing Script
 * Tests all forum features: categories, threads, posts, profiles, authorization
 */

const axios = require('axios');
const { sequelize: db, User, Category, Thread, Post } = require('./src/models');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = { username: 'TYIFAN', password: 'password123' };

// Store session cookies
let cookies = '';

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(status, message) {
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '→';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.blue;
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.yellow}━━━ ${title} ━━━${colors.reset}`);
}

// Helper to extract CSRF token from HTML
function extractCsrfToken(html) {
  const match = html.match(/name="_csrf"\s+value="([^"]+)"/);
  return match ? match[1] : null;
}

async function testDatabaseState() {
  section('DATABASE STATE');
  
  try {
    const categoryCount = await Category.count();
    const threadCount = await Thread.count();
    const postCount = await Post.count();
    const userCount = await User.count();
    
    log('info', `Categories: ${categoryCount}, Threads: ${threadCount}, Posts: ${postCount}, Users: ${userCount}`);
    log(categoryCount === 6 ? 'pass' : 'fail', `Expected 6 categories, found ${categoryCount}`);
    log(userCount >= 5 ? 'pass' : 'fail', `Expected at least 5 users, found ${userCount}`);
    
    return { categoryCount, threadCount, postCount, userCount };
  } catch (error) {
    log('fail', `Database connection failed: ${error.message}`);
    return null;
  }
}

async function testHomepage() {
  section('HOMEPAGE TESTING');
  
  try {
    const response = await axios.get(BASE_URL);
    log(response.status === 200 ? 'pass' : 'fail', `Homepage loads (status: ${response.status})`);
    
    // Check for category cards
    const categoryCount = (response.data.match(/category-card/g) || []).length;
    log(categoryCount === 6 ? 'pass' : 'fail', `Expected 6 category cards, found ${categoryCount}`);
    
    // Check for category links
    const hasAnnouncements = response.data.includes('href="/category/announcements"');
    const hasGeneralDiscussion = response.data.includes('href="/category/general-discussion"');
    log(hasAnnouncements && hasGeneralDiscussion ? 'pass' : 'fail', 'Category links present');
    
    return true;
  } catch (error) {
    log('fail', `Homepage test failed: ${error.message}`);
    return false;
  }
}

async function testCategoryPages() {
  section('CATEGORY PAGES');
  
  try {
    const categories = await Category.findAll();
    
    for (const category of categories) {
      const response = await axios.get(`${BASE_URL}/category/${category.slug}`);
      log(response.status === 200 ? 'pass' : 'fail', `Category "${category.name}" loads`);
      
      // Check for thread count display
      const hasThreadCount = response.data.includes('threads');
      log(hasThreadCount ? 'pass' : 'fail', `Thread count displayed for ${category.name}`);
    }
    
    return true;
  } catch (error) {
    log('fail', `Category page test failed: ${error.message}`);
    return false;
  }
}

async function login() {
  section('AUTHENTICATION');
  
  try {
    // Get login page for CSRF token
    const loginPage = await axios.get(`${BASE_URL}/auth/login`);
    const csrfToken = extractCsrfToken(loginPage.data);
    
    if (!csrfToken) {
      log('fail', 'Could not extract CSRF token from login page');
      return false;
    }
    
    // Perform login
    const loginResponse = await axios.post(
      `${BASE_URL}/auth/login`,
      `username=${TEST_USER.username}&password=${TEST_USER.password}&_csrf=${csrfToken}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': loginPage.headers['set-cookie']?.join('; ') || ''
        },
        maxRedirects: 0,
        validateStatus: (status) => status === 302
      }
    );
    
    // Store cookies for subsequent requests
    cookies = loginResponse.headers['set-cookie']?.join('; ') || '';
    
    log(loginResponse.status === 302 ? 'pass' : 'fail', `Login successful (redirected to ${loginResponse.headers.location})`);
    log(cookies.length > 0 ? 'pass' : 'fail', 'Session cookie received');
    
    return true;
  } catch (error) {
    log('fail', `Login failed: ${error.message}`);
    return false;
  }
}

async function testThreadCreation() {
  section('THREAD CREATION');
  
  try {
    // Get new thread form
    const newThreadPage = await axios.get(`${BASE_URL}/category/general-discussion/new`, {
      headers: { Cookie: cookies }
    });
    
    const csrfToken = extractCsrfToken(newThreadPage.data);
    log(csrfToken ? 'pass' : 'fail', 'New thread form loads for authenticated user');
    
    if (!csrfToken) return false;
    
    // Create a new thread
    const threadTitle = `Test Thread ${Date.now()}`;
    const threadContent = 'This is a test thread created by automated testing.';
    
    const createResponse = await axios.post(
      `${BASE_URL}/category/general-discussion/new`,
      `title=${encodeURIComponent(threadTitle)}&content=${encodeURIComponent(threadContent)}&_csrf=${csrfToken}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies
        },
        maxRedirects: 0,
        validateStatus: (status) => status === 302
      }
    );
    
    log(createResponse.status === 302 ? 'pass' : 'fail', 'Thread created successfully');
    
    // Extract slug from redirect location
    const redirectLocation = createResponse.headers.location;
    const slug = redirectLocation?.split('/thread/')[1];
    log(slug ? 'pass' : 'fail', `Thread slug generated: ${slug}`);
    
    // Verify thread in database
    const thread = await Thread.findOne({ where: { slug } });
    log(thread ? 'pass' : 'fail', 'Thread exists in database');
    log(thread?.title === threadTitle ? 'pass' : 'fail', 'Thread title matches');
    
    // Verify first post created
    const postCount = await Post.count({ where: { threadId: thread?.id } });
    log(postCount === 1 ? 'pass' : 'fail', `First post created automatically (found ${postCount} posts)`);
    
    return { slug, threadId: thread?.id };
  } catch (error) {
    log('fail', `Thread creation failed: ${error.message}`);
    return null;
  }
}

async function testThreadViewing(slug) {
  section('THREAD VIEWING');
  
  try {
    const response = await axios.get(`${BASE_URL}/thread/${slug}`);
    log(response.status === 200 ? 'pass' : 'fail', 'Thread page loads');
    
    // Check for posts
    const postCount = (response.data.match(/post-item/g) || []).length;
    log(postCount >= 1 ? 'pass' : 'fail', `Posts displayed (found ${postCount})`);
    
    // Check for reply form
    const hasReplyForm = response.data.includes('name="content"') && response.data.includes('Post Reply');
    log(hasReplyForm ? 'pass' : 'fail', 'Reply form present');
    
    // Check for breadcrumbs
    const hasBreadcrumbs = response.data.includes('breadcrumb');
    log(hasBreadcrumbs ? 'pass' : 'fail', 'Breadcrumb navigation present');
    
    return true;
  } catch (error) {
    log('fail', `Thread viewing failed: ${error.message}`);
    return false;
  }
}

async function testReplyCreation(slug) {
  section('REPLY CREATION');
  
  try {
    // Get thread page for CSRF token
    const threadPage = await axios.get(`${BASE_URL}/thread/${slug}`, {
      headers: { Cookie: cookies }
    });
    
    const csrfToken = extractCsrfToken(threadPage.data);
    log(csrfToken ? 'pass' : 'fail', 'Reply form accessible');
    
    if (!csrfToken) return false;
    
    // Post a reply
    const replyContent = `Test reply ${Date.now()}`;
    const replyResponse = await axios.post(
      `${BASE_URL}/thread/${slug}/reply`,
      `content=${encodeURIComponent(replyContent)}&_csrf=${csrfToken}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies
        },
        maxRedirects: 0,
        validateStatus: (status) => status === 302
      }
    );
    
    log(replyResponse.status === 302 ? 'pass' : 'fail', 'Reply posted successfully');
    
    // Verify reply appears on page
    const updatedPage = await axios.get(`${BASE_URL}/thread/${slug}`);
    const hasReply = updatedPage.data.includes(replyContent);
    log(hasReply ? 'pass' : 'fail', 'Reply appears on thread page');
    
    return true;
  } catch (error) {
    log('fail', `Reply creation failed: ${error.message}`);
    return false;
  }
}

async function testUserProfile() {
  section('USER PROFILE');
  
  try {
    // Test viewing own profile
    const profileResponse = await axios.get(`${BASE_URL}/profile/${TEST_USER.username}`, {
      headers: { Cookie: cookies }
    });
    
    log(profileResponse.status === 200 ? 'pass' : 'fail', 'Profile page loads');
    
    // Check for profile elements
    const hasUsername = profileResponse.data.includes(TEST_USER.username);
    const hasStats = profileResponse.data.includes('stat-card');
    const hasEditButton = profileResponse.data.includes('Edit Profile');
    
    log(hasUsername ? 'pass' : 'fail', 'Username displayed');
    log(hasStats ? 'pass' : 'fail', 'Stats cards present');
    log(hasEditButton ? 'pass' : 'fail', 'Edit profile button shown (own profile)');
    
    // Test viewing another user's profile
    const otherUserProfile = await axios.get(`${BASE_URL}/profile/johndoe`);
    const hasNoEditButton = !otherUserProfile.data.includes('Edit Profile');
    log(hasNoEditButton ? 'pass' : 'fail', 'Edit button hidden (other user profile)');
    
    return true;
  } catch (error) {
    log('fail', `Profile test failed: ${error.message}`);
    return false;
  }
}

async function testProfileEditing() {
  section('PROFILE EDITING');
  
  try {
    // Get edit profile form
    const editPage = await axios.get(`${BASE_URL}/profile/edit`, {
      headers: { Cookie: cookies }
    });
    
    log(editPage.status === 200 ? 'pass' : 'fail', 'Edit profile form loads');
    
    const csrfToken = extractCsrfToken(editPage.data);
    const hasDisplayNameField = editPage.data.includes('name="displayName"');
    const hasEmailField = editPage.data.includes('name="email"');
    
    log(hasDisplayNameField && hasEmailField ? 'pass' : 'fail', 'Form fields present');
    
    if (!csrfToken) return false;
    
    // Update profile
    const newDisplayName = `Test User ${Date.now()}`;
    const updateResponse = await axios.post(
      `${BASE_URL}/profile/edit`,
      `displayName=${encodeURIComponent(newDisplayName)}&email=${encodeURIComponent('test@example.com')}&_csrf=${csrfToken}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies
        },
        maxRedirects: 0,
        validateStatus: (status) => status === 302
      }
    );
    
    log(updateResponse.status === 302 ? 'pass' : 'fail', 'Profile updated successfully');
    
    // Verify update
    const user = await User.findOne({ where: { username: TEST_USER.username } });
    log(user?.displayName === newDisplayName ? 'pass' : 'fail', `Display name updated to "${newDisplayName}"`);
    
    return true;
  } catch (error) {
    log('fail', `Profile editing failed: ${error.message}`);
    return false;
  }
}

async function testAuthorization() {
  section('AUTHORIZATION');
  
  try {
    // Test unauthenticated access
    const newThreadUnauth = await axios.get(`${BASE_URL}/category/general-discussion/new`, {
      maxRedirects: 0,
      validateStatus: (status) => status === 302
    });
    
    const redirectsToLogin = newThreadUnauth.headers.location?.includes('/auth/login');
    log(redirectsToLogin ? 'pass' : 'fail', 'Guest redirected to login for new thread form');
    
    // Test edit profile without auth
    const editProfileUnauth = await axios.get(`${BASE_URL}/profile/edit`, {
      maxRedirects: 0,
      validateStatus: (status) => status === 302
    });
    
    const profileRedirect = editProfileUnauth.headers.location?.includes('/auth/login');
    log(profileRedirect ? 'pass' : 'fail', 'Guest redirected to login for profile edit');
    
    return true;
  } catch (error) {
    log('fail', `Authorization test failed: ${error.message}`);
    return false;
  }
}

async function testValidation() {
  section('VALIDATION');
  
  try {
    // Get new thread form
    const newThreadPage = await axios.get(`${BASE_URL}/category/general-discussion/new`, {
      headers: { Cookie: cookies }
    });
    
    const csrfToken = extractCsrfToken(newThreadPage.data);
    
    // Try to create thread with empty title
    const invalidResponse = await axios.post(
      `${BASE_URL}/category/general-discussion/new`,
      `title=&content=Some content&_csrf=${csrfToken}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies
        },
        validateStatus: (status) => true
      }
    );
    
    const hasErrors = invalidResponse.data.includes('error') || invalidResponse.data.includes('required');
    log(hasErrors ? 'pass' : 'fail', 'Validation errors displayed for empty title');
    
    // Try to create thread with too short content
    const shortContentResponse = await axios.post(
      `${BASE_URL}/category/general-discussion/new`,
      `title=Valid Title&content=ab&_csrf=${csrfToken}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies
        },
        validateStatus: (status) => true
      }
    );
    
    const hasContentError = shortContentResponse.data.includes('at least') || shortContentResponse.data.includes('characters');
    log(hasContentError ? 'pass' : 'fail', 'Validation enforces minimum content length');
    
    return true;
  } catch (error) {
    log('fail', `Validation test failed: ${error.message}`);
    return false;
  }
}

async function testEditAndDelete(slug, threadId) {
  section('EDIT & DELETE OPERATIONS');
  
  try {
    // Find a post to edit
    const post = await Post.findOne({ 
      where: { threadId },
      order: [['createdAt', 'DESC']]
    });
    
    if (!post) {
      log('fail', 'No post found to test editing');
      return false;
    }
    
    // Get edit form
    const editPage = await axios.get(`${BASE_URL}/post/${post.id}/edit`, {
      headers: { Cookie: cookies }
    });
    
    log(editPage.status === 200 ? 'pass' : 'fail', 'Edit post form loads');
    
    const csrfToken = extractCsrfToken(editPage.data);
    const isPreFilled = editPage.data.includes(post.content);
    log(isPreFilled ? 'pass' : 'fail', 'Edit form pre-filled with existing content');
    
    if (!csrfToken) return false;
    
    // Update the post
    const updatedContent = `Updated content ${Date.now()}`;
    const updateResponse = await axios.post(
      `${BASE_URL}/post/${post.id}/edit`,
      `content=${encodeURIComponent(updatedContent)}&_csrf=${csrfToken}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies
        },
        maxRedirects: 0,
        validateStatus: (status) => status === 302
      }
    );
    
    log(updateResponse.status === 302 ? 'pass' : 'fail', 'Post updated successfully');
    
    // Verify editedAt timestamp
    const updatedPost = await Post.findByPk(post.id);
    log(updatedPost?.editedAt !== null ? 'pass' : 'fail', 'editedAt timestamp set');
    log(updatedPost?.content === updatedContent ? 'pass' : 'fail', 'Post content updated in database');
    
    // Test post deletion (don't delete if it's the only post)
    const postCount = await Post.count({ where: { threadId } });
    if (postCount > 1) {
      const deleteResponse = await axios.post(
        `${BASE_URL}/post/${post.id}/delete`,
        `_csrf=${csrfToken}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookies
          },
          maxRedirects: 0,
          validateStatus: (status) => status === 302
        }
      );
      
      log(deleteResponse.status === 302 ? 'pass' : 'fail', 'Post deleted successfully');
      
      const deletedPost = await Post.findByPk(post.id);
      log(deletedPost === null ? 'pass' : 'fail', 'Post removed from database');
    } else {
      log('info', 'Skipped post deletion test (only one post in thread)');
    }
    
    return true;
  } catch (error) {
    log('fail', `Edit/delete test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log(`${colors.blue}
╔═══════════════════════════════════════════════════════════╗
║         EDUCARD FORUM - PHASE 3 TESTING SUITE            ║
║                    November 26, 2025                      ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Connect to database
    await db.authenticate();
    log('pass', 'Database connection established');
    
    // Run all tests
    await testDatabaseState();
    await testHomepage();
    await testCategoryPages();
    
    const loggedIn = await login();
    if (loggedIn) {
      const threadData = await testThreadCreation();
      
      if (threadData) {
        await testThreadViewing(threadData.slug);
        await testReplyCreation(threadData.slug);
        await testEditAndDelete(threadData.slug, threadData.threadId);
      }
      
      await testUserProfile();
      await testProfileEditing();
    }
    
    await testAuthorization();
    await testValidation();
    
    section('SUMMARY');
    console.log(`${colors.green}✓ Phase 3 comprehensive testing completed!${colors.reset}`);
    console.log(`\nAll major features tested:`);
    console.log(`  • Homepage and category listing`);
    console.log(`  • Thread creation and viewing`);
    console.log(`  • Post replies`);
    console.log(`  • Post editing and deletion`);
    console.log(`  • User profiles and editing`);
    console.log(`  • Authorization and validation`);
    
  } catch (error) {
    log('fail', `Test suite error: ${error.message}`);
    console.error(error);
  } finally {
    await db.close();
    log('info', 'Database connection closed');
  }
}

// Run the test suite
runAllTests().catch(console.error);
