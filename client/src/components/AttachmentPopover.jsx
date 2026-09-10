import React from 'react';
import { Camera, Video, FileText, Music, MapPin, User, BarChart2, CreditCard, Code, Tv, Eye, AlertTriangle, X } from 'lucide-react';

export default function AttachmentPopover({
  isOpen,
  onClose,
  onSelectPhoto,
  onSelectVideo,
  onSelectDocument,
  onSelectAudio,
  onShareLocation,
  onShareContact,
  onOpenPoll,
  onOpenSplitBill,
  onInsertCode,
  onOpenWatchTogether,
  isViewOnce,
  onToggleViewOnce,
  isPriority,
  onTogglePriority,
}) {
  if (!isOpen) return null;

  const items = [
    {
      id: 'photo',
      label: 'Photo',
      icon: Camera,
      color: '#7C5CFF',
      action: onSelectPhoto,
    },
    {
      id: 'video',
      label: 'Video',
      icon: Video,
      color: '#38D9FF',
      action: onSelectVideo,
    },
    {
      id: 'document',
      label: 'Document',
      icon: FileText,
      color: '#39D98A',
      action: onSelectDocument,
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: Music,
      color: '#FFB84D',
      action: onSelectAudio,
    },
    {
      id: 'poll',
      label: 'Poll',
      icon: BarChart2,
      color: '#00D2D3',
      action: onOpenPoll,
    },
    {
      id: 'split',
      label: 'Split Bill',
      icon: CreditCard,
      color: '#39D98A',
      action: onOpenSplitBill,
    },
    {
      id: 'code',
      label: 'Code Snippet',
      icon: Code,
      color: '#FD79A8',
      action: onInsertCode,
    },
    {
      id: 'watch',
      label: 'Watch Together',
      icon: Tv,
      color: '#38D9FF',
      action: onOpenWatchTogether,
    },
    {
      id: 'location',
      label: 'Location',
      icon: MapPin,
      color: '#FF5C70',
      action: onShareLocation,
    },
    {
      id: 'contact',
      label: 'Contact Card',
      icon: User,
      color: '#A29BFE',
      action: onShareContact,
    },
    {
      id: 'view_once',
      label: isViewOnce ? 'View-Once: Active ✓' : 'View-Once Mode',
      icon: Eye,
      color: isViewOnce ? '#38D9FF' : '#929BB2',
      action: onToggleViewOnce,
      isActive: isViewOnce,
    },
    {
      id: 'priority',
      label: isPriority ? 'Priority Alert: Active ✓' : 'Priority Alert',
      icon: AlertTriangle,
      color: isPriority ? '#FF5C70' : '#929BB2',
      action: onTogglePriority,
      isActive: isPriority,
    },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
        }}
      />

      {/* Floating Popover Container */}
      <div
        className="fade-in"
        style={{
          position: 'absolute',
          bottom: 'calc(66px + var(--safe-bottom))',
          left: '12px',
          width: '230px',
          maxWidth: 'calc(100vw - 24px)',
          maxHeight: 'min(440px, calc(100dvh - 110px))',
          overflowY: 'auto',
          backgroundColor: '#0D1220',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '8px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.action) item.action();
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: `${item.color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={17} />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
