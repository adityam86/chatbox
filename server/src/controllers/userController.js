import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

export async function updatePassword(req, res) {
  try {
    const currentUserId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [currentUserId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found.' });

    const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isValid) return res.status(401).json({ error: 'Incorrect current password.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, currentUserId]);

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('updatePassword error:', error);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
}

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
    const { bio, profile_image, username, privacy_last_seen, privacy_online, privacy_read_receipts } = req.body;

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

    if (privacy_last_seen !== undefined) {
      updates.push('privacy_last_seen = ?');
      values.push(privacy_last_seen);
    }

    if (privacy_online !== undefined) {
      updates.push('privacy_online = ?');
      values.push(privacy_online);
    }

    if (privacy_read_receipts !== undefined) {
      updates.push('privacy_read_receipts = ?');
      values.push(privacy_read_receipts ? 1 : 0);
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
      'SELECT id, username, email, profile_image, bio, is_online, last_seen, privacy_last_seen, privacy_online, privacy_read_receipts FROM users WHERE id = ?',
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
