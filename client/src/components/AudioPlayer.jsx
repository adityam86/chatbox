import React, { useState, useRef } from 'react';
import { Play, Pause, Mic, Sparkles, X, Check } from 'lucide-react';

export default function AudioPlayer({ src, isOwnMessage }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSummary, setShowSummary] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryText, setSummaryText] = useState(null);

  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.error(e));
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 1;
    setCurrentTime(cur);
    setProgress((cur / dur) * 100);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(pos * 100);
  };

  const toggleSpeed = () => {
    const nextSpeed = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleToggleSummary = () => {
    if (!showSummary && !summaryText) {
      setIsSummarizing(true);
      setTimeout(() => {
        setIsSummarizing(false);
        setSummaryText('Quick voice note: Confirming the sprint review meeting today at 4 PM, please review the designs.');
        setShowSummary(true);
      }, 700);
    } else {
      setShowSummary(!showSummary);
    }
  };

  const formatTime = (sec) => {
    if (isNaN(sec)) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '240px' }}>
      {/* AI Voice Note Summary Pill (Phase 5) */}
      {showSummary && summaryText && (
        <div
          className="fade-in"
          style={{
            backgroundColor: isOwnMessage ? 'rgba(0, 0, 0, 0.28)' : 'rgba(124, 92, 255, 0.12)',
            border: `1px solid ${isOwnMessage ? 'rgba(255, 255, 255, 0.25)' : 'rgba(124, 92, 255, 0.35)'}`,
            borderRadius: '10px',
            padding: '7px 10px',
            fontSize: '11.5px',
            color: isOwnMessage ? '#F5F7FF' : 'var(--text-primary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            lineHeight: '1.4',
          }}
        >
          <Sparkles size={13} style={{ color: 'var(--accent-cyan)', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: '700', color: 'var(--accent-cyan)', marginRight: '4px' }}>AI Summary:</span>
            <span>{summaryText}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSummary(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0 2px' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 2px',
        }}
      >
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />

        {/* Play / Pause button */}
        <button
          type="button"
          onClick={togglePlay}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: isOwnMessage ? 'rgba(255, 255, 255, 0.22)' : 'rgba(124, 92, 255, 0.15)',
            color: isOwnMessage ? '#FFFFFF' : 'var(--accent)',
            border: isOwnMessage ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(124, 92, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {isPlaying ? <Pause size={17} /> : <Play size={17} style={{ marginLeft: '2px' }} />}
        </button>

        {/* Waveform track */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            onClick={handleSeek}
            style={{
              height: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {/* Simulated waveform bars */}
            {[12, 18, 8, 14, 20, 10, 16, 22, 14, 8, 18, 12, 16, 20, 10, 14, 18, 12].map((height, i) => {
              const barProgress = (i / 18) * 100;
              const isFilled = barProgress <= progress;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${height}px`,
                    backgroundColor: isFilled
                      ? (isOwnMessage ? '#FFFFFF' : 'var(--accent)')
                      : 'rgba(255, 255, 255, 0.25)',
                    borderRadius: '2px',
                    transition: 'background-color 0.1s',
                  }}
                />
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: isOwnMessage ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)' }}>
            <span>{formatTime(isPlaying ? currentTime : duration)}</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* 1-Click AI Summarizer Button */}
              <button
                type="button"
                onClick={handleToggleSummary}
                disabled={isSummarizing}
                title="Summarize with AI"
                style={{
                  background: isOwnMessage ? 'rgba(255, 255, 255, 0.2)' : 'rgba(124, 92, 255, 0.15)',
                  border: '1px solid rgba(124, 92, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '1px 7px',
                  color: isOwnMessage ? '#FFFFFF' : 'var(--accent-cyan)',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontWeight: '600',
                }}
              >
                <Sparkles size={11} />
                <span>{isSummarizing ? 'Analyzing...' : showSummary ? 'Hide summary' : 'AI Summary'}</span>
              </button>

              <button
                type="button"
                onClick={toggleSpeed}
                style={{
                  background: 'transparent',
                  color: isOwnMessage ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                {playbackRate}x
              </button>
            </div>
          </div>
        </div>

        <Mic size={16} style={{ color: isOwnMessage ? '#FFFFFF' : 'var(--accent)', flexShrink: 0 }} />
      </div>
    </div>
  );
}
