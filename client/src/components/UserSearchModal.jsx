import React, { useState } from 'react';
import { X, Search, MessageSquarePlus, UserCheck } from 'lucide-react';
import api from '../services/api';

export default function UserSearchModal({ isOpen, onClose, onSelectUser }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(query.trim())}`);
      setResults(res.data.users || []);
      if (res.data.users.length === 0) {
        setError('No users found matching your search.');
      }
    } catch (err) {
      setError('Failed to search users.');
    } finally {
      setLoading(false);
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
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        className="fade-in"
        style={{
          width: '90%',
          maxWidth: '450px',
          backgroundColor: 'var(--bg-panel)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '17px' }}>
            <MessageSquarePlus size={20} style={{ color: 'var(--accent)' }} />
            <span>New Chat</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} style={{ padding: '16px 20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-input)',
              borderRadius: '8px',
              padding: '8px 12px',
              gap: '10px',
            }}
          >
            <Search size={18} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{
                background: 'transparent',
                color: 'var(--text-primary)',
                flex: 1,
                fontSize: '14.5px',
              }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>
              Search
            </button>
          </div>
        </form>

        {/* Results List */}
        <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '0 20px 20px 20px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
              Searching...
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '15px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {results.map((u) => (
            <div
              key={u.id}
              onClick={() => onSelectUser(u)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <img
                src={u.profile_image || `https://ui-avatars.com/api/?name=${u.username}&background=7C5CFF&color=fff`}
                alt={u.username}
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>{u.username}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{u.bio || u.email}</div>
              </div>
              <UserCheck size={18} style={{ color: 'var(--accent)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
