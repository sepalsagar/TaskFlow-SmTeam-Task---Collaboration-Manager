const Task = require('../models/Task');
const Team = require('../models/Team');
const User = require('../models/User');
const TeamMember = require('../models/TeamMember');

// @desc    Search tasks
// @route   GET /api/search/tasks
// @access  Private
const searchTasks = async (req, res) => {
  try {
    const { q, status, priority, team, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    // Get user's team IDs for scoping
    const memberships = await TeamMember.find({ user: userId }).select('team');
    const ledTeams = await Team.find({ leader: userId }).select('_id');
    const userTeamIds = [
      ...memberships.map(m => m.team.toString()),
      ...ledTeams.map(t => t._id.toString()),
    ];
    const uniqueTeamIds = [...new Set(userTeamIds)];

    const filter = {};

    // Admin can search all; others scoped to their teams
    if (req.user.role !== 'Admin') {
      filter.team = { $in: uniqueTeamIds };
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (team) filter.team = team;

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('team', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ tasks, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Search tasks error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search teams
// @route   GET /api/search/teams
// @access  Private
const searchTeams = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const total = await Team.countDocuments(filter);
    const teams = await Team.find(filter)
      .populate('leader', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ teams, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Search teams error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Global search across tasks and teams
// @route   GET /api/search
// @access  Private
const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const regex = { $regex: q, $options: 'i' };

    const [tasks, teams] = await Promise.all([
      Task.find({ $or: [{ title: regex }, { description: regex }] })
        .populate('team', 'name')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      Team.find({ $or: [{ name: regex }, { description: regex }] })
        .populate('leader', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({ tasks, teams });
  } catch (error) {
    console.error('Global search error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { searchTasks, searchTeams, globalSearch };
