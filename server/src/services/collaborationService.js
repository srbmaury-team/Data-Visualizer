import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import YamlFile from '../models/YamlFile.js';

// In-memory room state: tracks document content, users, and operation history per file
const rooms = new Map();

function getRoom(fileId) {
    if (!rooms.has(fileId)) {
        rooms.set(fileId, {
            users: new Map(),      // socketId -> { userId, username, color, cursor }
            content: null,          // current authoritative content (lazy-loaded)
            version: 0,            // increments on each operation
            pendingOps: [],        // operation log for late-joiners
        });
    }
    return rooms.get(fileId);
}

// Assign a consistent color to each user in a room
const CURSOR_COLORS = [
    '#e06c75', '#61afef', '#98c379', '#d19a66', '#c678dd',
    '#56b6c2', '#e5c07b', '#be5046', '#7ec8e3', '#f0a',
];

function assignColor(room) {
    const usedColors = new Set();
    for (const u of room.users.values()) {
        usedColors.add(u.color);
    }
    for (const c of CURSOR_COLORS) {
        if (!usedColors.has(c)) return c;
    }
    return CURSOR_COLORS[room.users.size % CURSOR_COLORS.length];
}

// Apply an OT-style text operation to content
// Operations: { type: 'insert' | 'delete', position, text?, length? }
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
        // Full replacement (fallback for complex edits)
        return op.text;
    }
    return content;
}

// Transform operation B against operation A (simple OT)
function transformOp(opB, opA) {
    if (opA.type === 'insert' && opB.type === 'insert') {
        if (opB.position > opA.position || (opB.position === opA.position && opB.userId > opA.userId)) {
            return { ...opB, position: opB.position + opA.text.length };
        }
        return opB;
    }
    if (opA.type === 'insert' && opB.type === 'delete') {
        if (opB.position >= opA.position) {
            return { ...opB, position: opB.position + opA.text.length };
        }
        return opB;
    }
    if (opA.type === 'delete' && opB.type === 'insert') {
        if (opB.position > opA.position) {
            return { ...opB, position: Math.max(opA.position, opB.position - opA.length) };
        }
        return opB;
    }
    if (opA.type === 'delete' && opB.type === 'delete') {
        if (opB.position >= opA.position + opA.length) {
            return { ...opB, position: opB.position - opA.length };
        }
        if (opB.position >= opA.position) {
            const overlap = Math.min(opB.length, opA.position + opA.length - opB.position);
            return { ...opB, position: opA.position, length: Math.max(0, opB.length - overlap) };
        }
        if (opB.position + opB.length > opA.position) {
            const overlap = opB.position + opB.length - opA.position;
            return { ...opB, length: opB.length - Math.min(overlap, opA.length) };
        }
        return opB;
    }
    return opB;
}

