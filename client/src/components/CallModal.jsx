import React, { useEffect, useRef, useState } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  ScreenShare,
  ScreenShareOff,
  PenTool,
  RotateCcw,
  X,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  { urls: 'stun:stun.services.mozilla.com' },
];

export default function CallModal({
  callType, // 'video' | 'audio'
  isCaller,
  targetUser,
  initialSignal,
  onEndCall,
}) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(callType === 'audio');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState(isCaller ? 'Ringing...' : 'Connecting...');
  const [callSeconds, setCallSeconds] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Whiteboard State (Phase 5)
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [brushColor, setBrushColor] = useState('#38D9FF');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);

  useEffect(() => {
    let isCancelled = false;

    async function initWebRTC() {
      try {
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: callType === 'video' ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          } : false,
        };

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (mediaErr) {
          console.warn('Initial getUserMedia failed, attempting audio fallback:', mediaErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setVideoOff(true);
          }
        }

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        const pc = new RTCPeerConnection({
          iceServers: ICE_SERVERS,
          iceCandidatePoolSize: 10,
        });
        peerConnectionRef.current = pc;

        // Monitor ICE connection state
        pc.oniceconnectionstatechange = () => {
          console.log('📶 WebRTC ICE Connection State:', pc.iceConnectionState);
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            setCallStatus('Connected');
          } else if (pc.iceConnectionState === 'failed') {
            console.warn('ICE Connection failed, restarting ICE...');
            if (pc.restartIce) pc.restartIce();
          } else if (pc.iceConnectionState === 'disconnected') {
            setCallStatus('Reconnecting...');
          }
        };

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Remote track received
        pc.ontrack = (event) => {
          console.log('📡 Remote media track received:', event.track.kind);
          const remoteStream = event.streams[0] || new MediaStream([event.track]);

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch((err) => {
              console.warn('Remote video autoplay blocked:', err);
              setAutoplayBlocked(true);
            });
          }

          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch((err) => {
              console.warn('Remote audio autoplay blocked:', err);
              setAutoplayBlocked(true);
            });
          }

          setCallStatus('Connected');
          if (!timerIntervalRef.current) {
            timerIntervalRef.current = setInterval(() => {
              setCallSeconds((prev) => prev + 1);
            }, 1000);
          }
        };

        // ICE candidate handler
        pc.onicecandidate = (event) => {
          if (event.candidate && targetUser?.id) {
            socket.emit('call:signal', {
              targetUserId: targetUser.id,
              signal: { type: 'candidate', candidate: event.candidate },
            });
          }
        };

        if (isCaller) {
          // Caller creates Offer
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: callType === 'video',
          });
          await pc.setLocalDescription(offer);

          socket.emit(
            'call:initiate',
            {
              targetUserId: targetUser.id,
              callType,
              callerId: socket.id,
              callerUserId: user?.id,
              callerName: user?.username || 'User',
              callerAvatar: user?.profile_image || null,
              signal: offer,
            },
            (res) => {
              if (res && res.error) {
                setCallStatus(res.error);
                setTimeout(onEndCall, 2500);
              }
            }
          );
        } else if (initialSignal) {
          // Receiver receives Offer and sends Answer
          await pc.setRemoteDescription(new RTCSessionDescription(initialSignal));

          // Flush queued candidates
          while (iceCandidatesQueueRef.current.length > 0) {
            const cand = iceCandidatesQueueRef.current.shift();
            await pc.addIceCandidate(cand).catch((e) => console.warn('Queued candidate error:', e));
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('call:signal', {
            targetUserId: targetUser.id,
            signal: answer,
          });
          setCallStatus('Connected');

          if (!timerIntervalRef.current) {
            timerIntervalRef.current = setInterval(() => {
              setCallSeconds((prev) => prev + 1);
            }, 1000);
          }
        }
      } catch (err) {
        console.error('Failed to get user media for call:', err);
        setCallStatus('Media access denied');
        setTimeout(onEndCall, 2500);
      }
    }

    initWebRTC();

    // Listen for incoming signals (answer, offer, candidates)
    const handleSignal = async (data) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        const signal = data.signal;
        if (!signal) return;

        if (signal.type === 'answer') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            setCallStatus('Connected');

            while (iceCandidatesQueueRef.current.length > 0) {
              const cand = iceCandidatesQueueRef.current.shift();
              await pc.addIceCandidate(cand).catch((e) => console.warn('Candidate error:', e));
            }
          }
        } else if (signal.type === 'offer') {
          if (pc.signalingState === 'stable' || pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));

            while (iceCandidatesQueueRef.current.length > 0) {
              const cand = iceCandidatesQueueRef.current.shift();
              await pc.addIceCandidate(cand).catch((e) => console.warn('Candidate error:', e));
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('call:signal', {
              targetUserId: targetUser.id,
              signal: answer,
            });
            setCallStatus('Connected');
          }
        } else if (signal.candidate) {
          const candidate = new RTCIceCandidate(signal.candidate);
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(candidate).catch((e) => console.warn('addIceCandidate error:', e));
          } else {
            // Queue candidate until remote description is set
            iceCandidatesQueueRef.current.push(candidate);
          }
        }
      } catch (e) {
        console.error('Error handling WebRTC signal:', e);
      }
    };

    const handleCallEnded = () => {
      cleanupMedia();
      onEndCall();
    };

    socket.on('call:signal', handleSignal);
    socket.on('call:accepted', handleSignal);
    socket.on('call:ended', handleCallEnded);

    return () => {
      isCancelled = true;
      socket.off('call:signal', handleSignal);
      socket.off('call:accepted', handleSignal);
      socket.off('call:ended', handleCallEnded);
      cleanupMedia();
    };
  }, []);

  const cleanupMedia = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');

        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare(videoSender);
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    } else {
      const senders = pc.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      stopScreenShare(videoSender);
    }
  };

  const stopScreenShare = async (videoSender) => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      const originalVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoSender && originalVideoTrack) {
        await videoSender.replaceTrack(originalVideoTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }

    setIsScreenSharing(false);
  };

  const handleEndCallClick = () => {
    if (targetUser) {
      socket.emit('call:end', { targetUserId: targetUser.id });
    }
    cleanupMedia();
    onEndCall();
  };

  // Whiteboard drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
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
        backgroundColor: '#080B14',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(13, 18, 32, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src={targetUser?.profile_image || `https://ui-avatars.com/api/?name=${targetUser?.username || 'User'}&background=7C5CFF&color=fff`}
            alt={targetUser?.username}
            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontWeight: '600', fontSize: '16px', color: '#fff' }}>
              {targetUser?.username || 'User'}
            </div>
            <div style={{ fontSize: '12px', color: callStatus === 'Connected' ? 'var(--online)' : 'var(--text-secondary)' }}>
              {callStatus === 'Connected' ? formatTimer(callSeconds) : callStatus}
            </div>
          </div>
        </div>
      </div>

      {/* Video Feeds Area */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: '#0A0E1A',
        }}
      >
        {/* Dedicated Remote Audio Player (active for both voice and video calls) */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
        />

        {/* Browser Autoplay Unmute Action Pill */}
        {autoplayBlocked && (
          <button
            type="button"
            onClick={() => {
              if (remoteAudioRef.current) remoteAudioRef.current.play().catch(() => {});
              if (remoteVideoRef.current) remoteVideoRef.current.play().catch(() => {});
              setAutoplayBlocked(false);
            }}
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--accent)',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '24px',
              boxShadow: '0 8px 24px rgba(124, 92, 255, 0.5)',
              zIndex: 100,
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Volume2 size={17} />
            <span>Tap to Enable Audio / Video</span>
          </button>
        )}

        {/* Remote Video Feed */}
        {callType === 'video' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: isScreenSharing ? 'contain' : 'cover',
            }}
          />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <img
              src={targetUser?.profile_image || `https://ui-avatars.com/api/?name=${targetUser?.username || 'User'}&background=7C5CFF&color=fff`}
              alt="Avatar"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: '3px solid var(--accent)',
                boxShadow: '0 0 30px rgba(124, 92, 255, 0.4)',
                marginBottom: '16px',
              }}
            />
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
              {targetUser?.username || 'User'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {callStatus}
            </div>
          </div>
        )}

        {/* Local Video Picture-in-Picture */}
        {callType === 'video' && (
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              right: '24px',
              width: '180px',
              height: '120px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              border: '2px solid var(--accent)',
              backgroundColor: '#0D1220',
              zIndex: 10,
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: isScreenSharing ? 'none' : 'scaleX(-1)',
              }}
            />
            {videoOff && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#0D1220',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                }}
              >
                Camera Off
              </div>
            )}
          </div>
        )}

        {/* Collaborative Live Whiteboard Overlay (Phase 5) */}
        {isWhiteboardOpen && (
          <div
            className="fade-in"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(8, 11, 20, 0.85)',
              backdropFilter: 'blur(10px)',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: '#0D1220',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PenTool size={18} color="var(--accent-cyan)" />
                <span style={{ fontWeight: '600', fontSize: '14.5px', color: '#fff' }}>Collaborative Whiteboard</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {['#38D9FF', '#7C5CFF', '#39D98A', '#FF5C70', '#FFB84D', '#FFFFFF'].map((col) => (
                  <div
                    key={col}
                    onClick={() => setBrushColor(col)}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: col,
                      border: brushColor === col ? '2px solid #fff' : '2px solid transparent',
                      cursor: 'pointer',
                    }}
                  />
                ))}

                <button
                  type="button"
                  onClick={clearCanvas}
                  className="btn-icon"
                  style={{ padding: '6px', marginLeft: '8px' }}
                  title="Clear canvas"
                >
                  <RotateCcw size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsWhiteboardOpen(false)}
                  className="btn-icon"
                  style={{ padding: '6px' }}
                  title="Close whiteboard"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={1400}
              height={900}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
                cursor: 'crosshair',
              }}
            />
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div
        style={{
          height: '90px',
          backgroundColor: 'rgba(13, 18, 32, 0.95)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        {/* Toggle Mic */}
        <button
          type="button"
          onClick={toggleMic}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: micMuted ? '#ea4335' : 'rgba(255,255,255,0.12)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title={micMuted ? 'Unmute' : 'Mute'}
        >
          {micMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Toggle Video (if video call) */}
        {callType === 'video' && (
          <button
            type="button"
            onClick={toggleVideo}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: videoOff ? '#ea4335' : 'rgba(255,255,255,0.12)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title={videoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {videoOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
        )}

        {/* Toggle Screen Share (video calls only) */}
        {callType === 'video' && (
          <button
            type="button"
            onClick={toggleScreenShare}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: isScreenSharing ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isScreenSharing ? '0 0 16px rgba(124, 92, 255, 0.5)' : 'none',
              transition: 'all 0.2s ease',
            }}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            {isScreenSharing ? <ScreenShareOff size={22} /> : <ScreenShare size={22} />}
          </button>
        )}

        {/* Toggle Collaborative Whiteboard (Phase 5) */}
        <button
          type="button"
          onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: isWhiteboardOpen ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isWhiteboardOpen ? '0 0 16px rgba(124, 92, 255, 0.5)' : 'none',
            transition: 'all 0.2s ease',
          }}
          title={isWhiteboardOpen ? 'Close Whiteboard' : 'Open Whiteboard'}
        >
          <PenTool size={22} />
        </button>

        {/* End Call */}
        <button
          type="button"
          onClick={handleEndCallClick}
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: '#ea4335',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="End Call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
