const { Category, Thread, User } = require('../models');
const { SITE_URL } = require('../utils/seo');

/**
 * Sitemap Controller
 * Generates XML sitemap for search engines
 */

/**
 * Generate and serve sitemap.xml
 */
exports.generateSitemap = async (req, res) => {
  try {
    // Fetch all categories
    const categories = await Category.findAll({
      attributes: ['slug', 'updatedAt'],
      order: [['createdAt', 'ASC']]
    });

    // Fetch all threads (limit to recent 5000 for performance)
    const threads = await Thread.findAll({
      attributes: ['slug', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit: 5000
    });

    // Fetch all user profiles (limit to recent 1000)
    const users = await User.findAll({
      attributes: ['username', 'updatedAt'],
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
      limit: 1000
    });

    // Build sitemap XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Homepage
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}/</loc>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Categories
    categories.forEach(category => {
      xml += '  <url>\n';
      xml += `    <loc>${SITE_URL}/category/${category.slug}</loc>\n`;
      xml += `    <lastmod>${new Date(category.updatedAt).toISOString()}</lastmod>\n`;
      xml += '    <changefreq>hourly</changefreq>\n';
      xml += '    <priority>0.9</priority>\n';
      xml += '  </url>\n';
    });

    // Threads
    threads.forEach(thread => {
      xml += '  <url>\n';
      xml += `    <loc>${SITE_URL}/thread/${thread.slug}</loc>\n`;
      xml += `    <lastmod>${new Date(thread.updatedAt).toISOString()}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    // User profiles
    users.forEach(user => {
      xml += '  <url>\n';
      xml += `    <loc>${SITE_URL}/profile/${user.username}</loc>\n`;
      xml += `    <lastmod>${new Date(user.updatedAt).toISOString()}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    // Set appropriate headers
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(xml);

  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
};

/**
 * Generate robots.txt dynamically (optional)
 */
exports.generateRobotsTxt = (req, res) => {
  const robotsTxt = `# Educard Forum - Robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /auth/
Disallow: /profile/edit

Sitemap: ${SITE_URL}/sitemap.xml
`;

  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
};
