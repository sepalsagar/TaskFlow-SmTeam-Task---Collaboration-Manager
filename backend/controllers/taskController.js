const Task = require('../models/Task');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const ActivityLog = require('../models/ActivityLog');
const { validationResult } = require('express-validator');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Team Leader, Admin)
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, priority, deadline, team, assignedTo } = req.body;

    // Verify team exists
    const teamDoc = await Team.findById(team);
    if (!teamDoc) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is team leader or admin
    if (teamDoc.leader.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only team leader can create tasks' });
    }

    // If assigning, verify assignee is a team member
    if (assignedTo) {
      const isMember = await TeamMember.findOne({ team, user: assignedTo });
      if (!isMember) {
        return res.status(400).json({ message: 'Assigned user is not a member of this team' });
      }
    }

    const task = await Task.create({
      title,
      description: description || '',
      priority: priority || 'Medium',
      deadline,
      team,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status: 'Pending',
    });

    // Log activity
    await ActivityLog.create({
      action: 'Task Created',
      details: `Task "${title}" was created in team "${teamDoc.name}"`,
      user: req.user._id,
      task: task._id,
      team,
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('team', 'name');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create task error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get tasks by team
// @route   GET /api/tasks/team/:teamId
// @access  Private
const getTasksByTeam = async (req, res) => {
  try {
    const { status, priority, assignedTo, search, page = 1, limit = 20 } = req.query;

    const filter = { team: req.params.teamId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      tasks,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get tasks error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get tasks assigned to current user
// @route   GET /api/tasks/my-tasks
// @access  Private
const getMyTasks = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 20 } = req.query;

    const filter = { assignedTo: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('team', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      tasks,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get my tasks error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('team', 'name leader');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update task (full update)
// @route   PUT /api/tasks/:id
// @access  Private (Team Leader, Admin)
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('team');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only team leader or admin
    if (task.team.leader.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only team leader can update tasks' });
    }

    const { title, description, priority, deadline, assignedTo, status } = req.body;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = deadline;
    if (status) task.status = status;
    if (assignedTo !== undefined) {
      // Verify assignee is team member
      if (assignedTo) {
        const isMember = await TeamMember.findOne({ team: task.team._id, user: assignedTo });
        if (!isMember) {
          return res.status(400).json({ message: 'Assigned user is not a team member' });
        }
      }
      task.assignedTo = assignedTo;
    }

    await task.save();

    // Log activity
    await ActivityLog.create({
      action: 'Task Updated',
      details: `Task "${task.title}" was updated`,
      user: req.user._id,
      task: task._id,
      team: task.team._id,
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('team', 'name');

    res.json(populated);
  } catch (error) {
    console.error('Update task error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update task status only
// @route   PATCH /api/tasks/:id/status
// @access  Private (assigned user, Team Leader, Admin)
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await Task.findById(req.params.id).populate('team');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Allow assigned user, team leader, or admin
    const isAssigned = task.assignedTo?.toString() === req.user._id.toString();
    const isLeader = task.team.leader.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isAssigned && !isLeader && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this task status' });
    }

    const oldStatus = task.status;
    task.status = status;
    await task.save();

    // Log activity
    await ActivityLog.create({
      action: 'Status Changed',
      details: `Task "${task.title}" status changed from "${oldStatus}" to "${status}"`,
      user: req.user._id,
      task: task._id,
      team: task.team._id,
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('team', 'name');

    res.json(populated);
  } catch (error) {
    console.error('Update status error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Team Leader, Admin)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('team');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.team.leader.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only team leader can delete tasks' });
    }

    await Task.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      action: 'Task Deleted',
      details: `Task "${task.title}" was deleted`,
      user: req.user._id,
      team: task.team._id,
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTask,
  getTasksByTeam,
  getMyTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
