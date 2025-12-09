# Educard User Guide

**Version:** 1.0.0  
**Last Updated:** December 9, 2024  
**Audience:** End Users

Welcome to Educard! This guide will help you get started with the educational forum platform and make the most of its features.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Account Management](#account-management)
3. [Navigating the Forum](#navigating-the-forum)
4. [Creating and Managing Threads](#creating-and-managing-threads)
5. [Posting and Replying](#posting-and-replying)
6. [Content Formatting](#content-formatting)
7. [Search and Discovery](#search-and-discovery)
8. [User Profiles](#user-profiles)
9. [Notifications](#notifications)
10. [Best Practices](#best-practices)
11. [FAQ](#faq)
12. [Getting Help](#getting-help)

---

## Getting Started

### What is Educard?

Educard is an educational forum platform where users can:
- Ask questions and get answers
- Share knowledge and learning resources
- Discuss topics in organized threads
- Build a learning community
- Discover content through search and tags

### System Requirements

**Supported Browsers:**
- Chrome 90+ ✅ (Recommended)
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

**Supported Devices:**
- Desktop computers (Windows, macOS, Linux)
- Tablets (iPad, Android tablets)
- Mobile phones (iOS, Android)

**Screen Sizes:**
- Responsive from 320px (mobile) to 4K displays
- Optimized for 1920x1080 desktop and 375x667 mobile

---

## Account Management

### Creating an Account

1. **Navigate to Registration**
   - Click "Sign Up" or "Register" in the navigation bar
   - Or visit `/register` directly

2. **Fill in Registration Form**
   - **Username:** 3-20 characters, alphanumeric only
   - **Email:** Valid email address (used for notifications)
   - **Password:** Minimum 8 characters, must include:
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
     - At least one special character (!@#$%^&*)

3. **Submit and Verify**
   - Click "Register" button
   - You'll be redirected to the login page
   - Success message will confirm account creation

**Example:**
```
Username: johndoe123
Email: john@example.com
Password: SecurePass123!
```

### Logging In

1. **Navigate to Login Page**
   - Click "Login" in the navigation bar
   - Or visit `/login` directly

2. **Enter Credentials**
   - Username or email address
   - Password

3. **Stay Logged In (Optional)**
   - Check "Remember Me" for persistent session
   - Session expires after 24 hours of inactivity

4. **Click "Login"**
   - Success: Redirected to homepage
   - Failure: Error message displayed

**Forgot Password?**
- Contact administrator for password reset
- (Password reset feature coming soon)

### Logging Out

1. Click your username in the navigation bar
2. Select "Logout" from dropdown menu
3. Or click "Logout" button in navigation
4. Confirmation message displayed

---

## Navigating the Forum

### Homepage

The homepage shows:
- **Thread List:** Recent and popular threads
- **Categories:** Browse threads by category
- **Search Bar:** Find specific content
- **Navigation:** Access all features

### Main Navigation

**Top Navigation Bar:**
- **Logo/Home:** Return to homepage
- **Categories:** Browse by topic
- **Search:** Find threads, posts, users
- **New Thread:** Create a discussion (when logged in)
- **Notifications:** View activity (when logged in)
- **Profile:** Your account menu (when logged in)
- **Login/Register:** Access controls (when logged out)

### Categories

Categories organize threads by topic:
- Computer Science
- Mathematics
- Science
- Language Learning
- General Discussion
- (And more...)

**To browse a category:**
1. Click "Categories" in navigation
2. Select a category from the list
3. View all threads in that category
4. Use filters to sort (newest, popular, most replies)

### Filters and Sorting

**Sort threads by:**
- Newest First
- Oldest First
- Most Replies
- Most Popular (votes)
- Most Active (recent activity)

**Filter threads by:**
- Category
- Tags
- Date range
- Author

---

## Creating and Managing Threads

### Creating a New Thread

1. **Click "New Thread"** (must be logged in)

2. **Fill in Thread Details:**
   - **Title:** Clear, descriptive title (5-200 characters)
   - **Category:** Select appropriate category
   - **Content:** Your question or discussion starter
   - **Tags:** Add relevant tags (optional, comma-separated)

3. **Format Content (Optional)**
   - Use Markdown for formatting
   - Add code snippets with syntax highlighting
   - Include images or attachments

4. **Preview** (Optional)
   - Click "Preview" to see formatted output
   - Make adjustments as needed

5. **Submit**
   - Click "Post Thread" button
   - Thread appears in category list
   - You're redirected to the thread page

**Example Thread:**
```markdown
Title: "How do I learn JavaScript as a beginner?"

Category: Computer Science

Content:
I'm new to programming and want to learn JavaScript. What 
resources would you recommend for beginners?

I've tried:
- FreeCodeCamp
- JavaScript.info

Tags: javascript, learning, beginner
```

### Editing Your Thread

1. **Navigate to Your Thread**
2. **Click "Edit" Button** (only visible to thread creator)
3. **Modify Title or Content**
4. **Save Changes**
   - Edit history is tracked
   - "Last edited" timestamp displayed

**Note:** You can only edit threads you created.

### Deleting Your Thread

1. **Navigate to Your Thread**
2. **Click "Delete" Button**
3. **Confirm Deletion** (this cannot be undone)
4. **Thread and all replies are permanently removed**

**Note:** 
- You can only delete threads you created
- Deleting a thread deletes all replies
- Consider editing instead of deleting

---

## Posting and Replying

### Replying to a Thread

1. **Open a Thread**
   - Click thread title from list

2. **Scroll to Reply Form** (at bottom)
   - Must be logged in to reply

3. **Write Your Reply**
   - Use the text editor
   - Format with Markdown (optional)
   - Add code snippets
   - Attach files (if enabled)

4. **Preview Your Reply** (Optional)
   - Click "Preview" tab
   - Review formatting

5. **Submit Reply**
   - Click "Post Reply" button
   - Reply appears immediately

**Reply Example:**
```markdown
Great question! For JavaScript beginners, I recommend:

1. **MDN Web Docs** - Excellent reference
2. **Eloquent JavaScript** - Free online book
3. **JavaScript30** - 30 day challenge

Here's a simple example:
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
console.log(greet('World'));
```

Good luck!
```

### Replying to a Specific Post

1. **Find the Post** you want to reply to
2. **Click "Reply" Button** on that post
3. **Quote is automatically included** (optional)
4. **Write your response**
5. **Submit**

### Editing Your Posts

1. **Find Your Post** in a thread
2. **Click "Edit" Button**
3. **Modify Content**
4. **Save Changes**
   - "Last edited" timestamp displayed
   - Edit history tracked

### Deleting Your Posts

1. **Find Your Post**
2. **Click "Delete" Button**
3. **Confirm Deletion**
4. **Post removed permanently**

**Note:** You cannot delete posts that have replies.

---

## Content Formatting

### Markdown Basics

Educard supports Markdown formatting for rich text:

**Text Formatting:**
```markdown
*italic text*
**bold text**
***bold and italic***
~~strikethrough~~
```

**Headers:**
```markdown
# Heading 1
## Heading 2
### Heading 3
```

**Lists:**
```markdown
Unordered List:
- Item 1
- Item 2
  - Nested item

Ordered List:
1. First item
2. Second item
3. Third item
```

**Links:**
```markdown
[Link text](https://example.com)
[Link with title](https://example.com "Click here")
```

**Images:**
```markdown
![Alt text](https://example.com/image.jpg)
![Image with title](image.jpg "Image description")
```

**Quotes:**
```markdown
> This is a blockquote
> It can span multiple lines
```

**Code:**
```markdown
Inline code: `console.log('Hello')`

Code block:
```javascript
function hello() {
  console.log('Hello, World!');
}
```
```

### Code Syntax Highlighting

Educard automatically highlights code syntax:

**Supported Languages:**
- JavaScript/TypeScript
- Python
- Java
- C/C++
- HTML/CSS
- SQL
- Bash/Shell
- And 100+ more...

**Example:**
````markdown
```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```
````

### Tables

```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

### Horizontal Rules

```markdown
---
or
***
```

---

## Search and Discovery

### Using Search

1. **Click Search Icon** or press `/` key
2. **Enter Search Query**
3. **Select Search Type:**
   - All Content (default)
   - Threads Only
   - Posts Only
   - Users
   - Tags

4. **View Results**
   - Results are highlighted
   - Sorted by relevance

**Search Tips:**
- Use quotes for exact phrases: `"react hooks"`
- Use + for required words: `+javascript +async`
- Use - to exclude words: `javascript -jquery`
- Search is case-insensitive

### Browsing by Tags

1. **Click a Tag** on any thread or post
2. **View all content with that tag**
3. **Combine tags** for refined results

**Popular Tags:**
- `#javascript`
- `#python`
- `#beginner`
- `#tutorial`
- `#help-wanted`

### Discovering Popular Content

**Popular Threads:**
- Most upvoted
- Most replied to
- Most viewed
- Trending (active recently)

**Active Users:**
- Most contributions
- Highest reputation
- Recent activity

---

## User Profiles

### Viewing Your Profile

1. **Click Your Username** in navigation
2. **Select "Profile"** from dropdown
3. Or visit `/profile/your-username`

**Profile Sections:**
- **About:** Bio, location, website
- **Statistics:** Posts, threads, reputation
- **Recent Activity:** Your recent posts and threads
- **Badges:** Achievements and milestones

### Editing Your Profile

1. **Go to Your Profile**
2. **Click "Edit Profile" Button**
3. **Update Information:**
   - Avatar/Profile Picture
   - Bio (500 characters max)
   - Location
   - Website URL
   - Social Links

4. **Save Changes**

### Viewing Other Users' Profiles

1. **Click any username** in threads or posts
2. **View their profile** with:
   - Public information
   - Post history
   - Thread history
   - Statistics

---

## Notifications

### Types of Notifications

You receive notifications when:
- Someone replies to your thread
- Someone replies to your post
- Someone mentions you (@username)
- Someone votes on your content
- Your post is marked as solution
- Moderation actions on your content

### Viewing Notifications

1. **Click Bell Icon** in navigation
2. **View Notification List**
3. **Click Notification** to go to content
4. **Mark as Read** or "Mark All as Read"

### Notification Settings

1. **Go to Profile Settings**
2. **Select "Notifications" Tab**
3. **Configure Preferences:**
   - Email notifications (on/off)
   - Web notifications (on/off)
   - Notification types (select which)

---

## Best Practices

### Creating Good Threads

✅ **Do:**
- Use clear, descriptive titles
- Include relevant context and details
- Choose appropriate category
- Add relevant tags
- Format code properly
- Be specific about your question
- Search first to avoid duplicates

❌ **Don't:**
- Use ALL CAPS or excessive punctuation
- Post the same question multiple times
- Use vague titles like "Help needed"
- Post off-topic content
- Include personal information

**Good Thread Example:**
```
Title: "How to implement JWT authentication in Express.js?"

I'm building a Node.js API with Express and need to implement JWT
authentication. I've installed jsonwebtoken but I'm unsure about:

1. Where to verify tokens (middleware?)
2. How to handle token expiration
3. Best practices for token storage

Here's my current code:
[code snippet]

Any guidance would be appreciated!
```

**Bad Thread Example:**
```
Title: "HELP!!!"

I need help with JWT it's not working help me please!!!
```

### Writing Helpful Replies

✅ **Do:**
- Answer the question directly
- Provide examples and code snippets
- Explain your reasoning
- Link to relevant resources
- Be respectful and encouraging
- Format your response clearly

❌ **Don't:**
- Be rude or condescending
- Just post a link without explanation
- Copy-paste without attribution
- Post off-topic responses
- Criticize without being constructive

### Community Guidelines

**Be Respectful:**
- Treat everyone with respect
- No harassment, hate speech, or personal attacks
- Disagree politely and constructively
- Welcome beginners and all skill levels

**Be Helpful:**
- Share your knowledge generously
- Provide clear explanations
- Help others learn, don't just give answers
- Acknowledge good contributions

**Be Honest:**
- Don't plagiarize or take credit for others' work
- Cite sources and give credit
- Admit when you don't know something
- Correct your mistakes

**Keep It Clean:**
- No spam or self-promotion
- No offensive content
- No illegal content
- Stay on topic

---

## FAQ

### General Questions

**Q: Is Educard free to use?**
A: Yes, Educard is completely free for all users.

**Q: Do I need an account to browse threads?**
A: No, you can browse content without an account. You need an account to post, reply, vote, and interact.

**Q: Can I use Educard on mobile?**
A: Yes! Educard is fully responsive and works great on phones and tablets.

**Q: How do I report inappropriate content?**
A: Click the "Report" button on any thread or post, and moderators will review it.

### Account Questions

**Q: I forgot my password. How do I reset it?**
A: Contact the administrator or use the password reset feature (coming soon).

**Q: Can I change my username?**
A: Currently, usernames cannot be changed. Contact an administrator if this is critical.

**Q: How do I delete my account?**
A: Contact an administrator to request account deletion.

**Q: Why can't I post or reply?**
A: Ensure you're logged in. New accounts may have posting restrictions for the first 24 hours.

### Content Questions

**Q: Can I delete my thread after people have replied?**
A: Yes, but all replies will be deleted too. Consider editing instead.

**Q: How do I mark a reply as the solution?**
A: Click "Mark as Solution" on the most helpful reply (thread creator only).

**Q: Can I upload images directly?**
A: Yes, use the image upload button in the editor or drag-and-drop.

**Q: What file types can I attach?**
A: Images (JPG, PNG, GIF), documents (PDF), and code files. Max 5MB per file.

**Q: Can I edit or delete someone else's post?**
A: No, only moderators and administrators can edit/delete others' content.

### Technical Questions

**Q: Why is the site loading slowly?**
A: Try refreshing the page, clearing your browser cache, or checking your internet connection.

**Q: The formatting in my post looks wrong. What happened?**
A: Check your Markdown syntax. Use the preview feature before posting.

**Q: Can I use the forum offline?**
A: No, Educard requires an internet connection.

**Q: Does Educard have an app?**
A: Not currently, but the mobile web version works great on all devices.

---

## Getting Help

### Help Resources

1. **This User Guide** - Comprehensive instructions
2. **FAQ Section** - Common questions answered
3. **Contact Support** - Email support@educard.example.com
4. **Community Meta Section** - Ask about using the forum
5. **Report Issues** - Use the "Report" button for problems

### Contacting Support

**For Technical Issues:**
- Email: support@educard.example.com
- Include:
  - Your username
  - Browser and device information
  - Description of the problem
  - Screenshots (if applicable)
  - Steps to reproduce the issue

**For Content Issues:**
- Use the "Report" button on specific content
- Moderators will review within 24 hours

**For Account Issues:**
- Email: accounts@educard.example.com
- Include:
  - Your username
  - Registered email address
  - Nature of the issue

### Response Times

- **Technical Support:** 1-2 business days
- **Account Issues:** 1-2 business days
- **Content Reports:** Reviewed within 24 hours
- **Urgent Security Issues:** Within 6 hours

---

## Keyboard Shortcuts

Educard supports keyboard shortcuts for power users:

| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `n` | New thread (when logged in) |
| `Esc` | Close modal/dialog |
| `?` | Show keyboard shortcuts |
| `Ctrl/Cmd + Enter` | Submit form (in editor) |
| `Ctrl/Cmd + K` | Insert link |
| `Ctrl/Cmd + B` | Bold text |
| `Ctrl/Cmd + I` | Italic text |

---

## Accessibility Features

Educard is designed to be accessible to all users:

- **Keyboard Navigation:** Full keyboard support
- **Screen Readers:** Compatible with NVDA, JAWS, VoiceOver
- **High Contrast:** Meets WCAG 2.1 AA standards
- **Text Scaling:** Supports browser zoom up to 200%
- **Focus Indicators:** Clear focus states for all interactive elements
- **Alt Text:** All images have descriptive alt text
- **ARIA Labels:** Proper labeling for assistive technologies

---

## Privacy and Security

### Your Data

- **What we collect:** Account info, posts, activity
- **How we use it:** Provide service, improve features
- **Who sees it:** Public posts are visible to all
- **Data retention:** Active as long as your account exists

### Security Tips

✅ **Do:**
- Use a strong, unique password
- Log out on shared computers
- Enable two-factor authentication (when available)
- Report suspicious activity

❌ **Don't:**
- Share your password
- Use the same password as other sites
- Click suspicious links in private messages
- Share personal information publicly

---

## Updates and Changelog

**Version 1.0.0 (December 2024)**
- Initial launch
- Core forum features
- User authentication
- Search functionality
- Markdown support
- Mobile responsive design

**Future Updates:**
- Password reset via email
- Two-factor authentication
- Direct messaging
- Rich notifications
- Mobile applications
- API access

---

## Conclusion

Thank you for being part of the Educard community! We hope this guide helps you make the most of the platform.

**Happy learning and contributing!** 🎓

---

**Document Version:** 1.0.0  
**Last Updated:** December 9, 2024  
**Maintained By:** Educard Team  
**Feedback:** docs@educard.example.com
