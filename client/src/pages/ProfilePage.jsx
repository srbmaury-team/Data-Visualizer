import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import apiService from "../services/apiService";
import "./ProfilePage.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, isAuthenticated: contextIsAuthenticated, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [profileData, setProfileData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
  // If user is not authenticated via context, redirect immediately
  useEffect(() => {
    if (!contextIsAuthenticated) {
      // Only show error if this wasn't triggered by a logout action
      const isLogoutAction = sessionStorage.getItem('logout_action');
      if (!isLogoutAction) {
        showError('You must be logged in to view your profile.');
      } else {
        sessionStorage.removeItem('logout_action');
      }
      navigate('/');
      return;
    }
  }, [contextIsAuthenticated, navigate, showError]);
  
  // Profile editing state
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    email: ''
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadProfileData = async () => {
    try {
      const response = await apiService.getUserProfile();
      setProfileData(response);
      setEditData({
        username: response.user.username,
        email: response.user.email
      });
    } catch (error) {
      console.error('Profile load error:', error);
      if (error.message.includes('401') || error.message.includes('No token') || error.message.includes('authorization denied')) {
        showError('Session expired. Please login again.');
        logout();
        navigate('/');
      } else {
        showError('Failed to load profile data: ' + error.message);
      }
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await apiService.getDashboard();
      setDashboardData(response);
    } catch (error) {
      console.error('Dashboard load error:', error);
      if (error.message.includes('401') || error.message.includes('No token') || error.message.includes('authorization denied')) {
        showError('Session expired. Please login again.');
        logout();
        navigate('/');
      } else {
        showError('Failed to load dashboard data: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load data if user is authenticated
    if (contextIsAuthenticated) {
      // Refresh token from localStorage to ensure we have the latest token
      apiService.refreshToken();
      loadProfileData();
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextIsAuthenticated]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.updateUserProfile(editData);
      setProfileData(prev => ({ ...prev, user: response.user }));
      // Update the user in AuthContext so it reflects in the header immediately
      updateUser(response.user);
      setEditMode(false);
      showSuccess('Profile updated successfully');
    } catch (error) {
      showError(error.message || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    
    try {
      await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      showSuccess('Password changed successfully');
    } catch (error) {
      showError(error.message || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await apiService.deleteAccount({ password: deletePassword });
      showSuccess('Account deleted successfully');
      logout();
      navigate('/');
    } catch (error) {
      showError(error.message || 'Failed to delete account');
    }
  };

  const handleLoadFile = async (file) => {
    try {
      // Fetch the full file content
      const fileData = await apiService.getYamlFile(file._id);
      
      // Navigate to the editor with the file content and ID
      // We'll pass the content via state so it can be loaded into the editor
      navigate('/', { 
        state: { 
          yamlContent: fileData.content,
          fileName: fileData.title,
          fileId: file._id,
          loadFile: true
        }
      });
      
      showSuccess(`Loaded "${file.title}" into editor`);
    } catch (error) {
      showError(error.message || 'Failed to load file');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h2>Loading Profile...</h2>
        </div>
        <div className="loading-state">
          <div className="spinner">⟳</div>
          <p>Loading your profile data...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h2>Profile Error</h2>
        </div>
        <div className="error-state">
          <p>Failed to load profile data. Please try again.</p>
          <button onClick={loadProfileData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>User Profile</h2>
        <div className="profile-actions">
          <button 
            className="logout-btn"
            onClick={() => {
              // Set flag to indicate this is a logout action
              sessionStorage.setItem('logout_action', 'true');
              logout();
              navigate('/');
              // Show success message after navigation
              setTimeout(() => {
                showSuccess('You have been logged out successfully!');
              }, 100);
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
          <button 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔒 Security
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'profile' && (
            <div className="profile-tab">
              <div className="profile-info-card">
                <div className="card-header">
                  <h3>Profile Information</h3>
                  <button 
                    className={`edit-btn ${editMode ? 'cancel' : 'edit'}`}
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? '✕ Cancel' : '✏️ Edit'}
                  </button>
                </div>
                
                {!editMode ? (
                  <div className="profile-display">
                    <div className="profile-field">
                      <label>Username</label>
                      <div className="field-value">{profileData.user.username}</div>
                    </div>
                    <div className="profile-field">
                      <label>Email</label>
                      <div className="field-value">{profileData.user.email}</div>
                    </div>
                    <div className="profile-field">
                      <label>Member Since</label>
                      <div className="field-value">{formatDate(profileData.user.createdAt)}</div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleProfileUpdate} className="profile-edit">
                    <div className="form-group">
                      <label>Username</label>
                      <input
                        type="text"
                        value={editData.username}
                        onChange={(e) => setEditData({...editData, username: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="save-btn">
                        💾 Save Changes
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="stats-card">
                <div className="card-header">
                  <h3>Account Statistics</h3>
                </div>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{profileData.stats.totalFiles}</div>
                    <div className="stat-label">Total Files</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{profileData.stats.publicFiles}</div>
                    <div className="stat-label">Public Files</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{profileData.stats.privateFiles}</div>
                    <div className="stat-label">Private Files</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{profileData.stats.totalViews}</div>
                    <div className="stat-label">Total Views</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && dashboardData && (
            <div className="dashboard-tab">
              <div className="recent-files-card">
                <div className="card-header">
                  <h3>Recent Files</h3>
                </div>
                {dashboardData.recentFiles.length > 0 ? (
                  <div className="files-list">
                    {dashboardData.recentFiles.map((file) => (
                      <div 
                        key={file._id} 
                        className="file-item clickable"
                        onClick={() => handleLoadFile(file)}
                        title="Click to open in editor"
                      >
                        <div className="file-info">
                          <div className="file-title">{file.title}</div>
                          <div className="file-meta">
                            {file.description && <span className="file-desc">{file.description}</span>}
                            <span className="file-date">Updated {formatDate(file.updatedAt)}</span>
                            <span className={`file-visibility ${file.isPublic ? 'public' : 'private'}`}>
                              {file.isPublic ? '🌐 Public' : '🔒 Private'}
                            </span>
                            <span className="file-views">👁️ {file.views} views</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No files created yet. Start building your first YAML diagram!</p>
                  </div>
                )}
              </div>

              <div className="popular-files-card">
                <div className="card-header">
                  <h3>Most Popular Files</h3>
                </div>
                {dashboardData.popularFiles.length > 0 ? (
                  <div className="files-list">
                    {dashboardData.popularFiles.map((file) => (
                      <div 
                        key={file._id} 
                        className="file-item clickable"
                        onClick={() => handleLoadFile(file)}
                        title="Click to open in editor"
                      >
                        <div className="file-info">
                          <div className="file-title">{file.title}</div>
                          <div className="file-meta">
                            {file.description && <span className="file-desc">{file.description}</span>}
                            <span className="file-date">Created {formatDate(file.createdAt)}</span>
                            <span className={`file-visibility ${file.isPublic ? 'public' : 'private'}`}>
                              {file.isPublic ? '🌐 Public' : '🔒 Private'}
                            </span>
                            <span className="file-views">👁️ {file.views} views</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No files to show yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="security-tab">
              <div className="password-card">
                <div className="card-header">
                  <h3>Change Password</h3>
                </div>
                <form onSubmit={handlePasswordChange} className="password-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      minLength="6"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      minLength="6"
                      required
                    />
                  </div>
                  <button type="submit" className="change-password-btn">
                    🔒 Change Password
                  </button>
                </form>
              </div>

              <div className="danger-zone-card">
                <div className="card-header">
                  <h3>Danger Zone</h3>
                </div>
                <div className="danger-content">
                  <p>⚠️ Once you delete your account, there is no going back. This will permanently delete your account and all your YAML files.</p>
                  
                  {!showDeleteConfirm ? (
                    <button 
                      className="delete-account-btn"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      🗑️ Delete Account
                    </button>
                  ) : (
                    <div className="delete-confirm">
                      <div className="form-group">
                        <label>Enter your password to confirm deletion:</label>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                      <div className="delete-actions">
                        <button 
                          className="confirm-delete-btn"
                          onClick={handleDeleteAccount}
                          disabled={!deletePassword}
                        >
                          ⚠️ Confirm Delete Account
                        </button>
                        <button 
                          className="cancel-delete-btn"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeletePassword('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}