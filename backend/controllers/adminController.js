const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeams = await Team.countDocuments();
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'Completed' });
    const inProgressTasks = await Task.countDocuments({ status: 'In Progress' });
    const pendingTasks = await Task.countDocuments({ status: 'Pending' });
    const overdueTasks = await Task.countDocuments({
      status: { $ne: 'Completed' },
      deadline: { $lt: new Date() },
    });

    // Users by role
    const admins = await User.countDocuments({ role: 'Admin' });
    const leaders = await User.countDocuments({ role: 'Team Leader' });
    const members = await User.countDocuments({ role: 'Member' });

    // Recent activity (system-wide)
    const recentActivity = await ActivityLog.find()
      .populate('user', 'name email')
      .populate('task', 'title')
      .populate('team', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      users: { total: totalUsers, admins, leaders, members },
      teams: { total: totalTeams },
      tasks: { total: totalTasks, completed: completedTasks, inProgress: inProgressTasks, pending: pendingTasks, overdue: overdueTasks },
      recentActivity,
    });
  } catch (error) {
    console.error('Admin stats error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get all users error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['Admin', 'Team Leader', 'Member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    await ActivityLog.create({
      action: 'Role Updated',
      details: `${user.name} role changed to ${role}`,
      user: req.user._id,
    });

    res.json(user);
  } catch (error) {
    console.error('Update role error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    await User.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      action: 'User Deleted',
      details: `User ${user.name} (${user.email}) was deleted`,
      user: req.user._id,
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all teams (admin)
// @route   GET /api/admin/teams
// @access  Private (Admin only)
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('leader', 'name email')
      .sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    console.error('Get all teams error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAdminStats, getAllUsers, updateUserRole, deleteUser, getAllTeams };
