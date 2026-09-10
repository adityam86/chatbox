import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import UserSearchModal from '../components/UserSearchModal';
import ProfileModal from '../components/ProfileModal';
import CreateGroupModal from '../components/CreateGroupModal';
import ImagePreviewModal from '../components/ImagePreviewModal';
import CreateStatusModal from '../components/CreateStatusModal';
import StatusViewerModal from '../components/StatusViewerModal';
import StarredMessagesModal from '../components/StarredMessagesModal';
import IncomingCallDialog from '../components/IncomingCallDialog';
import CallModal from '../components/CallModal';
import ForwardModal from '../components/ForwardModal';
import NavigationRail from '../components/NavigationRail';
import CallsScreen from '../components/CallsScreen';
import NotificationCenter from '../components/NotificationCenter';
import SettingsModal from '../components/SettingsModal';
import { playSentSound, playReceivedSound } from '../utils/sound';

export default function ChatPage() {
  const { user } = useAuth();
  const { socket, joinConversation } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);

  // Feature preferences
  const [pinnedChatIds, setPinnedChatIds] = useState([]);
  const [mutedChatIds, setMutedChatIds] = useState([]);
  const [starredMessageIds, setStarredMessageIds] = useState([]);
  const [statuses, setStatuses] = useState({ myStatuses: [], recentUpdates: [] });

  // Modals
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isStarredModalOpen, setIsStarredModalOpen] = useState(false);
  const [viewingStatusGroup, setViewingStatusGroup] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Calling state
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  // Forwarding state
  const [forwardingMessage, setForwardingMessage] = useState(null);

  // Reply state
  const [replyingTo, setReplyingTo] = useState(null);

  // Navigation & Settings state
  const [activeNavTab, setActiveNavTab] = useState('chats'); // 'chats' | 'groups' | 'calls' | 'notifications'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Mobile layout state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch initial data
  const loadConversations = async () => {
    try {
      const res = await api.get('/chats');
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadPreferences = async () => {
    try {
      const res = await api.get('/features/preferences');
      setPinnedChatIds(res.data.pinned || []);
      setMutedChatIds(res.data.muted || []);
      setStarredMessageIds(res.data.starredMessageIds || []);
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  };

  const loadStatuses = async () => {
    try {
      const res = await api.get('/statuses');
      setStatuses(res.data || { myStatuses: [], recentUpdates: [] });
    } catch (err) {
      console.error('Failed to load statuses:', err);
    }
  };

  useEffect(() => {
    loadConversations();
    loadPreferences();
    loadStatuses();
  }, []);

  // Select a chat
  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    setReplyingTo(null);
    joinConversation(chat.conversation_id);

    try {
      const res = await api.get(`/chats/${chat.conversation_id}/messages`);
      setMessages(res.data.messages || []);

      setConversations((prev) =>
        prev.map((c) =>
          c.conversation_id === chat.conversation_id ? { ...c, unread_count: 0 } : c
        )
      );

      if (socket) {
        socket.emit('message:read', {
          conversationId: chat.conversation_id,
          userId: user.id,
        });
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  // WebRTC & Real-Time Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      // Check if muted
      const isMuted = mutedChatIds.includes(newMsg.conversation_id);

      if (newMsg.sender_id === user.id) {
        playSentSound();
      } else if (!isMuted) {
        playReceivedSound();
      }

      if (selectedChat && selectedChat.conversation_id === newMsg.conversation_id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        if (newMsg.sender_id !== user.id) {
          socket.emit('message:read', {
            conversationId: selectedChat.conversation_id,
            userId: user.id,
          });
        }
      }

      setConversations((prev) => {
        const index = prev.findIndex((c) => c.conversation_id === newMsg.conversation_id);
        if (index === -1) {
          loadConversations();
          return prev;
        }

        const updatedChat = {
          ...prev[index],
          last_message_id: newMsg.id,
          last_message_text: newMsg.message,
          last_message_type: newMsg.message_type,
          last_message_sender_id: newMsg.sender_id,
          last_message_status: newMsg.status,
          last_message_created_at: newMsg.created_at,
          unread_count:
            selectedChat?.conversation_id === newMsg.conversation_id || newMsg.sender_id === user.id
              ? 0
              : (prev[index].unread_count || 0) + 1,
        };

        const rest = prev.filter((_, idx) => idx !== index);
        return [updatedChat, ...rest];
      });
    };

    const handleReadReceipt = ({ conversationId }) => {
      if (selectedChat && selectedChat.conversation_id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.sender_id === user.id ? { ...m, status: 'read' } : m))
        );
      }
    };

    const handleReactionUpdated = ({ messageId, userId, reaction, action, username }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const currentReactions = m.reactions || [];
          if (action === 'remove') {
            return { ...m, reactions: currentReactions.filter((r) => r.user_id !== userId) };
          }
          const filtered = currentReactions.filter((r) => r.user_id !== userId);
          return {
            ...m,
            reactions: [...filtered, { message_id: messageId, user_id: userId, reaction, username }],
          };
        })
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, is_deleted: true, message: 'This message was deleted.' } : m
        )
      );
    };

    const handleMessageEdited = ({ messageId, newContent }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, message: newContent, is_edited: true } : m
        )
      );
    };

    // Incoming Call listener
    const handleIncomingCall = (callData) => {
      setIncomingCall(callData);
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:read_receipt', handleReadReceipt);
    socket.on('message:reaction_updated', handleReactionUpdated);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('message:edited', handleMessageEdited);
    socket.on('conversation:updated', loadConversations);
    socket.on('call:incoming', handleIncomingCall);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:read_receipt', handleReadReceipt);
      socket.off('message:reaction_updated', handleReactionUpdated);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('message:edited', handleMessageEdited);
      socket.off('conversation:updated', loadConversations);
      socket.off('call:incoming', handleIncomingCall);
    };
  }, [socket, selectedChat, user, mutedChatIds]);

  // Send message
  const handleSendMessage = ({ message, messageType = 'text', mediaUrl = null, replyToMessageId = null }) => {
    if (!selectedChat) return;

    const payload = {
      conversationId: selectedChat.conversation_id,
      senderId: user.id,
      message,
      messageType,
      mediaUrl,
      replyToMessageId,
    };

    socket.emit('message:send', payload, (res) => {
      if (res && res.error) {
        api.post('/messages', {
          conversation_id: selectedChat.conversation_id,
          message,
          message_type: messageType,
          media_url: mediaUrl,
          reply_to_message_id: replyToMessageId,
        }).then((httpRes) => {
          setMessages((prev) => [...prev, httpRes.data.message]);
        });
      }
    });

    setReplyingTo(null);
  };

  // Forward message
  const handleForwardMessage = (targetConversationId, messageToForward) => {
    const payload = {
      conversationId: targetConversationId,
      senderId: user.id,
      message: messageToForward.message,
      messageType: messageToForward.message_type || 'text',
      mediaUrl: messageToForward.media_url || null,
      is_forwarded: true,
    };

    socket.emit('message:send', payload);
    setForwardingMessage(null);
  };

  // Reactions & Delete
  const handleReactMessage = (message, emoji) => {
    if (!socket || !selectedChat) return;
    socket.emit('message:reaction', {
      messageId: message.id,
      conversationId: selectedChat.conversation_id,
      userId: user.id,
      username: user.username,
      reaction: emoji,
    });
  };

  const handleDeleteMessage = (message) => {
    if (!socket || !selectedChat) return;
    socket.emit('message:delete', {
      messageId: message.id,
      conversationId: selectedChat.conversation_id,
      userId: user.id,
    });
  };

  const handleSaveEdit = (messageId, newContent) => {
    if (!socket || !selectedChat) return;
    socket.emit('message:edit', {
      messageId,
      conversationId: selectedChat.conversation_id,
      userId: user.id,
      newContent,
    });
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, message: newContent, is_edited: true } : m
      )
    );
  };

  // Pin & Mute
  const handleTogglePin = async (conversationId) => {
    try {
      const res = await api.post(`/features/chats/${conversationId}/pin`);
      if (res.data.isPinned) {
        setPinnedChatIds((prev) => [...prev, conversationId]);
      } else {
        setPinnedChatIds((prev) => prev.filter((id) => id !== conversationId));
      }
    } catch (err) {
      console.error('Failed to pin chat:', err);
    }
  };

  const handleToggleMute = async (conversationId) => {
    try {
      const res = await api.post(`/features/chats/${conversationId}/mute`);
      if (res.data.isMuted) {
        setMutedChatIds((prev) => [...prev, conversationId]);
      } else {
        setMutedChatIds((prev) => prev.filter((id) => id !== conversationId));
      }
    } catch (err) {
      console.error('Failed to mute chat:', err);
    }
  };

  // Star message
  const handleToggleStar = async (message) => {
    try {
      const res = await api.post(`/features/messages/${message.id}/star`);
      if (res.data.isStarred) {
        setStarredMessageIds((prev) => [...prev, message.id]);
      } else {
        setStarredMessageIds((prev) => prev.filter((id) => id !== message.id));
      }
    } catch (err) {
      console.error('Failed to star message:', err);
    }
  };

  // Clear chat messages
  const handleClearChat = async (conversationId) => {
    try {
      await api.delete(`/chats/${conversationId}/messages`);
      setMessages([]);
      loadConversations();
    } catch (err) {
      console.error('Failed to clear chat:', err);
      setMessages([]);
    }
  };

  // WebRTC Call Handlers
  const handleStartCall = (callType, directTargetUser = null) => {
    const target = directTargetUser || (
      selectedChat && selectedChat.type !== 'group'
        ? {
            id: selectedChat.recipient_id,
            username: selectedChat.recipient_username,
            profile_image: selectedChat.recipient_profile_image,
          }
        : null
    );

    if (!target) return;
    setActiveCall({
      callType,
      isCaller: true,
      targetUser: target,
    });
  };

  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;
    setActiveCall({
      callType: incomingCall.callType,
      isCaller: false,
      targetUser: {
        id: incomingCall.callerUserId || incomingCall.callerId,
        username: incomingCall.callerName || 'Caller',
        profile_image: incomingCall.callerAvatar || null,
      },
      initialSignal: incomingCall.signal,
    });
    setIncomingCall(null);
  };

  const handleDeclineIncomingCall = () => {
    if (!incomingCall) return;
    socket.emit('call:decline', { targetUserId: incomingCall.callerUserId || incomingCall.callerId });
    setIncomingCall(null);
  };

  // File selected
  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setIsImageModalOpen(true);
  };

  // Group created
  const handleGroupCreated = (group) => {
    loadConversations().then(() => {
      handleSelectChat({
        conversation_id: group.id,
        type: 'group',
        group_name: group.name,
        group_image: group.image,
      });
    });
  };

  // User search modal selection
  const handleSelectUserFromSearch = async (targetUser) => {
    setIsSearchModalOpen(false);
    try {
      const res = await api.post('/chats', { recipientId: targetUser.id });
      await loadConversations();
      const updatedRes = await api.get('/chats');
      const found = updatedRes.data.conversations.find((c) => c.conversation_id === res.data.conversationId);
      if (found) handleSelectChat(found);
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  const unreadMessageCount = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        maxWidth: '100vw',
        height: '100%',
        maxHeight: '100dvh',
        backgroundColor: 'var(--bg-app)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Desktop Left Navigation Rail (Section 4 & 44) */}
      {!isMobile && (
        <NavigationRail
          activeTab={activeNavTab}
          onSelectTab={setActiveNavTab}
          unreadMessageCount={unreadMessageCount}
          unreadNotificationCount={2}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
      )}

      {/* Sidebar Panel (Chats / Groups / Calls / Notifications) */}
      {(!isMobile || !selectedChat) && (
        <div
          style={{
            width: isMobile ? '100%' : '380px',
            minWidth: isMobile ? '100%' : '320px',
            maxWidth: isMobile ? '100%' : '450px',
            height: isMobile ? 'calc(100% - 60px)' : '100%',
          }}
        >
          {activeNavTab === 'calls' ? (
            <CallsScreen
              conversations={conversations}
              onStartCall={handleStartCall}
              onOpenNewChat={() => setIsSearchModalOpen(true)}
            />
          ) : activeNavTab === 'notifications' ? (
            <NotificationCenter
              conversations={conversations}
              onSelectChat={(chat) => {
                handleSelectChat(chat);
                setActiveNavTab('chats');
              }}
            />
          ) : (
            <ChatList
              filterType={activeNavTab === 'groups' ? 'groups' : 'all'}
              conversations={conversations}
              selectedChatId={selectedChat?.conversation_id}
              pinnedChatIds={pinnedChatIds}
              mutedChatIds={mutedChatIds}
              statuses={statuses}
              onSelectChat={handleSelectChat}
              onOpenNewChat={() => setIsSearchModalOpen(true)}
              onOpenNewGroup={() => setIsGroupModalOpen(true)}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onOpenStarredMessages={() => setIsStarredModalOpen(true)}
              onOpenCreateStatus={() => setIsStatusModalOpen(true)}
              onOpenStatusViewer={(group) => setViewingStatusGroup(group)}
            />
          )}
        </div>
      )}

      {/* Chat Window */}
      {(!isMobile || selectedChat) && (
        <div style={{ flex: 1, height: '100%' }}>
          <ChatWindow
            activeChat={selectedChat}
            messages={messages}
            replyingTo={replyingTo}
            starredMessageIds={starredMessageIds}
            isPinned={selectedChat && pinnedChatIds.includes(selectedChat.conversation_id)}
            isMuted={selectedChat && mutedChatIds.includes(selectedChat.conversation_id)}
            onReply={(msg) => setReplyingTo(msg)}
            onForward={(msg) => setForwardingMessage(msg)}
            onClearReply={() => setReplyingTo(null)}
            onSendMessage={handleSendMessage}
            onSaveEdit={handleSaveEdit}
            onDeleteMessage={handleDeleteMessage}
            onReactMessage={handleReactMessage}
            onToggleStar={handleToggleStar}
            onTogglePin={handleTogglePin}
            onToggleMute={handleToggleMute}
            onStartCall={handleStartCall}
            onFileSelected={handleFileSelected}
            onClearChat={handleClearChat}
            onBack={() => setSelectedChat(null)}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* MODALS & OVERLAYS */}

      {/* Incoming Call Ringing Dialog */}
      <IncomingCallDialog
        incomingCall={incomingCall}
        onAccept={handleAcceptIncomingCall}
        onDecline={handleDeclineIncomingCall}
      />

      {/* Active WebRTC Video/Voice Call Window */}
      {activeCall && (
        <CallModal
          callType={activeCall.callType}
          isCaller={activeCall.isCaller}
          targetUser={activeCall.targetUser}
          initialSignal={activeCall.initialSignal}
          onEndCall={() => setActiveCall(null)}
        />
      )}

      {/* Status Creation Modal */}
      <CreateStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onStatusCreated={() => loadStatuses()}
      />

      {/* Status Viewer Stories Player */}
      <StatusViewerModal
        isOpen={Boolean(viewingStatusGroup)}
        statusGroup={viewingStatusGroup}
        onClose={() => setViewingStatusGroup(null)}
      />

      {/* Starred Messages Drawer */}
      <StarredMessagesModal
        isOpen={isStarredModalOpen}
        onClose={() => setIsStarredModalOpen(false)}
        onSelectMessage={(starItem) => {
          const chat = conversations.find((c) => c.conversation_id === starItem.conversation_id);
          if (chat) handleSelectChat(chat);
        }}
      />

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectUser={handleSelectUserFromSearch}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={isImageModalOpen}
        file={selectedFile}
        onClose={() => {
          setIsImageModalOpen(false);
          setSelectedFile(null);
        }}
        onSendImage={handleSendMessage}
      />

      {/* Forward Message Modal */}
      <ForwardModal
        isOpen={Boolean(forwardingMessage)}
        message={forwardingMessage}
        conversations={conversations}
        onClose={() => setForwardingMessage(null)}
        onForwardMessage={handleForwardMessage}
      />

      {/* Settings Modal (Sections 27-31) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Mobile Bottom Navigation Rail (Section 4 & 44) */}
      {isMobile && !selectedChat && (
        <NavigationRail
          isMobile={true}
          activeTab={activeNavTab}
          onSelectTab={setActiveNavTab}
          unreadMessageCount={unreadMessageCount}
          unreadNotificationCount={2}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
      )}
    </div>
  );
}
