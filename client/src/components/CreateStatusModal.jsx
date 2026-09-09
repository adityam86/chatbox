import React, { useState, useRef } from 'react';
import { X, Send, Image as ImageIcon, Type, Palette } from 'lucide-react';
import api from '../services/api';

const STATUS_COLORS = [
  '#4C1D95', '#1E1B4B', '#0E7490', '#BE185D', '#047857', '#312E81', '#111827', '#831843',
];

export default function CreateStatusModal({ isOpen, onClose, onStatusCreated }) {
  const [type, setType] = useState('text'); // 'text' | 'photo'
  const [text, setText] = useState('');
  const [colorIndex, setColorIndex] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleNextColor = () => {
    setColorIndex((prev) => (prev + 1) % STATUS_COLORS.length);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setType('photo');
    }
  };

  const handleSubmit = async () => {
    if (type === 'text' && !text.trim()) {
      setError('Please type your status.');
      return;
    }

    if (type === 'photo' && !selectedFile) {
      setError('Please select a photo.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let mediaUrl = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        mediaUrl = uploadRes.data.url;
      }

      const res = await api.post('/statuses', {
        text: text.trim(),
        media_url: mediaUrl,
        background_color: type === 'text' ? STATUS_COLORS[colorIndex] : null,
      });

      onStatusCreated(res.data.status);
      onClose();
    } catch (err) {
      console.error('Failed to create status:', err);
      setError('Failed to post status.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentColor = STATUS_COLORS[colorIndex];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
      }}
    >
      <div
        className="fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '520px',
          backgroundColor: type === 'text' ? currentColor : '#080B14',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          position: 'relative',
          transition: 'background-color 0.25s',
        }}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Top Header */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-icon"
              onClick={() => {
                setType('text');
                setSelectedFile(null);
              }}
              style={{ color: type === 'text' ? 'var(--accent)' : '#fff' }}
              title="Text status"
            >
              <Type size={20} />
            </button>

            <button
              type="button"
              className="btn-icon"
              onClick={() => fileInputRef.current?.click()}
              style={{ color: type === 'photo' ? 'var(--accent)' : '#fff' }}
              title="Photo status"
            >
              <ImageIcon size={20} />
            </button>

            {type === 'text' && (
              <button
                type="button"
                className="btn-icon"
                onClick={handleNextColor}
                style={{ color: '#fff' }}
                title="Change background color"
              >
                <Palette size={20} />
              </button>
            )}
          </div>

          <button type="button" className="btn-icon" onClick={onClose} style={{ color: '#fff' }}>
            <X size={22} />
          </button>
        </div>

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {type === 'text' ? (
            <textarea
              placeholder="Type a status..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={200}
              autoFocus
              style={{
                width: '100%',
                background: 'transparent',
                color: '#fff',
                fontSize: '24px',
                textAlign: 'center',
                fontWeight: '600',
                border: 'none',
                outline: 'none',
                resize: 'none',
                height: '160px',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {selectedFile ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Status preview"
                  style={{ maxHeight: '280px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
                />
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'center' }}
                >
                  <ImageIcon size={48} style={{ marginBottom: '8px' }} />
                  <div>Click to choose photo</div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '6px 16px', color: '#ff8080', fontSize: '13px', textAlign: 'center', background: 'rgba(0,0,0,0.3)' }}>
            {error}
          </div>
        )}

        {/* Bottom Input & Submit Bar */}
        <div
          style={{
            padding: '14px 20px',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {type === 'photo' && (
            <input
              type="text"
              placeholder="Add a caption..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#fff',
                padding: '9px 14px',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          )}

          <div style={{ flex: type === 'text' ? 1 : 0, textAlign: 'right' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ width: '44px', height: '44px', borderRadius: '50%', padding: 0 }}
              title="Post Status"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
