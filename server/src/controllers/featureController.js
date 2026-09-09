import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';

// Star / Unstar Message
export async function toggleStarMessage(req, res) {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const [existing] = await pool.query(
      'SELECT id FROM starred_messages WHERE user_id = ? AND message_id = ?',
      [userId, messageId]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM starred_messages WHERE id = ?', [existing[0].id]);
      return res.status(200).json({ isStarred: false, message: 'Message unstarred.' });
    } else {
      const starId = uuidv4();
      await pool.query(
        'INSERT INTO starred_messages (id, user_id, message_id, created_at) VALUES (?, ?, ?, NOW())',
        [starId, userId, messageId]
      );
      return res.status(200).json({ isStarred: true, message: 'Message starred.' });
    }
  } catch (error) {
    console.error('toggleStarMessage error:', error);
    return res.status(500).json({ error: 'Failed to star/unstar message.' });
  }
}

// Get all Starred Messages for User
export async function getStarredMessages(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
        sm.id AS star_id,
        sm.created_at AS starred_at,
        m.id AS message_id,
        m.conversation_id,
        m.sender_id,
        m.message,
        m.message_type,
        m.media_url,
        m.created_at AS message_created_at,
        u.username AS sender_username,
        u.profile_image AS sender_profile_image,
        c.type AS conversation_type,
        c.name AS group_name
      FROM starred_messages sm
      INNER JOIN messages m ON sm.message_id = m.id
      INNER JOIN users u ON m.sender_id = u.id
      INNER JOIN conversations c ON m.conversation_id = c.id
      WHERE sm.user_id = ?
      ORDER BY sm.created_at DESC`,
      [userId]
    );

    return res.status(200).json({ starredMessages: rows });
  } catch (error) {
    console.error('getStarredMessages error:', error);
    return res.status(500).json({ error: 'Failed to fetch starred messages.' });
  }
}

// Toggle Pin Conversation
export async function togglePinChat(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const [existing] = await pool.query(
      'SELECT id, is_pinned FROM chat_preferences WHERE user_id = ? AND conversation_id = ?',
      [userId, conversationId]
    );

    let isPinned = true;
    if (existing.length > 0) {
      isPinned = !existing[0].is_pinned;
      await pool.query(
        'UPDATE chat_preferences SET is_pinned = ?, updated_at = NOW() WHERE id = ?',
        [isPinned, existing[0].id]
      );
    } else {
      const prefId = uuidv4();
      await pool.query(
        'INSERT INTO chat_preferences (id, user_id, conversation_id, is_pinned) VALUES (?, ?, ?, 1)',
        [prefId, userId, conversationId]
      );
    }

    return res.status(200).json({ isPinned, conversationId });
  } catch (error) {
    console.error('togglePinChat error:', error);
    return res.status(500).json({ error: 'Failed to pin/unpin chat.' });
  }
}

// Toggle Mute Notifications
export async function toggleMuteChat(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const [existing] = await pool.query(
      'SELECT id, is_muted FROM chat_preferences WHERE user_id = ? AND conversation_id = ?',
      [userId, conversationId]
    );

    let isMuted = true;
    if (existing.length > 0) {
      isMuted = !existing[0].is_muted;
      await pool.query(
        'UPDATE chat_preferences SET is_muted = ?, updated_at = NOW() WHERE id = ?',
        [isMuted, existing[0].id]
      );
    } else {
      const prefId = uuidv4();
      await pool.query(
        'INSERT INTO chat_preferences (id, user_id, conversation_id, is_muted) VALUES (?, ?, ?, 1)',
        [prefId, userId, conversationId]
      );
    }

    return res.status(200).json({ isMuted, conversationId });
  } catch (error) {
    console.error('toggleMuteChat error:', error);
    return res.status(500).json({ error: 'Failed to mute/unmute chat.' });
  }
}

// Get User Chat Preferences (Pinned & Muted)
export async function getUserPreferences(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      'SELECT conversation_id, is_pinned, is_muted FROM chat_preferences WHERE user_id = ?',
      [userId]
    );

    const [starred] = await pool.query(
      'SELECT message_id FROM starred_messages WHERE user_id = ?',
      [userId]
    );

    const pinned = rows.filter((r) => r.is_pinned).map((r) => r.conversation_id);
    const muted = rows.filter((r) => r.is_muted).map((r) => r.conversation_id);
    const starredMsgIds = starred.map((s) => s.message_id);

    return res.status(200).json({
      pinned,
      muted,
      starredMessageIds: starredMsgIds,
    });
  } catch (error) {
    console.error('getUserPreferences error:', error);
    return res.status(500).json({ error: 'Failed to fetch user preferences.' });
  }
}
