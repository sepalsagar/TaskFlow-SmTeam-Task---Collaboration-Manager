import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('taskflow_user'));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Teams
export const getMyTeams = () => API.get('/teams/my-teams');
export const createTeam = (data) => API.post('/teams', data);
export const getTeamById = (id) => API.get(`/teams/${id}`);
export const addTeamMember = (teamId, data) => API.post(`/teams/${teamId}/members`, data);
export const removeTeamMember = (teamId, userId) => API.delete(`/teams/${teamId}/members/${userId}`);
export const getTeamMembers = (teamId) => API.get(`/teams/${teamId}/members`);

// Tasks
export const createTask = (data) => API.post('/tasks', data);
export const getTasksByTeam = (teamId, params) => API.get(`/tasks/team/${teamId}`, { params });
export const getMyTasks = (params) => API.get('/tasks/my-tasks', { params });
export const getTaskById = (id) => API.get(`/tasks/${id}`);
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const updateTaskStatus = (id, data) => API.patch(`/tasks/${id}/status`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);
export const uploadAttachment = (id, formData) =>
  API.post(`/tasks/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Comments
export const getComments = (taskId) => API.get(`/comments/task/${taskId}`);
export const addComment = (data) => API.post('/comments', data);
export const deleteComment = (id) => API.delete(`/comments/${id}`);

// Activity Logs
export const getActivityLogs = (params) => API.get('/activity', { params });

// Admin
export const getAllUsers = (params) => API.get('/admin/users', { params });
export const getAdminUsers = getAllUsers;
export const getAllTeams = (params) => API.get('/admin/teams', { params });
export const getAdminTeams = () => API.get('/admin/teams');
export const getAllTasks = (params) => API.get('/admin/tasks', { params });
export const getAdminStats = () => API.get('/admin/stats');
export const updateUserRole = (userId, role) => API.put(`/admin/users/${userId}/role`, { role });
export const deleteUser = (userId) => API.delete(`/admin/users/${userId}`);

// Search
export const searchTasks = (params) => API.get('/search/tasks', { params });
export const searchTeams = (params) => API.get('/search/teams', { params });

// Dashboard
export const getDashboardStats = () => API.get('/dashboard/stats');

// File Upload
export const uploadTaskFile = (taskId, formData) =>
  API.post(`/upload/task/${taskId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteTaskAttachment = (taskId, index) =>
  API.delete(`/upload/task/${taskId}/attachment/${index}`);

export default API;
