/**
 * SEO Utilities
 * Helper functions for generating SEO-friendly meta tags and structured data
 */

const SITE_NAME = 'Educard Forum';
const SITE_DESCRIPTION = 'An educational discussion platform for students and educators to share knowledge and collaborate.';
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const DEFAULT_OG_IMAGE = '/images/og-default.png'; // Fallback image

/**
 * Generate page title with consistent format
 * @param {string} pageTitle - Page-specific title
 * @param {string} categoryName - Optional category name
 * @returns {string} Formatted title
 */
function generateTitle(pageTitle, categoryName = null) {
  if (!pageTitle || pageTitle === SITE_NAME) {
    return SITE_NAME;
  }
  
  if (categoryName) {
    return `${pageTitle} - ${categoryName} - ${SITE_NAME}`;
  }
  
  return `${pageTitle} - ${SITE_NAME}`;
}

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 160 for meta descriptions)
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 160) {
  if (!text) return '';
  
  // Remove HTML tags
  const plainText = text.replace(/<[^>]*>/g, '');
  
  // Remove excessive whitespace and newlines
  const cleaned = plainText.replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Truncate at word boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Generate meta description for a page
 * @param {string} content - Content to create description from
 * @param {string} fallback - Fallback description if content is empty
 * @returns {string} Meta description (max 160 chars)
 */
function generateDescription(content, fallback = SITE_DESCRIPTION) {
  if (!content) return truncateText(fallback);
  return truncateText(content, 160);
}

/**
 * Generate canonical URL
 * @param {string} path - URL path
 * @returns {string} Full canonical URL
 */
function generateCanonicalUrl(path) {
  // Remove query parameters for canonical URL
  const cleanPath = path.split('?')[0];
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Generate Open Graph meta tags data
 * @param {Object} options - OG tag options
 * @returns {Object} Open Graph data object
 */
function generateOpenGraph({
  title,
  description,
  type = 'website',
  url,
  image = DEFAULT_OG_IMAGE,
  imageAlt = SITE_NAME
}) {
  return {
    'og:type': type,
    'og:site_name': SITE_NAME,
    'og:title': title || SITE_NAME,
    'og:description': truncateText(description || SITE_DESCRIPTION, 200),
    'og:url': url || SITE_URL,
    'og:image': image.startsWith('http') ? image : `${SITE_URL}${image}`,
    'og:image:alt': imageAlt,
    // Twitter Card tags
    'twitter:card': 'summary_large_image',
    'twitter:title': title || SITE_NAME,
    'twitter:description': truncateText(description || SITE_DESCRIPTION, 200),
    'twitter:image': image.startsWith('http') ? image : `${SITE_URL}${image}`,
    'twitter:image:alt': imageAlt
  };
}

/**
 * Generate structured data (JSON-LD) for a forum thread
 * @param {Object} thread - Thread object with posts
 * @param {Object} category - Category object
 * @param {Array} posts - Array of post objects
 * @returns {Object} Structured data object
 */
function generateThreadStructuredData(thread, category, posts) {
  const firstPost = posts && posts.length > 0 ? posts[0] : null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    'headline': thread.title,
    'url': `${SITE_URL}/thread/${thread.slug}`,
    'datePublished': thread.createdAt,
    'dateModified': thread.updatedAt,
    'author': {
      '@type': 'Person',
      'name': thread.author ? thread.author.displayName || thread.author.username : 'Anonymous',
      'url': thread.author ? `${SITE_URL}/profile/${thread.author.username}` : undefined
    },
    'discussionUrl': `${SITE_URL}/thread/${thread.slug}`,
    'interactionStatistic': {
      '@type': 'InteractionCounter',
      'interactionType': 'https://schema.org/CommentAction',
      'userInteractionCount': posts ? posts.length - 1 : 0
    },
    'isPartOf': {
      '@type': 'WebPage',
      'name': category ? category.name : 'Forum',
      'url': category ? `${SITE_URL}/category/${category.slug}` : SITE_URL
    },
    'text': firstPost ? truncateText(firstPost.content, 300) : undefined
  };
}

/**
 * Generate structured data (JSON-LD) for a user profile
 * @param {Object} user - User object
 * @param {number} threadCount - Number of threads created
 * @param {number} postCount - Number of posts made
 * @returns {Object} Structured data object
 */
function generateProfileStructuredData(user, threadCount, postCount) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    'mainEntity': {
      '@type': 'Person',
      'name': user.displayName || user.username,
      'identifier': user.username,
      'url': `${SITE_URL}/profile/${user.username}`,
      'interactionStatistic': [
        {
          '@type': 'InteractionCounter',
          'interactionType': 'https://schema.org/CreateAction',
          'userInteractionCount': threadCount
        },
        {
          '@type': 'InteractionCounter',
          'interactionType': 'https://schema.org/CommentAction',
          'userInteractionCount': postCount
        }
      ]
    }
  };
}

/**
 * Generate BreadcrumbList structured data
 * @param {Array} breadcrumbs - Array of {name, url} objects
 * @returns {Object} Breadcrumb structured data
 */
function generateBreadcrumbStructuredData(breadcrumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': crumb.name,
      'item': `${SITE_URL}${crumb.url}`
    }))
  };
}

module.exports = {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  generateTitle,
  truncateText,
  generateDescription,
  generateCanonicalUrl,
  generateOpenGraph,
  generateThreadStructuredData,
  generateProfileStructuredData,
  generateBreadcrumbStructuredData
};
