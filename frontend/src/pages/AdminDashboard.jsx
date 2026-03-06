import React, { useState, useEffect } from 'react';
import { getAdminStats, getAdminUsers, updateUserRole, deleteUser, getAdminTeams } from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'teams') fetchTeams();
  }, [activeTab, userSearch, userRoleFilter, userPage]);

  const fetchStats = async () => {
    try {
      const res = await getAdminStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = { page: userPage, limit: 15 };
      if (userSearch) params.search = userSearch;
      if (userRoleFilter) params.role = userRoleFilter;
      const res = await getAdminUsers(params);
      setUsers(res.data.users);
      setUserPages(res.data.pages);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await getAdminTeams();
      setTeams(res.data);
    } catch (err) {
      console.error('Failed to load teams:', err);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;
    try {
      await updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This cannot be undone.`)) return;
    try {
      await deleteUser(userId);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) return <div className="page-container"><p>Loading admin dashboard...</p></div>;

  return (
    <div className="page-container">
      <h1>Admin Dashboard</h1>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
        <button className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>Teams</button>
        <button className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>Activity Log</button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div>
          <div className="stats-grid">
            <div className="stat-card stat-total">
              <h3>{stats.users.total}</h3>
              <p>Total Users</p>
            </div>
            <div className="stat-card stat-completed">
              <h3>{stats.teams.total}</h3>
              <p>Total Teams</p>
            </div>
            <div className="stat-card stat-progress">
              <h3>{stats.tasks.total}</h3>
              <p>Total Tasks</p>
            </div>
            <div className="stat-card stat-pending">
              <h3>{stats.tasks.completed}</h3>
              <p>Completed Tasks</p>
            </div>
            <div className="stat-card stat-overdue">
              <h3>{stats.tasks.overdue}</h3>
              <p>Overdue Tasks</p>
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Users by Role</h2>
            <div className="role-breakdown">
              <div className="role-item"><span className="role-badge admin">Admin</span> <strong>{stats.users.admins}</strong></div>
              <div className="role-item"><span className="role-badge leader">Team Leader</span> <strong>{stats.users.leaders}</strong></div>
              <div className="role-item"><span className="role-badge member">Member</span> <strong>{stats.users.members}</strong></div>
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Task Status Distribution</h2>
            <div className="status-dist">
              <div className="status-bar-row">
                <span>Completed</span>
                <div className="status-bar"><div className="status-fill completed" style={{ width: `${stats.tasks.total ? (stats.tasks.completed / stats.tasks.total * 100) : 0}%` }}></div></div>
                <span>{stats.tasks.completed}</span>
              </div>
              <div className="status-bar-row">
                <span>In Progress</span>
                <div className="status-bar"><div className="status-fill in-progress" style={{ width: `${stats.tasks.total ? (stats.tasks.inProgress / stats.tasks.total * 100) : 0}%` }}></div></div>
                <span>{stats.tasks.inProgress}</span>
              </div>
              <div className="status-bar-row">
                <span>Pending</span>
                <div className="status-bar"><div className="status-fill pending" style={{ width: `${stats.tasks.total ? (stats.tasks.pending / stats.tasks.total * 100) : 0}%` }}></div></div>
                <span>{stats.tasks.pending}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="filter-bar">
            <input type="text" placeholder="Search users..." value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }} />
            <select value={userRoleFilter} onChange={e => { setUserRoleFilter(e.target.value); setUserPage(1); }}>
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Team Leader">Team Leader</option>
              <option value="Member">Member</option>
            </select>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)}>
                      <option value="Admin">Admin</option>
                      <option value="Team Leader">Team Leader</option>
                      <option value="Member">Member</option>
                    </select>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u._id, u.name)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {userPages > 1 && (
            <div className="pagination">
              <button disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}>Prev</button>
              <span>Page {userPage} of {userPages}</span>
              <button disabled={userPage >= userPages} onClick={() => setUserPage(p => p + 1)}>Next</button>
            </div>
          )}
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Leader</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.leader?.name} ({t.leader?.email})</td>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && stats?.recentActivity && (
        <div className="dashboard-section">
          <ul className="activity-list">
            {stats.recentActivity.map(log => (
              <li key={log._id} className="activity-item">
                <span className="activity-action">{log.action}</span>
                <span className="activity-details">{log.details}</span>
                <span className="activity-user">{log.user?.name}</span>
                <span className="activity-time">{new Date(log.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
