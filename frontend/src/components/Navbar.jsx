import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">TaskFlow</Link>
      </div>
      {user ? (
        <div className="navbar-menu">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/teams">Teams</Link>
          <Link to="/tasks">My Tasks</Link>
          {user.role === 'Admin' && <Link to="/admin">Admin</Link>}
          <div className="navbar-user">
            <span>{user.name} ({user.role})</span>
            <button onClick={handleLogout} className="btn btn-logout">
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="navbar-menu">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
