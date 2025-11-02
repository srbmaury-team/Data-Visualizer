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
  };

  const initializeAuth = useCallback(async () => {
    try {
      // Refresh the token from localStorage in case it was updated
      apiService.refreshToken();
      
      if (apiService.isAuthenticated()) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData.user);
          setIsAuthenticated(true);
          saveUserToStorage(userData.user);
        } catch (error) {
          console.error('Failed to validate token:', error);
          // Only clear auth if it's a 401 (unauthorized) error
          // For network errors or 500 errors, keep the user logged in
          if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            console.log('Token invalid, logging out');
            apiService.setToken(null);
            setIsAuthenticated(false);
            setUser(null);
            clearUserFromStorage();
          } else {
            console.log('Network error, keeping user logged in with cached token');
            // Try to load user from storage for offline experience
            const cachedUser = loadUserFromStorage();
            if (cachedUser) {
              setUser(cachedUser);
              setIsAuthenticated(true);
            } else {
              // No cached user data, but keep token for when server comes back
              setIsAuthenticated(true);
            }
          }
        }
      } else {
        // No token found
        setIsAuthenticated(false);
        setUser(null);
        clearUserFromStorage();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Try to load from cache on general errors
      const cachedUser = loadUserFromStorage();
      if (apiService.isAuthenticated() && cachedUser) {
        setUser(cachedUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        clearUserFromStorage();
      }
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
    setUser(response.user);
    setIsAuthenticated(true);
    saveUserToStorage(response.user);
    // Ensure the apiService token is properly set
    if (response.token) {
      apiService.setToken(response.token);
    }
    return response;
  };

  const register = async (userData) => {
    const response = await apiService.register(userData);
    setUser(response.user);
    setIsAuthenticated(true);
    saveUserToStorage(response.user);
    // Ensure the apiService token is properly set
    if (response.token) {
      apiService.setToken(response.token);
    }
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

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;