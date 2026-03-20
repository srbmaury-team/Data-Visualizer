import React, { createContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper function to save user data
  const saveUserToStorage = (userData) => {
    localStorage.setItem('user_data', JSON.stringify(userData));
  };

  // Helper function to load user data
  const loadUserFromStorage = () => {
    try {
      const stored = localStorage.getItem('user_data');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  // Helper function to clear user data
  const clearUserFromStorage = () => {
    localStorage.removeItem('user_data');
    localStorage.removeItem('auth_token');
  };

  const initializeAuth = useCallback(async () => {
    try {
      // Always attempt to get the current user — the httpOnly cookie is sent
      // automatically. If there's no valid session, the server returns 401.
      try {
        const userData = await apiService.getCurrentUser();
        setUser(userData.user);
        setIsAuthenticated(true);
        saveUserToStorage(userData.user);
      } catch (error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('No token')) {
          // Not logged in — clear any stale cached data
          setIsAuthenticated(false);
          setUser(null);
          clearUserFromStorage();
        } else {
          // Network / server error — use cached profile for offline experience
          const cachedUser = loadUserFromStorage();
          if (cachedUser) {
            setUser(cachedUser);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setIsAuthenticated(false);
      setUser(null);
      clearUserFromStorage();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize authentication when component mounts
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials) => {
    const response = await apiService.login(credentials);
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    setUser(response.user);
    setIsAuthenticated(true);
    saveUserToStorage(response.user);
    return response;
  };

  const register = async (userData) => {
    const response = await apiService.register(userData);
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    setUser(response.user);
    setIsAuthenticated(true);
    saveUserToStorage(response.user);
    return response;
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      setIsAuthenticated(false);
      clearUserFromStorage();
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if server call fails
      setUser(null);
      setIsAuthenticated(false);
      clearUserFromStorage();
    }
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    saveUserToStorage(updatedUserData);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;