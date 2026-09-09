import React, { useState } from 'react';
import { Bell, MessageSquare, Users, PhoneMissed, CheckCheck, Trash2 } from 'lucide-react';

export default function NotificationCenter({
  onSelectChat,
  conversations = [],
}) {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'message',
      title: 'Rahul',
      subtitle: 'Hey bro 👋',
      time: '2 minutes ago',
      unread: true,
      icon: MessageSquare,
      iconColor: '#7C5CFF',
      conversationId: conversations[0]?.conversation_id,
    },
    {
      id: 2,
      type: 'mention',
      title: 'College Friends',
      subtitle: 'Priya mentioned you in group chat',
      time: '18 minutes ago',
      unread: true,
      icon: Users,
      iconColor: '#38D9FF',
      conversationId: conversations[1]?.conversation_id,
    },
    {
      id: 3,
      type: 'call',
      title: 'Rahul',
      subtitle: 'Missed voice call',
      time: '1 hour ago',
      unread: false,
      icon: PhoneMissed,
      iconColor: '#FF5C70',
      conversationId: conversations[0]?.conversation_id,
    },
    {
      id: 4,
      type: 'message',
      title: 'Aditya',
      subtitle: 'Project file has been uploaded',
      time: 'Yesterday',
      unread: false,
      icon: MessageSquare,
      iconColor: '#7C5CFF',
      conversationId: conversations[0]?.conversation_id,
    },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (item) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    if (item.conversationId && onSelectChat) {
      const match = conversations.find((c) => c.conversation_id === item.conversationId);
      if (match) onSelectChat(match);
    }
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
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          backgroundColor: 'var(--bg-panel)',
          height: '62px',
          flexShrink: 0,
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Notifications
          </h2>
        </div>

        {notifications.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn-icon"
              onClick={markAllAsRead}
              title="Mark all as read"
              style={{ fontSize: '12px' }}
            >
              <CheckCheck size={16} />
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={clearAll}
              title="Clear all"
              style={{ fontSize: '12px', color: 'var(--danger)' }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <Bell size={38} style={{ margin: '0 auto 12px auto', opacity: 0.35 }} />
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
              You're all caught up
            </div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              No new alerts or activity to report right now.
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--text-secondary)',
                padding: '4px 20px 8px 20px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Recent Activity
            </div>

            {notifications.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    backgroundColor: item.unread ? 'rgba(124, 92, 255, 0.06)' : 'transparent',
                    borderLeft: item.unread ? '2px solid #7C5CFF' : '2px solid transparent',
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = item.unread
                      ? 'rgba(124, 92, 255, 0.06)'
                      : 'transparent')
                  }
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: `rgba(255, 255, 255, 0.06)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.iconColor,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontWeight: item.unread ? '600' : '500',
                          fontSize: '14px',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {item.title}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {item.time}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '13px',
                        color: item.unread ? 'var(--text-primary)' : 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '2px',
                      }}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
