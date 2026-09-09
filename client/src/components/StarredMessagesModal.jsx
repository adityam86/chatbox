import React, { useEffect, useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';

export default function StarredMessagesModal({ isOpen, onClose, onSelectMessage }) {
  const [starred, setStarred] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api
        .get('/features/messages/starred')
        .then((res) => setStarred(res.data.starredMessages || []))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnstar = async (e, msgId) => {
    e.stopPropagation();
    try {
      await api.post(`/features/messages/${msgId}/star`);
      setStarred((prev) => prev.filter((m) => m.message_id !== msgId));
    } catch (err) {
      console.error('Failed to unstar:', err);
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
        backgroundColor: 'rgba(0,0,0,0.7)',
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
          maxWidth: '500px',
          maxHeight: '80vh',
          backgroundColor: 'var(--bg-panel)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border-color)',
          boxShadow: '0 12px 35px rgba(0,0,0,0.6)',
          overflow: 'hidden',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '17px' }}>
            <Star size={20} style={{ color: '#ffbc38' }} />
            <span>Starred Messages</span>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
              Loading starred messages...
            </div>
          ) : starred.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <Star size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <div>No starred messages yet.</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>
                Hover over any message and click the star icon to save it here.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {starred.map((m) => (
                <div
                  key={m.star_id}
                  onClick={() => {
                    onSelectMessage(m);
                    onClose();
                  }}
                  style={{
                    backgroundColor: 'var(--bg-hover)',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={m.sender_profile_image || `https://ui-avatars.com/api/?name=${m.sender_username}&background=7C5CFF&color=fff`}
                        alt={m.sender_username}
                        style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                      />
                      <span style={{ fontWeight: '600', fontSize: '13.5px' }}>{m.sender_username}</span>
                      {m.group_name && (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          in {m.group_name}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {format(new Date(m.message_created_at), 'dd/MM/yy h:mm a')}
                      </span>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={(e) => handleUnstar(e, m.message_id)}
                        title="Unstar message"
                        style={{ padding: '4px' }}
                      >
                        <Star size={15} fill="#ffbc38" color="#ffbc38" />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                    {m.message_type === 'image' ? (
                      <div>📷 Photo</div>
                    ) : m.message_type === 'audio' ? (
                      <div>🎙️ Voice message</div>
                    ) : (
                      m.message
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
