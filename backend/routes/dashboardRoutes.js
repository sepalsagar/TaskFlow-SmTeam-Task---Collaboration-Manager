const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @route   GET /api/dashboard/stats
router.get('/stats', getDashboardStats);

module.exports = router;
