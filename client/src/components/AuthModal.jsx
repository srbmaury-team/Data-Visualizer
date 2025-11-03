import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import './styles/AuthModal.css';

const LoginForm = ({ onToggleMode, onClose }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      await login(credentials);
      showSuccess('Welcome back! You are now logged in.');
      onClose();
    } catch (err) {
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-form">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group auth-labels">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={credentials.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group auth-labels">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading} className="auth-button">
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="auth-toggle">
        Don't have an account?{' '}
        <button onClick={onToggleMode} className="link-button">
          Sign up
        </button>
      </p>
    </div>
  );
};

const RegisterForm = ({ onToggleMode, onClose }) => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userData.password !== userData.confirmPassword) {
      const errorMessage = 'Passwords do not match';
      showError(errorMessage);
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword: _, ...registerData } = userData;
      await register(registerData);
      showSuccess('Account created successfully! Welcome!');
      onClose();
    } catch (err) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-form">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group auth-labels">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={userData.username}
            onChange={handleChange}
            required
            disabled={isLoading}
            minLength="3"
            maxLength="30"
            pattern="[a-zA-Z0-9_-]+"
            title="Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens"
          />
        </div>
        <div className="form-group auth-labels">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group auth-labels">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={userData.password}
            onChange={handleChange}
            required
            disabled={isLoading}
            minLength="6"
          />
        </div>
        <div className="form-group auth-labels">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={userData.confirmPassword}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading} className="auth-button">
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      <p className="auth-toggle">
        Already have an account?{' '}
        <button onClick={onToggleMode} className="link-button">
          Login
        </button>
      </p>
    </div>
  );
};

const AuthModal = ({ isOpen, onClose }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="auth-modal-close" onClick={onClose}>
          ×
        </button>
        {isLoginMode ? (
          <LoginForm onToggleMode={() => setIsLoginMode(false)} onClose={onClose} />
        ) : (
          <RegisterForm onToggleMode={() => setIsLoginMode(true)} onClose={onClose} />
        )}
      </div>
    </div>
  );
};

export default AuthModal;