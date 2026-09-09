import React, { useState, useEffect } from 'react';
import { X, Users, Search, Check, Plus, Radio } from 'lucide-react';
import api from '../services/api';

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [isBroadcastChannel, setIsBroadcastChannel] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setGroupName('');
      setIsBroadcastChannel(false);
      setSearch('');
      setSearchResults([]);
      setSelectedUsers([]);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(search.trim())}`);
      setSearchResults(res.data.users || []);
    } catch (err) {
      setError('Failed to search users.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectUser = (user) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please provide a group name.');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Please add at least one member to the group.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const memberIds = selectedUsers.map((u) => u.id);
      const finalName = isBroadcastChannel ? `${groupName.trim()} [Channel]` : groupName.trim();
      const res = await api.post('/chats/group', {
        name: finalName,
        memberIds,
      });

      onGroupCreated(res.data.group);
      onClose();
    } catch (err) {
      console.error('Failed to create group:', err);
      setError(err.response?.data?.error || 'Failed to create group.');
    } finally {
      setCreating(false);
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
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
          maxWidth: '460px',
          backgroundColor: 'var(--bg-panel)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 10px 35px rgba(0,0,0,0.5)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '17px' }}>
            {isBroadcastChannel ? (
              <Radio size={20} style={{ color: 'var(--accent-cyan)' }} />
            ) : (
              <Users size={20} style={{ color: 'var(--accent)' }} />
            )}
            <span>{isBroadcastChannel ? 'Create Broadcast Channel' : 'Create New Group'}</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ padding: '8px 12px', backgroundColor: 'rgba(234,67,53,0.15)', color: '#ff8080', borderRadius: '6px', fontSize: '13.5px' }}>
              {error}
            </div>
          )}

          {/* Group Name input */}
          <div>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              {isBroadcastChannel ? 'Channel Name / Title' : 'Group Name / Subject'}
            </label>
            <input
              type="text"
              placeholder={isBroadcastChannel ? 'e.g. Daily Tech Radar, Product Updates...' : 'e.g. College Friends, Work Project...'}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '14.5px',
              }}
            />
          </div>

          {/* Broadcast Channel Option Toggle */}
          <div
            onClick={() => setIsBroadcastChannel(!isBroadcastChannel)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: isBroadcastChannel ? 'rgba(124, 92, 255, 0.14)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${isBroadcastChannel ? 'var(--accent)' : 'var(--border-color)'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isBroadcastChannel ? 'var(--accent)' : 'rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isBroadcastChannel ? '#fff' : 'var(--text-secondary)',
                }}
              >
                <Radio size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Broadcast Channel
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  1-to-many updates: Only admins post, members read & react
                </div>
              </div>
            </div>
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: `2px solid ${isBroadcastChannel ? 'var(--accent)' : 'var(--text-muted)'}`,
                backgroundColor: isBroadcastChannel ? 'var(--accent)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isBroadcastChannel && <Check size={12} color="#fff" />}
            </div>
          </div>

          {/* Selected participants chips */}
          {selectedUsers.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Selected participants ({selectedUsers.length}):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    onClick={() => toggleSelectUser(u)}
                    style={{
                      backgroundColor: 'var(--bg-hover)',
                      border: '1px solid var(--border-color)',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '12.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{u.username}</span>
                    <X size={13} style={{ color: 'var(--text-secondary)' }} />
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search contacts to add */}
          <div>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Add Members
            </label>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  gap: '8px',
                  flex: 1,
                }}
              >
                <Search size={16} style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search user to add..."
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
              <button type="submit" className="btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                Find
              </button>
            </form>
          </div>

          {/* Search Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {searchResults.map((u) => {
              const isSelected = selectedUsers.some((sel) => sel.id === u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleSelectUser(u)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-hover)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={u.profile_image || `https://ui-avatars.com/api/?name=${u.username}&background=7C5CFF&color=fff`}
                      alt={u.username}
                      style={{ width: '34px', height: '34px', borderRadius: '50%' }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{u.username}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.bio || u.email}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: '1.5px solid var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                    }}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button type="button" onClick={onClose} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '8px 16px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleCreateGroup}
            disabled={creating}
          >
            <Check size={16} />
            <span>{creating ? 'Creating...' : (isBroadcastChannel ? 'Create Channel' : 'Create Group')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
