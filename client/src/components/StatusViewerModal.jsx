import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SLIDE_DURATION = 5000; // 5 seconds per slide

export default function StatusViewerModal({ statusGroup, isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const statuses = statusGroup?.statuses || [];
  const currentStatus = statuses[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
  }, [statusGroup]);

  useEffect(() => {
    if (!isOpen || statuses.length === 0 || isPaused) return;

    const interval = 50; // update every 50ms
    const step = (interval / SLIDE_DURATION) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Go to next slide
          if (currentIndex < statuses.length - 1) {
            setCurrentIndex((idx) => idx + 1);
            return 0;
          } else {
            // Reached end of status
            clearInterval(timerRef.current);
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [isOpen, currentIndex, statuses.length, isPaused, onClose]);

  if (!isOpen || !currentStatus) return null;

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
      setProgress(0);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const timeAgo = currentStatus.created_at
    ? formatDistanceToNow(new Date(currentStatus.created_at), { addSuffix: true })
    : '';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0c1317',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          maxHeight: '820px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: currentStatus.background_color || '#000',
          boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
          overflow: 'hidden',
        }}
      >
        {/* Segmented Progress Bars at Top */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            gap: '4px',
            zIndex: 20,
          }}
        >
          {statuses.map((_, i) => {
            let fillPercent = 0;
            if (i < currentIndex) fillPercent = 100;
            else if (i === currentIndex) fillPercent = progress;

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '3px',
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${fillPercent}%`,
                    height: '100%',
                    backgroundColor: '#fff',
                    transition: i === currentIndex ? 'width 0.05s linear' : 'none',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '16px',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={statusGroup.user?.profile_image || `https://ui-avatars.com/api/?name=${statusGroup.user?.username}&background=7C5CFF&color=fff`}
              alt={statusGroup.user?.username}
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: '#fff' }}>
                {statusGroup.user?.username}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                {timeAgo}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{ color: '#fff', backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Content View */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            position: 'relative',
          }}
        >
          {currentStatus.media_url ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={currentStatus.media_url}
                alt="Status"
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              />
              {currentStatus.text && (
                <div
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    marginTop: '12px',
                    fontSize: '15px',
                    textAlign: 'center',
                  }}
                >
                  {currentStatus.text}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                color: '#fff',
                fontSize: '28px',
                fontWeight: '600',
                textAlign: 'center',
                lineHeight: '38px',
                wordBreak: 'break-word',
              }}
            >
              {currentStatus.text}
            </div>
          )}

          {/* Navigation Click Zones */}
          <div
            onClick={handlePrev}
            style={{
              position: 'absolute',
              top: '60px',
              left: 0,
              width: '35%',
              bottom: 0,
              cursor: 'pointer',
            }}
          />
          <div
            onClick={handleNext}
            style={{
              position: 'absolute',
              top: '60px',
              right: 0,
              width: '35%',
              bottom: 0,
              cursor: 'pointer',
            }}
          />
        </div>
      </div>
    </div>
  );
}
