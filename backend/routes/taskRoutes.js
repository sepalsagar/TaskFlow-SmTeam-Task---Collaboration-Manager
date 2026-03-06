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
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title max 200 chars'),
    body('description').optional().trim().isLength({ max: 5000 }).withMessage('Description max 5000 chars'),
    body('deadline').notEmpty().withMessage('Deadline is required').isISO8601().withMessage('Invalid date format'),
    body('team').notEmpty().withMessage('Team is required').isMongoId().withMessage('Invalid team ID'),
    body('assignedTo').optional().isMongoId().withMessage('Invalid user ID'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Priority must be Low, Medium, or High'),
    body('status').optional().isIn(['Pending', 'In Progress', 'Completed']).withMessage('Invalid status'),
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
  [body('status').notEmpty().withMessage('Status is required').isIn(['Pending', 'In Progress', 'Completed']).withMessage('Invalid status value')],
  updateTaskStatus
);

// @route   DELETE /api/tasks/:id
router.delete('/:id', deleteTask);

module.exports = router;
