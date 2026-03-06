const Comment = require('../models/Comment');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { validationResult } = require('express-validator');

// @desc    Add comment to a task
// @route   POST /api/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, task } = req.body;

    const taskDoc = await Task.findById(task);
    if (!taskDoc) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = await Comment.create({
      text,
      task,
      user: req.user._id,
    });

    // Log activity
    await ActivityLog.create({
      action: 'Comment Added',
      details: `Comment added on task "${taskDoc.title}"`,
      user: req.user._id,
      task: task,
      team: taskDoc.team,
    });

    const populated = await Comment.findById(comment._id)
      .populate('user', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Add comment error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get comments for a task
// @route   GET /api/comments/task/:taskId
// @access  Private
const getCommentsByTask = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (comment author or Admin)
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addComment, getCommentsByTask, deleteComment };
