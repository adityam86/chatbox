import React, { useState } from 'react';
import { X, Send, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';

export default function ImagePreviewModal({ file, isOpen, onClose, onSendImage }) {
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !file) return null;

  const previewUrl = URL.createObjectURL(file);

  const handleSend = async () => {
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onSendImage({
        mediaUrl: res.data.url,
        message: caption.trim(),
        messageType: 'image',
      });

      onClose();
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
    >
      {/* Top close button */}
      <div style={{ position: 'absolute', top: '16px', right: '20px' }}>
        <button className="btn-icon" onClick={onClose} style={{ color: '#fff' }}>
          <X size={26} />
        </button>
      </div>

      {/* Image Preview Container */}
      <div
        className="fade-in"
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: 'var(--bg-panel)',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '15px',
            fontWeight: '600',
          }}
        >
          <ImageIcon size={18} style={{ color: 'var(--accent)' }} />
          <span>Send Image</span>
        </div>

        <div style={{ maxHeight: '420px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={previewUrl}
            alt="Preview"
            style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }}
          />
        </div>

        {error && (
          <div style={{ padding: '8px 16px', color: '#ff8080', fontSize: '13px', backgroundColor: 'rgba(234,67,53,0.1)' }}>
            {error}
          </div>
        )}

        {/* Caption & Send */}
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--bg-panel)',
          }}
        >
          <input
            type="text"
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            style={{
              flex: 1,
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '14.5px',
            }}
          />

          <button
            type="button"
            className="btn-primary"
            onClick={handleSend}
            disabled={uploading}
            style={{ width: '42px', height: '42px', borderRadius: '50%', padding: 0 }}
            title="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
