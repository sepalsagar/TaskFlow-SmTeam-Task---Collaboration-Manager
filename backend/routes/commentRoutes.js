const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { addComment, getCommentsByTask, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @route   POST /api/comments
router.post(
  '/',
  [
    body('text').trim().notEmpty().withMessage('Comment text is required'),
    body('task').notEmpty().withMessage('Task ID is required'),
  ],
  addComment
);

// @route   GET /api/comments/task/:taskId
router.get('/task/:taskId', getCommentsByTask);

// @route   DELETE /api/comments/:id
router.delete('/:id', deleteComment);

module.exports = router;
