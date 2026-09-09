import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';

export async function getUserConversations(req, res) {
  try {
    const currentUserId = req.user.id;

    // Fetch conversations where user is a member, including latest message and recipient details
    const [rows] = await pool.query(
      `SELECT 
        c.id AS conversation_id,
        c.type,
        c.name AS group_name,
        c.image AS group_image,
        c.updated_at,
        u.id AS recipient_id,
        u.username AS recipient_username,
        u.profile_image AS recipient_profile_image,
        u.is_online AS recipient_is_online,
        u.last_seen AS recipient_last_seen,
        lm.id AS last_message_id,
        lm.message AS last_message_text,
        lm.message_type AS last_message_type,
        lm.sender_id AS last_message_sender_id,
        lm.status AS last_message_status,
        lm.created_at AS last_message_created_at,
        (
          SELECT COUNT(*)
          FROM messages m2
          WHERE m2.conversation_id = c.id
            AND m2.sender_id != ?
            AND m2.status != 'read'
        ) AS unread_count
      FROM conversations c
      INNER JOIN conversation_members cm ON c.id = cm.conversation_id AND cm.user_id = ?
      -- For 1-on-1 chats, find the other member
      LEFT JOIN conversation_members other_cm 
        ON c.id = other_cm.conversation_id AND other_cm.user_id != ? AND c.type = 'direct'
      LEFT JOIN users u ON other_cm.user_id = u.id
      -- Fetch latest message
      LEFT JOIN (
        SELECT m1.*
        FROM messages m1
        INNER JOIN (
          SELECT conversation_id, MAX(created_at) AS max_created
          FROM messages
          GROUP BY conversation_id
        ) latest ON m1.conversation_id = latest.conversation_id AND m1.created_at = latest.max_created
      ) lm ON c.id = lm.conversation_id
      ORDER BY COALESCE(lm.created_at, c.updated_at) DESC`,
      [currentUserId, currentUserId, currentUserId]
    );

    return res.status(200).json({ conversations: rows });
  } catch (error) {
    console.error('getUserConversations error:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
}

export async function getOrCreateConversation(req, res) {
  try {
    const currentUserId = req.user.id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required.' });
    }

    if (recipientId === currentUserId) {
      return res.status(400).json({ error: 'Cannot start a conversation with yourself.' });
    }

    // Check if direct conversation already exists between both users
    const [existing] = await pool.query(
      `SELECT c.id
       FROM conversations c
       INNER JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = ?
       INNER JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = ?
       WHERE c.type = 'direct'
       LIMIT 1`,
      [currentUserId, recipientId]
    );

    if (existing.length > 0) {
      return res.status(200).json({ conversationId: existing[0].id, isNew: false });
    }

    // Verify recipient exists
    const [recipient] = await pool.query('SELECT id FROM users WHERE id = ?', [recipientId]);
    if (recipient.length === 0) {
      return res.status(404).json({ error: 'Recipient user does not exist.' });
    }

    // Create new conversation
    const conversationId = uuidv4();
    await pool.query(
      'INSERT INTO conversations (id, type, created_by) VALUES (?, "direct", ?)',
      [conversationId, currentUserId]
    );

    // Add members
    await pool.query(
      `INSERT INTO conversation_members (id, conversation_id, user_id) VALUES
       (?, ?, ?),
       (?, ?, ?)`,
      [uuidv4(), conversationId, currentUserId, uuidv4(), conversationId, recipientId]
    );

    return res.status(201).json({ conversationId, isNew: true });
  } catch (error) {
    console.error('getOrCreateConversation error:', error);
    return res.status(500).json({ error: 'Failed to create conversation.' });
  }
}

export async function getConversationMessages(req, res) {
  try {
    const currentUserId = req.user.id;
    const { id: conversationId } = req.params;

    // Verify membership
    const [membership] = await pool.query(
      'SELECT id FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
      [conversationId, currentUserId]
    );

    if (membership.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this conversation.' });
    }

    // Fetch messages with sender info and reply details
    const [messages] = await pool.query(
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
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC`,
      [conversationId]
    );

    // Fetch reactions for messages if any exist
    if (messages.length > 0) {
      const messageIds = messages.map((m) => m.id);
      const [reactions] = await pool.query(
        `SELECT mr.id, mr.message_id, mr.user_id, mr.reaction, u.username
         FROM message_reactions mr
         INNER JOIN users u ON mr.user_id = u.id
         WHERE mr.message_id IN (?)`,
        [messageIds]
      );

      const reactionsByMsgId = {};
      reactions.forEach((r) => {
        if (!reactionsByMsgId[r.message_id]) {
          reactionsByMsgId[r.message_id] = [];
        }
        reactionsByMsgId[r.message_id].push(r);
      });

      messages.forEach((m) => {
        m.reactions = reactionsByMsgId[m.id] || [];
      });
    }

    // Mark messages as read if sent by other users
    await pool.query(
      `UPDATE messages 
       SET status = 'read', updated_at = NOW() 
       WHERE conversation_id = ? AND sender_id != ? AND status != 'read'`,
      [conversationId, currentUserId]
    );

    return res.status(200).json({ messages });
  } catch (error) {
    console.error('getConversationMessages error:', error);
    return res.status(500).json({ error: 'Failed to fetch messages.' });
  }
}

export async function createGroup(req, res) {
  try {
    const currentUserId = req.user.id;
    const { name, memberIds = [], image = null } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Group name is required.' });
    }

    const conversationId = uuidv4();
    const groupImage = image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=2a3942&color=00a884`;

    // Create group conversation
    await pool.query(
      `INSERT INTO conversations (id, type, name, image, created_by)
       VALUES (?, 'group', ?, ?, ?)`,
      [conversationId, name.trim(), groupImage, currentUserId]
    );

    // Add creator as admin
    await pool.query(
      `INSERT INTO conversation_members (id, conversation_id, user_id, role)
       VALUES (?, ?, ?, 'admin')`,
      [uuidv4(), conversationId, currentUserId]
    );

    // Add other members (deduplicated, excluding creator)
    const uniqueMembers = [...new Set(memberIds)].filter((id) => id !== currentUserId);
    for (const memberId of uniqueMembers) {
      await pool.query(
        `INSERT INTO conversation_members (id, conversation_id, user_id, role)
         VALUES (?, ?, ?, 'member')`,
        [uuidv4(), conversationId, memberId]
      );
    }

    return res.status(201).json({
      message: 'Group created successfully',
      conversationId,
      group: {
        id: conversationId,
        name: name.trim(),
        image: groupImage,
        type: 'group',
        created_by: currentUserId,
      },
    });
  } catch (error) {
    console.error('createGroup error:', error);
    return res.status(500).json({ error: 'Failed to create group.' });
  }
}

export async function getGroupMembers(req, res) {
  try {
    const { id: conversationId } = req.params;

    const [members] = await pool.query(
      `SELECT cm.role, cm.joined_at, u.id, u.username, u.email, u.profile_image, u.bio, u.is_online, u.last_seen
       FROM conversation_members cm
       INNER JOIN users u ON cm.user_id = u.id
       WHERE cm.conversation_id = ?
       ORDER BY cm.role = 'admin' DESC, u.username ASC`,
      [conversationId]
    );

    return res.status(200).json({ members });
  } catch (error) {
    console.error('getGroupMembers error:', error);
    return res.status(500).json({ error: 'Failed to fetch group members.' });
  }
}

export async function clearConversationMessages(req, res) {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user.id;

    const [membership] = await pool.query(
      'SELECT id FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
      [conversationId, userId]
    );
    if (membership.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this conversation.' });
    }

    await pool.query('DELETE FROM messages WHERE conversation_id = ?', [conversationId]);
    await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = ?', [conversationId]);

    return res.status(200).json({ message: 'Chat history cleared successfully.' });
  } catch (error) {
    console.error('clearConversationMessages error:', error);
    return res.status(500).json({ error: 'Failed to clear chat history.' });
  }
}

