# 💬 ChatApp — WhatsApp-Style Real-Time Chat Application

A full-stack, production-ready real-time messaging application designed to work across phones and PCs over the internet with instant delivery, active online presence, typing indicators, read receipts, and message persistence.

---

## 🌟 Key Features

- ⚡ **Real-Time Communication**: Built with Socket.IO for instant two-way messaging between multiple devices.
- 📱 **Responsive WhatsApp UI**: Designed with WhatsApp's signature dark theme (`#111b21`, `#202c33`, `#00a884`), responsive split view for desktop and navigation view for mobile.
- 👥 **User Discovery & 1-on-1 Chats**: Search registered users by username/email and start chatting immediately.
- 🟢 **Online & Presence Tracking**: Real-time indicators when users are online or typing.
- ✓✓ **Delivery & Read Status**: WhatsApp-style tick indicators:
  - Single gray tick (`✓`): Sent to server
  - Double gray tick (`✓✓`): Delivered
  - Double cyan tick (`✓✓`): Read by recipient
- 🔐 **Authentication & Security**: JWT-based session management, bcrypt password hashing, input sanitization, and Helmet HTTP protection.
- 🗄️ **Persistent MySQL Database**: Fully normalized relational schema storing users, conversations, membership, messages, and reactions.

---

## 📂 Project Architecture & Folder Structure

```text
chatbox/
│
├── client/                     # Vite + React (Frontend)
│   ├── src/
│   │   ├── components/         # ChatList, ChatWindow, MessageBubble, MessageInput, UserSearchModal, ProfileModal
│   │   ├── context/            # AuthContext, SocketContext
│   │   ├── pages/              # Login, Register, ChatPage
│   │   ├── services/           # Axios API client, Socket.IO client
│   │   ├── App.jsx             # React Router and protected routes
│   │   └── index.css           # WhatsApp theme colors and responsive layout
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Node.js + Express + Socket.IO (Backend)
│   ├── src/
│   │   ├── config/             # MySQL connection pool (db.js)
│   │   ├── controllers/        # authController, userController, chatController, messageController
│   │   ├── middleware/         # authMiddleware (JWT verification)
│   │   ├── routes/             # authRoutes, userRoutes, chatRoutes, messageRoutes
│   │   ├── sockets/            # chatSocket (realtime events, presence, typing, read receipts)
│   │   └── server.js           # Server entry point
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── database/
│   ├── schema.sql              # MySQL DDL definitions (Users, Conversations, Messages, Reactions)
│   └── migrate.js              # Database migration runner script
│
├── package.json                # Workspace helper scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or higher (v24 recommended)
- **npm**: v9 or higher
- **MySQL**: Local (XAMPP, MySQL Workbench, Docker) or Cloud (Aiven, PlanetScale, Railway, TiDB)

---

### 2. Installation

Install dependencies for both server and client:

```bash
# In the root project directory:
npm run install:all
```

Or individually:

```bash
cd server
npm install

cd ../client
npm install
```

---

### 3. Configure Database & Environment

1. Ensure MySQL is running on your system.
2. Edit `server/.env` to configure your database credentials:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=chatapp
DB_PORT=3306

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

3. Run the automated database migration to create the tables:

```bash
npm run db:migrate
```

---

### 4. Running the Application

In two separate terminals:

**Terminal 1 — Backend:**
```bash
npm run server
# Server will start on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
npm run client
# Client will start on http://localhost:5173
```

Now open [http://localhost:5173](http://localhost:5173) in your browser!

---

## 🧪 Testing Between Two Users / Devices

1. Open [http://localhost:5173](http://localhost:5173) in a standard browser window and register **User 1** (e.g. `aditya`).
2. Open [http://localhost:5173](http://localhost:5173) in an Incognito/Private window (or a different browser/phone on your Wi-Fi network) and register **User 2** (e.g. `rahul`).
3. On User 1, click the **New Chat (+)** icon, search for `rahul`, and select him.
4. Send a message: "Hello bro 👋".
5. Notice the message appears instantly on User 2's screen with real-time Socket.IO synchronization!
