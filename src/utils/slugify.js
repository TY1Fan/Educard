/**
 * Slug Generation Utility
 * Creates URL-friendly slugs from strings
 */

/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to slugify
 * @returns {string} - URL-friendly slug
 * 
 * @example
 * slugify('Hello World') // 'hello-world'
 * slugify('My First Thread!') // 'my-first-thread'
 * slugify('Questions & Answers') // 'questions-answers'
 */
function slugify(text) {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')                // Normalize Unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\s+/g, '-')            // Replace spaces with -
    .replace(/[^\w\-]+/g, '')        // Remove all non-word chars except -
    .replace(/\-\-+/g, '-')          // Replace multiple - with single -
    .replace(/^-+/, '')              // Trim - from start of text
    .replace(/-+$/, '');             // Trim - from end of text
}

/**
 * Generate a unique slug by checking against existing slugs
 * Useful for in-memory slug uniqueness checking
 * 
 * @param {string} text - The text to slugify
 * @param {Array<string>} existingSlugs - Array of existing slugs to check against
 * @returns {string} - Unique slug
 * 
 * @example
 * uniqueSlug('My Thread', ['my-thread']) // 'my-thread-1'
 * uniqueSlug('My Thread', ['my-thread', 'my-thread-1']) // 'my-thread-2'
 */
function uniqueSlug(text, existingSlugs = []) {
  let slug = slugify(text);
  let counter = 1;
  const originalSlug = slug;

  while (existingSlugs.includes(slug)) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Generate a unique slug using database model
 * Checks database for existing slugs and appends counter if needed
 * 
 * @param {string} text - The text to slugify  
 * @param {Object} Model - Sequelize model to check against
 * @param {Object} whereClause - Additional where conditions (e.g., { categoryId: 1 })
 * @returns {Promise<string>} - Unique slug
 * 
 * @example
 * await uniqueSlugFromDB('My Thread', Thread, { categoryId: 1 })
 * // Checks if 'my-thread' exists in threads with categoryId=1
 * // Returns 'my-thread' or 'my-thread-1', 'my-thread-2', etc.
 */
async function uniqueSlugFromDB(text, Model, whereClause = {}) {
  let slug = slugify(text);
  let counter = 1;
  const originalSlug = slug;

  // Keep checking until we find a unique slug
  while (true) {
    const existing = await Model.findOne({ 
      where: { slug, ...whereClause },
      attributes: ['id', 'slug'] // Only fetch what we need
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${originalSlug}-${counter}`;
    counter++;
    
    // Safety limit to prevent infinite loops
    if (counter > 1000) {
      throw new Error('Could not generate unique slug after 1000 attempts');
    }
  }
}

module.exports = {
  slugify,
  uniqueSlug,
  uniqueSlugFromDB
};
