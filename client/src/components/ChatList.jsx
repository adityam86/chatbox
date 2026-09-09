import React, { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Search,
  MessageSquarePlus,
  LogOut,
  User as UserIcon,
  Users,
  Star,
  CircleDot,
  MessageSquare,
  Pin,
  BellOff,
  Plus,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import StatusIndicator from './StatusIndicator';

export default function ChatList({
  conversations,
  selectedChatId,
  pinnedChatIds = [],
  mutedChatIds = [],
  statuses = { myStatuses: [], recentUpdates: [] },
  filterType = 'all',
  onSelectChat,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenProfile,
  onOpenStarredMessages,
  onOpenCreateStatus,
  onOpenStatusViewer,
}) {
  const { user, logout } = useAuth();
  const { isUserOnline, typingUsers } = useSocket();
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'status'
  const [selectedFolder, setSelectedFolder] = useState('all'); // 'all' | 'personal' | 'groups' | 'unread' | 'vip'
  const [search, setSearch] = useState('');

  // Sort conversations: Pinned chats first, then by last message timestamp
  const sortedConversations = [...conversations].sort((a, b) => {
    const isPinnedA = pinnedChatIds.includes(a.conversation_id);
    const isPinnedB = pinnedChatIds.includes(b.conversation_id);
    if (isPinnedA && !isPinnedB) return -1;
    if (!isPinnedA && isPinnedB) return 1;
    return new Date(b.last_message_created_at || b.updated_at) - new Date(a.last_message_created_at || a.updated_at);
  });

  const filteredConversations = sortedConversations.filter((c) => {
    const isChannel = (c.group_name || '').includes('[Channel]');
    if (filterType === 'groups' && c.type !== 'group') return false;
    if (selectedFolder === 'personal' && c.type === 'group') return false;
    if (selectedFolder === 'groups' && (c.type !== 'group' || isChannel)) return false;
    if (selectedFolder === 'channels' && !isChannel) return false;
    if (selectedFolder === 'unread' && !c.unread_count) return false;
    if (selectedFolder === 'vip' && !pinnedChatIds.includes(c.conversation_id)) return false;

    const rawTitle = c.type === 'group' ? c.group_name : c.recipient_username;
    const title = isChannel ? rawTitle.replace('[Channel]', '').trim() : rawTitle;
    return (title || '').toLowerCase().includes(search.toLowerCase());
  });

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd/MM/yyyy');
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-app)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          backgroundColor: 'var(--bg-panel)',
          height: '62px',
          flexShrink: 0,
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {/* User Info */}
        <div
          onClick={onOpenProfile}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          title="Edit Profile"
        >
          <div style={{ position: 'relative' }}>
            <img
              src={user?.profile_image || `https://ui-avatars.com/api/?name=${user?.username}&background=7C5CFF&color=fff`}
              alt={user?.username}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--accent)',
                boxShadow: '0 0 10px rgba(124, 92, 255, 0.35)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '10px',
                height: '10px',
                backgroundColor: 'var(--online)',
                borderRadius: '50%',
                border: '2px solid var(--bg-panel)',
              }}
            />
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)' }}>
              {user?.username}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: '500' }}>
              Aurora
            </div>
          </div>
        </div>

        {/* Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button className="btn-icon" onClick={onOpenStarredMessages} title="Starred messages">
            <Star size={18} />
          </button>
          <button className="btn-icon" onClick={onOpenNewGroup} title="New group">
            <Users size={18} />
          </button>
          <button className="btn-icon" onClick={onOpenNewChat} title="New chat">
            <MessageSquarePlus size={18} />
          </button>
          <button className="btn-icon" onClick={onOpenProfile} title="Profile">
            <UserIcon size={18} />
          </button>
          <button className="btn-icon" onClick={logout} title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Tabs: Chats vs Status */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-panel)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('chats')}
          style={{
            flex: 1,
            padding: '11px 0',
            background: 'transparent',
            color: activeTab === 'chats' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'chats' ? '600' : '500',
            fontSize: '13.5px',
            borderBottom: activeTab === 'chats' ? '2.5px solid var(--accent)' : '2.5px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <MessageSquare size={16} color={activeTab === 'chats' ? 'var(--accent)' : 'currentColor'} />
          <span>CHATS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('status')}
          style={{
            flex: 1,
            padding: '11px 0',
            background: 'transparent',
            color: activeTab === 'status' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'status' ? '600' : '500',
            fontSize: '13.5px',
            borderBottom: activeTab === 'status' ? '2.5px solid var(--accent)' : '2.5px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <CircleDot size={16} color={activeTab === 'status' ? 'var(--accent)' : 'currentColor'} />
          <span>STATUS</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'status' ? (
        /* STATUS STORIES TAB */
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* My Status */}
          <div
            onClick={() => {
              if (statuses.myStatuses?.length > 0) {
                onOpenStatusViewer({ user, statuses: statuses.myStatuses });
              } else {
                onOpenCreateStatus();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '10px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '16px',
              backgroundColor: 'var(--bg-hover)',
            }}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={user?.profile_image || `https://ui-avatars.com/api/?name=${user?.username}&background=7C5CFF&color=fff`}
                alt={user?.username}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: statuses.myStatuses?.length > 0 ? '2.5px solid var(--accent)' : '2px solid var(--border-color)',
                }}
              />
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCreateStatus();
                }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'var(--accent)',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  border: '1.5px solid var(--bg-app)',
                  boxShadow: '0 2px 6px rgba(124, 92, 255, 0.4)',
                }}
                title="Add to my status"
              >
                <Plus size={12} strokeWidth={3} />
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>My status</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {statuses.myStatuses?.length > 0
                  ? `${statuses.myStatuses.length} status update${statuses.myStatuses.length > 1 ? 's' : ''}`
                  : 'Tap to add status update'}
              </div>
            </div>
          </div>

          {/* Recent Updates Header */}
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase' }}>
            Recent updates
          </div>

          {statuses.recentUpdates?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
              No recent updates from your contacts.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {statuses.recentUpdates?.map((grp) => (
                <div
                  key={grp.user.id}
                  onClick={() => onOpenStatusViewer(grp)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={grp.user.profile_image || `https://ui-avatars.com/api/?name=${grp.user.username}&background=7C5CFF&color=fff`}
                      alt={grp.user.username}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2.5px solid var(--accent)',
                        padding: '1.5px',
                      }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '14.5px' }}>{grp.user.username}</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {format(new Date(grp.lastUpdated), 'h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* CHATS TAB */
        <>
          {/* Search Bar */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-input)',
                borderRadius: '20px',
                padding: '7px 14px',
                gap: '10px',
                border: '1px solid var(--border-color)',
                transition: 'border-color 0.2s',
              }}
            >
              <Search size={16} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search or start new chat"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  flex: 1,
                  fontSize: '13.5px',
                }}
              />
            </div>
          </div>

          {/* Custom Chat Folders / Tabs (Phase 5) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              overflowX: 'auto',
              borderBottom: '1px solid var(--border-color)',
              flexShrink: 0,
            }}
          >
            {[
              { id: 'all', label: 'All' },
              { id: 'personal', label: 'Personal' },
              { id: 'groups', label: 'Groups' },
              { id: 'channels', label: 'Channels' },
              { id: 'unread', label: 'Unread' },
              { id: 'vip', label: 'VIP' },
            ].map((f) => {
              const isSelected = selectedFolder === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFolder(f.id)}
                  style={{
                    padding: '4px 11px',
                    borderRadius: '16px',
                    backgroundColor: isSelected ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                    fontSize: '11.5px',
                    fontWeight: isSelected ? '600' : '400',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Top Stories / Status Horizontal Tray (Phase 4) */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              overflowX: 'auto',
              flexShrink: 0,
            }}
          >
            {/* User Story Circle */}
            <div
              onClick={() => {
                if (statuses.myStatuses?.length > 0) {
                  onOpenStatusViewer({ user, statuses: statuses.myStatuses });
                } else {
                  onOpenCreateStatus();
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    padding: '2px',
                    background:
                      statuses.myStatuses?.length > 0
                        ? 'var(--aurora-gradient)'
                        : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={
                      user?.profile_image ||
                      `https://ui-avatars.com/api/?name=${user?.username}&background=7C5CFF&color=fff`
                    }
                    alt="Your Story"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--bg-panel)',
                    }}
                  />
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCreateStatus();
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '0px',
                    right: '0px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    border: '2px solid var(--bg-panel)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                  title="Add Status"
                >
                  <Plus size={11} strokeWidth={3} />
                </div>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  maxWidth: '54px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                }}
              >
                Your status
              </span>
            </div>

            {/* Contacts Stories Circles */}
            {statuses.recentUpdates?.map((grp) => (
              <div
                key={grp.user.id}
                onClick={() => onOpenStatusViewer(grp)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    padding: '2px',
                    background: 'linear-gradient(135deg, #7C5CFF 0%, #38D9FF 100%)',
                    boxShadow: '0 0 10px rgba(56, 217, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={
                      grp.user.profile_image ||
                      `https://ui-avatars.com/api/?name=${grp.user.username}&background=7C5CFF&color=fff`
                    }
                    alt={grp.user.username}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--bg-panel)',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                    maxWidth: '54px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'center',
                  }}
                >
                  {grp.user.username}
                </span>
              </div>
            ))}
          </div>

          {/* Chat List Items */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.length === 0 ? (
              filterType === 'groups' ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
                  <Users size={38} style={{ margin: '0 auto 12px auto', opacity: 0.4, color: 'var(--accent)' }} />
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>No groups yet</div>
                  <div style={{ fontSize: '13px', marginTop: '4px', marginBottom: '16px' }}>
                    Create group chats to collaborate and message together.
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={onOpenNewGroup}
                    style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '10px' }}
                  >
                    Create New Group
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  No chats found.<br />
                  <span
                    onClick={onOpenNewChat}
                    style={{ color: 'var(--accent)', cursor: 'pointer', marginTop: '8px', display: 'inline-block' }}
                  >
                    Start a new conversation
                  </span>
                </div>
              )
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedChatId === c.conversation_id;
                const isPinned = pinnedChatIds.includes(c.conversation_id);
                const isMuted = mutedChatIds.includes(c.conversation_id);
                const isOnline = isUserOnline(c.recipient_id) || Boolean(c.recipient_is_online);
                const isTyping = (typingUsers[c.conversation_id] || []).length > 0;
                const isOwnLastMessage = c.last_message_sender_id === user?.id;

                const chatTitle = c.type === 'group' ? c.group_name : c.recipient_username;
                const avatarUrl =
                  c.type === 'group'
                    ? c.group_image || 'https://ui-avatars.com/api/?name=Group&background=1A2233&color=fff'
                    : c.recipient_profile_image || `https://ui-avatars.com/api/?name=${chatTitle}&background=7C5CFF&color=fff`;

                return (
                  <div
                    key={c.conversation_id}
                    onClick={() => onSelectChat(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: isSelected ? '12px 16px 12px 13px' : '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                      borderBottom: '1px solid var(--border-color)',
                      gap: '12px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Avatar with Pulsing Online Badge */}
                    <div style={{ position: 'relative' }}>
                      <img
                        src={avatarUrl}
                        alt={chatTitle}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                        }}
                      />
                      {isOnline && (
                        <div
                          className="online-pulse"
                          style={{
                            position: 'absolute',
                            bottom: 1,
                            right: 1,
                            width: '11px',
                            height: '11px',
                            backgroundColor: 'var(--online)',
                            borderRadius: '50%',
                            border: '2px solid var(--bg-app)',
                          }}
                          title="Online"
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                          {c.group_name?.includes('[Channel]') && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                color: 'var(--accent-cyan)',
                                backgroundColor: 'rgba(56, 217, 255, 0.15)',
                                border: '1px solid rgba(56, 217, 255, 0.3)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                flexShrink: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <Radio size={10} />
                              <span>CHANNEL</span>
                            </span>
                          )}
                          <span style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.group_name?.includes('[Channel]') ? c.group_name.replace('[Channel]', '').trim() : chatTitle}
                          </span>
                          {isMuted && <BellOff size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                        </div>
                        <span style={{ fontSize: '11.5px', color: c.unread_count > 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                          {formatTimestamp(c.last_message_created_at || c.updated_at)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '13px',
                            color: isTyping ? 'var(--accent)' : 'var(--text-secondary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isTyping ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                              <span>typing</span>
                              <span style={{ display: 'inline-flex', gap: '2px' }}>
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                              </span>
                            </span>
                          ) : (
                            <>
                              {isOwnLastMessage && <StatusIndicator status={c.last_message_status} size={14} />}
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.last_message_text ||
                                  (c.last_message_type === 'image'
                                    ? '📷 Photo'
                                    : c.last_message_type === 'audio'
                                    ? '🎙️ Voice note'
                                    : c.last_message_type === 'file'
                                    ? '📄 Document'
                                    : 'No messages yet')}
                              </span>
                            </>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isPinned && <Pin size={13} style={{ color: 'var(--accent)', transform: 'rotate(45deg)' }} />}
                          {c.unread_count > 0 && (
                            <span
                              style={{
                                background: 'var(--aurora-gradient)',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: '700',
                                borderRadius: '10px',
                                padding: '2px 7px',
                                minWidth: '18px',
                                textAlign: 'center',
                                boxShadow: '0 2px 8px rgba(124, 92, 255, 0.4)',
                              }}
                            >
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
