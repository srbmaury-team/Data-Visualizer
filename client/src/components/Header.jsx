import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './styles/Header.css';

const Header = ({ onShowAuth, onShowSavedGraphs }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1>🔄 YAML Visualizer</h1>
      </div>
      <div className="header-right">
        {isAuthenticated ? (
          <div className="user-menu">
            <button 
              className="user-name-btn"
              onClick={handleProfileClick}
              title="View Profile"
            >
              Welcome, {user?.username || 'User'}!
            </button>
            <button 
              className="header-btn saved-graphs-btn" 
              onClick={onShowSavedGraphs}
            >
              📚 My Graphs
            </button>
            <button 
              className="header-btn logout-btn" 
              onClick={handleLogout}
            >
              🚪 Logout
            </button>
          </div>
        ) : (
          <div className="auth-menu">
            <span className="guest-name">Welcome, Guest!</span>
            <button 
              className="header-btn login-btn" 
              onClick={onShowAuth}
            >
              🔐 Login / Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;