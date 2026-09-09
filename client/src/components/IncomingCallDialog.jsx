import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { startRingtone, stopRingtone } from '../utils/sound';

export default function IncomingCallDialog({ incomingCall, onAccept, onDecline }) {
  useEffect(() => {
    if (incomingCall) {
      startRingtone();
    }
    return () => {
      stopRingtone();
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  const isVideo = incomingCall.callType === 'video';

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(13, 18, 32, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        border: '1px solid rgba(124, 92, 255, 0.35)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 99999,
        minWidth: '340px',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div style={{ position: 'relative' }}>
        <img
          src={incomingCall.callerAvatar || `https://ui-avatars.com/api/?name=${incomingCall.callerName}&background=7C5CFF&color=fff`}
          alt={incomingCall.callerName}
          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            backgroundColor: 'var(--accent)',
            borderRadius: '50%',
            padding: '4px',
            display: 'flex',
          }}
        >
          {isVideo ? <Video size={12} color="#FFFFFF" /> : <Phone size={12} color="#FFFFFF" />}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', fontSize: '15.5px', color: 'var(--text-primary)' }}>{incomingCall.callerName}</div>
        <div style={{ fontSize: '13px', color: 'var(--accent-cyan)', marginTop: '2px', fontWeight: '500' }}>
          Incoming {isVideo ? 'video' : 'voice'} call...
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Decline */}
        <button
          type="button"
          onClick={onDecline}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--danger)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255, 77, 109, 0.4)',
          }}
          title="Decline"
        >
          <PhoneOff size={18} />
        </button>

        {/* Accept */}
        <button
          type="button"
          onClick={onAccept}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--aurora-gradient)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(124, 92, 255, 0.5)',
          }}
          title="Accept"
        >
          <Phone size={18} />
        </button>
      </div>
    </div>
  );
}
