import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyTeams, createTeam } from '../services/api';

const Teams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const fetchTeams = async () => {
    try {
      const res = await getMyTeams();
      setTeams(res.data);
    } catch (err) {
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createTeam(formData);
      setFormData({ name: '', description: '' });
      setShowForm(false);
      fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    }
  };

  if (loading) return <div className="page-container"><p>Loading teams...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Teams</h1>
        {(user.role === 'Team Leader' || user.role === 'Admin') && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Create Team'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card form-card">
          <h3>Create New Team</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Team Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter team name"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Team description (optional)"
                rows={3}
              />
            </div>
            <button type="submit" className="btn btn-primary">Create Team</button>
          </form>
        </div>
      )}

      <div className="grid">
        {teams.length === 0 ? (
          <p className="empty-state">No teams found. Join or create a team to get started!</p>
        ) : (
          teams.map((team) => (
            <Link to={`/teams/${team._id}`} key={team._id} className="card team-card">
              <h3>{team.name}</h3>
              <p>{team.description || 'No description'}</p>
              <div className="card-footer">
                <span className="badge">Leader: {team.leader?.name}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Teams;
