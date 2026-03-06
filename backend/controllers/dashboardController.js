const Task = require('../models/Task');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get dashboard stats for logged-in user
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get teams the user belongs to
    const memberships = await TeamMember.find({ user: userId }).select('team');
    const teamIds = memberships.map(m => m.team);

    // Get teams the user leads
    const ledTeams = await Team.find({ leader: userId }).select('_id');
    const ledTeamIds = ledTeams.map(t => t._id);

    // Combine unique team IDs
    const allTeamIds = [...new Set([...teamIds.map(String), ...ledTeamIds.map(String)])];

    // Task stats
    const totalAssigned = await Task.countDocuments({ assignedTo: userId });
    const completedTasks = await Task.countDocuments({ assignedTo: userId, status: 'Completed' });
    const inProgressTasks = await Task.countDocuments({ assignedTo: userId, status: 'In Progress' });
    const pendingTasks = await Task.countDocuments({ assignedTo: userId, status: 'Pending' });
    const overdueTasks = await Task.countDocuments({
      assignedTo: userId,
      status: { $ne: 'Completed' },
      deadline: { $lt: new Date() },
    });

    // Priority breakdown
    const highPriority = await Task.countDocuments({ assignedTo: userId, priority: 'High', status: { $ne: 'Completed' } });
    const mediumPriority = await Task.countDocuments({ assignedTo: userId, priority: 'Medium', status: { $ne: 'Completed' } });
    const lowPriority = await Task.countDocuments({ assignedTo: userId, priority: 'Low', status: { $ne: 'Completed' } });

    // Recent activity
    const recentActivity = await ActivityLog.find({ user: userId })
      .populate('task', 'title')
      .populate('team', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Upcoming deadlines
    const upcomingDeadlines = await Task.find({
      assignedTo: userId,
      status: { $ne: 'Completed' },
      deadline: { $gte: new Date() },
    })
      .populate('team', 'name')
      .sort({ deadline: 1 })
      .limit(5);

    res.json({
      taskStats: {
        total: totalAssigned,
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
      },
      priorityBreakdown: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority,
      },
      teamCount: allTeamIds.length,
      recentActivity,
      upcomingDeadlines,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDashboardStats };
