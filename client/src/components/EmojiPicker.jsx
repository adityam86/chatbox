import React, { useState } from 'react';
import { Smile, Heart, Coffee, Star, Compass } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
      '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
      '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
      '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
      '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄',
    ],
  },
  {
    id: 'gestures',
    name: 'Hands & Gestures',
    icon: Heart,
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️',
      '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲',
      '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶',
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '🔥',
    ],
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: Coffee,
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
      '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑',
      '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅',
      '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆',
      '☕', '🍵', '🧃', '🥤', '🧋', '🍺', '🍻', '🍷', '🥂', '🍾',
    ],
  },
  {
    id: 'objects',
    name: 'Objects & Symbols',
    icon: Star,
    emojis: [
      '💡', '🔦', '🕯️', '🪔', '📱', '💻', '🖥️', '⌨️', '🖱️', '📷',
      '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀',
      '🚀', '✈️', '🚗', '🚕', '🚌', '🏎️', '🛵', '🚲', '🛴', '🚨',
      '⭐', '🌟', '✨', '⚡', '☄️', '💥', '☀️', '🌈', '☁️', '🌧️',
      '✔️', '❌', '💯', '⚠️', '🚫', '⛔', '🟢', '🔴', '🟣', '🔵',
    ],
  },
];

export default function EmojiPicker({ onSelectEmoji, onClose }) {
  const [activeTab, setActiveTab] = useState('smileys');
  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];

  return (
    <div
      className="fade-in"
      style={{
        position: 'absolute',
        bottom: '65px',
        left: '12px',
        width: '320px',
        height: '280px',
        backgroundColor: 'var(--bg-panel)',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-hover)',
        }}
      >
        {EMOJI_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={cat.name}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>

      {/* Emoji Grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
          alignContent: 'start',
        }}
      >
        {currentCategory.emojis.map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectEmoji(emoji)}
            style={{
              background: 'transparent',
              fontSize: '22px',
              padding: '6px 0',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-active)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
