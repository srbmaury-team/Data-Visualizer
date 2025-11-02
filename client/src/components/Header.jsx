import React from 'react';
import { useAuth } from '../hooks/useAuth';
import './styles/Header.css';

const Header = ({ onShowAuth, onShowSavedGraphs }) => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1>🔄 YAML Visualizer</h1>
      </div>
      <div className="header-right">
        {isAuthenticated ? (
          <div className="user-menu">
            <span className="user-name">Welcome, {user?.username || 'User'}!</span>
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