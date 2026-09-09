import React, { useState } from 'react';
import {
  X,
  Palette,
  Bell,
  Lock,
  Shield,
  Globe,
  HardDrive,
  HelpCircle,
  Check,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('appearance'); // 'appearance' | 'notifications' | 'privacy' | 'security' | 'storage' | 'about'

  // Settings State
  const [theme, setTheme] = useState('dark');
  const [accent, setAccent] = useState('#7C5CFF');
  const [notifications, setNotifications] = useState({
    messages: true,
    groups: true,
    calls: true,
    sounds: true,
    preview: true,
  });
  const [privacy, setPrivacy] = useState({
    lastSeen: 'Everyone',
    onlineStatus: 'Everyone',
    readReceipts: true,
    typingIndicator: true,
  });

  // 2FA PIN State (Phase 5)
  const [pinEnabled, setPinEnabled] = useState(() => Boolean(localStorage.getItem('user_2fa_pin')));
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  if (!isOpen) return null;

  const ACCENTS = [
    { name: 'Violet', hex: '#7C5CFF' },
    { name: 'Blue', hex: '#38D9FF' },
    { name: 'Green', hex: '#39D98A' },
    { name: 'Orange', hex: '#FFB84D' },
  ];

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
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          height: '620px',
          backgroundColor: '#0D1220',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Left Navigation Sidebar */}
        <div
          style={{
            width: '260px',
            backgroundColor: '#080B14',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Settings
            </h3>
          </div>

          {/* Navigation Categories */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', padding: '6px 14px', textTransform: 'uppercase' }}>
              Chat
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('appearance')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeSection === 'appearance' ? 'var(--bg-active)' : 'transparent',
                color: activeSection === 'appearance' ? 'var(--accent)' : 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'left',
              }}
            >
              <Palette size={18} />
              <span>Appearance</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('notifications')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeSection === 'notifications' ? 'var(--bg-active)' : 'transparent',
                color: activeSection === 'notifications' ? 'var(--accent)' : 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'left',
              }}
            >
              <Bell size={18} />
              <span>Notifications</span>
            </button>

            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', padding: '14px 14px 6px 14px', textTransform: 'uppercase' }}>
              Account & Privacy
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('privacy')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeSection === 'privacy' ? 'var(--bg-active)' : 'transparent',
                color: activeSection === 'privacy' ? 'var(--accent)' : 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'left',
              }}
            >
              <Lock size={18} />
              <span>Privacy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('security')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeSection === 'security' ? 'var(--bg-active)' : 'transparent',
                color: activeSection === 'security' ? 'var(--accent)' : 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'left',
              }}
            >
              <Shield size={18} />
              <span>Security</span>
            </button>

            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', padding: '14px 14px 6px 14px', textTransform: 'uppercase' }}>
              General & Support
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('storage')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeSection === 'storage' ? 'var(--bg-active)' : 'transparent',
                color: activeSection === 'storage' ? 'var(--accent)' : 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'left',
              }}
            >
              <HardDrive size={18} />
              <span>Storage & Data</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('about')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeSection === 'about' ? 'var(--bg-active)' : 'transparent',
                color: activeSection === 'about' ? 'var(--accent)' : 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'left',
              }}
            >
              <HelpCircle size={18} />
              <span>About Aurora</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0D1220' }}>
          {/* Top Bar with Close Button */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {activeSection}
            </h4>
            <button type="button" className="btn-icon" onClick={onClose} title="Close settings">
              <X size={18} />
            </button>
          </div>

          {/* Section Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {/* APPEARANCE */}
            {activeSection === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                    Theme
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['Dark', 'Light', 'System'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t.toLowerCase())}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '12px',
                          backgroundColor: theme === t.toLowerCase() ? 'var(--bg-card)' : 'rgba(255,255,255,0.02)',
                          border: theme === t.toLowerCase() ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                    Accent Color
                  </label>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Electric Violet is the branded default accent of Midnight Aurora.
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {ACCENTS.map((a) => (
                      <div
                        key={a.hex}
                        onClick={() => setAccent(a.hex)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 14px',
                          borderRadius: '12px',
                          backgroundColor: accent === a.hex ? 'var(--bg-card)' : 'transparent',
                          border: accent === a.hex ? `1.5px solid ${a.hex}` : '1px solid var(--border-color)',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: a.hex,
                          }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                          {a.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeSection === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries({
                  messages: 'Direct Messages',
                  groups: 'Group Messages',
                  calls: 'Incoming Calls',
                  sounds: 'Sound Effects',
                  preview: 'Message Preview in Banner',
                }).map(([key, label]) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {label}
                    </span>
                    <input
                      type="checkbox"
                      checked={notifications[key]}
                      onChange={(e) =>
                        setNotifications((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                      style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* PRIVACY */}
            {activeSection === 'privacy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Last Seen & Online</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Who can see when you are active</div>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--accent)' }}>Everyone</span>
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Read Receipts</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Show neon cyan checkmarks when read</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.readReceipts}
                    onChange={(e) => setPrivacy((p) => ({ ...p, readReceipts: e.target.checked }))}
                    style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                  />
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Typing Indicators</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Show bouncing dots when composing messages</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.typingIndicator}
                    onChange={(e) => setPrivacy((p) => ({ ...p, typingIndicator: e.target.checked }))}
                    style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                  />
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeSection === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Active Sessions
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Smartphone size={15} color="var(--online)" />
                    <span>Windows Chrome • Active now</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    End-to-End Encryption
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Your messages and WebRTC calls are encrypted directly peer-to-peer.
                  </div>
                </div>

                {/* Two-Step Verification 6-Digit PIN (Phase 5) */}
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Two-Step Verification (6-Digit PIN)
                    </div>
                    {pinEnabled && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#39D98A',
                          backgroundColor: 'rgba(57, 217, 138, 0.15)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: '600',
                        }}
                      >
                        Active
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Require a secure 6-digit PIN when registering or logging into your ChatApp account.
                  </div>

                  {pinSuccess && (
                    <div style={{ color: '#39D98A', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                      {pinSuccess}
                    </div>
                  )}

                  {isEditingPin ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="password"
                        maxLength={6}
                        placeholder="Enter 6-digit PIN"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                        style={{
                          backgroundColor: '#080B14',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          color: '#fff',
                          fontSize: '14px',
                          letterSpacing: '2px',
                          width: '160px',
                        }}
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={pinInput.length !== 6}
                        onClick={() => {
                          if (pinInput.length === 6) {
                            localStorage.setItem('user_2fa_pin', pinInput);
                            setPinEnabled(true);
                            setIsEditingPin(false);
                            setPinInput('');
                            setPinSuccess('PIN successfully updated!');
                            setTimeout(() => setPinSuccess(''), 3000);
                          }
                        }}
                        style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px' }}
                      >
                        Save PIN
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => {
                          setIsEditingPin(false);
                          setPinInput('');
                        }}
                        style={{ padding: '6px' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setIsEditingPin(true)}
                        style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px' }}
                      >
                        {pinEnabled ? 'Change PIN' : 'Enable 6-Digit PIN'}
                      </button>

                      {pinEnabled && (
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.removeItem('user_2fa_pin');
                            setPinEnabled(false);
                            setPinSuccess('PIN disabled.');
                            setTimeout(() => setPinSuccess(''), 3000);
                          }}
                          style={{
                            padding: '6px 14px',
                            fontSize: '12px',
                            borderRadius: '8px',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                          }}
                        >
                          Disable
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STORAGE */}
            {activeSection === 'storage' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Storage Usage
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Messages & Media Cache: <strong>14.2 MB</strong>
                  </div>
                </div>
              </div>
            )}

            {/* ABOUT */}
            {activeSection === 'about' && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <h3 className="aurora-text" style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                  Aurora Chat
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Version 2.0.0 — Midnight Aurora Edition
                </p>
                <p style={{ maxWidth: '420px', margin: '0 auto', fontSize: '13.5px', lineHeight: '20px', color: 'var(--text-secondary)' }}>
                  Built with React, Node.js, Express, Socket.IO, WebRTC, and TiDB Cloud MySQL.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
