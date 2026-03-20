import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

/**
 * Get or create the singleton socket connection.
 * Automatically attaches the auth token if available.
 */
export function getSocket() {
  // Reuse existing socket if it exists (even if temporarily disconnected — it will auto-reconnect)
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
      withCredentials: true,
    auth: {
      token: localStorage.getItem('auth_token'),
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('🔌 Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  return socket;
}

/**
 * Disconnect and clean up the socket connection.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Join a file room for collaborative editing.
 */
export function joinFileRoom(fileId) {
  const s = getSocket();
  s.emit('join-file', { fileId });
}

/**
 * Leave a file room.
 */
export function leaveFileRoom(fileId) {
  const s = getSocket();
  s.emit('leave-file', { fileId });
}

/**
 * Send a text operation to the server.
 * @param {string} fileId
 * @param {{ type: 'insert'|'delete'|'replace', position?: number, text?: string, length?: number }} op
 * @param {number} baseVersion - the version this op is based on
 */
export function sendOperation(fileId, op, baseVersion) {
  const s = getSocket();
  s.emit('operation', { fileId, op, baseVersion });
}

/**
 * Send a full content sync (fallback for complex edits).
 */
export function sendContentSync(fileId, content) {
  const s = getSocket();
  s.emit('sync-content', { fileId, content });
}

/**
 * Update cursor position.
 * @param {string} fileId
 * @param {{ line: number, ch: number, selectionStart?: number, selectionEnd?: number }} cursor
 */
export function sendCursorUpdate(fileId, cursor) {
  const s = getSocket();
  s.emit('cursor-update', { fileId, cursor });
}

/**
 * Send typing indicator.
 */
export function sendTypingIndicator(fileId, isTyping) {
  const s = getSocket();
  s.emit('typing', { fileId, isTyping });
}

export default {
  getSocket,
  disconnectSocket,
  joinFileRoom,
  leaveFileRoom,
  sendOperation,
  sendContentSync,
  sendCursorUpdate,
  sendTypingIndicator,
};
