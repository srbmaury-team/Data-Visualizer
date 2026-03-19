import React from 'react';
import './styles/PresenceBar.css';

export default function PresenceBar({ users = [], typingUsers = [], isConnected = false }) {
  if (!isConnected && users.length === 0) return null;

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
          {users.map((user) => (
            <div
              key={user.socketId}
              className="presence-avatar"
              style={{ backgroundColor: user.color }}
              title={`${user.username}${user.canEdit ? '' : ' (view-only)'}`}
            >
              {(user.username || '?')[0].toUpperCase()}
            </div>
          ))}
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
    </div>
  );
}
