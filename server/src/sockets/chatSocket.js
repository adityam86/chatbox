import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';
import jwt from 'jsonwebtoken';

// Map of userId -> Set of socketIds (to support multiple tabs/devices)
const onlineUsers = new Map();

// Spam protection map: userId_event -> timestamp array
const socketRateLimits = new Map();

function checkRateLimit(userId, event, limitMs = 1000, maxEvents = 5) {
  const key = `${userId}_${event}`;
  const now = Date.now();
  if (!socketRateLimits.has(key)) {
    socketRateLimits.set(key, [now]);
    return true;
  }
  
  const timestamps = socketRateLimits.get(key).filter(t => now - t < limitMs);
  timestamps.push(now);
  socketRateLimits.set(key, timestamps);
  
  if (timestamps.length > maxEvents) {
    return false; // Rate limit exceeded
  }
  return true;
}

async function checkMembership(userA, userB) {
  try {
    const [rows] = await pool.query(
      `SELECT cm1.conversation_id 
       FROM conversation_members cm1
       JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
       WHERE cm1.user_id = ? AND cm2.user_id = ? LIMIT 1`,
      [userA, userB]
    );
    return rows.length > 0;
  } catch (err) {
    console.error('Membership check failed:', err);
    return false;
  }
}

async function checkConversationMembership(userId, conversationId) {
  try {
    const [rows] = await pool.query(
      `SELECT user_id FROM conversation_members WHERE user_id = ? AND conversation_id = ? LIMIT 1`,
      [userId, conversationId]
    );
    return rows.length > 0;
  } catch (err) {
    console.error('Conversation membership check failed:', err);
    return false;
  }
}

