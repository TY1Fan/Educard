const express = require('express');
const router = express.Router();
const sitemapController = require('../controllers/sitemapController');

/**
 * Sitemap Routes
 */

// Generate and serve sitemap.xml
router.get('/sitemap.xml', sitemapController.generateSitemap);

// Optional: Dynamic robots.txt (though we have static one in public/)
// router.get('/robots.txt', sitemapController.generateRobotsTxt);

module.exports = router;
