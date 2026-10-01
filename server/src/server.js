import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

import path from 'path';
import { fileURLToPath } from 'url';

import pool, { testDbConnection } from './config/db.js';
import { setupChatSocket } from './sockets/chatSocket.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import statusRoutes from './routes/statusRoutes.js';
import featureRoutes from './routes/featureRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const isOriginAllowed = (origin) => {
  // Allow requests with no origin (like mobile apps, curl requests)
  if (!origin) return true;
  
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  if (CLIENT_URL && (origin === CLIENT_URL || origin.startsWith(CLIENT_URL))) return true;
  
  // Allow preview deployments
  if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com') || origin.endsWith('.netlify.app')) return true;
  
  return false;
};

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Rate Limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Limit each IP to 50 auth requests per window
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());
app.use(cors({
  origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
  credentials: true,
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Setup Socket handlers
setupChatSocket(io);

// Global Error monitoring for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'ChatApp Realtime API',
  });
});

// Apply global API rate limit
app.use('/api', apiLimiter);

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/features', featureRoutes);

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start Server
async function startServer() {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    process.exit(1);
  }

  await testDbConnection();

  // Start cron for disappearing messages
  setInterval(async () => {
    try {
      const [result] = await pool.query(
        'DELETE FROM messages WHERE expires_at IS NOT NULL AND expires_at <= NOW()'
      );
      if (result.affectedRows > 0) {
        console.log(`🗑️ Deleted ${result.affectedRows} expired messages.`);
      }
    } catch (err) {
      console.error('Failed to run message expiration cron:', err);
    }
  }, 1000 * 60 * 5); // every 5 minutes

  server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 ChatApp server listening on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💬 Socket.IO ready for real-time clients`);
    console.log(`=========================================`);
  });
}

startServer();
