const { marked } = require('marked');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const hljs = require('highlight.js');

// Create DOMPurify instance with JSDOM
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Configure marked options
 */
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error('Highlight.js error:', err);
      }
    }
    return hljs.highlightAuto(code).value;
  },
  langPrefix: 'hljs language-',
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
  headerIds: false, // Don't add IDs to headers
  mangle: false // Don't escape email addresses
});

/**
 * Process markdown content and sanitize HTML
 * @param {string} content - Raw markdown content
 * @returns {string} - Sanitized HTML output
 */
function processMarkdown(content) {
  if (!content) return '';
  
  try {
    // Convert markdown to HTML
    const rawHtml = marked.parse(content);
    
    // Sanitize HTML to prevent XSS attacks
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'del', 's', 'strike',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr',
        'span', 'div'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'alt', 'src',
        'class', 'id',
        'target', 'rel'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      ADD_ATTR: ['target'], // Allow target attribute for links
      FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'textarea', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });
    
    // Add target="_blank" and rel="noopener noreferrer" to external links
    return cleanHtml.replace(
      /<a href="http/g,
      '<a target="_blank" rel="noopener noreferrer" href="http'
    );
  } catch (error) {
    console.error('Markdown processing error:', error);
    // Return escaped plain text as fallback
    return escapeHtml(content);
  }
}

/**
 * Escape HTML special characters
 * @param {string} text - Plain text
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Strip markdown formatting and return plain text
 * @param {string} content - Markdown content
 * @returns {string} - Plain text
 */
function stripMarkdown(content) {
  if (!content) return '';
  
  return content
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/~~(.+?)~~/g, '$1') // Remove strikethrough
    .replace(/`(.+?)`/g, '$1') // Remove inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
    .replace(/!\[.+?\]\(.+?\)/g, '') // Remove images
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/^\s*[-*+]\s/gm, '') // Remove list markers
    .replace(/^\s*\d+\.\s/gm, '') // Remove numbered list markers
    .replace(/^\s*>\s/gm, '') // Remove blockquotes
    .trim();
}

module.exports = {
  processMarkdown,
  stripMarkdown,
  escapeHtml
};
