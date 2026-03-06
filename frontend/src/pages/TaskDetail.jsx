import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getComments,
  addComment,
  deleteComment,
  uploadTaskFile,
} from '../services/api';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);

  const fetchTask = async () => {
    try {
      const [taskRes, commentsRes] = await Promise.all([
        getTaskById(id),
        getComments(id),
      ]);
      setTask(taskRes.data);
      setComments(commentsRes.data);
      setEditData({
        title: taskRes.data.title,
        description: taskRes.data.description,
        priority: taskRes.data.priority,
        deadline: taskRes.data.deadline?.split('T')[0],
        status: taskRes.data.status,
      });
    } catch (err) {
      setError('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const isLeader =
    task?.team?.leader === user?._id ||
    task?.team?.leader?._id === user?._id ||
    user?.role === 'Admin';
  const isAssigned = task?.assignedTo?._id === user?._id;
  const canChangeStatus = isAssigned || isLeader;

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTaskStatus(id, { status: newStatus });
      fetchTask();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await updateTask(id, editData);
      setEditing(false);
      fetchTask();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addComment({ text: newComment, task: id });
      setNewComment('');
      fetchTask();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      fetchTask();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await uploadTaskFile(id, formData);
      setFile(null);
      fetchTask();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file');
    }
  };

  const isOverdue = task && task.status !== 'Completed' && new Date(task.deadline) < new Date();

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (loading) return <div className="page-container"><p>Loading...</p></div>;
  if (!task) return <div className="page-container"><p>Task not found</p></div>;

  return (
    <div className="page-container">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="task-detail">
        {!editing ? (
          <>
            <div className="task-detail-header">
              <h1>{task.title}</h1>
              <div className="task-badges">
                <span className={`badge badge-${task.status.toLowerCase().replace(' ', '-')}`}>
                  {task.status}
                </span>
                <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>
                  {task.priority}
                </span>
                {isOverdue && <span className="badge badge-overdue">OVERDUE</span>}
              </div>
            </div>

            <div className="task-info-grid">
              <div><strong>Team:</strong> {task.team?.name}</div>
              <div><strong>Assigned To:</strong> {task.assignedTo?.name || 'Unassigned'}</div>
              <div><strong>Created By:</strong> {task.createdBy?.name}</div>
              <div className={isOverdue ? 'deadline-overdue' : ''}>
                <strong>Deadline:</strong> {formatDate(task.deadline)}
              </div>
              <div><strong>Created:</strong> {formatDate(task.createdAt)}</div>
            </div>

            {task.description && (
              <div className="task-description">
                <h3>Description</h3>
                <p>{task.description}</p>
              </div>
            )}

            {/* Status Change */}
            {canChangeStatus && task.status !== 'Completed' && (
              <div className="task-actions">
                {task.status === 'Pending' && (
                  <button className="btn btn-progress" onClick={() => handleStatusChange('In Progress')}>
                    Start Working
                  </button>
                )}
                {task.status === 'In Progress' && (
                  <button className="btn btn-complete" onClick={() => handleStatusChange('Completed')}>
                    Mark Complete
                  </button>
                )}
              </div>
            )}

            {isLeader && (
              <div className="task-actions">
                <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>
                <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
              </div>
            )}
          </>
        ) : (
          <div className="card form-card">
            <h3>Edit Task</h3>
            <form onSubmit={handleEdit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={editData.priority}
                    onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={editData.deadline}
                    onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="task-actions">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Attachments */}
        <div className="card">
          <h3>Attachments</h3>
          {task.attachments && task.attachments.length > 0 ? (
            <ul className="attachment-list">
              {task.attachments.map((att, idx) => (
                <li key={idx}>
                  <a href={`/${att.path}`} target="_blank" rel="noreferrer">
                    {att.filename}
                  </a>
                  <span className="text-muted"> ({(att.size / 1024).toFixed(1)} KB)</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No attachments</p>
          )}
          {(isLeader || isAssigned) && (
            <div className="upload-area">
              <input type="file" onChange={(e) => setFile(e.target.files[0])} />
              <button className="btn btn-sm btn-primary" onClick={handleFileUpload} disabled={!file}>
                Upload
              </button>
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="card">
          <h3>Comments ({comments.length})</h3>
          <form onSubmit={handleComment} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              required
            />
            <button type="submit" className="btn btn-primary">Post Comment</button>
          </form>
          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="text-muted">No comments yet</p>
            ) : (
              comments.map((c) => (
                <div key={c._id} className="comment-item">
                  <div className="comment-header">
                    <strong>{c.user?.name}</strong>
                    <span className="text-muted">{formatDate(c.createdAt)}</span>
                    {(c.user?._id === user?._id || user?.role === 'Admin') && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteComment(c._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p>{c.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
