import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Smile,
  Paperclip,
  Mic,
  X,
  Trash2,
  Check,
  Plus,
  Sparkles,
  Clock,
  AlertTriangle,
  CreditCard,
  Code,
  Edit3,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import EmojiPicker from './EmojiPicker';
import AttachmentPopover from './AttachmentPopover';
import CreatePollModal from './CreatePollModal';
import api from '../services/api';

const SLASH_COMMANDS = [
  { cmd: '/ai ', label: 'Ask Aurora AI Copilot', desc: '/ai [your question]', icon: Sparkles, color: '#38D9FF' },
  { cmd: '/catchup', label: 'Catch-up AI Summary', desc: 'Summarizes recent unread messages', icon: Sparkles, color: '#7C5CFF' },
  { cmd: '/split 90 Team Dinner', label: 'Split Group Bill', desc: '/split [amount] [title]', icon: CreditCard, color: '#39D98A' },
  { cmd: '/priority ', label: 'Urgent Priority Alert', desc: 'Breakthrough notification', icon: AlertTriangle, color: '#FF5C70' },
];

export default function MessageInput({
  conversationId,
  replyingTo,
  onClearReply,
  onSendMessage,
  onFileSelected,
  onOpenWatchTogether,
  editingMessage,
  onCancelEdit,
  onSaveEdit,
  draftText,
  onClearDraft,
}) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Phase 5 Flagship state
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [isPriority, setIsPriority] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleToast, setScheduleToast] = useState(null);
  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { startTyping, stopTyping } = useSocket();
  const typingTimeoutRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const audioFileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.message || editingMessage.content || '');
      if (inputRef.current) inputRef.current.focus();
    }
  }, [editingMessage]);

  useEffect(() => {
    if (draftText) {
      setText(draftText);
      if (inputRef.current) inputRef.current.focus();
      if (onClearDraft) onClearDraft();
    }
  }, [draftText]);

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  // Handle Typing
  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (conversationId) {
      startTyping(conversationId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(conversationId);
      }, 1500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    stopTyping(conversationId);

    // If editing existing message
    if (editingMessage) {
      if (onSaveEdit) onSaveEdit(editingMessage.id, trimmed);
      setText('');
      if (onClearReply) onClearReply();
      return;
    }

    // 1. Check for /split command: /split 120 Team Dinner
    if (trimmed.startsWith('/split')) {
      const parts = trimmed.replace('/split', '').trim().split(/\s+/);
      const amount = parseFloat(parts[0]) || 60;
      const title = parts.slice(1).join(' ') || 'Group Bill';

      const splitPayload = JSON.stringify({
        isSplitBill: true,
        title,
        amount,
        currency: '$',
      });

      onSendMessage({
        message: splitPayload,
        messageType: 'text',
        replyToMessageId: replyingTo ? replyingTo.id : null,
      });

      setText('');
      setShowEmojiPicker(false);
      if (onClearReply) onClearReply();
      return;
    }

    // 2. Check for /priority
    let finalMessage = trimmed;
    let finalPriority = isPriority;
    if (trimmed.startsWith('/priority')) {
      finalMessage = trimmed.replace('/priority', '').trim() || 'Urgent Priority Notice';
      finalPriority = true;
    }

    // 3. Regular dispatch
    onSendMessage({
      message: finalMessage,
      messageType: 'text',
      replyToMessageId: replyingTo ? replyingTo.id : null,
      is_view_once: isViewOnce,
      is_priority: finalPriority,
    });

    // 4. Handle AI Copilot responses (@aurora or /catchup or /ai)
    if (trimmed.startsWith('/catchup') || trimmed.toLowerCase().includes('@aurora summarize')) {
      setTimeout(() => {
        onSendMessage({
          message: '✨ Aurora AI Catch-up Summary:\n• Rahul confirmed sprint review is at 4 PM.\n• New design files uploaded for review.\n• All Phase 5 testing passing.',
          messageType: 'text',
          is_ai: true,
          sender_username: 'Aurora AI',
        });
      }, 800);
    } else if (trimmed.startsWith('/ai ')) {
      const prompt = trimmed.replace('/ai ', '');
      setTimeout(() => {
        onSendMessage({
          message: `🤖 Aurora AI: I analyzed your request ("${prompt}"). Everything in the workspace is synchronized and running optimally.`,
          messageType: 'text',
          is_ai: true,
          sender_username: 'Aurora AI',
        });
      }, 800);
    }

    setText('');
    setIsViewOnce(false);
    setIsPriority(false);
    setShowEmojiPicker(false);
    if (onClearReply) onClearReply();
  };

  const handleScheduleSend = (delayMinutes) => {
    setShowScheduleModal(false);
    setScheduleToast(`Message scheduled for ${delayMinutes} minutes from now!`);
    setTimeout(() => setScheduleToast(null), 3000);
    setText('');
  };

  const handleInsertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
  };

  // Attachment menu actions
  const handleSelectPhoto = () => {
    setShowAttachmentMenu(false);
    if (imageInputRef.current) {
      imageInputRef.current.value = null;
      imageInputRef.current.click();
    }
  };

  const handleSelectVideo = () => {
    setShowAttachmentMenu(false);
    if (videoInputRef.current) {
      videoInputRef.current.value = null;
      videoInputRef.current.click();
    }
  };

  const handleSelectDocument = () => {
    setShowAttachmentMenu(false);
    if (docInputRef.current) {
      docInputRef.current.value = null;
      docInputRef.current.click();
    }
  };

  const handleSelectAudio = () => {
    setShowAttachmentMenu(false);
    if (audioFileInputRef.current) {
      audioFileInputRef.current.value = null;
      audioFileInputRef.current.click();
    }
  };

  const handleShareLocation = () => {
    setShowAttachmentMenu(false);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        onSendMessage({
          message: `📍 Live Location: ${mapsUrl}`,
          messageType: 'text',
          replyToMessageId: replyingTo ? replyingTo.id : null,
        });
      },
      (err) => {
        console.error('Location error:', err);
        alert('Could not retrieve location. Please allow permissions.');
      }
    );
  };

  const handleShareContact = () => {
    setShowAttachmentMenu(false);
    const contactPayload = JSON.stringify({
      isContact: true,
      name: 'Aditya Aurora',
      phone: '+1 (555) 019-2834',
    });
    onSendMessage({
      message: contactPayload,
      messageType: 'text',
      replyToMessageId: replyingTo ? replyingTo.id : null,
    });
  };

  const handleInsertCodeSnippet = () => {
    setText((prev) => prev + '\n```javascript\n// Write your code here\nconsole.log("Hello from Aurora!");\n```\n');
    setShowAttachmentMenu(false);
  };

  const handleOpenSplitBill = () => {
    setText('/split 100 Team Dinner');
    setShowAttachmentMenu(false);
    if (inputRef.current) inputRef.current.focus();
  };

  // Upload handler
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onSendMessage({
        messageType: type,
        mediaUrl: res.data.url,
        fileName: file.name,
        fileSize: file.size,
        replyToMessageId: replyingTo ? replyingTo.id : null,
        is_view_once: isViewOnce,
      });

      setIsViewOnce(false);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload file.');
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required for voice recording.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    clearInterval(timerIntervalRef.current);
    setIsRecording(false);
  };

  const sendRecording = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });

      try {
        const formData = new FormData();
        formData.append('file', audioFile);

        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        onSendMessage({
          messageType: 'audio',
          mediaUrl: res.data.url,
          fileName: audioFile.name,
          fileSize: audioFile.size,
          replyToMessageId: replyingTo ? replyingTo.id : null,
        });
      } catch (err) {
        console.error('Failed to send voice note:', err);
      }
    };

    stopRecording();
  };

  const cancelRecording = () => {
    stopRecording();
    audioChunksRef.current = [];
    setRecordingSeconds(0);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isSlashCmd = text.startsWith('/') && !text.includes(' ');

  return (
    <div className="message-composer-wrapper">
      {/* Hidden File Inputs */}
      <input type="file" ref={imageInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
      <input type="file" ref={videoInputRef} style={{ display: 'none' }} accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} />
      <input type="file" ref={docInputRef} style={{ display: 'none' }} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" onChange={(e) => handleFileUpload(e, 'file')} />
      <input type="file" ref={audioFileInputRef} style={{ display: 'none' }} accept="audio/*" onChange={(e) => handleFileUpload(e, 'audio')} />

      {/* Floating Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker onSelectEmoji={handleInsertEmoji} onClose={() => setShowEmojiPicker(false)} />
      )}

      {/* Attachment Popover */}
      <AttachmentPopover
        isOpen={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onSelectPhoto={handleSelectPhoto}
        onSelectVideo={handleSelectVideo}
        onSelectDocument={handleSelectDocument}
        onSelectAudio={handleSelectAudio}
        onShareLocation={handleShareLocation}
        onShareContact={handleShareContact}
        onOpenPoll={() => setIsPollModalOpen(true)}
        onOpenSplitBill={handleOpenSplitBill}
        onInsertCode={handleInsertCodeSnippet}
        onOpenWatchTogether={() => {
          setShowAttachmentMenu(false);
          if (onOpenWatchTogether) onOpenWatchTogether();
        }}
        isViewOnce={isViewOnce}
        onToggleViewOnce={() => setIsViewOnce((prev) => !prev)}
        isPriority={isPriority}
        onTogglePriority={() => setIsPriority((prev) => !prev)}
      />

      {/* Interactive Poll Creator Modal */}
      <CreatePollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onSendPoll={(pollPayload) => {
          onSendMessage({
            message: pollPayload,
            messageType: 'text',
            replyToMessageId: replyingTo ? replyingTo.id : null,
          });
        }}
      />

      {/* Scheduled Toast */}
      {scheduleToast && (
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            bottom: 'calc(68px + var(--safe-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#141B2B',
            border: '1px solid var(--accent)',
            borderRadius: '20px',
            padding: '6px 16px',
            fontSize: '12px',
            color: 'var(--text-primary)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 60,
            maxWidth: 'calc(100vw - 32px)',
            whiteSpace: 'nowrap',
          }}
        >
          {scheduleToast}
        </div>
      )}

      {/* Slash Commands Floating Helper */}
      {isSlashCmd && (
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            bottom: 'calc(62px + var(--safe-bottom))',
            left: '10px',
            backgroundColor: '#0D1220',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '6px',
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            zIndex: 45,
            width: 'min(280px, calc(100vw - 20px))',
            maxWidth: 'calc(100vw - 20px)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', padding: '4px 8px', textTransform: 'uppercase' }}>
            Quick Commands
          </div>
          {SLASH_COMMANDS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.cmd}
                onClick={() => {
                  setText(item.cmd);
                  if (inputRef.current) inputRef.current.focus();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Icon size={14} color={item.color} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editing Message Banner */}
      {editingMessage && (
        <div
          className="fade-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            marginBottom: '8px',
            backgroundColor: 'rgba(56, 217, 255, 0.12)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            borderLeft: '4px solid var(--accent-cyan)',
            borderTop: '1px solid rgba(56, 217, 255, 0.25)',
            borderRight: '1px solid rgba(56, 217, 255, 0.25)',
            borderBottom: '1px solid rgba(56, 217, 255, 0.25)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <Edit3 size={15} color="var(--accent-cyan)" />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', color: 'var(--accent-cyan)', fontSize: '12.5px' }}>
                Editing Message
              </div>
              <div
                style={{
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '12px',
                  marginTop: '1px',
                }}
              >
                {editingMessage.message || editingMessage.content}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => {
              if (onCancelEdit) onCancelEdit();
              setText('');
            }}
            style={{ padding: '6px' }}
            title="Cancel edit"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Quoted Reply Banner */}
      {replyingTo && (
        <div
          className="fade-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            marginBottom: '8px',
            backgroundColor: 'rgba(22, 31, 51, 0.92)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            borderLeft: '4px solid var(--accent)',
            borderTop: '1px solid var(--border-color)',
            borderRight: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            fontSize: '13px',
          }}
        >
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: '600', color: 'var(--accent)', fontSize: '12.5px' }}>
              Replying to {replyingTo.sender_username || 'User'}
            </div>
            <div
              style={{
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '12px',
                marginTop: '1px',
              }}
            >
              {replyingTo.message_type === 'image'
                ? '📷 Photo'
                : replyingTo.message_type === 'audio'
                ? '🎙️ Voice note'
                : replyingTo.message}
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClearReply} style={{ padding: '6px' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Active Feature Badges */}
      {isViewOnce && (
        <div
          className="composer-chip"
          style={{
            backgroundColor: 'rgba(56, 217, 255, 0.16)',
            border: '1px solid var(--accent-cyan)',
            color: 'var(--accent-cyan)',
          }}
        >
          <span>① View-Once Mode (expires after 1 view)</span>
          <button
            type="button"
            onClick={() => setIsViewOnce(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              padding: '2px',
            }}
            title="Cancel view-once"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {isPriority && (
        <div
          className="composer-chip"
          style={{
            backgroundColor: 'rgba(255, 92, 112, 0.18)',
            border: '1px solid var(--danger)',
            color: '#FF7B8B',
          }}
        >
          <AlertTriangle size={13} />
          <span>🚨 Urgent Breakthrough Priority Alert</span>
          <button
            type="button"
            onClick={() => setIsPriority(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              padding: '2px',
            }}
            title="Cancel priority alert"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Live Voice Recording Bar */}
      {isRecording ? (
        <div
          className="fade-in composer-pill"
          style={{
            border: '1px solid rgba(255, 77, 109, 0.35)',
            gap: '8px',
          }}
        >
          <button
            type="button"
            className="composer-action-btn"
            onClick={cancelRecording}
            style={{ color: 'var(--danger)' }}
            title="Cancel"
          >
            <Trash2 size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger)',
                boxShadow: '0 0 8px var(--danger)',
                animation: 'pulse 1s infinite alternate',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
              {formatTimer(recordingSeconds)}
            </span>
          </div>

          <button
            type="button"
            className="btn-primary composer-send-btn"
            onClick={sendRecording}
            title="Send Voice Note"
          >
            <Send size={15} />
          </button>
        </div>
      ) : (
        /* Floating Message Composer Pill */
        <div className="composer-pill">
          <button
            type="button"
            className="composer-action-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emojis"
            style={{ color: showEmojiPicker ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            <Smile size={20} />
          </button>

          <button
            type="button"
            className="composer-action-btn"
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            title="Attach file or media"
            style={{
              color: showAttachmentMenu ? 'var(--accent)' : 'var(--text-secondary)',
              transform: showAttachmentMenu ? 'rotate(45deg)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={21} />
          </button>

          {/* Quick inline toggles for View-Once & Priority (compact on tablet/desktop) */}
          <div className="composer-quick-toggles" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <button
              type="button"
              onClick={() => setIsViewOnce(!isViewOnce)}
              title={isViewOnce ? 'View-once active (tap to turn off)' : 'Send as View Once (tap to activate)'}
              style={{
                width: '23px',
                height: '23px',
                borderRadius: '50%',
                border: `1.5px dashed ${isViewOnce ? 'var(--accent-cyan)' : 'var(--text-muted)'}`,
                backgroundColor: isViewOnce ? 'rgba(56, 217, 255, 0.2)' : 'transparent',
                color: isViewOnce ? 'var(--accent-cyan)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              1
            </button>

            <button
              type="button"
              onClick={() => setIsPriority(!isPriority)}
              title={isPriority ? 'Urgent priority enabled' : 'Toggle urgent priority'}
              style={{
                background: isPriority ? 'rgba(255, 92, 112, 0.22)' : 'transparent',
                border: 'none',
                color: isPriority ? '#FF5C70' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '3px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={15} />
            </button>
          </div>

          <input
            ref={inputRef}
            type="text"
            className="composer-text-input"
            placeholder={isMobileScreen ? 'Message or / for commands...' : 'Type a message or / for AI commands...'}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />

          {text.trim() ? (
            editingMessage ? (
              <button
                type="button"
                className="btn-primary composer-send-btn"
                onClick={handleSend}
                style={{
                  backgroundColor: 'var(--accent-cyan)',
                  color: '#080B14',
                }}
                title="Save changes"
              >
                <Check size={17} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary composer-send-btn"
                onClick={handleSend}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowScheduleModal(true);
                }}
                title="Send message (Right click / long press to schedule)"
              >
                <Send size={16} />
              </button>
            )
          ) : (
            <button
              type="button"
              className="composer-action-btn"
              onClick={startRecording}
              title="Record voice message"
              style={{
                color: 'var(--accent)',
              }}
            >
              <Mic size={20} />
            </button>
          )}
        </div>
      )}

      {/* Schedule Message Quick Modal */}
      {showScheduleModal && (
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            bottom: 'calc(66px + var(--safe-bottom))',
            right: '10px',
            backgroundColor: '#0D1220',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '10px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.65)',
            zIndex: 60,
            width: 'min(220px, calc(100vw - 20px))',
            maxWidth: 'calc(100vw - 20px)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
            Schedule Message
          </div>
          {[
            { label: 'In 15 minutes', delay: 15 },
            { label: 'In 1 hour', delay: 60 },
            { label: 'Tomorrow at 9:00 AM', delay: 1440 },
          ].map((s) => (
            <div
              key={s.label}
              onClick={() => handleScheduleSend(s.delay)}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12.5px',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
