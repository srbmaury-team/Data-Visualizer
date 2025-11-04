/**
 * Centralized API service for communicating with the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Get authorization headers
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Refresh token from localStorage
   */
  refreshToken() {
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Make HTTP request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle different error response formats from backend
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (data.error) {
          errorMessage = data.error;
        } else if (data.errors && Array.isArray(data.errors)) {
          // Handle validation errors array
          errorMessage = data.errors.map(err => err.msg).join(', ');
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Handle authentication errors - just clear token, let AuthContext handle the UI
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.setToken(null);
        // Don't redirect here, let the AuthContext handle authentication state
      }
      
      throw error;
    }
  }

  /**
   * Authentication API calls
   */
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    // Backend expects 'login' field (can be email or username) instead of 'email'
    const loginData = {
      login: credentials.email, // Send email as login field
      password: credentials.password
    };
    
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    this.setToken(null);
    return Promise.resolve();
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  /**
   * YAML File API calls
   */
  async saveYamlFile(yamlData) {
    return this.request('/yaml', {
      method: 'POST',
      body: JSON.stringify(yamlData),
    });
  }

  async getMyYamlFiles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/yaml/my?${queryString}` : '/yaml/my';
    return this.request(endpoint);
  }

  async getYamlFile(id) {
    return this.request(`/yaml/${id}`);
  }

  async updateYamlFile(id, yamlData) {
    return this.request(`/yaml/${id}`, {
      method: 'PUT',
      body: JSON.stringify(yamlData),
    });
  }

  async deleteYamlFile(id) {
    return this.request(`/yaml/${id}`, {
      method: 'DELETE',
    });
  }

  async getSharedYamlFile(shareId) {
    return this.request(`/yaml/shared/${shareId}`);
  }

  async shareYamlFile(id, isPublic) {
    return this.request(`/yaml/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ isPublic }),
    });
  }

  /**
   * User API calls
   */
  async getUserProfile() {
    return this.request('/user/profile');
  }

  async updateUserProfile(profileData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData) {
    return this.request('/user/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async deleteAccount(passwordData) {
    return this.request('/user/account', {
      method: 'DELETE',
      body: JSON.stringify(passwordData),
    });
  }

  async getDashboard() {
    return this.request('/user/dashboard');
  }

  /**
   * Version History API calls
   */
  async createVersion(fileId, versionData) {
    return this.request(`/files/${fileId}/versions`, {
      method: 'POST',
      body: JSON.stringify(versionData),
    });
  }

  async getVersionHistory(fileId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/files/${fileId}/versions?${queryString}` : `/files/${fileId}/versions`;
    return this.request(endpoint);
  }

  async getVersion(fileId, versionNumber) {
    return this.request(`/files/${fileId}/versions/${versionNumber}`);
  }

  async revertToVersion(fileId, versionNumber, message) {
    return this.request(`/files/${fileId}/versions/${versionNumber}/revert`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async cleanupVersionHistory(fileId, keepVersions = 50) {
    return this.request(`/files/${fileId}/versions/cleanup`, {
      method: 'DELETE',
      body: JSON.stringify({ keepVersions }),
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Get stored authentication token
   */
  getToken() {
    return this.token;
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;