export function setupChatSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    const authenticatedUserId = socket.user.id;

    // 1. User registers their socket
    socket.on('user:join', async () => {
      socket.join(authenticatedUserId); // For cross-tab syncing of delete-for-me
      if (!onlineUsers.has(authenticatedUserId)) {
        onlineUsers.set(authenticatedUserId, new Set());
      }
      onlineUsers.get(authenticatedUserId).add(socket.id);

      // Mark user online in DB
      try {
        await pool.query('UPDATE users SET is_online = 1, last_seen = NOW() WHERE id = ?', [authenticatedUserId]);

        // Mark pending messages as delivered
        await pool.query(
          `UPDATE message_status 
           SET status = 'delivered', delivered_at = NOW() 
           WHERE user_id = ? AND status = 'sent'`,
          [authenticatedUserId]
        );
      } catch (err) {
        console.error('Error setting user online status:', err.message);
      }

      // Broadcast to everyone that this user is online
      io.emit('user:status', {
        userId: authenticatedUserId,
        is_online: true,
        last_seen: new Date(),
      });

      console.log(`👤 User ${socket.user.username} is online (${onlineUsers.get(authenticatedUserId).size} sockets)`);
    });

    // 2. Join a conversation room
    socket.on('conversation:join', async (conversationId) => {
      if (conversationId) {
        const isMember = await checkConversationMembership(authenticatedUserId, conversationId);
        if (isMember) {
          socket.join(conversationId);
          console.log(`📥 Socket ${socket.id} joined conversation room: ${conversationId}`);
        } else {
          console.warn(`Unauthorized room join attempt by ${authenticatedUserId} for ${conversationId}`);
        }
      }
    });

    // 3. Leave a conversation room
    socket.on('conversation:leave', (conversationId) => {
      if (conversationId) {
        socket.leave(conversationId);
      }
    });

    // 4. Typing indicators
    socket.on('typing:start', ({ conversationId, username }) => {
      if (!checkRateLimit(authenticatedUserId, 'typing:start', 1000, 3)) return;
      socket.to(conversationId).emit('typing:start', { conversationId, userId: authenticatedUserId, username });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      if (!checkRateLimit(authenticatedUserId, 'typing:stop', 1000, 3)) return;
      socket.to(conversationId).emit('typing:stop', { conversationId, userId: authenticatedUserId, username: socket.user.username });
    });

    // 5. Send message in real-time
    socket.on('message:send', async (data, callback) => {
      try {
        if (!checkRateLimit(authenticatedUserId, 'message:send', 1000, 5)) {
          if (typeof callback === 'function') callback({ error: 'You are sending messages too fast.' });
          return;
        }

        const { conversationId, message, messageType = 'text', mediaUrl = null, replyToMessageId = null, disappearingTimer = 'off' } = data;
        const senderId = authenticatedUserId;

        if (!conversationId || !senderId || (!message && !mediaUrl)) {
          if (typeof callback === 'function') callback({ error: 'Missing required message parameters.' });
          return;
        }

        const messageId = uuidv4();

        // Calculate expiresAt
        let expiresAt = null;
        if (disappearingTimer === '24h') {
          expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        } else if (disappearingTimer === '7d') {
          expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        } else if (disappearingTimer === '90d') {
          expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        }

        // Check if recipient is currently online to set initial status
        let initialStatus = 'sent';

        // Insert into DB
        await pool.query(
          `INSERT INTO messages (id, conversation_id, sender_id, message, message_type, media_url, reply_to_message_id, status, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [messageId, conversationId, senderId, message || null, messageType, mediaUrl, replyToMessageId, initialStatus, expiresAt]
        );

        // Populate per-recipient message_status
        const [membersForStatus] = await pool.query(
          'SELECT user_id FROM conversation_members WHERE conversation_id = ? AND user_id != ?',
          [conversationId, senderId]
        );
        for (const member of membersForStatus) {
          const statusId = uuidv4();
          let memberStatus = 'sent';
          let deliveredAt = null;

          if (onlineUsers.has(member.user_id)) {
            memberStatus = 'delivered';
            deliveredAt = new Date();
          }

          await pool.query(
            `INSERT INTO message_status (id, message_id, user_id, status, delivered_at)
             VALUES (?, ?, ?, ?, ?)`,
            [statusId, messageId, member.user_id, memberStatus, deliveredAt]
          );
        }

        // Update conversation updated_at
        await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = ?', [conversationId]);

        // Query full message details including reply quote
        const [msgRows] = await pool.query(
          `SELECT 
            m.id,
            m.conversation_id,
            m.sender_id,
            m.message,
            m.message_type,
            m.media_url,
            m.reply_to_message_id,
            m.status,
            m.is_deleted,
            m.created_at,
            u.username AS sender_username,
            u.profile_image AS sender_profile_image,
            rm.message AS reply_text,
            ru.username AS reply_sender_username
          FROM messages m
          INNER JOIN users u ON m.sender_id = u.id
          LEFT JOIN messages rm ON m.reply_to_message_id = rm.id
          LEFT JOIN users ru ON rm.sender_id = ru.id
          WHERE m.id = ?`,
          [messageId]
        );

        const newMsg = msgRows[0];
        newMsg.reactions = [];

        // Broadcast to all sockets in conversation room (including sender or excluding based on UI logic)
        io.to(conversationId).emit('message:new', newMsg);

        // Also notify members who might not have opened this chat yet (to update their sidebar/chat list)
        const [members] = await pool.query(
          'SELECT user_id FROM conversation_members WHERE conversation_id = ?',
          [conversationId]
        );

        members.forEach((m) => {
          if (onlineUsers.has(m.user_id)) {
            onlineUsers.get(m.user_id).forEach((sid) => {
              io.to(sid).emit('conversation:updated', {
                conversationId,
                lastMessage: newMsg,
              });
            });
          }
        });

        if (typeof callback === 'function') {
          callback({ success: true, message: newMsg });
        }
      } catch (err) {
        console.error('Socket message:send error:', err);
        if (typeof callback === 'function') callback({ error: 'Failed to deliver message.' });
      }
    });

    // 6. Message read receipt
    socket.on('message:read', async ({ conversationId }) => {
      try {
        const userId = authenticatedUserId;
        if (!conversationId || !userId) return;

        await pool.query(
          `UPDATE messages 
           SET status = 'read', updated_at = NOW() 
           WHERE conversation_id = ? AND sender_id != ? AND status != 'read'`,
          [conversationId, userId]
        );

        // Update per-recipient message_status
        await pool.query(
          `UPDATE message_status ms
           INNER JOIN messages m ON ms.message_id = m.id
           SET ms.status = 'read', ms.read_at = NOW()
           WHERE m.conversation_id = ? AND ms.user_id = ? AND ms.status != 'read'`,
          [conversationId, userId]
        );

        // Notify other conversation participants that messages are read (blue double check!)
        socket.to(conversationId).emit('message:read_receipt', {
          conversationId,
          readBy: userId,
        });
      } catch (err) {
        console.error('Error updating read receipts:', err.message);
      }
    });

    // 7. Message Reactions
    socket.on('message:reaction', async ({ messageId, conversationId, reaction }) => {
      try {
        const userId = authenticatedUserId;
        const username = socket.user.username;
        if (!messageId || !userId || !reaction || !conversationId) return;

        if (!checkRateLimit(userId, 'message:reaction', 500, 10)) return;

        // Ensure user is authorized to interact with this conversation
        const isAllowed = await checkConversationMembership(userId, conversationId);
        if (!isAllowed) {
          console.warn(`Unauthorized reaction attempt by ${userId}`);
          return;
        }

        // Check if user already gave this reaction (toggle off)
        const [existing] = await pool.query(
          'SELECT id, reaction FROM message_reactions WHERE message_id = ? AND user_id = ?',
          [messageId, userId]
        );

        if (existing.length > 0 && existing[0].reaction === reaction) {
          // Remove reaction
          await pool.query('DELETE FROM message_reactions WHERE id = ?', [existing[0].id]);
          io.to(conversationId).emit('message:reaction_updated', {
            messageId,
            conversationId,
            userId,
            action: 'remove',
            reaction,
          });
        } else {
          // Add or change reaction
          const reactionId = uuidv4();
          await pool.query(
            `INSERT INTO message_reactions (id, message_id, user_id, reaction)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE reaction = VALUES(reaction), created_at = NOW()`,
            [reactionId, messageId, userId, reaction]
          );

          io.to(conversationId).emit('message:reaction_updated', {
            messageId,
            conversationId,
            userId,
            username,
            action: 'add',
            reaction,
          });
        }
      } catch (err) {
        console.error('Socket message:reaction error:', err);
      }
    });

    // 8. Delete message (Delete for everyone)
    socket.on('message:delete', async ({ messageId, conversationId }) => {
      try {
        const userId = authenticatedUserId;
        if (!messageId || !userId) return;

        // Verify sender or group admin
        const [msg] = await pool.query('SELECT sender_id FROM messages WHERE id = ?', [messageId]);
        if (msg.length > 0) {
          const isSender = msg[0].sender_id === userId;
          
          let isAdmin = false;
          if (!isSender && conversationId) {
            const [roleCheck] = await pool.query(
              'SELECT role FROM conversation_members WHERE user_id = ? AND conversation_id = ?',
              [userId, conversationId]
            );
            if (roleCheck.length > 0 && roleCheck[0].role === 'admin') {
              isAdmin = true;
            }
          }

          if (isSender || isAdmin) {
            await pool.query(
              'UPDATE messages SET is_deleted = 1, message = "This message was deleted." WHERE id = ?',
              [messageId]
            );

            io.to(conversationId).emit('message:deleted', {
              messageId,
              conversationId,
            });
          }
        }
      } catch (err) {
        console.error('Socket message:delete error:', err);
      }
    });

    // 8. Message delete (For Me)
    socket.on('message:delete_for_me', async ({ messageId, conversationId }) => {
      try {
        const userId = authenticatedUserId;
        if (!messageId || !conversationId || !userId) return;

        const deletedId = uuidv4();
        await pool.query(
          `INSERT INTO deleted_messages (id, user_id, message_id)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE id=id`,
          [deletedId, userId, messageId]
        );

        io.to(userId).emit('message:deleted_for_me', {
          messageId,
          conversationId,
        });
      } catch (err) {
        console.error('Socket message:delete_for_me error:', err.message);
      }
    });

    // 8.5 Edit message (Within 15 minutes / sender only)
    socket.on('message:edit', async ({ messageId, conversationId, newContent }, callback) => {
      try {
        const userId = authenticatedUserId;
        if (!messageId || !userId || !newContent || !newContent.trim()) {
          if (typeof callback === 'function') callback({ error: 'Missing parameters' });
          return;
        }

        const [msg] = await pool.query('SELECT sender_id, created_at FROM messages WHERE id = ?', [messageId]);
        if (msg.length === 0 || msg[0].sender_id !== userId) {
          if (typeof callback === 'function') callback({ error: 'Unauthorized to edit this message' });
          return;
        }

        const messageTime = new Date(msg[0].created_at).getTime();
        const now = Date.now();
        const diffMinutes = (now - messageTime) / (1000 * 60);

        if (diffMinutes > 15) {
          if (typeof callback === 'function') callback({ error: 'Message can only be edited within 15 minutes of sending' });
          return;
        }

        // Update DB message content
        await pool.query(
          'UPDATE messages SET message = ?, updated_at = NOW() WHERE id = ?',
          [newContent.trim(), messageId]
        );

        io.to(conversationId).emit('message:edited', {
          messageId,
          conversationId,
          newContent: newContent.trim(),
        });

        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        console.error('Socket message:edit error:', err);
        if (typeof callback === 'function') callback({ error: 'Failed to edit message.' });
      }
    });

    // 9. WebRTC 1-on-1 Audio & Video Call Signaling
    socket.on('call:initiate', async ({ targetUserId, callType, callerAvatar, signal }, callback) => {
      const caller = socket.user.username;
      const cUserId = authenticatedUserId;

      const isAllowed = await checkMembership(cUserId, targetUserId);
      if (!isAllowed) {
        console.warn(`Unauthorized call attempt from ${cUserId} to ${targetUserId}`);
        if (typeof callback === 'function') callback({ error: 'Unauthorized. You must be in a conversation to call.' });
        return;
      }

      console.log(`📞 Call initiated by ${caller} (${cUserId}) to ${targetUserId} (${callType})`);

      const payload = {
        callerId: socket.id,
        callerUserId: cUserId,
        callerName: caller,
        callerAvatar: callerAvatar || null,
        callType: callType || 'video',
        signal,
      };

      let delivered = false;

      if (onlineUsers.has(targetUserId)) {
        const recipientSockets = onlineUsers.get(targetUserId);
        recipientSockets.forEach((sid) => {
          io.to(sid).emit('call:incoming', payload);
        });
        delivered = true;
      } else if (io.sockets.sockets && io.sockets.sockets.has(targetUserId)) {
        io.to(targetUserId).emit('call:incoming', payload);
        delivered = true;
      }

      if (delivered) {
        if (typeof callback === 'function') callback({ success: true });
      } else {
        console.warn(`User ${targetUserId} is offline or not found in onlineUsers.`);
        if (typeof callback === 'function') callback({ error: 'User is currently offline.' });
      }
    });

    socket.on('call:accept', async ({ targetUserId, signal }) => {
      const isAllowed = await checkMembership(authenticatedUserId, targetUserId);
      if (!isAllowed) return;

      console.log(`✅ Call accepted, routing answer signal to ${targetUserId}`);
      const payload = { signal, fromUserId: authenticatedUserId, fromSocketId: socket.id };
      if (onlineUsers.has(targetUserId)) {
        onlineUsers.get(targetUserId).forEach((sid) => {
          io.to(sid).emit('call:accepted', payload);
        });
      } else if (io.sockets.sockets && io.sockets.sockets.has(targetUserId)) {
        io.to(targetUserId).emit('call:accepted', payload);
      }
    });

    socket.on('call:decline', async ({ targetUserId }) => {
      const isAllowed = await checkMembership(authenticatedUserId, targetUserId);
      if (!isAllowed) return;

      console.log(`❌ Call declined for ${targetUserId}`);
      if (onlineUsers.has(targetUserId)) {
        onlineUsers.get(targetUserId).forEach((sid) => {
          io.to(sid).emit('call:declined');
        });
      } else if (io.sockets.sockets && io.sockets.sockets.has(targetUserId)) {
        io.to(targetUserId).emit('call:declined');
      }
    });

    socket.on('call:signal', async ({ targetUserId, signal }) => {
      const isAllowed = await checkMembership(authenticatedUserId, targetUserId);
      if (!isAllowed) return;

      const payload = { signal, fromUserId: authenticatedUserId, fromSocketId: socket.id };
      if (onlineUsers.has(targetUserId)) {
        onlineUsers.get(targetUserId).forEach((sid) => {
          io.to(sid).emit('call:signal', payload);
        });
      } else if (io.sockets.sockets && io.sockets.sockets.has(targetUserId)) {
        io.to(targetUserId).emit('call:signal', payload);
      }
    });

    socket.on('call:end', async ({ targetUserId }) => {
      const isAllowed = await checkMembership(authenticatedUserId, targetUserId);
      if (!isAllowed) return;

      console.log(`📴 Call ended with ${targetUserId}`);
      if (onlineUsers.has(targetUserId)) {
        onlineUsers.get(targetUserId).forEach((sid) => {
          io.to(sid).emit('call:ended');
        });
      } else if (io.sockets.sockets && io.sockets.sockets.has(targetUserId)) {
        io.to(targetUserId).emit('call:ended');
      }
    });

    // 7. Disconnection
    socket.on('disconnect', async () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);

      if (authenticatedUserId && onlineUsers.has(authenticatedUserId)) {
        const userSockets = onlineUsers.get(authenticatedUserId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(authenticatedUserId);

          try {
            await pool.query('UPDATE users SET is_online = 0, last_seen = NOW() WHERE id = ?', [authenticatedUserId]);
          } catch (err) {
            console.error('Error setting user offline in DB:', err.message);
          }

          io.emit('user:status', {
            userId: authenticatedUserId,
            is_online: false,
            last_seen: new Date(),
          });

          console.log(`👤 User ${authenticatedUserId} is now offline.`);
        }
      }
    });
  });
}

export function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}