export function initializeSocketServer(httpServer, corsOptions) {
    const io = new Server(httpServer, {
        cors: {
            origin: corsOptions.origin,
            credentials: true,
            methods: ['GET', 'POST'],
        },
        pingInterval: 25000,
        pingTimeout: 20000,
    });

    // Authentication middleware for socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) {
                // Allow anonymous connections with limited capabilities
                socket.userData = { userId: null, username: 'Anonymous', isAnonymous: true };
                return next();
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userData = {
                userId: user._id.toString(),
                username: user.username || user.email,
                isAnonymous: false,
            };
            next();
        } catch (err) {
            // Allow connection but mark as anonymous
            socket.userData = { userId: null, username: 'Anonymous', isAnonymous: true };
            next();
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id} (${socket.userData.username})`);

        // --- Join a file room for collaborative editing ---
        socket.on('join-file', async ({ fileId }) => {
            if (!fileId) return;

            try {
                // Verify the file exists and user has access
                const file = await YamlFile.findById(fileId);
                if (!file) {
                    socket.emit('collab-error', { message: 'File not found' });
                    return;
                }

                // Check permissions
                const userId = socket.userData.userId;
                const ownerId = file.owner?.toString();
                const isOwner = userId === ownerId;
                const permission = userId ? (file.permissions?.get?.(userId) || file.permissions?.[userId]) : null;

                // Explicit 'no-access' always blocks, even on public files
                if (permission === 'no-access') {
                    socket.emit('collab-error', { message: 'Access denied' });
                    return;
                }

                // Only owner or users with explicit view/edit permission can join the collab room
                const canEdit = isOwner || permission === 'edit';
                const canView = canEdit || permission === 'view';

                if (!canView) {
                    socket.emit('collab-error', { message: 'Access denied' });
                    return;
                }

                // Leave any previous room
                for (const r of socket.rooms) {
                    if (r !== socket.id && r.startsWith('file:')) {
                        leaveRoom(socket, r);
                    }
                }

                const roomId = `file:${fileId}`;
                socket.join(roomId);

                const room = getRoom(fileId);

                // Initialize room content from DB if first user
                if (room.content === null) {
                    room.content = file.content || '';
                    room.version = 0;
                }

                const color = assignColor(room);
                room.users.set(socket.id, {
                    userId: socket.userData.userId,
                    username: socket.userData.username,
                    color,
                    cursor: null,
                    canEdit,
                });

                const allUsers = Array.from(room.users.entries()).map(([sid, u]) => ({
                    socketId: sid,
                    ...u,
                }));

                console.log(`📂 User ${socket.userData.username} (${socket.id}) joined room ${fileId} — ${room.users.size} user(s) in room: [${allUsers.map(u => u.username).join(', ')}]`);

                // Send the current state to the joining user
                socket.emit('file-state', {
                    content: room.content,
                    version: room.version,
                    users: allUsers,
                    canEdit,
                });

                // Notify others that a new user joined
                const otherCount = room.users.size - 1;
                console.log(`📢 Broadcasting user-joined for ${socket.userData.username} to ${otherCount} other user(s) in room ${fileId}`);
                socket.to(roomId).emit('user-joined', {
                    socketId: socket.id,
                    userId: socket.userData.userId,
                    username: socket.userData.username,
                    color,
                    canEdit,
                });

            } catch (err) {
                console.error('Error joining file room:', err);
                socket.emit('collab-error', { message: 'Failed to join file' });
            }
        });

        // --- Handle text operations (OT-based) ---
        socket.on('operation', ({ fileId, op, baseVersion }) => {
            if (!fileId) return;

            const room = getRoom(fileId);
            const user = room.users.get(socket.id);
            if (!user || !user.canEdit) {
                socket.emit('collab-error', { message: 'No edit permission' });
                return;
            }

            // Transform the operation against any operations that happened since baseVersion
            let transformedOp = { ...op, userId: socket.userData.userId };
            const opsToTransformAgainst = room.pendingOps.slice(baseVersion);

            for (const existingOp of opsToTransformAgainst) {
                transformedOp = transformOp(transformedOp, existingOp);
            }

            // Apply to server content
            room.content = applyOperation(room.content, transformedOp);
            room.version++;
            room.pendingOps.push(transformedOp);

            // Keep only last 1000 ops to prevent memory leak
            if (room.pendingOps.length > 1000) {
                room.pendingOps = room.pendingOps.slice(-500);
            }

            // Acknowledge to sender
            socket.emit('ack', { version: room.version });

            // Broadcast to others in the room
            const roomId = `file:${fileId}`;
            socket.to(roomId).emit('remote-operation', {
                op: transformedOp,
                version: room.version,
                userId: socket.userData.userId,
                username: socket.userData.username,
            });
        });

        // --- Handle full content sync (fallback for complex edits) ---
        socket.on('sync-content', ({ fileId, content }) => {
            if (!fileId) return;

            const room = getRoom(fileId);
            const user = room.users.get(socket.id);
            if (!user || !user.canEdit) return;

            room.content = content;
            room.version++;
            room.pendingOps = [];

            socket.emit('ack', { version: room.version });

            const roomId = `file:${fileId}`;
            socket.to(roomId).emit('content-sync', {
                content,
                version: room.version,
                userId: socket.userData.userId,
                username: socket.userData.username,
            });
        });

        // --- Cursor position updates ---
        socket.on('cursor-update', ({ fileId, cursor }) => {
            if (!fileId) return;

            const room = getRoom(fileId);
            const user = room.users.get(socket.id);
            if (!user) return;

            user.cursor = cursor; // { line, ch, selectionStart, selectionEnd }

            const roomId = `file:${fileId}`;
            socket.to(roomId).emit('remote-cursor', {
                socketId: socket.id,
                userId: socket.userData.userId,
                username: socket.userData.username,
                color: user.color,
                cursor,
            });
        });

        // --- Typing indicator ---
        socket.on('typing', ({ fileId, isTyping }) => {
            if (!fileId) return;

            const roomId = `file:${fileId}`;
            socket.to(roomId).emit('user-typing', {
                socketId: socket.id,
                username: socket.userData.username,
                isTyping,
            });
        });

        // --- Leave a file room ---
        socket.on('leave-file', ({ fileId }) => {
            if (!fileId) return;
            leaveRoom(socket, `file:${fileId}`);
        });

        // --- Handle disconnect ---
        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.id}`);
            // Clean up all rooms this socket was in
            for (const roomId of socket.rooms) {
                if (roomId.startsWith('file:')) {
                    leaveRoom(socket, roomId);
                }
            }
            // Also check the in-memory rooms map
            for (const [fileId, room] of rooms.entries()) {
                if (room.users.has(socket.id)) {
                    room.users.delete(socket.id);
                    const roomId = `file:${fileId}`;
                    io.to(roomId).emit('user-left', { socketId: socket.id });
                    // Clean up empty rooms
                    if (room.users.size === 0) {
                        rooms.delete(fileId);
                    }
                }
            }
        });
    });

    function leaveRoom(socket, roomId) {
        const fileId = roomId.replace('file:', '');
        const room = rooms.get(fileId);
        if (room) {
            room.users.delete(socket.id);
            socket.leave(roomId);
            io.to(roomId).emit('user-left', { socketId: socket.id });
            // Clean up empty rooms
            if (room.users.size === 0) {
                rooms.delete(fileId);
            }
        }
    }

    return io;
}
