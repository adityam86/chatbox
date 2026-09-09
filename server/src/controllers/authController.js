import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';

export async function register(req, res) {
  try {
    const { username, email, password, bio } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if username or email already exists
    const [existingUsers] = await pool.query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
      [username.trim(), email.trim().toLowerCase()]
    );

    if (existingUsers.length > 0) {
      const match = existingUsers[0];
      if (match.username.toLowerCase() === username.trim().toLowerCase()) {
        return res.status(409).json({ error: 'Username is already taken.' });
      }
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();
    const userBio = bio || 'Hey there! I am using ChatApp.';
    // Default avatar using UI Avatars
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username.trim())}&background=00a884&color=fff&size=128`;

    await pool.query(
      `INSERT INTO users (id, username, email, password_hash, profile_image, bio, is_online, last_seen)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
      [userId, username.trim(), email.trim().toLowerCase(), passwordHash, defaultAvatar, userBio]
    );

    const token = jwt.sign(
      { id: userId, username: username.trim(), email: email.trim().toLowerCase() },
      process.env.JWT_SECRET || 'super_secret_chatapp_jwt_key_2026_change_in_production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const userResponse = {
      id: userId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      profile_image: defaultAvatar,
      bio: userBio,
      is_online: 1,
      last_seen: new Date(),
    };

    return res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

export async function login(req, res) {
  try {
    const { identifier, password } = req.body; // identifier can be username or email

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email and password are required.' });
    }

    const cleanIdentifier = identifier.trim();

    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
      [cleanIdentifier, cleanIdentifier.toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Mark online
    await pool.query('UPDATE users SET is_online = 1, last_seen = NOW() WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'super_secret_chatapp_jwt_key_2026_change_in_production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      profile_image: user.profile_image,
      bio: user.bio,
      is_online: 1,
      last_seen: new Date(),
    };

    return res.status(200).json({
      message: 'Login successful',
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

export async function getMe(req, res) {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, profile_image, bio, is_online, last_seen, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ user: users[0] });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function logout(req, res) {
  try {
    if (req.user && req.user.id) {
      await pool.query('UPDATE users SET is_online = 0, last_seen = NOW() WHERE id = ?', [req.user.id]);
    }
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('logout error:', error);
    return res.status(500).json({ error: 'Internal server error during logout.' });
  }
}
