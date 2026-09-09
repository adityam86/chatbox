import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSocket, connectSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [typingUsers, setTypingUsers] = useState({}); // { [conversationId]: [username1, username2] }

  useEffect(() => {
    if (!user) return;

    const socket = connectSocket(user);

    // Handler for online/offline updates
    function handleUserStatus({ userId, is_online }) {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (is_online) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    }

    // Handler for typing start
    function handleTypingStart({ conversationId, username }) {
      setTypingUsers((prev) => {
        const current = prev[conversationId] || [];
        if (!current.includes(username)) {
          return { ...prev, [conversationId]: [...current, username] };
        }
        return prev;
      });
    }

    // Handler for typing stop
    function handleTypingStop({ conversationId, userId }) {
      setTypingUsers((prev) => {
        const current = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: current.filter((u) => u !== userId),
        };
      });
    }

    socket.on('user:status', handleUserStatus);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('user:status', handleUserStatus);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [user]);

  const joinConversation = (conversationId) => {
    const socket = getSocket();
    if (activeConversationId && activeConversationId !== conversationId) {
      socket.emit('conversation:leave', activeConversationId);
    }
    setActiveConversationId(conversationId);
    socket.emit('conversation:join', conversationId);
  };

  const startTyping = (conversationId) => {
    const socket = getSocket();
    if (user && conversationId) {
      socket.emit('typing:start', { conversationId, username: user.username });
    }
  };

  const stopTyping = (conversationId) => {
    const socket = getSocket();
    if (user && conversationId) {
      socket.emit('typing:stop', { conversationId });
    }
  };

  const isUserOnline = (userId) => {
    return onlineUserIds.has(userId);
  };

  return (
    <SocketContext.Provider
      value={{
        socket: getSocket(),
        onlineUserIds,
        isUserOnline,
        activeConversationId,
        joinConversation,
        startTyping,
        stopTyping,
        typingUsers,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
