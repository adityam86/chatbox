import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';

// Map of userId -> Set of socketIds (to support multiple tabs/devices)
const onlineUsers = new Map();

export function setupChatSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    let authenticatedUserId = null;

    // 1. User registers their socket
    socket.on('user:join', async (userData) => {
      if (!userData || !userData.id) return;
      authenticatedUserId = userData.id;

      if (!onlineUsers.has(authenticatedUserId)) {
        onlineUsers.set(authenticatedUserId, new Set());
      }
      onlineUsers.get(authenticatedUserId).add(socket.id);

      // Mark user online in DB
      try {
        await pool.query('UPDATE users SET is_online = 1, last_seen = NOW() WHERE id = ?', [authenticatedUserId]);
      } catch (err) {
        console.error('Error setting user online status:', err.message);
      }

      // Broadcast to everyone that this user is online
      io.emit('user:status', {
        userId: authenticatedUserId,
        is_online: true,
        last_seen: new Date(),
      });

      console.log(`👤 User ${userData.username || authenticatedUserId} is online (${onlineUsers.get(authenticatedUserId).size} sockets)`);
    });

    // 2. Join a conversation room
    socket.on('conversation:join', (conversationId) => {
      if (conversationId) {
        socket.join(conversationId);
        console.log(`📥 Socket ${socket.id} joined conversation room: ${conversationId}`);
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
      socket.to(conversationId).emit('typing:start', { conversationId, userId: authenticatedUserId, username });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:stop', { conversationId, userId: authenticatedUserId });
    });

    // 5. Send message in real-time
    socket.on('message:send', async (data, callback) => {
      try {
        const { conversationId, senderId, message, messageType = 'text', mediaUrl = null, replyToMessageId = null } = data;

        if (!conversationId || !senderId || (!message && !mediaUrl)) {
          if (typeof callback === 'function') callback({ error: 'Missing required message parameters.' });
          return;
        }

        const messageId = uuidv4();

        // Check if recipient is currently online to set initial status
        let initialStatus = 'sent';

        // Insert into DB
        await pool.query(
          `INSERT INTO messages (id, conversation_id, sender_id, message, message_type, media_url, reply_to_message_id, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [messageId, conversationId, senderId, message || null, messageType, mediaUrl, replyToMessageId, initialStatus]
        );

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
    socket.on('message:read', async ({ conversationId, userId }) => {
      try {
        if (!conversationId || !userId) return;

        await pool.query(
          `UPDATE messages 
           SET status = 'read', updated_at = NOW() 
           WHERE conversation_id = ? AND sender_id != ? AND status != 'read'`,
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
    socket.on('message:reaction', async ({ messageId, conversationId, userId, reaction, username }) => {
      try {
        if (!messageId || !userId || !reaction) return;

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
    socket.on('message:delete', async ({ messageId, conversationId, userId }) => {
      try {
        if (!messageId || !userId) return;

        // Verify sender
        const [msg] = await pool.query('SELECT sender_id FROM messages WHERE id = ?', [messageId]);
        if (msg.length > 0 && msg[0].sender_id === userId) {
          await pool.query(
            'UPDATE messages SET is_deleted = 1, message = "This message was deleted." WHERE id = ?',
            [messageId]
          );

          io.to(conversationId).emit('message:deleted', {
            messageId,
            conversationId,
          });
        }
      } catch (err) {
        console.error('Socket message:delete error:', err);
      }
    });

    // 8.5 Edit message (Within 15 minutes / sender only)
    socket.on('message:edit', async ({ messageId, conversationId, userId, newContent }, callback) => {
      try {
        if (!messageId || !userId || !newContent || !newContent.trim()) {
          if (typeof callback === 'function') callback({ error: 'Missing parameters' });
          return;
        }

        const [msg] = await pool.query('SELECT sender_id, created_at FROM messages WHERE id = ?', [messageId]);
        if (msg.length === 0 || msg[0].sender_id !== userId) {
          if (typeof callback === 'function') callback({ error: 'Unauthorized to edit this message' });
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
    socket.on('call:initiate', ({ targetUserId, callType, callerId, callerUserId, callerName, callerAvatar, signal }, callback) => {
      const caller = callerName || authenticatedUserId || 'User';
      const cUserId = callerUserId || authenticatedUserId;
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

    socket.on('call:accept', ({ targetUserId, signal }) => {
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

    socket.on('call:decline', ({ targetUserId }) => {
      console.log(`❌ Call declined for ${targetUserId}`);
      if (onlineUsers.has(targetUserId)) {
        onlineUsers.get(targetUserId).forEach((sid) => {
          io.to(sid).emit('call:declined');
        });
      } else if (io.sockets.sockets && io.sockets.sockets.has(targetUserId)) {
        io.to(targetUserId).emit('call:declined');
      }
    });

    socket.on('call:signal', ({ targetUserId, signal }) => {
      const payload = { signal, fromUserId: authenticatedUserId, fromSocketId: socket.id };
      if (onlineUsers.has(targetUserId)) {
        onlineUsers.get(targetUserId).forEach((sid) => {
          io.to(sid).emit('call:signal', payload);
        });
      } else if (io.sockets.sockets && io.sockets.sockets.has(targetUserId)) {
        io.to(targetUserId).emit('call:signal', payload);
      }
    });

    socket.on('call:end', ({ targetUserId }) => {
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
