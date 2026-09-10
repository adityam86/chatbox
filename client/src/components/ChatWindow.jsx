import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  Search,
  ShieldCheck,
  X,
  Video,
  Phone,
  Pin,
  BellOff,
  Bell,
  Lock,
  Palette,
  Trash2,
  Timer,
  Radio,
  Tv,
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import ContactInfoDrawer from './ContactInfoDrawer';
import WatchTogetherModal from './WatchTogetherModal';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { format, isToday, isYesterday } from 'date-fns';

const WALLPAPERS = {
  aurora: { name: 'Midnight Aurora', bg: 'var(--bg-chat)', isDoodle: true },
  abyss: { name: 'Deep Abyss', bg: '#080B14', isDoodle: false },
  cyber: { name: 'Cyber Violet', bg: '#0F0E1E', isDoodle: false },
  navy: { name: 'Deep Navy', bg: '#0B132B', isDoodle: false },
  slate: { name: 'Dark Slate', bg: '#101625', isDoodle: false },
};

export default function ChatWindow({
  activeChat,
  messages,
  replyingTo,
  starredMessageIds = [],
  isPinned = false,
  isMuted = false,
  onReply,
  onForward,
  onClearReply,
  onSendMessage,
  onSaveEdit,
  onDeleteMessage,
  onReactMessage,
  onToggleStar,
  onTogglePin,
  onToggleMute,
  onStartCall,
  onFileSelected,
  onClearChat,
  onBack,
  isMobile,
}) {
  const { user } = useAuth();
  const { isUserOnline, typingUsers } = useSocket();
  const messagesEndRef = useRef(null);

  const [lightboxImage, setLightboxImage] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [wallpaperTheme, setWallpaperTheme] = useState('aurora');
  const [disappearingTimer, setDisappearingTimer] = useState('off');
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showScreenshotGuardToast, setShowScreenshotGuardToast] = useState(false);
  const [draftText, setDraftText] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen') {
        setShowScreenshotGuardToast(true);
        setTimeout(() => setShowScreenshotGuardToast(false), 3500);
      }
    };
    window.addEventListener('keyup', handleKeyDown);
    return () => window.removeEventListener('keyup', handleKeyDown);
  }, []);

  useEffect(() => {
    if (activeChat?.conversation_id) {
      const saved = localStorage.getItem(`disappearing_${activeChat.conversation_id}`);
      setDisappearingTimer(saved || 'off');
      const savedGhost = localStorage.getItem(`ghost_${activeChat.conversation_id}`);
      setIsGhostMode(savedGhost === 'true');
    }
  }, [activeChat?.conversation_id]);

  const handleUpdateDisappearing = (val) => {
    setDisappearingTimer(val);
    if (activeChat?.conversation_id) {
      localStorage.setItem(`disappearing_${activeChat.conversation_id}`, val);
    }
  };

  const handleToggleGhostMode = (val) => {
    setIsGhostMode(val);
    if (activeChat?.conversation_id) {
      localStorage.setItem(`ghost_${activeChat.conversation_id}`, val ? 'true' : 'false');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeChat) {
    return (
      <div
        className="chat-wallpaper"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px',
          color: 'var(--text-secondary)',
        }}
      >
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'rgba(124, 92, 255, 0.12)',
            border: '1px solid rgba(124, 92, 255, 0.35)',
            boxShadow: '0 0 24px rgba(124, 92, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            color: 'var(--accent)',
          }}
        >
          <ShieldCheck size={46} color="#38D9FF" />
        </div>
        <h2 className="aurora-text" style={{ marginBottom: '8px', fontSize: '26px', fontWeight: '700' }}>
          Aurora Chat
        </h2>
        <p style={{ maxWidth: '440px', fontSize: '14.5px', lineHeight: '22px', color: 'var(--text-secondary)' }}>
          End-to-end synchronized messaging, crystal-clear WebRTC calling, and real-time Socket.IO experience.
          Select a chat to begin.
        </p>
      </div>
    );
  }

  const isGroup = activeChat.type === 'group';
  const isChannel = isGroup && (activeChat.group_name || '').includes('[Channel]');
  const isChannelAdmin = !isChannel || (activeChat.created_by ? activeChat.created_by === user?.id : true);
  const isOnline = isUserOnline(activeChat.recipient_id) || Boolean(activeChat.recipient_is_online);
  const isTyping = (typingUsers[activeChat.conversation_id] || []).length > 0;
  const rawTitle = isGroup ? activeChat.group_name : activeChat.recipient_username;
  const chatTitle = isChannel ? rawTitle.replace('[Channel]', '').trim() : rawTitle;
  const avatarUrl = isGroup
    ? activeChat.group_image || 'https://ui-avatars.com/api/?name=Group&background=1A2233&color=fff'
    : activeChat.recipient_profile_image || `https://ui-avatars.com/api/?name=${chatTitle}&background=7C5CFF&color=fff`;

  let statusText = 'offline';
  if (isChannel) {
    statusText = 'Broadcast Channel';
  } else if (isGroup) {
    statusText = isTyping ? 'someone is typing...' : 'Group chat';
  } else if (isTyping) {
    statusText = 'typing...';
  } else if (isOnline) {
    statusText = 'online';
  }

  // Disappearing messages filter
  const expiryDurations = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
  };
  const expiryMs = expiryDurations[disappearingTimer];
  const now = Date.now();

  const activeMessages = messages.filter((m) => {
    if (!expiryMs) return true;
    const msgTime = new Date(m.created_at || now).getTime();
    return now - msgTime < expiryMs;
  });

  const displayedMessages = searchQuery.trim()
    ? activeMessages.filter((m) =>
        (m.message || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeMessages;

  const currentTheme = WALLPAPERS[wallpaperTheme] || WALLPAPERS.aurora;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: currentTheme.bg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Contact / Group Info Right Drawer */}
      <ContactInfoDrawer
        isOpen={isContactInfoOpen}
        onClose={() => setIsContactInfoOpen(false)}
        chat={activeChat}
        messages={activeMessages}
        disappearingTimer={disappearingTimer}
        onUpdateDisappearing={handleUpdateDisappearing}
        onImageClick={(url) => setLightboxImage(url)}
        isGhostMode={isGhostMode}
        onToggleGhostMode={handleToggleGhostMode}
      />

      {/* Watch Together Synchronized Co-Player */}
      <WatchTogetherModal
        isOpen={isWatchModalOpen}
        onClose={() => setIsWatchModalOpen(false)}
        chatTitle={chatTitle}
      />

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            cursor: 'zoom-out',
          }}
        >
          <button
            type="button"
            className="btn-icon"
            onClick={() => setLightboxImage(null)}
            style={{ position: 'absolute', top: '20px', right: '24px', color: '#fff' }}
          >
            <X size={30} />
          </button>
          <img
            src={lightboxImage}
            alt="Enlarged view"
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          backgroundColor: 'rgba(13, 18, 32, 0.92)',
          backdropFilter: 'blur(16px)',
          height: '62px',
          flexShrink: 0,
          borderBottom: '1px solid var(--border-color)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          onClick={() => setIsContactInfoOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          title="Click to view info"
        >
          {isMobile && (
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <img
            src={avatarUrl}
            alt={chatTitle}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--accent)',
              boxShadow: '0 0 10px rgba(124, 92, 255, 0.25)',
            }}
          />

          <div>
            <div style={{ fontWeight: '600', fontSize: '15.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--text-primary)' }}>{chatTitle}</span>
              {isPinned && <Pin size={13} style={{ color: 'var(--accent)', transform: 'rotate(45deg)' }} />}
              {isMuted && <BellOff size={13} style={{ color: 'var(--text-muted)' }} />}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: isTyping ? 'var(--accent)' : (isOnline ? 'var(--online)' : 'var(--text-secondary)'),
                fontWeight: isOnline || isTyping ? '500' : '400',
              }}
            >
              {statusText}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {!isGroup && (
            <button
              type="button"
              className="btn-icon"
              onClick={() => onStartCall && onStartCall('video')}
              title="Video call"
            >
              <Video size={19} />
            </button>
          )}

          {!isGroup && (
            <button
              type="button"
              className="btn-icon"
              onClick={() => onStartCall && onStartCall('audio')}
              title="Voice call"
            >
              <Phone size={18} />
            </button>
          )}

          {/* Watch Together Co-Player Quick Launcher */}
          <button
            type="button"
            className="btn-icon"
            onClick={() => setIsWatchModalOpen(true)}
            title="Watch Together (YouTube/Video)"
            style={{ color: isWatchModalOpen ? 'var(--accent-cyan)' : 'currentColor' }}
          >
            <Tv size={18} />
          </button>

          <button
            type="button"
            className="btn-icon"
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) setSearchQuery('');
            }}
            style={{ color: showSearch ? 'var(--accent)' : 'var(--text-secondary)' }}
            title="Search messages in chat"
          >
            <Search size={19} />
          </button>

          <button
            type="button"
            className="btn-icon"
            onClick={() => setShowMenu(!showMenu)}
            title="More options"
          >
            <MoreVertical size={19} />
          </button>

          {/* Menu Dropdown */}
          {showMenu && (
            <div
              className="fade-in"
              style={{
                position: 'absolute',
                top: '55px',
                right: '16px',
                backgroundColor: 'rgba(13, 18, 32, 0.96)',
                backdropFilter: 'blur(16px)',
                borderRadius: '14px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(124, 92, 255, 0.25)',
                width: '190px',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsContactInfoOpen(true);
                  setShowMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span>{isGroup ? 'Group info' : 'Contact info'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onTogglePin(activeChat.conversation_id);
                  setShowMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Pin size={16} />
                <span>{isPinned ? 'Unpin chat' : 'Pin chat'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleMute(activeChat.conversation_id);
                  setShowMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {isMuted ? <Bell size={16} /> : <BellOff size={16} />}
                <span>{isMuted ? 'Unmute' : 'Mute notifications'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  if (window.confirm('Are you sure you want to clear all messages in this chat?')) {
                    onClearChat && onClearChat(activeChat.conversation_id);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'transparent',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Trash2 size={16} />
                <span>Clear chat</span>
              </button>

              {/* Wallpaper Themes */}
              <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Palette size={13} />
                  <span>WALLPAPER</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {Object.entries(WALLPAPERS).map(([key, val]) => (
                    <div
                      key={key}
                      onClick={() => {
                        setWallpaperTheme(key);
                        setShowMenu(false);
                      }}
                      title={val.name}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: key === 'aurora' ? '#101625' : val.bg,
                        border: wallpaperTheme === key ? '2px solid var(--accent)' : '1px solid #444',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Guard Toast */}
      {showScreenshotGuardToast && (
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255, 92, 112, 0.95)',
            backdropFilter: 'blur(16px)',
            color: '#FFFFFF',
            padding: '8px 18px',
            borderRadius: '20px',
            boxShadow: '0 8px 30px rgba(255, 92, 112, 0.45)',
            fontSize: '12.5px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
          }}
        >
          <ShieldCheck size={17} />
          <span>🛡️ Screenshot Guard Active: Confidential messages are protected.</span>
        </div>
      )}

      {/* Broadcast Announcement Channel Banner */}
      {isChannel && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'rgba(56, 217, 255, 0.1)',
            borderBottom: '1px solid rgba(56, 217, 255, 0.22)',
            padding: '7px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--accent-cyan)',
            zIndex: 9,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={14} />
            <span style={{ fontWeight: '600' }}>Broadcast Channel</span>
            <span style={{ color: 'var(--text-secondary)' }}>• 1-to-many announcements</span>
          </div>
          <span style={{ fontSize: '11px', opacity: 0.85 }}>
            {isChannelAdmin ? 'Admin broadcasting mode' : 'Subscriber (Read-only)'}
          </span>
        </div>
      )}

      {/* Pinned Message Banner (Section 41) */}
      {isPinned && messages.length > 0 && (
        <div
          className="fade-in"
          style={{
            backgroundColor: '#141B2B',
            borderLeft: '3px solid var(--accent)',
            borderBottom: '1px solid var(--border-color)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            zIndex: 9,
          }}
          onClick={() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <Pin size={14} style={{ color: 'var(--accent)', flexShrink: 0, transform: 'rotate(45deg)' }} />
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', marginRight: '6px' }}>
                Pinned:
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {messages[messages.length - 1]?.message ||
                  (messages[messages.length - 1]?.message_type === 'image'
                    ? 'Photo attachment'
                    : 'Attachment')}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(activeChat.conversation_id);
            }}
            title="Unpin"
            style={{ padding: '4px', color: 'var(--text-muted)' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* In-Chat Search Bar */}
      {showSearch && (
        <div
          className="fade-in"
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--bg-hover)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 10,
          }}
        >
          <Search size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search within this chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '14px',
            }}
          />
          {searchQuery && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {displayedMessages.length} match{displayedMessages.length === 1 ? '' : 'es'}
            </span>
          )}
          <button
            type="button"
            className="btn-icon"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Message Feed */}
      <div
        className={currentTheme.isDoodle ? 'chat-wallpaper' : ''}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px 0',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: currentTheme.bg,
        }}
      >
        {/* End-to-End Encryption Padlock Notice */}
        <div
          style={{
            backgroundColor: 'rgba(255, 193, 7, 0.11)',
            border: '1px solid rgba(255, 193, 7, 0.22)',
            borderRadius: '8px',
            padding: '8px 14px',
            margin: '4px auto 12px auto',
            maxWidth: '430px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#ffdf7a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            lineHeight: '16px',
          }}
        >
          <Lock size={15} style={{ flexShrink: 0, color: '#ffc107' }} />
          <span>
            Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
          </span>
        </div>

        {/* Disappearing Messages Notice Banner */}
        {disappearingTimer !== 'off' && (
          <div
            className="fade-in"
            style={{
              backgroundColor: 'rgba(124, 92, 255, 0.12)',
              border: '1px solid rgba(124, 92, 255, 0.28)',
              borderRadius: '8px',
              padding: '8px 14px',
              margin: '0 auto 16px auto',
              maxWidth: '460px',
              textAlign: 'center',
              fontSize: '12px',
              color: '#D8CEFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              lineHeight: '16px',
            }}
          >
            <Timer size={15} style={{ flexShrink: 0, color: 'var(--accent)' }} />
            <span>
              Disappearing messages are on. New messages will disappear from this chat{' '}
              {disappearingTimer === '24h'
                ? '24 hours'
                : disappearingTimer === '7d'
                ? '7 days'
                : '90 days'}{' '}
              after being sent.
            </span>
          </div>
        )}

        {displayedMessages.map((m, index) => {
          const prevMessage = index > 0 ? displayedMessages[index - 1] : null;
          const msgDate = new Date(m.created_at || Date.now());
          const prevDate = prevMessage ? new Date(prevMessage.created_at || Date.now()) : null;
          const showDateSeparator = !prevDate || msgDate.toDateString() !== prevDate.toDateString();

          let dateLabel = format(msgDate, 'MMMM d, yyyy');
          if (isToday(msgDate)) dateLabel = 'TODAY';
          else if (isYesterday(msgDate)) dateLabel = 'YESTERDAY';

          return (
            <React.Fragment key={m.id}>
              {showDateSeparator && (
                <div
                  style={{
                    margin: '12px auto',
                    padding: '3px 12px',
                    backgroundColor: '#141B2B',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.5px',
                    textAlign: 'center',
                    alignSelf: 'center',
                  }}
                >
                  {dateLabel}
                </div>
              )}
              <MessageBubble
                message={m}
                isOwnMessage={m.sender_id === user?.id}
                isGroupChat={isGroup}
                isStarred={starredMessageIds.includes(m.id)}
                hasDisappearingTimer={disappearingTimer !== 'off'}
                isGhostMode={isGhostMode}
                onReply={onReply}
                onForward={onForward}
                onDelete={onDeleteMessage}
                onReact={onReactMessage}
                onToggleStar={onToggleStar}
                onImageClick={(url) => setLightboxImage(url)}
                onEdit={(msg) => setEditingMessage(msg)}
                onDraftReply={(text) => setDraftText(text)}
              />
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Broadcast channel subscriber check / Message Input Footer */}
      {!isChannelAdmin ? (
        <div
          style={{
            padding: '14px 20px',
            textAlign: 'center',
            backgroundColor: 'rgba(13, 18, 32, 0.9)',
            borderTop: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Radio size={16} color="var(--accent-cyan)" />
          <span>Only channel administrators can post messages to this channel.</span>
        </div>
      ) : (
        <MessageInput
          conversationId={activeChat.conversation_id}
          replyingTo={replyingTo}
          onClearReply={onClearReply}
          onSendMessage={onSendMessage}
          onFileSelected={onFileSelected}
          onOpenWatchTogether={() => setIsWatchModalOpen(true)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onSaveEdit={(id, newText) => {
            if (onSaveEdit) onSaveEdit(id, newText);
            setEditingMessage(null);
          }}
          draftText={draftText}
          onClearDraft={() => setDraftText('')}
        />
      )}
    </div>
  );
}
