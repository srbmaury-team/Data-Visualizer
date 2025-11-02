import React from "react";
import "./styles/SavedGraphsModal.css";

const formatDate = (dateValue) => {
  if (!dateValue) {
    // Return current date as fallback for missing dates
    const now = new Date();
    return {
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      isFallback: true
    };
  }
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    // If it's not a valid date, try common timestamp formats
    const numericValue = parseInt(dateValue);
    if (!isNaN(numericValue)) {
      const timestampDate = new Date(numericValue);
      if (!isNaN(timestampDate.getTime())) {
        return {
          date: timestampDate.toLocaleDateString(),
          time: timestampDate.toLocaleTimeString()
        };
      }
    }
    
    // Final fallback - return current date
    const now = new Date();
    return {
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      isFallback: true
    };
  }
  
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString()
  };
};

const SavedGraphsModal = ({ 
  showSavedGraphs, 
  setShowSavedGraphs, 
  savedGraphs, 
  handleLoadGraph, 
  handleDeleteGraph, 
  handleUpdateGraph, 
  isAuthenticated, 
  onAuthRequired 
}) => {
  const copyShareLink = async (shareId) => {
    try {
      const shareUrl = `${window.location.origin}/shared/${shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      
      // Show temporary success feedback
      const button = document.querySelector(`[data-share-id="${shareId}"]`);
      if (button) {
        const originalIcon = button.textContent;
        button.textContent = '✅';
        button.style.background = '#10b981';
        button.style.color = 'white';
        
        setTimeout(() => {
          button.textContent = originalIcon;
          button.style.background = '';
          button.style.color = '';
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy share link:', err);
      // Fallback for older browsers
      const shareUrl = `${window.location.origin}/shared/${shareId}`;
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      // Show feedback
      const button = document.querySelector(`[data-share-id="${shareId}"]`);
      if (button) {
        const originalIcon = button.textContent;
        button.textContent = '✅';
        button.style.background = '#10b981';
        button.style.color = 'white';
        
        setTimeout(() => {
          button.textContent = originalIcon;
          button.style.background = '';
          button.style.color = '';
        }, 2000);
      }
    }
  };
  if (!showSavedGraphs) return null;

  const handleAuthRequiredAction = () => {
    setShowSavedGraphs(false);
    onAuthRequired();
  };

  return (
    <div className="modal-overlay" onClick={() => setShowSavedGraphs(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📚 My Saved Graphs</h2>
          <button className="close-modal-btn" onClick={() => setShowSavedGraphs(false)}>✕</button>
        </div>
        <div className="modal-body">
          {!isAuthenticated ? (
            <div className="auth-required">
              <p>🔐 Authentication Required</p>
              <p className="auth-hint">Please login to view and manage your saved graphs</p>
              <button className="auth-btn" onClick={handleAuthRequiredAction}>
                Login / Sign Up
              </button>
            </div>
          ) : savedGraphs.length === 0 ? (
            <div className="empty-state">
              <p>📭 No saved graphs yet</p>
              <p className="empty-hint">Save your current graph using the "💾 Save Graph" button</p>
            </div>
          ) : (
            <div className="graphs-list">
              {savedGraphs.map(graph => (
                <div key={graph.id} className="graph-item">
                  <div className="graph-info">
                    <h3>{graph.title}</h3>
                    {graph.description && (
                      <p className="graph-description">{graph.description}</p>
                    )}
                    <p className="graph-date">
                      {(() => {
                        const createdDate = formatDate(graph.createdAt);
                        const dateText = `Created: ${createdDate.date} at ${createdDate.time}`;
                        return createdDate.isFallback ? 
                          <span className="fallback-date" title="Original creation date not available">{dateText} (estimated)</span> : 
                          dateText;
                      })()}
                      {graph.updatedAt && graph.updatedAt !== graph.createdAt && (
                        <span className="updated-date">
                          <br />
                          {(() => {
                            const updatedDate = formatDate(graph.updatedAt);
                            const dateText = `Updated: ${updatedDate.date} at ${updatedDate.time}`;
                            return updatedDate.isFallback ? 
                              <span className="fallback-date" title="Original update date not available">{dateText} (estimated)</span> : 
                              dateText;
                          })()}
                        </span>
                      )}
                    </p>
                    {graph.tags && graph.tags.length > 0 && (
                      <div className="graph-tags">
                        {graph.tags.map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                    <p className="graph-preview">
                      {graph.content ? 
                        graph.content.split('\n').slice(0, 2).join('\n') + '...' : 
                        'No content available'
                      }
                    </p>
                    {graph.isPublic && graph.shareId && (
                      <div className="public-indicator">
                        🌐 Public Graph - (ID: {graph.shareId})
                        <button 
                          className="copy-icon-btn" 
                          data-share-id={graph.shareId}
                          onClick={() => copyShareLink(graph.shareId)}
                          title="Copy share link"
                        >
                          📋
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="graph-actions">
                    <button className="load-btn" onClick={() => handleLoadGraph(graph)}>📂 Load</button>
                    <button className="update-btn" onClick={() => handleUpdateGraph(graph)}>✏️ Update</button>
                    <button className="delete-btn" onClick={() => handleDeleteGraph(graph.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedGraphsModal;