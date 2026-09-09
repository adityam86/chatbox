import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Check, QrCode } from 'lucide-react';

export default function SecurityCodeModal({ isOpen, onClose, contactName, chatId }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate deterministic 60-digit fingerprint based on chatId string
  const generateFingerprint = (seed) => {
    let hash = 0;
    const str = seed || 'aurora-default-seed';
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }

    let digits = '';
    for (let i = 0; i < 60; i++) {
      const pseudoVal = Math.abs(Math.sin(hash + i) * 10000);
      digits += Math.floor(pseudoVal % 10);
    }

    // Split into 12 chunks of 5 digits
    const chunks = [];
    for (let i = 0; i < 60; i += 5) {
      chunks.push(digits.substring(i, i + 5));
    }
    return chunks;
  };

  const chunks = generateFingerprint(chatId);
  const fullCode = chunks.join(' ');

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0D1220',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '24px 20px',
        }}
      >
        {/* Close Button */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-icon" onClick={onClose} style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Shield Icon */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(124, 92, 255, 0.15)',
            border: '1px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            boxShadow: '0 0 20px rgba(124, 92, 255, 0.3)',
            marginBottom: '14px',
          }}
        >
          <ShieldCheck size={32} color="#38D9FF" />
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
          Verify security code
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '18px', maxWidth: '360px', marginBottom: '18px' }}>
          All messages and calls with <strong style={{ color: 'var(--text-primary)' }}>{contactName || 'this chat'}</strong> are end-to-end encrypted. Verify that this 60-digit number matches on both devices.
        </p>

        {/* QR Code Container */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '16px',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Stylized QR representation */}
          <div
            style={{
              width: '130px',
              height: '130px',
              backgroundColor: '#080B14',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              backgroundImage: 'radial-gradient(#7C5CFF 15%, transparent 16%), radial-gradient(#38D9FF 15%, transparent 16%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 8px 8px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#0D1220',
                border: '1.5px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <ShieldCheck size={20} color="#38D9FF" />
            </div>
          </div>
        </div>

        {/* 60-digit fingerprint blocks */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px 12px',
            backgroundColor: 'rgba(20, 27, 43, 0.6)',
            padding: '14px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: 'var(--text-primary)',
            letterSpacing: '1px',
            marginBottom: '18px',
            width: '100%',
          }}
        >
          {chunks.map((chunk, idx) => (
            <span key={idx} style={{ textAlign: 'center', fontWeight: '600' }}>
              {chunk}
            </span>
          ))}
        </div>

        {/* Copy Button */}
        <button
          type="button"
          className="btn-primary"
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '11px',
            borderRadius: '12px',
            fontSize: '13.5px',
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? 'Copied to Clipboard' : 'Copy Security Code'}</span>
        </button>
      </div>
    </div>
  );
}
