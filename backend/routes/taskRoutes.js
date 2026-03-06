const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createTask,
  getTasksByTeam,
  getMyTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @route   GET /api/tasks/my-tasks
router.get('/my-tasks', getMyTasks);

// @route   GET /api/tasks/team/:teamId
router.get('/team/:teamId', getTasksByTeam);

// @route   POST /api/tasks
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('deadline').notEmpty().withMessage('Deadline is required'),
    body('team').notEmpty().withMessage('Team is required'),
  ],
  createTask
);

// @route   GET /api/tasks/:id
router.get('/:id', getTaskById);

// @route   PUT /api/tasks/:id
router.put('/:id', updateTask);

// @route   PATCH /api/tasks/:id/status
router.patch(
  '/:id/status',
  [body('status').notEmpty().withMessage('Status is required')],
  updateTaskStatus
);

// @route   DELETE /api/tasks/:id
router.delete('/:id', deleteTask);

module.exports = router;
