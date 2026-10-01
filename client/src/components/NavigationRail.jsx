import React from 'react';
import {
  MessageSquare,
  Users,
  Phone,
  Bell,
  Settings,
  User,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NavigationRail({
  activeTab,
  onSelectTab,
  unreadMessageCount = 0,
  unreadNotificationCount = 0,
  isMobile = false,
  onOpenSettings,
  onOpenProfile,
}) {
  const { user, logout } = useAuth();

  const navItems = [
    {
      id: 'chats',
      label: 'Chats',
      icon: MessageSquare,
      badge: unreadMessageCount,
    },
    {
      id: 'groups',
      label: 'Groups',
      icon: Users,
    },
    {
      id: 'calls',
      label: 'Calls',
      icon: Phone,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotificationCount,
    },
  ];

  // Mobile Bottom Navigation Bar (Section 4)
  if (isMobile) {
    const mobileItems = [
      { id: 'chats', label: 'Chats', icon: MessageSquare, badge: unreadMessageCount },
      { id: 'groups', label: 'Groups', icon: Users },
      { id: 'calls', label: 'Calls', icon: Phone },
      { id: 'settings', label: 'More', icon: Settings },
    ];

    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#0D1220',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 100,
          backdropFilter: 'blur(16px)',
        }}
      >
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.id === 'settings'
              ? activeTab === 'settings' || activeTab === 'notifications'
              : activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'settings') {
                  onOpenSettings ? onOpenSettings() : onSelectTab('settings');
                } else {
                  onSelectTab(item.id);
                }
              }}
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                gap: '4px',
                position: 'relative',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon size={20} />
                {Boolean(item.badge) && item.badge > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-6px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent)',
                    }}
                  />
                )}
              </div>
              <span style={{ fontSize: '11px', fontWeight: isActive ? '600' : '500' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Desktop Left Navigation Rail (Section 4 & 44)
  return (
    <div
      style={{
        width: '68px',
        height: '100%',
        backgroundColor: 'rgba(10, 14, 25, 0.82)',
        backdropFilter: 'blur(18px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.055)',
        boxShadow: 'inset -1px 0 0 rgba(255, 255, 255, 0.01)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0 14px 0',
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* Top Brand Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--aurora-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 16px rgba(124, 92, 252, 0.4)',
            cursor: 'pointer',
          }}
          title="ChatBox"
        >
          <Sparkles size={20} />
        </div>

        {/* Primary Nav Icons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  title={item.label}
                  className={`nav-rail-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={isActive ? 24 : 22} style={{ transition: 'all 0.18s ease' }} />

                  {Boolean(item.badge) && item.badge > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        backgroundColor: 'var(--accent)',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: '700',
                        borderRadius: '10px',
                        padding: '1px 5px',
                        minWidth: '16px',
                        textAlign: 'center',
                        border: '2px solid var(--bg-panel)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Controls: Settings & Profile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          className={`nav-rail-item ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <Settings size={activeTab === 'settings' ? 24 : 22} style={{ transition: 'all 0.18s ease' }} />
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          title={user?.username || 'My Profile'}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            transition: 'transform 0.18s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <img
            src={user?.profile_image || `https://ui-avatars.com/api/?name=${user?.username}&background=7C5CFF&color=fff`}
            alt={user?.username}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--accent)',
            }}
          />
        </button>
      </div>
    </div>
  );
}
