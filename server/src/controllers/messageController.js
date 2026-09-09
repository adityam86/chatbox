import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';

export async function sendMessage(req, res) {
  try {
    const senderId = req.user.id;
    const { conversation_id, message, message_type = 'text', media_url = null, reply_to_message_id = null } = req.body;

    if (!conversation_id || (!message && !media_url)) {
      return res.status(400).json({ error: 'Conversation ID and content or media are required.' });
    }

    // Verify sender is a conversation member
    const [membership] = await pool.query(
      'SELECT id FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
      [conversation_id, senderId]
    );

    if (membership.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this conversation.' });
    }

    const messageId = uuidv4();
    await pool.query(
      `INSERT INTO messages (id, conversation_id, sender_id, message, message_type, media_url, reply_to_message_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'sent')`,
      [messageId, conversation_id, senderId, message || null, message_type, media_url, reply_to_message_id]
    );

    // Update conversation timestamp
    await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = ?', [conversation_id]);

    // Retrieve the created message with sender info
    const [savedMsgRows] = await pool.query(
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
        u.profile_image AS sender_profile_image
      FROM messages m
      INNER JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?`,
      [messageId]
    );

    return res.status(201).json({ message: savedMsgRows[0] });
  } catch (error) {
    console.error('sendMessage error:', error);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
}

export async function addReaction(req, res) {
  try {
    const userId = req.user.id;
    const { id: messageId } = req.params;
    const { reaction } = req.body;

    if (!reaction) {
      return res.status(400).json({ error: 'Reaction emoji is required.' });
    }

    const reactionId = uuidv4();
    await pool.query(
      `INSERT INTO message_reactions (id, message_id, user_id, reaction)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE reaction = VALUES(reaction), created_at = NOW()`,
      [reactionId, messageId, userId, reaction]
    );

    return res.status(200).json({ message: 'Reaction updated successfully.', reaction });
  } catch (error) {
    console.error('addReaction error:', error);
    return res.status(500).json({ error: 'Failed to add reaction.' });
  }
}

export async function deleteMessage(req, res) {
  try {
    const userId = req.user.id;
    const { id: messageId } = req.params;

    const [msg] = await pool.query('SELECT sender_id FROM messages WHERE id = ?', [messageId]);
    if (msg.length === 0) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    if (msg[0].sender_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own messages.' });
    }

    await pool.query('UPDATE messages SET is_deleted = 1, message = "This message was deleted." WHERE id = ?', [messageId]);

    return res.status(200).json({ message: 'Message deleted successfully.' });
  } catch (error) {
    console.error('deleteMessage error:', error);
    return res.status(500).json({ error: 'Failed to delete message.' });
  }
}
