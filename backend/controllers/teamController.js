const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { validationResult } = require('express-validator');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private (Team Leader, Admin)
const createTeam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const team = await Team.create({
      name,
      description: description || '',
      leader: req.user._id,
    });

    // Automatically add creator as team leader member
    await TeamMember.create({
      team: team._id,
      user: req.user._id,
      role: 'Team Leader',
    });

    // Update user role to Team Leader if they are a Member
    if (req.user.role === 'Member') {
      await User.findByIdAndUpdate(req.user._id, { role: 'Team Leader' });
    }

    // Log activity
    await ActivityLog.create({
      action: 'Team Created',
      details: `Team "${name}" was created`,
      user: req.user._id,
      team: team._id,
    });

    const populatedTeam = await Team.findById(team._id).populate('leader', 'name email');
    res.status(201).json(populatedTeam);
  } catch (error) {
    console.error('Create team error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get teams for logged-in user
// @route   GET /api/teams/my-teams
// @access  Private
const getMyTeams = async (req, res) => {
  try {
    const memberships = await TeamMember.find({ user: req.user._id }).select('team');
    const teamIds = memberships.map((m) => m.team);

    const teams = await Team.find({ _id: { $in: teamIds } })
      .populate('leader', 'name email')
      .sort({ createdAt: -1 });

    res.json(teams);
  } catch (error) {
    console.error('Get my teams error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Private
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('leader', 'name email');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a member of the team or Admin
    const isMember = await TeamMember.findOne({
      team: team._id,
      user: req.user._id,
    });

    if (!isMember && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to view this team' });
    }

    res.json(team);
  } catch (error) {
    console.error('Get team error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add member to team
// @route   POST /api/teams/:id/members
// @access  Private (Team Leader of that team, Admin)
const addTeamMember = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Only team leader or admin can add members
    if (team.leader.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only team leader can add members' });
    }

    const { email } = req.body;
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Check for duplicate membership
    const existingMember = await TeamMember.findOne({
      team: team._id,
      user: userToAdd._id,
    });
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this team' });
    }

    const member = await TeamMember.create({
      team: team._id,
      user: userToAdd._id,
      role: 'Member',
    });

    // Log activity
    await ActivityLog.create({
      action: 'Member Added',
      details: `${userToAdd.name} was added to team "${team.name}"`,
      user: req.user._id,
      team: team._id,
    });

    const populatedMember = await TeamMember.findById(member._id)
      .populate('user', 'name email role');

    res.status(201).json(populatedMember);
  } catch (error) {
    console.error('Add member error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get team members
// @route   GET /api/teams/:id/members
// @access  Private
const getTeamMembers = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const members = await TeamMember.find({ team: team._id })
      .populate('user', 'name email role')
      .sort({ role: 1, joinedAt: 1 });

    res.json(members);
  } catch (error) {
    console.error('Get members error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private (Team Leader, Admin)
const removeTeamMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Only team leader or admin can remove members
    if (team.leader.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only team leader can remove members' });
    }

    // Can't remove the team leader
    if (req.params.userId === team.leader.toString()) {
      return res.status(400).json({ message: 'Cannot remove the team leader' });
    }

    const member = await TeamMember.findOneAndDelete({
      team: team._id,
      user: req.params.userId,
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found in this team' });
    }

    const removedUser = await User.findById(req.params.userId);

    // Log activity
    await ActivityLog.create({
      action: 'Member Removed',
      details: `${removedUser?.name || 'User'} was removed from team "${team.name}"`,
      user: req.user._id,
      team: team._id,
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update team info
// @route   PUT /api/teams/:id
// @access  Private (Team Leader, Admin)
const updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only team leader can update team' });
    }

    const { name, description } = req.body;
    if (name) team.name = name;
    if (description !== undefined) team.description = description;

    await team.save();

    const updatedTeam = await Team.findById(team._id).populate('leader', 'name email');
    res.json(updatedTeam);
  } catch (error) {
    console.error('Update team error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTeam,
  getMyTeams,
  getTeamById,
  addTeamMember,
  getTeamMembers,
  removeTeamMember,
  updateTeam,
};
