import React from 'react';
import { FileText, Download } from 'lucide-react';

export default function DocumentBubble({ message, isOwnMessage }) {
  const fileName = message.message || 'Document';
  const fileUrl = message.media_url;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: isOwnMessage ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '10px 14px',
        marginBottom: '6px',
        minWidth: '220px',
        border: isOwnMessage ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'var(--aurora-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          flexShrink: 0,
          boxShadow: '0 3px 10px rgba(124, 92, 255, 0.35)',
        }}
      >
        <FileText size={20} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: '600',
            fontSize: '13.5px',
            color: isOwnMessage ? '#FFFFFF' : 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={fileName}
        >
          {fileName}
        </div>
        <div style={{ fontSize: '11.5px', color: isOwnMessage ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)', marginTop: '2px' }}>
          Document • Click to download
        </div>
      </div>

      <a
        href={fileUrl}
        download
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: isOwnMessage ? 'rgba(255, 255, 255, 0.2)' : 'rgba(124, 92, 255, 0.15)',
          color: isOwnMessage ? '#FFFFFF' : 'var(--accent-cyan)',
          textDecoration: 'none',
          flexShrink: 0,
        }}
        title="Download file"
      >
        <Download size={15} />
      </a>
    </div>
  );
}
