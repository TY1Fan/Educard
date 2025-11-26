const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

/**
 * GET /search - Display search results
 */
router.get('/', searchController.search);

module.exports = router;
