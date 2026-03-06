import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getMyTasks, updateTaskStatus } from '../services/api';

const MyTasks = () => {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('kanban'); // kanban or list
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;

      const res = await getMyTasks(params);
      setTasks(res.data.tasks || res.data);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filters, page]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, { status: newStatus });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const isOverdue = (deadline, status) => {
    if (status === 'Completed') return false;
    return new Date(deadline) < new Date();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Group tasks by status for Kanban view
  const grouped = {
    Pending: tasks.filter((t) => t.status === 'Pending'),
    'In Progress': tasks.filter((t) => t.status === 'In Progress'),
    Completed: tasks.filter((t) => t.status === 'Completed'),
  };

  if (loading) return <div className="page-container"><p>Loading tasks...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Tasks</h1>
        <div className="view-toggle">
          <button
            className={`btn ${view === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('kanban')}
          >
            Kanban
          </button>
          <button
            className={`btn ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('list')}
          >
            List
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="filters-bar">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="kanban-board">
          {Object.entries(grouped).map(([status, statusTasks]) => (
            <div key={status} className={`kanban-column kanban-${status.toLowerCase().replace(' ', '-')}`}>
              <h3 className="kanban-header">
                {status} <span className="count">({statusTasks.length})</span>
              </h3>
              <div className="kanban-cards">
                {statusTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`kanban-card ${isOverdue(task.deadline, task.status) ? 'overdue' : ''}`}
                  >
                    <Link to={`/tasks/${task._id}`}>
                      <h4>{task.title}</h4>
                    </Link>
                    <div className="task-meta">
                      <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                      <span className={`deadline ${isOverdue(task.deadline, task.status) ? 'deadline-overdue' : ''}`}>
                        {isOverdue(task.deadline, task.status) && '⚠ '}
                        {formatDate(task.deadline)}
                      </span>
                    </div>
                    {task.team && <p className="text-muted">{task.team.name}</p>}
                    {status !== 'Completed' && (
                      <div className="task-actions">
                        {status === 'Pending' && (
                          <button
                            className="btn btn-sm btn-progress"
                            onClick={() => handleStatusChange(task._id, 'In Progress')}
                          >
                            Start
                          </button>
                        )}
                        {status === 'In Progress' && (
                          <button
                            className="btn btn-sm btn-complete"
                            onClick={() => handleStatusChange(task._id, 'Completed')}
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {statusTasks.length === 0 && (
                  <p className="empty-column">No tasks</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="task-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Deadline</th>
                <th>Team</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} className={isOverdue(task.deadline, task.status) ? 'overdue-row' : ''}>
                  <td><Link to={`/tasks/${task._id}`}>{task.title}</Link></td>
                  <td>
                    <span className={`badge badge-${task.status.toLowerCase().replace(' ', '-')}`}>
                      {task.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className={isOverdue(task.deadline, task.status) ? 'deadline-overdue' : ''}>
                    {isOverdue(task.deadline, task.status) && '⚠ '}
                    {formatDate(task.deadline)}
                  </td>
                  <td>{task.team?.name}</td>
                  <td>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && <p className="empty-state">No tasks found</p>}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default MyTasks;
