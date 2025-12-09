const { processMarkdown, escapeHtml, truncateText } = require('../../src/utils/markdown');

describe('Validation Utilities', () => {
  describe('Markdown Processing', () => {
    test('should convert markdown to HTML', () => {
      const markdown = '# Hello\n\nThis is **bold** text.';
      const html = processMarkdown(markdown);
      
      expect(html).toContain('<h1>Hello</h1>');
      expect(html).toContain('<strong>bold</strong>');
    });

    test('should sanitize XSS attempts', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = processMarkdown(malicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    test('should allow safe HTML tags', () => {
      const markdown = '**bold** _italic_ `code`';
      const html = processMarkdown(markdown);
      
      expect(html).toContain('<strong>');
      expect(html).toContain('<em>');
      expect(html).toContain('<code>');
    });

    test('should handle links correctly', () => {
      const markdown = '[Click here](https://example.com)';
      const html = processMarkdown(markdown);
      
      expect(html).toContain('<a');
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
    });

    test('should handle empty input', () => {
      expect(processMarkdown('')).toBe('');
      expect(processMarkdown(null)).toBe('');
      expect(processMarkdown(undefined)).toBe('');
    });

    test('should remove dangerous attributes', () => {
      const malicious = '<img src=x onerror="alert(1)">';
      const sanitized = processMarkdown(malicious);
      
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    test('should handle code blocks with syntax highlighting', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const html = processMarkdown(markdown);
      
      expect(html).toContain('<pre>');
      expect(html).toContain('<code');
    });
  });

  describe('HTML Escaping', () => {
    test('should escape HTML special characters', () => {
      const text = '<script>alert("test")</script>';
      const escaped = escapeHtml(text);
      
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });

    test('should escape ampersands', () => {
      const text = 'Tom & Jerry';
      const escaped = escapeHtml(text);
      
      expect(escaped).toContain('&amp;');
    });

    test('should escape quotes', () => {
      const text = 'She said "hello"';
      const escaped = escapeHtml(text);
      
      expect(escaped).toContain('&quot;');
    });

    test('should handle empty input', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
    });
  });

  describe('Text Truncation', () => {
    test('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      const truncated = truncateText(text, 20);
      
      expect(truncated.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(truncated).toContain('...');
    });

    test('should not truncate short text', () => {
      const text = 'Short text';
      const truncated = truncateText(text, 20);
      
      expect(truncated).toBe(text);
      expect(truncated).not.toContain('...');
    });

    test('should handle exact length', () => {
      const text = 'Exactly twenty chars';
      const truncated = truncateText(text, 20);
      
      expect(truncated).toBe(text);
    });
  });
});

describe('Input Validation', () => {
  describe('Username Validation', () => {
    const validateUsername = (username) => {
      if (!username) return { valid: false, error: 'Username is required' };
      if (username.length < 3) return { valid: false, error: 'Username must be at least 3 characters' };
      if (username.length > 20) return { valid: false, error: 'Username must be at most 20 characters' };
      if (!/^[a-zA-Z0-9_]+$/.test(username)) return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
      return { valid: true };
    };

    test('should accept valid username', () => {
      const result = validateUsername('validUser123');
      expect(result.valid).toBe(true);
    });

    test('should reject short username', () => {
      const result = validateUsername('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 3 characters');
    });

    test('should reject long username', () => {
      const result = validateUsername('a'.repeat(21));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at most 20 characters');
    });

    test('should reject invalid characters', () => {
      const result = validateUsername('user@name');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('letters, numbers, and underscores');
    });

    test('should reject empty username', () => {
      const result = validateUsername('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('Email Validation', () => {
    const validateEmail = (email) => {
      if (!email) return { valid: false, error: 'Email is required' };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return { valid: false, error: 'Invalid email format' };
      return { valid: true };
    };

    test('should accept valid email', () => {
      const result = validateEmail('user@example.com');
      expect(result.valid).toBe(true);
    });

    test('should reject invalid email format', () => {
      const result = validateEmail('notanemail');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid email format');
    });

    test('should reject email without domain', () => {
      const result = validateEmail('user@');
      expect(result.valid).toBe(false);
    });

    test('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('Password Validation', () => {
    const validatePassword = (password) => {
      if (!password) return { valid: false, error: 'Password is required' };
      if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
      if (password.length > 72) return { valid: false, error: 'Password must be at most 72 characters' };
      return { valid: true };
    };

    test('should accept valid password', () => {
      const result = validatePassword('securePassword123');
      expect(result.valid).toBe(true);
    });

    test('should reject short password', () => {
      const result = validatePassword('pass');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 8 characters');
    });

    test('should reject very long password', () => {
      const result = validatePassword('a'.repeat(73));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at most 72 characters');
    });

    test('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });
  });
});
