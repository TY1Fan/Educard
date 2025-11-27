const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { cacheSearch } = require('../middleware/cache');

/**
 * GET /search - Display search results (with cache)
 */
router.get('/', cacheSearch(), searchController.search);

module.exports = router;
