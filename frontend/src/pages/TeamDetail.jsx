import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getTeamById,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  getTasksByTeam,
} from '../services/api';

const TeamDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const isLeader = team?.leader?._id === user?._id || user?.role === 'Admin';

  const fetchData = async () => {
    try {
      const [teamRes, membersRes, tasksRes] = await Promise.all([
        getTeamById(id),
        getTeamMembers(id),
        getTasksByTeam(id),
      ]);
      setTeam(teamRes.data);
      setMembers(membersRes.data);
      setTasks(tasksRes.data.tasks || tasksRes.data);
    } catch (err) {
      setError('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await addTeamMember(id, { email });
      setEmail('');
      setSuccess('Member added successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    setError('');
    try {
      await removeTeamMember(id, userId);
      setSuccess('Member removed');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;
  if (!team) return <div className="page-container"><p>Team not found</p></div>;

  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>{team.name}</h1>
          <p>{team.description || 'No description'}</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Team Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{members.length}</h3>
          <p>Members</p>
        </div>
        <div className="stat-card">
          <h3>{tasks.length}</h3>
          <p>Total Tasks</p>
        </div>
        <div className="stat-card stat-pending">
          <h3>{pendingTasks}</h3>
          <p>Pending</p>
        </div>
        <div className="stat-card stat-progress">
          <h3>{inProgressTasks}</h3>
          <p>In Progress</p>
        </div>
        <div className="stat-card stat-completed">
          <h3>{completedTasks}</h3>
          <p>Completed</p>
        </div>
      </div>

      {/* Add Member */}
      {isLeader && (
        <div className="card form-card">
          <h3>Add Team Member</h3>
          <form onSubmit={handleAddMember} className="inline-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter member's email"
              required
            />
            <button type="submit" className="btn btn-primary">Add Member</button>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="card">
        <h3>Team Members</h3>
        <div className="members-list">
          {members.map((m) => (
            <div key={m._id} className="member-item">
              <div>
                <strong>{m.user?.name}</strong>
                <span className="text-muted"> — {m.user?.email}</span>
                <span className={`badge badge-${m.role === 'Team Leader' ? 'leader' : 'member'}`}>
                  {m.role}
                </span>
              </div>
              {isLeader && m.role !== 'Team Leader' && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemoveMember(m.user?._id)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tasks Preview */}
      <div className="card">
        <div className="card-header">
          <h3>Team Tasks</h3>
          <Link to={`/tasks?team=${id}`} className="btn btn-secondary">View All Tasks</Link>
        </div>
        {tasks.length === 0 ? (
          <p className="empty-state">No tasks yet</p>
        ) : (
          <div className="task-list">
            {tasks.slice(0, 5).map((task) => (
              <Link to={`/tasks/${task._id}`} key={task._id} className="task-item">
                <div className="task-info">
                  <strong>{task.title}</strong>
                  <span className={`badge badge-${task.status.toLowerCase().replace(' ', '-')}`}>
                    {task.status}
                  </span>
                  <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                </div>
                {task.assignedTo && (
                  <span className="text-muted">Assigned to: {task.assignedTo.name}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;
