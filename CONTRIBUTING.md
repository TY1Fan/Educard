# Contributing to Educard

Thank you for your interest in contributing to Educard! This guide will help you get started with contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Branching Strategy](#branching-strategy)
5. [Commit Style](#commit-style)
6. [Code Standards](#code-standards)
7. [Testing](#testing)
8. [Pull Request Process](#pull-request-process)
9. [Code Review Checklist](#code-review-checklist)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please:

- Be respectful and considerate in all interactions
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

Unacceptable behavior includes harassment, discrimination, trolling, or any form of disrespectful conduct.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 18+ installed
- PostgreSQL 12+ installed
- Git configured with your identity
- A GitHub account
- Basic knowledge of Express.js and PostgreSQL

### Setting Up Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork:**
```bash
git clone https://github.com/YOUR_USERNAME/educard.git
cd educard
```

3. **Add upstream remote:**
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/educard.git
```

4. **Install dependencies:**
```bash
npm install
```

5. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your local database credentials
```

6. **Set up database:**
```bash
# Create database
createdb educard_dev

# Run migrations
npm run db:migrate
```

7. **Start development server:**
```bash
npm run dev
```

8. **Verify setup:**
   - Open http://localhost:3000
   - Register a test user
   - Create a test post

---

## Development Workflow

### 1. Create an Issue

Before starting work:
- Search existing issues to avoid duplicates
- Open a new issue describing the feature/bug
- Wait for maintainer feedback and approval
- Get issue assigned to you

### 2. Create a Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Write clean, readable code following our standards
- Add/update tests for your changes
- Update documentation as needed
- Test thoroughly in development

### 4. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with clear message
git commit -m "feat: Add user profile avatar upload"
```

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Open pull request on GitHub
# Fill out the PR template with details
```

---

## Branching Strategy

We use a **feature branch workflow** with protected main branch.

| Branch | Purpose | Example |
|--------|---------|---------|
| `main` | Production-ready code | - |
| `dev` | Development branch; features merged here before release | - |
| `feature/*` | New features | `feature/add-markdown-editor` |
| `fix/*` | Bug fixes | `fix/broken-pagination` |
| `plan/*` | Documentation or spec updates | `plan/update-api-docs` |
| `hotfix/*` | Critical production fixes | `hotfix/security-patch` |

### Branch Naming Conventions

- Use lowercase with hyphens
- Be descriptive but concise
- Include issue number when applicable

**Good examples:**
```bash
feature/user-profile-editing
fix/broken-search-results
plan/update-deployment-docs
fix/issue-123-login-validation
```

**Bad examples:**
```bash
my-changes
bugfix
feature123
UpdateUserProfile
```

---

## Commit Style

We follow the **Conventional Commits** specification for clear and consistent commit messages.

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Type

Must be one of the following:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, whitespace)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools
- `security`: Security fixes or improvements

### Scope (Optional)

The scope specifies the area of the codebase:
- `auth`: Authentication/authorization
- `forum`: Forum features (categories, threads, posts)
- `admin`: Admin panel features
- `ui`: User interface changes
- `db`: Database changes
- `api`: API changes
- `deps`: Dependency updates

### Subject Line Rules

- Use imperative mood ("Add feature" not "Added feature")
- Don't capitalize first letter (unless proper noun)
- Keep under 50 characters
- No period at the end
- Be clear and concise

### Examples

**Good commit messages:**
```bash
feat(auth): add password reset functionality
fix(forum): resolve pagination bug in thread listing
docs(api): update endpoint documentation
refactor(db): optimize user query performance
security(auth): fix XSS vulnerability in post editor
test(forum): add integration tests for thread creation
```

**Bad commit messages:**
```bash
fixed stuff
Update code
WIP
asdfasdf
Fixed bug (which bug?)
Added new feature (which feature?)
```

### Commit Body Convention

For non-trivial commits, include a body explaining:

```
Current situation -- use present tense

Why it needs to change

What is being done about it -- use imperative mood

Why it is done that way

Any other relevant info (breaking changes, migration notes, etc.)
```

**Example with body:**
```
fix(auth): prevent session fixation attacks

Current session handling allows session IDs to be reused
after login, which creates a session fixation vulnerability.

Regenerate session ID on successful login to prevent
session fixation attacks.

This follows OWASP session management best practices.
Related to security audit findings in issue #45.
```

---

## Code Standards

### JavaScript Style Guide

We follow these conventions:

**General:**
- Use 2 spaces for indentation (no tabs)
- Use single quotes for strings
- Use semicolons
- Max line length: 100 characters
- Use camelCase for variables and functions
- Use PascalCase for classes

**Modern JavaScript:**
- Use `const` by default, `let` when reassignment needed
- Avoid `var`
- Use arrow functions for callbacks
- Use template literals instead of string concatenation
- Use destructuring when beneficial

**Example:**
```javascript
// Good
const getUserById = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

// Bad
var getUserById = function(userId) {
  return User.findByPk(userId).then(function(user) {
    if (!user) throw new Error('User not found')
    return user
  })
}
```

### Code Organization

**File Structure:**
- Controllers: Handle HTTP requests/responses
- Models: Define data structures and database logic
- Routes: Define URL endpoints and map to controllers
- Middleware: Reusable request processing logic
- Utils: Helper functions and utilities
- Views: EJS templates

**Naming Conventions:**
- Files: lowercase with hyphens (`user-controller.js`)
- Classes: PascalCase (`UserController`)
- Functions: camelCase (`getUserProfile`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- Routes: lowercase with hyphens (`/user-profile`)

### Security Guidelines

**Always:**
- Validate and sanitize user input
- Use parameterized queries (Sequelize handles this)
- Escape output in templates (EJS auto-escapes)
- Check authentication and authorization
- Use HTTPS in production
- Keep dependencies updated

**Never:**
- Trust user input without validation
- Store passwords in plain text
- Expose sensitive data in responses
- Concatenate user input into SQL queries
- Commit secrets to git

### Database Guidelines

**Migrations:**
- Always create migrations for schema changes
- Never modify existing migrations
- Test migrations before committing
- Include both `up` and `down` methods

**Models:**
- Define validations at model level
- Use indexes for frequently queried fields
- Define associations clearly
- Document complex relationships

**Queries:**
- Use eager loading to avoid N+1 queries
- Add appropriate indexes
- Use transactions for related operations
- Limit query results with pagination

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test tests/auth.test.js

# Run lint checks
npm run lint

# Auto-fix lint issues
npm run lint:fix
```

### Writing Tests

**Test Structure:**
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup code
  });

  afterEach(() => {
    // Cleanup code
  });

  it('should do something specific', async () => {
    // Arrange
    const user = await createTestUser();

    // Act
    const result = await someFunction(user.id);

    // Assert
    expect(result).toBeDefined();
    expect(result.name).toBe(user.name);
  });
});
```

**What to Test:**
- Happy path (expected behavior)
- Error cases and edge cases
- Validation logic
- Authentication/authorization
- Database operations
- API endpoints

### Test Coverage Requirements

- Aim for 80%+ code coverage
- All critical paths must be tested
- All authentication/authorization logic tested
- All database operations tested

---

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Added/updated tests for changes
- [ ] Updated documentation as needed
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main
- [ ] No merge conflicts
- [ ] Tested manually in development

### Pull Request Template

When creating a PR, include:

```markdown
## Description
Brief description of what this PR does

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran and how to reproduce them

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the project style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

1. **Automatic Checks:** CI/CD runs tests and linters
2. **Code Review:** At least one maintainer reviews the code
3. **Feedback:** Address reviewer comments and make requested changes
4. **Approval:** Once approved, maintainer will merge
5. **Merge:** Squash and merge into main/dev branch

### After Merge

- Delete your feature branch
- Close related issues
- Update local main branch

---

## Code Review Checklist

### For Contributors

Before requesting review:
- [ ] All tests pass locally (`npm test`)
- [ ] Linter passes without errors (`npm run lint`)
- [ ] Code is self-documented with clear variable/function names
- [ ] Complex logic has explanatory comments
- [ ] Added/updated tests for new functionality
- [ ] Updated relevant documentation
- [ ] Manually tested all changes
- [ ] Checked for console errors in browser
- [ ] Verified database migrations work correctly
- [ ] No sensitive data (passwords, API keys) in code
- [ ] Following existing code patterns and conventions

### For Reviewers

When reviewing code:

**Functionality:**
- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] No obvious bugs or logic errors

**Code Quality:**
- [ ] Code is readable and maintainable
- [ ] Variable and function names are clear
- [ ] No unnecessary complexity
- [ ] DRY principle followed (Don't Repeat Yourself)
- [ ] Functions are focused and single-purpose

**Security:**
- [ ] User input is validated and sanitized
- [ ] Authentication/authorization checks are present
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Sensitive data is not exposed

**Performance:**
- [ ] No obvious performance issues
- [ ] Database queries are optimized
- [ ] No N+1 query problems
- [ ] Appropriate use of caching

**Testing:**
- [ ] Adequate test coverage for new code
- [ ] Tests are meaningful and test the right things
- [ ] Tests are not brittle

**Documentation:**
- [ ] Public APIs are documented
- [ ] Complex logic is explained
- [ ] README/docs updated if needed

**Standards:**
- [ ] Follows project code style
- [ ] Commit messages follow convention
- [ ] Aligns with project architecture
- [ ] Meets acceptance criteria from issue

---

## Additional Resources

### Documentation
- [README.md](./README.md) - Project overview and setup
- [SECURITY.md](./SECURITY.md) - Security policies and reporting
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture
- [specs/](./specs/) - Detailed specifications

### Useful Links
- [Express.js Documentation](https://expressjs.com/)
- [Sequelize Documentation](https://sequelize.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [EJS Documentation](https://ejs.co/)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Getting Help

- Open an issue for bugs or feature requests
- Check existing issues and PRs for similar problems
- Review specs documentation for architecture decisions
- Ask questions in pull request comments

---

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- Project changelog
- Release notes (for significant contributions)

Thank you for contributing to Educard! 🎉