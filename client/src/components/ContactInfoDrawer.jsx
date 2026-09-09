import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Image as ImageIcon,
  FileText,
  Users,
  Shield,
  ShieldCheck,
  Lock,
  ChevronRight,
  Timer,
  ExternalLink,
  Download,
  Check,
  Film,
  EyeOff,
  FileDown,
} from 'lucide-react';
import SecurityCodeModal from './SecurityCodeModal';
import api from '../services/api';

const TIMER_OPTIONS = [
  { label: 'Off', value: 'off', desc: 'Messages stay in chat indefinitely' },
  { label: '24 hours', value: '24h', desc: 'Disappear 24 hours after being sent' },
  { label: '7 days', value: '7d', desc: 'Disappear 7 days after being sent' },
  { label: '90 days', value: '90d', desc: 'Disappear 90 days after being sent' },
];

export default function ContactInfoDrawer({
  isOpen,
  onClose,
  chat,
  messages = [],
  disappearingTimer = 'off',
  onUpdateDisappearing,
  onImageClick,
  isGhostMode = false,
  onToggleGhostMode,
}) {
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'docs' | 'links'
  const [groupMembers, setGroupMembers] = useState([]);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [showTimerPicker, setShowTimerPicker] = useState(false);

  const isGroup = chat?.type === 'group';

  useEffect(() => {
    if (isOpen && isGroup && chat?.conversation_id) {
      api
        .get(`/chats/${chat.conversation_id}/members`)
        .then((res) => setGroupMembers(res.data.members || []))
        .catch((err) => console.error(err));
    }
  }, [isOpen, isGroup, chat?.conversation_id]);

  if (!isOpen || !chat) return null;

  const chatTitle = isGroup ? chat.group_name : chat.recipient_username;
  const avatarUrl = isGroup
    ? chat.group_image || 'https://ui-avatars.com/api/?name=Group&background=1A2233&color=fff'
    : chat.recipient_profile_image || `https://ui-avatars.com/api/?name=${chatTitle}&background=7C5CFF&color=fff`;

  // 1. Filter Media (Images & Videos)
  const mediaMessages = messages.filter(
    (m) =>
      m.media_url &&
      (m.message_type === 'image' ||
        m.message_type === 'video' ||
        /\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i.test(m.media_url))
  );

  // 2. Filter Documents
  const docMessages = messages.filter(
    (m) =>
      m.media_url &&
      m.message_type !== 'image' &&
      m.message_type !== 'video' &&
      m.message_type !== 'audio' &&
      !/\.(jpg|jpeg|png|gif|webp|mp4|webm|mp3|ogg|wav)$/i.test(m.media_url)
  );

  // 3. Extract Links from Text Messages
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const extractedLinks = [];
  messages.forEach((m) => {
    if (m.content && m.message_type === 'text') {
      const matches = m.content.match(urlRegex);
      if (matches) {
        matches.forEach((url, i) => {
          extractedLinks.push({
            id: `${m.id}-${i}`,
            url,
            sender: m.sender_username,
            date: m.created_at,
          });
        });
      }
    }
  });

  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const currentTimerLabel =
    TIMER_OPTIONS.find((t) => t.value === disappearingTimer)?.label || 'Off';

  return (
    <div
      className="fade-in"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '380px',
        maxWidth: '100%',
        backgroundColor: 'rgba(13, 18, 32, 0.96)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          height: '62px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          backgroundColor: 'transparent',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <button type="button" className="btn-icon" onClick={onClose}>
          <X size={20} />
        </button>
        <span style={{ fontWeight: '600', fontSize: '16px', color: 'var(--text-primary)' }}>
          {isGroup ? 'Group info' : 'Contact info'}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Profile Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            marginBottom: '10px',
          }}
        >
          <img
            src={avatarUrl}
            alt={chatTitle}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--accent)',
              boxShadow: '0 0 24px rgba(124, 92, 255, 0.35)',
              marginBottom: '14px',
            }}
          />
          <h3 style={{ fontSize: '19px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
            {chatTitle}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isGroup ? `Group • ${groupMembers.length || 2} participants` : chat.recipient_email || 'Aurora User'}
          </p>
        </div>

        {/* About / Bio (if 1-on-1) */}
        {!isGroup && (
          <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255, 255, 255, 0.02)', marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
              About
            </div>
            <div style={{ fontSize: '14.5px', color: 'var(--text-primary)' }}>
              {chat.recipient_bio || 'Hey there! I am using Aurora Chat.'}
            </div>
          </div>
        )}

        {/* Group Members Section */}
        {isGroup && (
          <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255, 255, 255, 0.02)', marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>
              {groupMembers.length} participants
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {groupMembers.map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={m.profile_image || `https://ui-avatars.com/api/?name=${m.username}&background=7C5CFF&color=fff`}
                      alt={m.username}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{m.username}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.bio}</div>
                    </div>
                  </div>
                  {m.role === 'admin' && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--accent-cyan)',
                        backgroundColor: 'rgba(124, 92, 255, 0.15)',
                        border: '1px solid var(--accent)',
                        borderRadius: '6px',
                        padding: '2px 7px',
                        fontWeight: '600',
                      }}
                    >
                      Group Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 1. DISAPPEARING MESSAGES SETTING (Phase 4)                     */}
        {/* ============================================================ */}
        <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255, 255, 255, 0.02)', marginBottom: '10px' }}>
          <div
            onClick={() => setShowTimerPicker(!showTimerPicker)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: '6px 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: disappearingTimer !== 'off' ? 'rgba(124, 92, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  border: disappearingTimer !== 'off' ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: disappearingTimer !== 'off' ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <Timer size={17} />
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                  Disappearing messages
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {currentTimerLabel}
                </div>
              </div>
            </div>
            <ChevronRight
              size={18}
              style={{
                color: 'var(--text-secondary)',
                transform: showTimerPicker ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.15s ease',
              }}
            />
          </div>

          {/* Inline Timer Options Picker */}
          {showTimerPicker && (
            <div
              className="fade-in"
              style={{
                marginTop: '12px',
                padding: '10px',
                backgroundColor: 'rgba(20, 27, 43, 0.7)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {TIMER_OPTIONS.map((opt) => {
                const isSelected = disappearingTimer === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      if (onUpdateDisappearing) onUpdateDisappearing(opt.value);
                      setShowTimerPicker(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(124, 92, 255, 0.15)' : 'transparent',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '13.5px',
                          fontWeight: isSelected ? '600' : '400',
                          color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                        }}
                      >
                        {opt.label}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{opt.desc}</div>
                    </div>
                    {isSelected && <Check size={16} color="var(--accent)" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 2. SHARED MEDIA, LINKS & DOCS HUB (Phase 4)                   */}
        {/* ============================================================ */}
        <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-hover)', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Media, links and docs
            </span>
            <span style={{ fontSize: '12px', color: 'var(--accent)' }}>
              {mediaMessages.length + docMessages.length + extractedLinks.length} total
            </span>
          </div>

          {/* Tab Selector */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '3px',
              marginBottom: '14px',
            }}
          >
            {[
              { id: 'media', label: `Media (${mediaMessages.length})` },
              { id: 'docs', label: `Docs (${docMessages.length})` },
              { id: 'links', label: `Links (${extractedLinks.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: '6px',
                  background: activeTab === t.id ? 'var(--accent)' : 'transparent',
                  color: activeTab === t.id ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: activeTab === t.id ? '600' : '400',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: MEDIA (Photos & Videos) */}
          {activeTab === 'media' && (
            mediaMessages.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {mediaMessages.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onImageClick && onImageClick(m.media_url)}
                    style={{
                      height: '84px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {m.message_type === 'video' || /\.(mp4|webm)$/i.test(m.media_url) ? (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#0D1220',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Film size={24} color="var(--accent-cyan)" />
                      </div>
                    ) : (
                      <img
                        src={m.media_url}
                        alt="Media"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                No photos or videos shared yet.
              </div>
            )
          )}

          {/* TAB 2: DOCS */}
          {activeTab === 'docs' && (
            docMessages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {docMessages.map((m) => (
                  <a
                    key={m.id}
                    href={m.media_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(20, 27, 43, 0.6)',
                      border: '1px solid var(--border-color)',
                      textDecoration: 'none',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(124, 92, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent)',
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-primary)',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {m.file_name || m.media_url.split('/').pop() || 'Document'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {m.file_size ? `${(m.file_size / 1024).toFixed(1)} KB` : 'File attachment'}
                      </div>
                    </div>
                    <Download size={15} color="var(--text-secondary)" />
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                No documents or files shared yet.
              </div>
            )
          )}

          {/* TAB 3: LINKS */}
          {activeTab === 'links' && (
            extractedLinks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {extractedLinks.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(20, 27, 43, 0.6)',
                      border: '1px solid var(--border-color)',
                      textDecoration: 'none',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(56, 217, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-cyan)',
                        flexShrink: 0,
                      }}
                    >
                      <ExternalLink size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--accent-cyan)',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.url}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {getDomain(item.url)} • from {item.sender || 'Chat'}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                No links shared in this conversation yet.
              </div>
            )
          )}
        </div>

        {/* End-to-End Encryption & Security Code (Phase 3) */}
        <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255, 255, 255, 0.02)', marginBottom: '10px' }}>
          <div
            onClick={() => setIsSecurityModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: '6px 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(57, 217, 138, 0.12)',
                  border: '1px solid rgba(57, 217, 138, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--online)',
                }}
              >
                <Lock size={17} />
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                  Encryption
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Messages are end-to-end encrypted. Tap to verify.
                </div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
          </div>
        </div>

        {/* Ghost Mode Toggle (Phase 5) */}
        <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255, 255, 255, 0.02)', marginBottom: '10px' }}>
          <div
            onClick={() => onToggleGhostMode && onToggleGhostMode(!isGhostMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: '6px 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: isGhostMode ? 'rgba(124, 92, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                  border: isGhostMode ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isGhostMode ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <EyeOff size={17} />
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                  Ghost Mode (Peek to Reveal)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {isGhostMode ? 'Active • Messages blurred until hovered' : 'Off • Anti-shoulder surfing'}
                </div>
              </div>
            </div>
            <div
              style={{
                width: '36px',
                height: '20px',
                borderRadius: '10px',
                backgroundColor: isGhostMode ? 'var(--accent)' : 'rgba(255, 255, 255, 0.15)',
                position: 'relative',
                transition: 'background-color 0.2s',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  position: 'absolute',
                  top: '2px',
                  left: isGhostMode ? '18px' : '2px',
                  transition: 'left 0.2s',
                }}
              />
            </div>
          </div>
        </div>

        {/* Export Chat Transcript (Phase 5) */}
        <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255, 255, 255, 0.02)', marginBottom: '16px' }}>
          <div
            onClick={() => {
              const header = `==============================================\nAurora ChatApp - Conversation with ${chatTitle}\nExported: ${new Date().toLocaleString()}\nTotal Messages: ${messages.length}\n==============================================\n\n`;
              const body = messages.map((m) => {
                const time = m.created_at ? new Date(m.created_at).toLocaleString() : 'Unknown';
                const sender = m.sender_username || 'Unknown';
                const content = m.message || m.content || (m.media_url ? `[Attachment: ${m.media_url}]` : '');
                return `[${time}] ${sender}: ${content}`;
              }).join('\n\n');

              const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ChatApp_${chatTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Transcript.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: '6px 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(56, 217, 255, 0.12)',
                  border: '1px solid rgba(56, 217, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)',
                }}
              >
                <FileDown size={17} />
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                  Export Chat
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Download transcript as a .txt archive
                </div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
          </div>
        </div>
      </div>

      {/* Security Code Verification Modal */}
      <SecurityCodeModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        contactName={chatTitle}
        chatId={chat.conversation_id}
      />
    </div>
  );
}
