const express = require('express');
const router = express.Router();
const { searchTasks, searchTeams, globalSearch } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @route   GET /api/search
router.get('/', globalSearch);

// @route   GET /api/search/tasks
router.get('/tasks', searchTasks);

// @route   GET /api/search/teams
router.get('/teams', searchTeams);

module.exports = router;
