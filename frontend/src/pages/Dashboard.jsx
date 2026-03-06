import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getMyTeams } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, teamsRes] = await Promise.all([
          getDashboardStats(),
          getMyTeams(),
        ]);
        setStats(statsRes.data);
        setTeams(teamsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="page-container"><p>Loading dashboard...</p></div>;

  return (
    <div className="page-container">
      <h1>Welcome back, {user?.name}!</h1>

      {/* Task Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <h3>{stats?.taskStats?.total || 0}</h3>
          <p>Total Tasks</p>
        </div>
        <div className="stat-card stat-completed">
          <h3>{stats?.taskStats?.completed || 0}</h3>
          <p>Completed</p>
        </div>
        <div className="stat-card stat-progress">
          <h3>{stats?.taskStats?.inProgress || 0}</h3>
          <p>In Progress</p>
        </div>
        <div className="stat-card stat-pending">
          <h3>{stats?.taskStats?.pending || 0}</h3>
          <p>Pending</p>
        </div>
        <div className="stat-card stat-overdue">
          <h3>{stats?.taskStats?.overdue || 0}</h3>
          <p>Overdue</p>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="dashboard-section">
        <h2>Priority Breakdown</h2>
        <div className="priority-bars">
          <div className="priority-bar-row">
            <span className="priority-label high">High</span>
            <div className="priority-bar">
              <div className="priority-fill high" style={{ width: `${stats?.priorityBreakdown?.high ? Math.min(stats.priorityBreakdown.high * 20, 100) : 0}%` }}></div>
            </div>
            <span className="priority-count">{stats?.priorityBreakdown?.high || 0}</span>
          </div>
          <div className="priority-bar-row">
            <span className="priority-label medium">Medium</span>
            <div className="priority-bar">
              <div className="priority-fill medium" style={{ width: `${stats?.priorityBreakdown?.medium ? Math.min(stats.priorityBreakdown.medium * 20, 100) : 0}%` }}></div>
            </div>
            <span className="priority-count">{stats?.priorityBreakdown?.medium || 0}</span>
          </div>
          <div className="priority-bar-row">
            <span className="priority-label low">Low</span>
            <div className="priority-bar">
              <div className="priority-fill low" style={{ width: `${stats?.priorityBreakdown?.low ? Math.min(stats.priorityBreakdown.low * 20, 100) : 0}%` }}></div>
            </div>
            <span className="priority-count">{stats?.priorityBreakdown?.low || 0}</span>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="dashboard-section">
        <h2>Upcoming Deadlines</h2>
        {stats?.upcomingDeadlines?.length > 0 ? (
          <div className="deadline-list">
            {stats.upcomingDeadlines.map(task => (
              <Link key={task._id} to={`/tasks/${task._id}`} className="deadline-item">
                <span className="deadline-title">{task.title}</span>
                <span className="deadline-team">{task.team?.name}</span>
                <span className="deadline-date">{new Date(task.deadline).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-text">No upcoming deadlines. You're all caught up!</p>
        )}
      </div>

      {/* My Teams */}
      <div className="dashboard-section">
        <h2>My Teams ({teams.length})</h2>
        {teams.length > 0 ? (
          <div className="team-cards-grid">
            {teams.slice(0, 6).map(team => (
              <Link key={team._id} to={`/teams/${team._id}`} className="team-card-mini">
                <h4>{team.name}</h4>
                <p>{team.description?.substring(0, 60) || 'No description'}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-text">You're not part of any teams yet. <Link to="/teams">Browse teams</Link></p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section">
        <h2>Recent Activity</h2>
        {stats?.recentActivity?.length > 0 ? (
          <ul className="activity-list">
            {stats.recentActivity.map(log => (
              <li key={log._id} className="activity-item">
                <span className="activity-action">{log.action}</span>
                <span className="activity-details">{log.details}</span>
                <span className="activity-time">{new Date(log.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-text">No recent activity.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
