import React, { useState } from 'react';
import { X, User, Check, Edit2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profile_image || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  if (!isOpen || !user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const res = await api.put('/users/profile', {
        bio,
        profile_image: profileImage,
      });
      updateUser(res.data.user);
      setMsg('Profile updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Failed to update profile.');
    } finally {
      setSaving(false);
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
            <User size={20} style={{ color: 'var(--accent)' }} />
            <span>Profile</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <img
              src={profileImage || user.profile_image}
              alt={user.username}
              style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }}
            />
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{user.username}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user.email}</div>
          </div>

          <div>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Profile Photo URL
            </label>
            <input
              type="text"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              About / Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Hey there! I am using ChatApp."
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'none',
              }}
            />
          </div>

          {msg && (
            <div style={{ textAlign: 'center', fontSize: '13.5px', color: msg.includes('Failed') ? 'var(--danger)' : 'var(--accent)' }}>
              {msg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '8px 16px', cursor: 'pointer' }}>
              Close
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Check size={16} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
