import React, { useState } from 'react';
import { X, Forward, Search, Send } from 'lucide-react';

export default function ForwardModal({
  isOpen,
  message,
  conversations,
  onClose,
  onForwardMessage,
}) {
  const [search, setSearch] = useState('');

  if (!isOpen || !message) return null;

  const filtered = conversations.filter((c) => {
    const title = c.type === 'group' ? c.group_name : c.recipient_username;
    return (title || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
      }}
    >
      <div
        className="fade-in"
        style={{
          width: '90%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-panel)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 12px 35px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '16.5px' }}>
            <Forward size={20} style={{ color: 'var(--accent)' }} />
            <span>Forward message to...</span>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-input)',
              borderRadius: '8px',
              padding: '8px 12px',
              gap: '8px',
            }}
          >
            <Search size={16} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search contacts..."
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

        {/* Message Preview */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--bg-hover)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            borderBottom: '1px solid var(--border-color)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Forwarding: "{message.message || (message.message_type === 'image' ? 'Photo' : 'Attachment')}"
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
          {filtered.map((c) => {
            const chatTitle = c.type === 'group' ? c.group_name : c.recipient_username;
            const avatarUrl =
              c.type === 'group'
                ? c.group_image || 'https://ui-avatars.com/api/?name=Group&background=1A2233&color=fff'
                : c.recipient_profile_image || `https://ui-avatars.com/api/?name=${chatTitle}&background=7C5CFF&color=fff`;

            return (
              <div
                key={c.conversation_id}
                onClick={() => {
                  onForwardMessage(c.conversation_id, message);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={avatarUrl}
                    alt={chatTitle}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14.5px' }}>{chatTitle}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {c.type === 'group' ? 'Group' : c.recipient_email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-icon"
                  style={{ color: 'var(--accent)' }}
                  title="Forward here"
                >
                  <Send size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
