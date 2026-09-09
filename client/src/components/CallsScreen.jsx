import React, { useState } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Search, Plus } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

export default function CallsScreen({
  conversations = [],
  onStartCall,
  onOpenNewChat,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'missed'
  const [search, setSearch] = useState('');

  // Generate realistic call log history from conversations
  const sampleCalls = conversations.slice(0, 8).map((c, idx) => {
    const isMissed = idx % 3 === 2;
    const isOutgoing = idx % 2 === 0;
    const isVideo = idx % 2 === 1;
    const targetUser = {
      id: c.recipient_id,
      username: c.type === 'group' ? c.group_name : c.recipient_username,
      profile_image: c.type === 'group' ? c.group_image : c.recipient_profile_image,
    };

    const date = new Date(Date.now() - idx * 3600 * 1000 * 14);
    let timeLabel = format(date, 'h:mm a');
    if (isToday(date)) timeLabel = `Today, ${timeLabel}`;
    else if (isYesterday(date)) timeLabel = `Yesterday, ${timeLabel}`;
    else timeLabel = format(date, 'MMM d, h:mm a');

    return {
      id: `call-${c.conversation_id || idx}`,
      targetUser,
      type: isVideo ? 'video' : 'voice',
      direction: isOutgoing ? 'outgoing' : 'incoming',
      isMissed,
      timeLabel,
    };
  });

  const filteredCalls = sampleCalls.filter((call) => {
    if (filter === 'missed' && !call.isMissed) return false;
    if (search.trim()) {
      return (call.targetUser.username || '')
        .toLowerCase()
        .includes(search.toLowerCase());
    }
    return true;
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-app)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          backgroundColor: 'var(--bg-panel)',
          height: '62px',
          flexShrink: 0,
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
          Calls
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-primary"
            onClick={onOpenNewChat}
            style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '8px' }}
            title="Start new call"
          >
            <Plus size={15} />
            <span>New Call</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-input)',
            borderRadius: '20px',
            padding: '7px 14px',
            gap: '10px',
            border: '1px solid var(--border-color)',
            marginBottom: '12px',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search calls..."
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

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '16px',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: filter === 'all' ? 'var(--accent)' : 'transparent',
              color: filter === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
              border: filter === 'all' ? 'none' : '1px solid var(--border-color)',
              transition: 'all 0.15s ease',
            }}
          >
            All Calls
          </button>

          <button
            type="button"
            onClick={() => setFilter('missed')}
            style={{
              padding: '6px 14px',
              borderRadius: '16px',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: filter === 'missed' ? 'var(--danger)' : 'transparent',
              color: filter === 'missed' ? '#FFFFFF' : 'var(--text-secondary)',
              border: filter === 'missed' ? 'none' : '1px solid var(--border-color)',
              transition: 'all 0.15s ease',
            }}
          >
            Missed
          </button>
        </div>
      </div>

      {/* Calls List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {filteredCalls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
            <Phone size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>No calls yet</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              Your recent voice and video call logs will appear here.
            </div>
          </div>
        ) : (
          filteredCalls.map((call) => (
            <div
              key={call.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid var(--border-color)',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {/* Avatar and details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={
                    call.targetUser.profile_image ||
                    `https://ui-avatars.com/api/?name=${call.targetUser.username}&background=7C5CFF&color=fff`
                  }
                  alt={call.targetUser.username}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                />

                <div>
                  <div
                    style={{
                      fontWeight: '600',
                      fontSize: '14.5px',
                      color: call.isMissed ? 'var(--danger)' : 'var(--text-primary)',
                    }}
                  >
                    {call.targetUser.username}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    {call.isMissed ? (
                      <PhoneMissed size={14} style={{ color: 'var(--danger)' }} />
                    ) : call.direction === 'outgoing' ? (
                      <PhoneOutgoing size={14} style={{ color: 'var(--online)' }} />
                    ) : (
                      <PhoneIncoming size={14} style={{ color: 'var(--accent-cyan)' }} />
                    )}

                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {call.timeLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Call triggers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => onStartCall && onStartCall('audio', call.targetUser)}
                  title="Voice Call"
                  style={{ color: 'var(--accent)', padding: '8px' }}
                >
                  <Phone size={18} />
                </button>

                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => onStartCall && onStartCall('video', call.targetUser)}
                  title="Video Call"
                  style={{ color: 'var(--accent-cyan)', padding: '8px' }}
                >
                  <Video size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
