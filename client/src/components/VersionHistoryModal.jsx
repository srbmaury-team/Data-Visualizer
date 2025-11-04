import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../hooks/useToast';
import apiService from '../services/apiService';
import './styles/VersionHistoryModal.css';

const VersionHistoryModal = ({ 
  isOpen, 
  onClose, 
  fileId, 
  fileName, 
  onLoadVersion 
}) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(new Set());
  const [selectedVersion, setSelectedVersion] = useState(null);
  const { showSuccess, showError } = useToast();
  const scrollContainerRef = useRef(null);

  const loadVersionHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getVersionHistory(fileId, {
        limit: 50,
        includeDeltas: false
      });
      setVersions(response.versions);
    } catch {
      showError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  }, [fileId, showError]);

  useEffect(() => {
    if (isOpen && fileId) {
      loadVersionHistory();
    }
  }, [isOpen, fileId, loadVersionHistory]);

  const loadVersionContent = async (version) => {
    const scrollPosition = scrollContainerRef.current?.scrollTop || 0;
    
    try {
      setLoadingVersions(prev => new Set([...prev, version.version]));
      const response = await apiService.getVersion(fileId, version.version);
      setSelectedVersion({
        ...version,
        content: response.content
      });
      
      // Restore scroll position after content loads
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollPosition;
        }
      }, 0);
      
    } catch {
      showError('Failed to load version content');
    } finally {
      setLoadingVersions(prev => {
        const newSet = new Set(prev);
        newSet.delete(version.version);
        return newSet;
      });
    }
  };

  const revertToVersion = async (version) => {
    if (!window.confirm(`Are you sure you want to revert to version ${version.version}? This will create a new version with the reverted content.`)) {
      return;
    }

    try {
      setLoading(true);
      const message = `Reverted to version ${version.version}: ${version.changeMetadata?.summary || 'No description'}`;
      
      // Revert to the version (this creates a new version and updates the file)
      const revertResponse = await apiService.revertToVersion(fileId, version.version, message);
      
      // Notify parent component with the reverted content (parent will show success message)
      if (onLoadVersion) {
        onLoadVersion(revertResponse.content, `Reverted to version ${version.version}`);
      }
      
      // Refresh version history to show the new version
      await loadVersionHistory();
      
    } catch {
      showError('Failed to revert to version');
    } finally {
      setLoading(false);
    }
  };

  const loadVersionInEditor = async (version) => {
    try {
      setLoading(true);
      const response = await apiService.getVersion(fileId, version.version);
      
      if (onLoadVersion) {
        onLoadVersion(response.content, `Loaded version ${version.version}`);
      }
      
      showSuccess(`Loaded version ${version.version} into editor`);
      onClose();
      
    } catch {
      showError('Failed to load version');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const closeVersionPreview = () => {
    const scrollPosition = scrollContainerRef.current?.scrollTop || 0;
    setSelectedVersion(null);
    
    // Restore scroll position after preview closes
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollPosition;
      }
    }, 0);
  };

  const getChangeTypeIcon = (changeMetadata) => {
    if (!changeMetadata) return '📝';
    
    const { linesChanged } = changeMetadata;
    if (linesChanged?.added > 0 && linesChanged?.removed === 0) return '➕';
    if (linesChanged?.removed > 0 && linesChanged?.added === 0) return '➖';
    if (linesChanged?.added > 0 || linesChanged?.removed > 0) return '✏️';
    return '📝';
  };

  if (!isOpen) return null;

  return (
    <div className="version-history-modal-overlay" onClick={onClose}>
      <div className="version-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="version-modal-header">
          <h2>📚 Version History</h2>
          <div className="version-header-actions">
            <button onClick={onClose} className="version-close-btn">✕</button>
          </div>
        </div>

        <div className="version-modal-content">
          <div className="file-info">
            <strong>{fileName}</strong>
            <span className="version-count">
              {versions.length} version{versions.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Loading versions...</span>
            </div>
          )}

          {!loading && versions.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No Version History</h3>
              <p>Save your file to create the first version and start tracking changes.</p>
            </div>
          )}

          {!loading && versions.length > 0 && (
            <div className="versions-list" ref={scrollContainerRef}>
            {versions.map((version) => {
              const { date, time } = formatDate(version.createdAt);
              const isSelected = selectedVersion?.version === version.version;

              return (
                <React.Fragment key={version.version}>
                  <div 
                    className={`version-item ${isSelected ? 'selected' : ''}`}
                  >
                  <div className="version-header">
                    <div className="version-info">
                      <span className="version-number">
                        {getChangeTypeIcon(version.changeMetadata)} v{version.version}
                        {version.isSnapshot && <span className="snapshot-badge">📸 Snapshot</span>}
                      </span>
                      <span className="version-author">by {version.author?.username || 'Unknown'}</span>
                    </div>
                    <div className="version-date">
                      <span className="date">{date}</span>
                      <span className="time">{time}</span>
                    </div>
                  </div>

                  <div className="version-details">
                    <div className="change-summary">
                      {version.changeMetadata?.summary || 'No description'}
                    </div>
                    
                    {version.message && (
                      <div className="version-message">
                        💬 {version.message}
                      </div>
                    )}

                    <div className="change-stats">
                      {version.changeMetadata?.linesChanged && (
                        <>
                          {version.changeMetadata.linesChanged.added > 0 && (
                            <span className="stat-add">+{version.changeMetadata.linesChanged.added}</span>
                          )}
                          {version.changeMetadata.linesChanged.removed > 0 && (
                            <span className="stat-remove">-{version.changeMetadata.linesChanged.removed}</span>
                          )}
                        </>
                      )}
                      <span className="stat-type">{version.changeMetadata?.saveType || 'manual'}</span>
                    </div>
                  </div>

                  <div className="version-actions">
                    <button 
                      onClick={() => loadVersionContent(version)}
                      className="view-btn"
                      disabled={loadingVersions.has(version.version)}
                    >
                      {loadingVersions.has(version.version) ? '⏳' : '👁️'} View
                    </button>
                    <button 
                      onClick={() => loadVersionInEditor(version)}
                      className="load-btn"
                      disabled={loading}
                    >
                      📂 Load
                    </button>
                    <button 
                      onClick={() => revertToVersion(version)}
                      className="revert-btn"
                      disabled={loading || version.version === versions[0]?.version}
                    >
                      ↩️ Revert
                    </button>
                  </div>
                </div>

                {/* Show version preview inline if this version is selected */}
                {selectedVersion && selectedVersion.version === version.version && (
                  <div className="version-preview inline-preview">
                    <div className="preview-header">
                      <h4>📄 Version {selectedVersion.version} Content</h4>
                      <button 
                        onClick={closeVersionPreview}
                        className="close-preview-btn"
                      >
                        ✕
                      </button>
                    </div>
                    <pre className="content-preview">
                      {selectedVersion.content}
                    </pre>
                  </div>
                )}
              </React.Fragment>
              );
            })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;