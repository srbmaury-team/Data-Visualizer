import React, { useState } from 'react';
import './styles/PresenceBar.css';

const MAX_VISIBLE = 5;

export default function PresenceBar({ users = [], typingUsers = [], isConnected = false, canShare = false, onShare }) {
  const [activePopover, setActivePopover] = useState(null);

  if (!isConnected && users.length === 0) return null;

  const visibleUsers = users.slice(0, MAX_VISIBLE);
  const overflowCount = users.length - MAX_VISIBLE;

  return (
    <div className="presence-bar">
      <div className="presence-status">
        <span className={`presence-dot ${isConnected ? 'connected' : 'disconnected'}`} />
        <span className="presence-label">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {users.length > 0 && (
        <div className="presence-users">
          {visibleUsers.map((user) => (
            <div
              key={user.socketId}
              className="presence-avatar-wrapper"
            >
              <div
                className="presence-avatar"
                style={{ backgroundColor: user.color }}
                onClick={() => setActivePopover(activePopover === user.socketId ? null : user.socketId)}
              >
                {(user.username || '?')[0].toUpperCase()}
              </div>
              {activePopover === user.socketId && (
                <div className="presence-popover">
                  <div className="popover-header" style={{ borderColor: user.color }}>
                    <div className="popover-avatar" style={{ backgroundColor: user.color }}>
                      {(user.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="popover-name">{user.username || 'Anonymous'}</div>
                  </div>
                  <div className="popover-details">
                    <div className="popover-row">
                      <span className="popover-label">Role</span>
                      <span className={`popover-badge ${user.canEdit ? 'badge-edit' : 'badge-view'}`}>
                        {user.canEdit ? '✏️ Editor' : '👁️ Viewer'}
                      </span>
                    </div>
                    <div className="popover-row">
                      <span className="popover-label">Status</span>
                      <span className="popover-status">
                        <span className="status-dot online" /> Online
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {overflowCount > 0 && (
            <div className="presence-avatar presence-overflow" title={users.slice(MAX_VISIBLE).map(u => u.username).join(', ')}>
              +{overflowCount}
            </div>
          )}
          <span className="presence-count">
            {users.length} collaborator{users.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {typingUsers.length > 0 && (
        <div className="presence-typing">
          <span className="typing-indicator">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
          <span className="typing-label">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.length} people typing...`}
          </span>
        </div>
      )}

      {canShare && (
        <button className="presence-share-btn" onClick={onShare}>
          🔗 Share
        </button>
      )}
    </div>
  );
}
