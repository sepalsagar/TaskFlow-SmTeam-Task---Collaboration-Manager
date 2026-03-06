const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/upload');

router.use(protect);

// @desc    Upload attachment to a task
// @route   POST /api/upload/task/:taskId
// @access  Private
router.post('/task/:taskId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      // Clean up uploaded file if task not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Task not found' });
    }

    const attachment = {
      filename: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      mimetype: req.file.mimetype,
      size: req.file.size,
    };

    task.attachments.push(attachment);
    await task.save();

    await ActivityLog.create({
      action: 'File Uploaded',
      details: `File "${req.file.originalname}" uploaded to task "${task.title}"`,
      user: req.user._id,
      task: task._id,
      team: task.team,
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      attachment,
    });
  } catch (error) {
    // Clean up file on error
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    console.error('Upload error:', error.message);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @desc    Delete attachment from a task
// @route   DELETE /api/upload/task/:taskId/attachment/:index
// @access  Private
router.delete('/task/:taskId/attachment/:index', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const index = parseInt(req.params.index);
    if (index < 0 || index >= task.attachments.length) {
      return res.status(400).json({ message: 'Invalid attachment index' });
    }

    const attachment = task.attachments[index];

    // Delete file from disk
    const filePath = path.join(__dirname, '..', attachment.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    task.attachments.splice(index, 1);
    await task.save();

    await ActivityLog.create({
      action: 'File Deleted',
      details: `File "${attachment.filename}" removed from task "${task.title}"`,
      user: req.user._id,
      task: task._id,
      team: task.team,
    });

    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete attachment error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
