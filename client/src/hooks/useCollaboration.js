import { useState, useEffect, useRef, useCallback } from 'react';
import {
    getSocket,
    joinFileRoom,
    leaveFileRoom,
    sendOperation,
    sendContentSync,
    sendCursorUpdate,
    sendTypingIndicator,
} from '../services/socket';

/**
 * Compute a minimal diff between oldText and newText.
 * Returns an operation: insert, delete, or replace (fallback).
 */
function computeOperation(oldText, newText) {
    if (oldText === newText) return null;

    // Find common prefix
    let prefixLen = 0;
    const minLen = Math.min(oldText.length, newText.length);
    while (prefixLen < minLen && oldText[prefixLen] === newText[prefixLen]) {
        prefixLen++;
    }

    // Find common suffix (not overlapping with prefix)
    let suffixLen = 0;
    const maxSuffix = minLen - prefixLen;
    while (
        suffixLen < maxSuffix &&
        oldText[oldText.length - 1 - suffixLen] === newText[newText.length - 1 - suffixLen]
    ) {
        suffixLen++;
    }

    const deletedLen = oldText.length - prefixLen - suffixLen;
    const insertEnd = newText.length - suffixLen;
    const insertedText = insertEnd > prefixLen ? newText.slice(prefixLen, insertEnd) : '';

    // Pure deletion
    if (deletedLen > 0 && insertedText.length === 0) {
        return { type: 'delete', position: prefixLen, length: deletedLen };
    }

    // Pure insertion
    if (deletedLen === 0 && insertedText.length > 0) {
        return { type: 'insert', position: prefixLen, text: insertedText };
    }

    // Complex edit — use full replace as fallback
    if (deletedLen > 0 && insertedText.length > 0) {
        return { type: 'replace', text: newText };
    }

    return null;
}

/**
 * Apply an OT operation to text content.
 */
function applyOperation(content, op) {
    if (op.type === 'insert') {
        const pos = Math.min(op.position, content.length);
        return content.slice(0, pos) + op.text + content.slice(pos);
    }
    if (op.type === 'delete') {
        const pos = Math.min(op.position, content.length);
        const end = Math.min(pos + op.length, content.length);
        return content.slice(0, pos) + content.slice(end);
    }
    if (op.type === 'replace') {
        return op.text;
    }
    return content;
}

/**
 * Hook for collaborative editing on a shared file.
 *
 * @param {string|null} fileId - The file ID to collaborate on
 * @param {string} localContent - The current local content
 * @param {function} setLocalContent - Setter for local content
 * @param {boolean} enabled - Whether collaboration is enabled
 * @returns {{ remoteUsers, remoteCursors, isConnected, typingUsers, handleLocalChange, handleCursorChange }}
 */
