import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.PROD ? 'https://chatbox-wn0k.onrender.com' : 'http://localhost:5000');

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket(user) {
  const s = getSocket();
  const token = localStorage.getItem('chatapp_token');
  if (token) {
    s.auth = { token };
  }
  
  s.off('connect', s._handleConnect);
  s._handleConnect = () => {
    if (user) {
      s.emit('user:join');
    }
  };
  s.on('connect', s._handleConnect);

  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
  }
}
