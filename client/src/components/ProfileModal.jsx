import React, { useState, useRef } from 'react';
import { X, User, Check, Lock, Camera, UploadCloud } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
  
  // Profile State
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profile_image || '');
  
  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const fileInputRef = useRef(null);

  if (!isOpen || !user) return null;

  const showMessage = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (username.trim().length < 3) {
      return showMessage('Username must be at least 3 characters', 'error');
    }
    setSaving(true);
    try {
      const res = await api.put('/users/profile', {
        username: username !== user.username ? username : undefined,
        bio,
        profile_image: profileImage,
      });
      updateUser(res.data.user);
      showMessage('Profile updated successfully!');
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return showMessage('New password must be at least 6 characters.', 'error');
    }
    if (newPassword !== confirmPassword) {
      return showMessage('Passwords do not match.', 'error');
    }

    setSaving(true);
    try {
      await api.put('/users/password', {
        currentPassword,
        newPassword
      });
      showMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to update password.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setSaving(true);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfileImage(res.data.url);
      showMessage('Avatar uploaded. Click Save Changes to apply.');
    } catch (err) {
      showMessage('Failed to upload avatar.', 'error');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
        backdropFilter: 'blur(4px)',
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
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'rgba(255,255,255,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '18px' }}>
            <User size={22} style={{ color: 'var(--accent)' }} />
            <span>Account Settings</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              color: activeTab === 'profile' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'profile' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              fontWeight: activeTab === 'profile' ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              color: activeTab === 'security' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'security' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              fontWeight: activeTab === 'security' ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Security
          </button>
        </div>

        <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={profileImage || user.profile_image}
                    alt={user.username}
                    style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: 'var(--accent-cyan)',
                      color: '#000',
                      border: '2px solid var(--bg-panel)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Upload New Avatar"
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{user.email}</div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
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
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    resize: 'none',
                  }}
                />
              </div>

              {msg && activeTab === 'profile' && (
                <div style={{ textAlign: 'center', fontSize: '13.5px', color: msgType === 'error' ? 'var(--danger)' : 'var(--accent-cyan)' }}>
                  {msg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={onClose} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '8px 16px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  <Check size={16} />
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                  }}
                />
              </div>

              {msg && activeTab === 'security' && (
                <div style={{ textAlign: 'center', fontSize: '13.5px', color: msgType === 'error' ? 'var(--danger)' : 'var(--accent-cyan)' }}>
                  {msg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={onClose} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '8px 16px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  <Lock size={16} />
                  <span>{saving ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
