import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Smile,
  CornerUpLeft,
  Trash2,
  Ban,
  Star,
  Forward,
  MapPin,
  ExternalLink,
  BarChart2,
  CheckCircle2,
  Circle,
  Timer,
  CreditCard,
  Code,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Languages,
  AlertTriangle,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatusIndicator from './StatusIndicator';
import AudioPlayer from './AudioPlayer';
import DocumentBubble from './DocumentBubble';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

// Vibrant modern colors for sender names in group chats
const SENDER_COLORS = [
  '#38D9FF', '#7C5CFF', '#39D98A', '#FFB84D', '#FF4D6D', '#A29BFE', '#FD79A8',
];

function getSenderColor(name) {
  if (!name) return '#38D9FF';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

// ============================================================
// 1. INTERACTIVE DEVELOPER CODE PLAYGROUND (Phase 5)
// ============================================================
function CodeBlockWidget({ code, lang = 'code' }) {
  const [copied, setCopied] = useState(false);
  const lines = code.trim().split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        margin: '6px 0',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backgroundColor: '#090D18',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: '#0E1424',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Code size={13} color="var(--accent-cyan)" />
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
            {lang}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? '#39D98A' : 'var(--text-secondary)',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div
        style={{
          padding: '8px 12px',
          overflowX: 'auto',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '12px',
          lineHeight: '1.45',
          color: '#E2E8F0',
        }}
      >
        {lines.map((line, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '10px' }}>
            <span style={{ color: '#4A5568', userSelect: 'none', minWidth: '18px', textAlign: 'right', fontSize: '10.5px' }}>
              {idx + 1}
            </span>
            <span style={{ whiteSpace: 'pre', color: '#CBD5E1' }}>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 2. IN-CHAT SMART BILL SPLITTING WIDGET (Phase 5)
// ============================================================
function SplitBillWidget({ rawJson, isOwnMessage }) {
  const { user } = useAuth();
  const currentUserId = user?.id || 'me';

  let bill;
  try {
    bill = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
  } catch (e) {
    return <div>{rawJson}</div>;
  }

  const [billData, setBillData] = useState(bill);

  const participants = billData.participants || [
    { id: currentUserId, name: user?.username || 'You', paid: false },
    { id: 'u2', name: 'Rahul', paid: true },
    { id: 'u3', name: 'Aditya', paid: false },
  ];

  const total = billData.amount || 90;
  const perPerson = (total / participants.length).toFixed(2);
  const paidCount = participants.filter((p) => p.paid).length;
  const percent = Math.round((paidCount / participants.length) * 100);

  const togglePaid = (id) => {
    setBillData((prev) => {
      const updated = (prev.participants || participants).map((p) =>
        p.id === id ? { ...p, paid: !p.paid } : p
      );
      return { ...prev, participants: updated };
    });
  };

  return (
    <div
      style={{
        width: '100%',
        minWidth: '260px',
        maxWidth: '340px',
        padding: '12px 14px',
        backgroundColor: isOwnMessage ? 'rgba(0, 0, 0, 0.25)' : 'rgba(26, 34, 51, 0.7)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: '2px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #39D98A, #38D9FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#080B14',
            }}
          >
            <CreditCard size={15} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
              {billData.title || 'Shared Bill'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Total: {billData.currency || '$'}{total} • {billData.currency || '$'}{perPerson}/each
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: percent === 100 ? '#39D98A' : 'var(--accent-cyan)',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            padding: '2px 7px',
            borderRadius: '10px',
          }}
        >
          {percent}% settled
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: 'linear-gradient(90deg, #39D98A, #38D9FF)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Participants */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {participants.map((p) => (
          <div
            key={p.id}
            onClick={() => togglePaid(p.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: p.paid ? 'rgba(57, 217, 138, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${p.paid ? 'rgba(57, 217, 138, 0.35)' : 'rgba(255, 255, 255, 0.06)'}`,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {p.paid ? <CheckCircle2 size={14} color="#39D98A" /> : <Circle size={14} color="var(--text-muted)" />}
              <span style={{ color: p.paid ? '#FFFFFF' : 'var(--text-primary)', fontWeight: p.paid ? '600' : '400' }}>
                {p.name}
              </span>
            </div>
            <span style={{ fontSize: '10.5px', color: p.paid ? '#39D98A' : 'var(--text-secondary)' }}>
              {p.paid ? 'Paid' : 'Tap to mark paid'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 3. DISAPPEARING "VIEW ONCE" MEDIA WIDGET (Phase 5)
// ============================================================
function ViewOnceWidget({ message, isOwnMessage, onImageClick }) {
  const [isOpened, setIsOpened] = useState(false);

  const handleOpen = () => {
    if (isOpened) return;
    setIsOpened(true);
    if (onImageClick && message.media_url) {
      onImageClick(message.media_url);
    }
  };

  return (
    <div
      onClick={handleOpen}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        borderRadius: '20px',
        backgroundColor: isOpened
          ? 'rgba(255, 255, 255, 0.05)'
          : isOwnMessage
          ? 'rgba(255, 255, 255, 0.18)'
          : 'rgba(124, 92, 255, 0.15)',
        border: `1px solid ${isOpened ? 'rgba(255, 255, 255, 0.1)' : 'var(--accent)'}`,
        cursor: isOpened ? 'default' : 'pointer',
        color: isOpened ? 'var(--text-muted)' : isOwnMessage ? '#FFFFFF' : 'var(--accent-cyan)',
        fontSize: '13px',
        fontWeight: '600',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: `1.5px dashed ${isOpened ? 'var(--text-muted)' : 'currentColor'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: '800',
        }}
      >
        1
      </div>
      <span>{isOpened ? 'Opened • Expired' : 'View Once Photo'}</span>
      {isOpened ? <EyeOff size={14} /> : <Eye size={14} />}
    </div>
  );
}

// ============================================================
// 4. POLL WIDGET
// ============================================================
function PollWidget({ rawJson, isOwnMessage }) {
  const { user } = useAuth();
  const currentUserId = user?.id || 'me';

  let initialPoll;
  try {
    initialPoll = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
  } catch (e) {
    return <div>{rawJson}</div>;
  }

  const [poll, setPoll] = useState(initialPoll);

  const totalVotes = poll.options.reduce((acc, opt) => acc + (opt.votes ? opt.votes.length : 0), 0);

  const handleVote = (optionId) => {
    setPoll((prev) => {
      const updatedOptions = prev.options.map((opt) => {
        const votes = opt.votes || [];
        const hasVoted = votes.includes(currentUserId);

        if (opt.id === optionId) {
          return {
            ...opt,
            votes: hasVoted ? votes.filter((id) => id !== currentUserId) : [...votes, currentUserId],
          };
        }

        if (!prev.allowMultiple && hasVoted) {
          return {
            ...opt,
            votes: votes.filter((id) => id !== currentUserId),
          };
        }

        return opt;
      });

      return { ...prev, options: updatedOptions };
    });
  };

  return (
    <div
      style={{
        width: '100%',
        minWidth: '260px',
        maxWidth: '340px',
        padding: '12px 14px',
        backgroundColor: isOwnMessage ? 'rgba(0, 0, 0, 0.22)' : 'rgba(26, 34, 51, 0.7)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginTop: '2px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'var(--aurora-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <BarChart2 size={15} />
        </div>
        <div style={{ fontWeight: '700', fontSize: '14.5px', color: 'var(--text-primary)', lineHeight: '1.3' }}>
          {poll.question}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
        {poll.options.map((opt) => {
          const votesCount = opt.votes ? opt.votes.length : 0;
          const pct = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
          const hasVoted = (opt.votes || []).includes(currentUserId);

          return (
            <div
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              style={{
                position: 'relative',
                borderRadius: '8px',
                padding: '8px 10px',
                border: hasVoted ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                backgroundColor: 'rgba(20, 27, 43, 0.5)',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  backgroundColor: 'rgba(124, 92, 255, 0.2)',
                  transition: 'width 0.3s ease',
                  zIndex: 0,
                }}
              />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {hasVoted ? (
                    <CheckCircle2 size={16} color="var(--accent)" />
                  ) : (
                    <Circle size={16} color="var(--text-secondary)" />
                  )}
                  <span style={{ fontSize: '13.5px', fontWeight: hasVoted ? '600' : '400', color: 'var(--text-primary)' }}>
                    {opt.text}
                  </span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
        <span>{totalVotes} vote{totalVotes === 1 ? '' : 's'}</span>
        {poll.allowMultiple && <span>Multiple choices</span>}
      </div>
    </div>
  );
}

// ============================================================
// 5. FORMATTED TEXT PARSER (Markdown + Code Blocks)
// ============================================================
function FormattedTextInline({ text, isOwnMessage }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, lIdx) => {
        const words = line.split(/(\s+)/);
        return (
          <React.Fragment key={lIdx}>
            {words.map((part, pIdx) => {
              if (/^(https?:\/\/[^\s]+)/.test(part)) {
                return (
                  <a
                    key={pIdx}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: isOwnMessage ? '#38D9FF' : 'var(--accent-cyan)',
                      textDecoration: 'underline',
                      wordBreak: 'break-all',
                    }}
                  >
                    {part}
                  </a>
                );
              }
              if (/^\*([^*]+)\*$/.test(part)) return <strong key={pIdx}>{part.slice(1, -1)}</strong>;
              if (/^_([^_]+)_$/.test(part)) return <em key={pIdx}>{part.slice(1, -1)}</em>;
              if (/^~([^~]+)~$/.test(part)) return <del key={pIdx}>{part.slice(1, -1)}</del>;
              if (/^`([^`]+)`$/.test(part)) {
                return (
                  <code
                    key={pIdx}
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      fontSize: '12.5px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
            {lIdx < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </>
  );
}

function FormattedText({ text, isOwnMessage }) {
  if (!text) return null;

  // Poll payload
  if (text.includes('"isPoll":true') || text.includes('"isPoll": true')) {
    return <PollWidget rawJson={text} isOwnMessage={isOwnMessage} />;
  }

  // Split bill payload
  if (text.includes('"isSplitBill":true') || text.includes('"isSplitBill": true')) {
    return <SplitBillWidget rawJson={text} isOwnMessage={isOwnMessage} />;
  }

  // Code blocks: ```lang ... ```
  if (text.includes('```')) {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return (
      <div style={{ wordBreak: 'break-word' }}>
        {parts.map((segment, sIdx) => {
          if (segment.startsWith('```') && segment.endsWith('```')) {
            const raw = segment.slice(3, -3);
            const firstNewline = raw.indexOf('\n');
            let lang = 'code';
            let codeContent = raw;
            if (firstNewline !== -1) {
              const possibleLang = raw.slice(0, firstNewline).trim();
              if (possibleLang && !possibleLang.includes(' ')) {
                lang = possibleLang;
                codeContent = raw.slice(firstNewline + 1);
              }
            }
            return <CodeBlockWidget key={sIdx} code={codeContent} lang={lang} />;
          }
          return <FormattedTextInline key={sIdx} text={segment} isOwnMessage={isOwnMessage} />;
        })}
      </div>
    );
  }

  return (
    <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: '1.45' }}>
      <FormattedTextInline text={text} isOwnMessage={isOwnMessage} />
    </div>
  );
}

// ============================================================
// MAIN COMPONENT: MessageBubble
// ============================================================
export default function MessageBubble({
  message,
  isOwnMessage,
  isGroupChat,
  isStarred,
  hasDisappearingTimer,
  isGhostMode,
  onReply,
  onForward,
  onDelete,
  onReact,
  onToggleStar,
  onImageClick,
  onEdit,
  onDraftReply,
}) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showDraftTones, setShowDraftTones] = useState(false);
  const [isGhostRevealed, setIsGhostRevealed] = useState(false);
  const [translation, setTranslation] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleSelectDraftTone = (tone) => {
    setShowDraftTones(false);
    const originalText = message.message || message.content || 'your message';
    let draft = '';
    switch (tone) {
      case 'formal':
        draft = `Thank you for the update. I have reviewed "${originalText.slice(0, 30)}..." and will proceed accordingly.`;
        break;
      case 'friendly':
        draft = `Sounds great! Thanks for sharing this 😊 Let's do it!`;
        break;
      case 'concise':
        draft = `Acknowledged. On it. 👍`;
        break;
      case 'witty':
        draft = `Say less! Already one step ahead 🚀✨`;
        break;
      default:
        draft = `Understood, thanks!`;
    }

    if (onDraftReply) {
      onDraftReply(draft);
    }
    if (onReply) {
      onReply(message);
    }
  };

  const timeString = message.created_at
    ? format(new Date(message.created_at), 'h:mm a')
    : '';

  const isAi =
    message.is_ai ||
    message.sender_username === 'Aurora AI' ||
    message.sender_username === '@aurora';

  const isPriority =
    message.is_priority ||
    (typeof message.content === 'string' && message.content.includes('"isPriority":true'));

  const isViewOnce =
    message.is_view_once ||
    (typeof message.content === 'string' && message.content.includes('"isViewOnce":true'));

  // Group reactions by emoji
  const reactionCounts = {};
  (message.reactions || []).forEach((r) => {
    reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1;
  });

  const handleTranslate = () => {
    if (translation) {
      setTranslation(null);
      return;
    }
    setIsTranslating(true);
    setTimeout(() => {
      setIsTranslating(false);
      const text = message.message || message.content || '';
      setTranslation(`"Hello! I am confirming that everything is on track for our release." (Auto-translated to English)`);
    }, 450);
  };

  return (
    <div
      className="bubble-in"
      onMouseEnter={() => {
        setShowToolbar(true);
        if (isGhostMode) setIsGhostRevealed(true);
      }}
      onMouseLeave={() => {
        setShowToolbar(false);
        setShowReactionPicker(false);
        if (isGhostMode) setIsGhostRevealed(false);
      }}
      style={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        marginBottom: '6px',
        padding: '0 16px',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: '68%',
          minWidth: '120px',
          background: isAi
            ? 'linear-gradient(135deg, rgba(124, 92, 255, 0.35), rgba(56, 217, 255, 0.25))'
            : isPriority
            ? 'linear-gradient(135deg, rgba(255, 92, 112, 0.3), rgba(124, 92, 255, 0.35))'
            : isOwnMessage
            ? 'var(--bubble-sent-gradient)'
            : 'var(--bubble-recv)',
          color: isOwnMessage ? '#FFFFFF' : 'var(--text-primary)',
          borderRadius: '16px',
          borderTopRightRadius: isOwnMessage ? '4px' : '16px',
          borderTopLeftRadius: isOwnMessage ? '16px' : '4px',
          padding: '8px 12px 7px 12px',
          boxShadow: isPriority
            ? '0 0 16px rgba(255, 92, 112, 0.45)'
            : isAi
            ? '0 0 16px rgba(124, 92, 255, 0.35)'
            : isOwnMessage
            ? '0 4px 14px rgba(104, 72, 232, 0.25)'
            : '0 2px 8px rgba(0, 0, 0, 0.25)',
          border: isPriority
            ? '1.5px solid #FF5C70'
            : isAi
            ? '1.5px solid var(--accent)'
            : isOwnMessage
            ? 'none'
            : '1px solid rgba(255, 255, 255, 0.06)',
          wordBreak: 'break-word',
          fontSize: '14.2px',
          lineHeight: '1.45',
          filter: isGhostMode && !isGhostRevealed ? 'blur(6px)' : 'none',
          transition: 'filter 0.18s ease',
        }}
      >
        {/* Priority Header */}
        {isPriority && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#FF5C70',
              marginBottom: '4px',
              letterSpacing: '0.4px',
            }}
          >
            <AlertTriangle size={12} />
            <span>URGENT PRIORITY</span>
          </div>
        )}

        {/* AI Copilot Badge */}
        {isAi && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11.5px',
              fontWeight: '700',
              color: 'var(--accent-cyan)',
              marginBottom: '5px',
            }}
          >
            <Sparkles size={13} />
            <span>Aurora AI Copilot</span>
          </div>
        )}

        {/* Forwarded label */}
        {message.is_forwarded && (
          <div
            style={{
              fontSize: '11px',
              color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '4px',
              fontStyle: 'italic',
            }}
          >
            <Forward size={12} style={{ transform: 'scaleX(-1)' }} />
            <span>Forwarded</span>
          </div>
        )}

        {/* Group Sender Name Header */}
        {isGroupChat && !isOwnMessage && !isAi && (
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: '700',
              color: getSenderColor(message.sender_username),
              marginBottom: '4px',
            }}
          >
            {message.sender_username}
          </div>
        )}

        {/* Quoted / Reply Preview */}
        {message.reply_text && (
          <div
            style={{
              backgroundColor: isOwnMessage ? 'rgba(0, 0, 0, 0.22)' : 'rgba(124, 92, 255, 0.08)',
              borderLeft: `3px solid ${isOwnMessage ? '#38D9FF' : 'var(--accent)'}`,
              padding: '4px 8px',
              borderRadius: '6px',
              marginBottom: '6px',
              fontSize: '12px',
              color: isOwnMessage ? 'rgba(255, 255, 255, 0.85)' : 'var(--text-secondary)',
            }}
          >
            <div style={{ fontWeight: '600', color: isOwnMessage ? '#38D9FF' : 'var(--accent)', fontSize: '11.5px' }}>
              {message.reply_sender_username || 'Reply'}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {message.reply_text}
            </div>
          </div>
        )}

        {/* Content Renderers */}
        {message.is_deleted ? (
          <div style={{ fontStyle: 'italic', opacity: 0.65, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Ban size={14} />
            <span>This message was deleted</span>
          </div>
        ) : isViewOnce ? (
          <ViewOnceWidget message={message} isOwnMessage={isOwnMessage} onImageClick={onImageClick} />
        ) : message.message_type === 'image' ? (
          <div>
            <img
              src={message.media_url}
              alt="attachment"
              onClick={() => onImageClick && onImageClick(message.media_url)}
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '8px',
                cursor: 'pointer',
                objectFit: 'cover',
                marginBottom: message.message ? '6px' : '0',
              }}
            />
            {message.message && <FormattedText text={message.message} isOwnMessage={isOwnMessage} />}
          </div>
        ) : message.message_type === 'audio' ? (
          <AudioPlayer src={message.media_url} isOwnMessage={isOwnMessage} />
        ) : message.message_type === 'file' ? (
          <DocumentBubble message={message} isOwnMessage={isOwnMessage} />
        ) : (
          <FormattedText text={message.message || message.content} isOwnMessage={isOwnMessage} />
        )}

        {/* Inline Translation Result (Phase 5) */}
        {translation && (
          <div
            className="fade-in"
            style={{
              marginTop: '6px',
              paddingTop: '6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '12px',
              color: isOwnMessage ? '#E0F2FE' : 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
            }}
          >
            <Languages size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: '600' }}>{translation}</span>
            </div>
          </div>
        )}

        {/* Message Footer: Timestamp, Edited tag, Star, Clock, Read receipts */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '4px',
            fontSize: '11px',
            color: isOwnMessage ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-secondary)',
            marginTop: '3px',
            float: 'right',
            marginLeft: '10px',
          }}
        >
          {message.is_edited && (
            <span style={{ fontSize: '10px', opacity: 0.8, fontStyle: 'italic' }}>edited</span>
          )}
          {isStarred && <Star size={11} fill="#FFB84D" color="#FFB84D" />}
          {hasDisappearingTimer && <Timer size={11} style={{ opacity: 0.8 }} title="Disappearing message" />}
          <span>{timeString}</span>
          {isOwnMessage && !message.is_deleted && (
            <StatusIndicator status={message.status} size={14} />
          )}
        </div>

        {/* Reaction Pill Badge */}
        {Object.keys(reactionCounts).length > 0 && (
          <div
            className="fade-in"
            style={{
              position: 'absolute',
              bottom: '-10px',
              left: isOwnMessage ? 'auto' : '10px',
              right: isOwnMessage ? '10px' : 'auto',
              backgroundColor: 'rgba(13, 18, 32, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(124, 92, 255, 0.35)',
              borderRadius: '14px',
              padding: '2px 7px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11.5px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              zIndex: 3,
            }}
          >
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <span key={emoji} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <span>{emoji}</span>
                {count > 1 && <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{count}</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover Action Toolbar */}
      {showToolbar && !message.is_deleted && (
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            top: '-20px',
            right: isOwnMessage ? 'auto' : '24px',
            left: isOwnMessage ? '24px' : 'auto',
            backgroundColor: 'rgba(13, 18, 32, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '2px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.5)',
            zIndex: 10,
          }}
        >
          {/* Reaction trigger */}
          <button
            type="button"
            className="btn-icon"
            style={{ padding: '4px' }}
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            title="React"
          >
            <Smile size={16} />
          </button>

          {/* AI Reply Drafter */}
          <button
            type="button"
            className="btn-icon"
            style={{ padding: '4px', color: showDraftTones ? 'var(--accent-cyan)' : 'currentColor' }}
            onClick={() => {
              setShowDraftTones(!showDraftTones);
              setShowReactionPicker(false);
            }}
            title="AI Reply Drafter (Formal, Friendly, Concise, Witty)"
          >
            <Sparkles size={16} color="#38D9FF" />
          </button>

          {/* Inline Translation */}
          <button
            type="button"
            className="btn-icon"
            style={{ padding: '4px', color: translation ? 'var(--accent-cyan)' : 'currentColor' }}
            onClick={handleTranslate}
            title={translation ? 'Hide translation' : 'Translate message'}
          >
            <Languages size={16} />
          </button>

          {/* Star message */}
          <button
            type="button"
            className="btn-icon"
            style={{ padding: '4px' }}
            onClick={() => onToggleStar(message)}
            title={isStarred ? 'Unstar' : 'Star'}
          >
            <Star size={16} fill={isStarred ? '#FFB84D' : 'none'} color={isStarred ? '#FFB84D' : 'currentColor'} />
          </button>

          {/* Edit (if own message) */}
          {isOwnMessage && onEdit && (
            <button
              type="button"
              className="btn-icon"
              style={{ padding: '4px' }}
              onClick={() => onEdit(message)}
              title="Edit message"
            >
              <Edit3 size={15} />
            </button>
          )}

          {/* Reply */}
          <button
            type="button"
            className="btn-icon"
            style={{ padding: '4px' }}
            onClick={() => onReply(message)}
            title="Reply"
          >
            <CornerUpLeft size={16} />
          </button>

          {/* Forward */}
          <button
            type="button"
            className="btn-icon"
            style={{ padding: '4px' }}
            onClick={() => onForward(message)}
            title="Forward"
          >
            <Forward size={16} />
          </button>

          {/* Delete for everyone (if own message) */}
          {isOwnMessage && (
            <button
              type="button"
              className="btn-icon"
              style={{ padding: '4px', color: 'var(--danger)' }}
              onClick={() => onDelete(message)}
              title="Delete for everyone"
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Quick reactions palette */}
          {showReactionPicker && (
            <div
              className="fade-in"
              style={{
                position: 'absolute',
                bottom: '34px',
                left: 0,
                backgroundColor: 'rgba(13, 18, 32, 0.96)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(124, 92, 255, 0.35)',
                borderRadius: '24px',
                padding: '4px 10px',
                display: 'flex',
                gap: '8px',
                boxShadow: '0 8px 28px rgba(0, 0, 0, 0.6)',
              }}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(message, emoji);
                    setShowReactionPicker(false);
                  }}
                  style={{
                    background: 'transparent',
                    fontSize: '19px',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    transition: 'transform 0.12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* AI Draft Tones Palette */}
          {showDraftTones && (
            <div
              className="fade-in"
              style={{
                position: 'absolute',
                bottom: '34px',
                left: isOwnMessage ? 'auto' : '0',
                right: isOwnMessage ? '0' : 'auto',
                backgroundColor: 'rgba(13, 18, 32, 0.96)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(56, 217, 255, 0.35)',
                borderRadius: '24px',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 8px 28px rgba(0, 0, 0, 0.6)',
                zIndex: 20,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-cyan)', paddingRight: '2px' }}>
                ✨ Draft:
              </span>
              {[
                { id: 'formal', label: '💼 Formal' },
                { id: 'friendly', label: '🤝 Friendly' },
                { id: 'concise', label: '⚡ Concise' },
                { id: 'witty', label: '😄 Witty' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectDraftTone(t.id)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '3px 8px',
                    fontSize: '11.5px',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(56, 217, 255, 0.2)';
                    e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
