const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createTeam,
  getMyTeams,
  getTeamById,
  addTeamMember,
  getTeamMembers,
  removeTeamMember,
  updateTeam,
} = require('../controllers/teamController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// @route   GET /api/teams/my-teams
router.get('/my-teams', getMyTeams);

// @route   POST /api/teams
router.post(
  '/',
  authorizeRoles('Team Leader', 'Admin'),
  [body('name').trim().notEmpty().withMessage('Team name is required')],
  createTeam
);

// @route   GET /api/teams/:id
router.get('/:id', getTeamById);

// @route   PUT /api/teams/:id
router.put('/:id', updateTeam);

// @route   POST /api/teams/:id/members
router.post(
  '/:id/members',
  [body('email').isEmail().withMessage('Valid email is required')],
  addTeamMember
);

// @route   GET /api/teams/:id/members
router.get('/:id/members', getTeamMembers);

// @route   DELETE /api/teams/:id/members/:userId
router.delete('/:id/members/:userId', removeTeamMember);

module.exports = router;
