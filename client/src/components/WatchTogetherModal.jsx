import React, { useState } from 'react';
import { X, Play, Pause, Tv, Link2, Users, RefreshCw } from 'lucide-react';

function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function WatchTogetherModal({
  isOpen,
  onClose,
  initialUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  chatTitle = 'Chat',
}) {
  const [url, setUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSynced, setIsSynced] = useState(true);

  if (!isOpen) return null;

  const ytId = getYouTubeId(url);

  const handleLoadUrl = (e) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setUrl(inputUrl.trim());
      setInputUrl('');
      setIsSynced(true);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    setIsSynced(true);
  };

  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 99999,
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
          backgroundColor: '#0D1220',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#080B14',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--aurora-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Tv size={17} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#fff' }}>
                Watch Together
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Synchronized video playback with {chatTitle}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                fontWeight: '600',
                color: '#39D98A',
                backgroundColor: 'rgba(57, 217, 138, 0.12)',
                border: '1px solid rgba(57, 217, 138, 0.3)',
                padding: '3px 9px',
                borderRadius: '12px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#39D98A' }} />
              <span>Real-Time Sync</span>
            </div>

            <button type="button" className="btn-icon" onClick={onClose} style={{ padding: '6px' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '440px',
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {ytId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&enablejsapi=1`}
              title="Watch Together Video Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
          ) : (
            <video
              src={url}
              autoPlay
              controls
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </div>

        {/* Controls & URL Loader Bar */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#080B14',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <form
            onSubmit={handleLoadUrl}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '4px 10px',
              gap: '8px',
            }}
          >
            <Link2 size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Paste YouTube or video URL to watch together..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '8px' }}
            >
              Play
            </button>
          </form>

          <button
            type="button"
            onClick={togglePlay}
            className="btn-icon"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={isPlaying ? 'Pause for everyone' : 'Play for everyone'}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
          </button>
        </div>
      </div>
    </div>
  );
}