export function useCollaboration(fileId, localContent, setLocalContent, enabled = true) {
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [remoteCursors, setRemoteCursors] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [accessDenied, setAccessDenied] = useState(false);

    const versionRef = useRef(0);
    const contentRef = useRef(localContent);
    const fileIdRef = useRef(fileId);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);

    // Keep content ref in sync — but NOT during remote updates (handled directly)
    useEffect(() => {
        contentRef.current = localContent;
    }, [localContent]);

    // Main connection effect
    useEffect(() => {
        if (!enabled || !fileId) return;

        fileIdRef.current = fileId;
        setAccessDenied(false);
        const socket = getSocket();

        const handleConnect = () => {
            // Rejoin the file room on reconnect so we get user-joined events
            if (fileIdRef.current) {
                joinFileRoom(fileIdRef.current);
            }
        };
        const handleDisconnect = () => {
            setIsConnected(false);
            setRemoteUsers([]);
            setRemoteCursors({});
        };

        // Receive the initial file state when joining a room
        const handleFileState = ({ content, version, users, canEdit }) => {
            versionRef.current = version;
            contentRef.current = content;
            setLocalContent(content);

            setRemoteUsers(users.filter((u) => u.socketId !== socket.id));
            setIsConnected(true);
            setAccessDenied(false);
        };

        // A new user joined the room
        const handleUserJoined = (user) => {
            setRemoteUsers((prev) => {
                if (prev.some((u) => u.socketId === user.socketId)) return prev;
                return [...prev, user];
            });
        };

        // A user left the room
        const handleUserLeft = ({ socketId }) => {
            setRemoteUsers((prev) => prev.filter((u) => u.socketId !== socketId));
            setRemoteCursors((prev) => {
                const next = { ...prev };
                delete next[socketId];
                return next;
            });
            setTypingUsers((prev) => {
                const next = new Set(prev);
                next.delete(socketId);
                return next;
            });
        };

        // Receive a remote text operation
        const handleRemoteOperation = ({ op, version, userId, username }) => {
            versionRef.current = version;

            // Apply to contentRef immediately so handleLocalChange sees the latest
            const newContent = applyOperation(contentRef.current, op);
            contentRef.current = newContent;
            setLocalContent(newContent);
        };

        // Receive a full content sync
        const handleContentSync = ({ content, version }) => {
            versionRef.current = version;
            contentRef.current = content;
            setLocalContent(content);
        };

        // Server acknowledgment of our operation
        const handleAck = ({ version }) => {
            versionRef.current = version;
        };

        // Remote cursor updates
        const handleRemoteCursor = ({ socketId, userId, username, color, cursor }) => {
            setRemoteCursors((prev) => ({
                ...prev,
                [socketId]: { userId, username, color, cursor },
            }));
        };

        // Typing indicator
        const handleUserTyping = ({ socketId, username, isTyping }) => {
            setTypingUsers((prev) => {
                const next = new Set(prev);
                if (isTyping) {
                    next.add(username);
                } else {
                    next.delete(username);
                }
                return next;
            });
        };

        // Handle errors (including access denied)
        const handleError = ({ message }) => {
            console.warn('Collaboration error:', message);
            if (message === 'Access denied') {
                setAccessDenied(true);
                setIsConnected(false);
            }
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('file-state', handleFileState);
        socket.on('user-joined', handleUserJoined);
        socket.on('user-left', handleUserLeft);
        socket.on('remote-operation', handleRemoteOperation);
        socket.on('content-sync', handleContentSync);
        socket.on('ack', handleAck);
        socket.on('remote-cursor', handleRemoteCursor);
        socket.on('user-typing', handleUserTyping);
        socket.on('collab-error', handleError);

        // Join the file room:
        // If already connected, join immediately.
        // If not connected yet, handleConnect will join when the socket connects.
        // This prevents a double-join (buffered emit + handleConnect both firing).
        if (socket.connected) {
            joinFileRoom(fileId);
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('file-state', handleFileState);
            socket.off('user-joined', handleUserJoined);
            socket.off('user-left', handleUserLeft);
            socket.off('remote-operation', handleRemoteOperation);
            socket.off('content-sync', handleContentSync);
            socket.off('ack', handleAck);
            socket.off('remote-cursor', handleRemoteCursor);
            socket.off('user-typing', handleUserTyping);
            socket.off('collab-error', handleError);

            leaveFileRoom(fileId);
            setRemoteUsers([]);
            setRemoteCursors({});
            setIsConnected(false);
            setAccessDenied(false);
        };
    }, [fileId, enabled, setLocalContent]);

    /**
     * Call this when the user makes a local change.
     * Computes a diff and sends the operation to the server.
     */
    const handleLocalChange = useCallback(
        (newContent) => {
            if (!fileIdRef.current) return;

            const oldContent = contentRef.current;
            const op = computeOperation(oldContent, newContent);

            if (!op) return;

            // Update contentRef immediately so subsequent calls compare correctly
            contentRef.current = newContent;

            if (op.type === 'replace') {
                sendContentSync(fileIdRef.current, newContent);
            } else {
                sendOperation(fileIdRef.current, op, versionRef.current);
            }

            // Typing indicator
            if (!isTypingRef.current) {
                isTypingRef.current = true;
                sendTypingIndicator(fileIdRef.current, true);
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
                isTypingRef.current = false;
                sendTypingIndicator(fileIdRef.current, false);
            }, 2000);
        },
        [],
    );

    /**
     * Call this when the user moves the cursor or changes selection.
     */
    const handleCursorChange = useCallback(
        (cursor) => {
            if (!fileIdRef.current) return;
            sendCursorUpdate(fileIdRef.current, cursor);
        },
        [],
    );

    return {
        remoteUsers,
        remoteCursors,
        isConnected,
        accessDenied,
        typingUsers: Array.from(typingUsers),
        handleLocalChange,
        handleCursorChange,
    };
}
