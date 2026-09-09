import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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
  if (!s.connected) {
    s.connect();
    if (user) {
      s.emit('user:join', user);
    }
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
  }
}
