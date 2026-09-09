import pool from '../config/db.js';

export async function searchUsers(req, res) {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;

    if (!q || q.trim() === '') {
      return res.status(200).json({ users: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    const [users] = await pool.query(
      `SELECT id, username, email, profile_image, bio, is_online, last_seen
       FROM users
       WHERE (username LIKE ? OR email LIKE ?) AND id != ?
       LIMIT 20`,
      [searchTerm, searchTerm, currentUserId]
    );

    return res.status(200).json({ users });
  } catch (error) {
    console.error('searchUsers error:', error);
    return res.status(500).json({ error: 'Failed to search users.' });
  }
}

export async function getUserProfile(req, res) {
  try {
    const { id } = req.params;

    const [users] = await pool.query(
      'SELECT id, username, email, profile_image, bio, is_online, last_seen, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ user: users[0] });
  } catch (error) {
    console.error('getUserProfile error:', error);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
}

export async function updateProfile(req, res) {
  try {
    const currentUserId = req.user.id;
    const { bio, profile_image, username } = req.body;

    const updates = [];
    const values = [];

    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }

    if (profile_image !== undefined) {
      updates.push('profile_image = ?');
      values.push(profile_image);
    }

    if (username !== undefined && username.trim().length >= 3) {
      // Check if username is already taken by someone else
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username.trim(), currentUserId]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Username is already in use.' });
      }
      updates.push('username = ?');
      values.push(username.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update provided.' });
    }

    values.push(currentUserId);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    const [updatedUser] = await pool.query(
      'SELECT id, username, email, profile_image, bio, is_online, last_seen FROM users WHERE id = ?',
      [currentUserId]
    );

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser[0],
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}
