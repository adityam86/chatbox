import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';

export async function createStatus(req, res) {
  try {
    const userId = req.user.id;
    const { text, media_url, background_color = '#005c4b' } = req.body;

    if (!text && !media_url) {
      return res.status(400).json({ error: 'Text or media is required for status.' });
    }

    const statusId = uuidv4();
    await pool.query(
      `INSERT INTO statuses (id, user_id, media_url, text, background_color, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [statusId, userId, media_url || null, text || null, background_color]
    );

    const [rows] = await pool.query(
      `SELECT s.*, u.username, u.profile_image
       FROM statuses s
       INNER JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [statusId]
    );

    return res.status(201).json({ status: rows[0] });
  } catch (error) {
    console.error('createStatus error:', error);
    return res.status(500).json({ error: 'Failed to create status.' });
  }
}

export async function getStatuses(req, res) {
  try {
    const currentUserId = req.user.id;

    // Get statuses created within the last 24 hours
    const [rows] = await pool.query(
      `SELECT s.*, u.username, u.profile_image
       FROM statuses s
       INNER JOIN users u ON s.user_id = u.id
       WHERE s.created_at >= NOW() - INTERVAL 24 HOUR
       ORDER BY s.created_at DESC`
    );

    // Group by user
    const myStatuses = [];
    const recentStatusesMap = new Map();

    rows.forEach((s) => {
      if (s.user_id === currentUserId) {
        myStatuses.push(s);
      } else {
        if (!recentStatusesMap.has(s.user_id)) {
          recentStatusesMap.set(s.user_id, {
            user: {
              id: s.user_id,
              username: s.username,
              profile_image: s.profile_image,
            },
            statuses: [],
            lastUpdated: s.created_at,
          });
        }
        recentStatusesMap.get(s.user_id).statuses.push(s);
      }
    });

    return res.status(200).json({
      myStatuses,
      recentUpdates: Array.from(recentStatusesMap.values()),
    });
  } catch (error) {
    console.error('getStatuses error:', error);
    return res.status(500).json({ error: 'Failed to fetch statuses.' });
  }
}
