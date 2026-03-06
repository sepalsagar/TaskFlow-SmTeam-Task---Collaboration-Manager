const ActivityLog = require('../models/ActivityLog');

// @desc    Get activity logs
// @route   GET /api/activity
// @access  Private
const getActivityLogs = async (req, res) => {
  try {
    const { team, task, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (team) filter.team = team;
    if (task) filter.task = task;

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .populate('user', 'name email')
      .populate('task', 'title')
      .populate('team', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get activity logs error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getActivityLogs };
