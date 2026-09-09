import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Lock, User, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState(null); // 'sending' | 'sent'
  const [show2FAPrompt, setShow2FAPrompt] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await login(identifier, password);
      const configuredPin = localStorage.getItem('user_2fa_pin');
      if (configuredPin) {
        setShow2FAPrompt(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify2FA = (e) => {
    e.preventDefault();
    const configuredPin = localStorage.getItem('user_2fa_pin');
    if (pinInput === configuredPin) {
      navigate('/');
    } else {
      setPinError('Incorrect 6-digit security PIN. Please try again.');
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(124, 92, 255, 0.12) 0%, transparent 60%)',
      }}
    >
      <div
        className="fade-in"
        style={{
          width: '90%',
          maxWidth: '420px',
          backgroundColor: 'rgba(13, 18, 32, 0.92)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '36px 28px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(124, 92, 255, 0.25)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'var(--aurora-gradient)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
              boxShadow: '0 0 24px rgba(124, 92, 255, 0.45)',
            }}
          >
            <MessageSquare size={34} />
          </div>
          <h1 className="aurora-text" style={{ fontSize: '26px', fontWeight: '700' }}>Aurora Chat</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Sign in to start messaging
          </p>
        </div>

        {show2FAPrompt ? (
          <div className="fade-in" style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(124, 92, 255, 0.15)',
                border: '1.5px solid var(--accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                marginBottom: '16px',
              }}
            >
              <Lock size={28} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
              Two-Step Verification
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Enter your 6-digit security PIN to access your account.
            </p>

            {pinError && (
              <div style={{ color: '#ff8080', fontSize: '13px', marginBottom: '14px', fontWeight: '500' }}>
                {pinError}
              </div>
            )}

            <form onSubmit={handleVerify2FA} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="••••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                style={{
                  backgroundColor: 'rgba(26, 34, 51, 0.7)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '24px',
                  letterSpacing: '10px',
                  textAlign: 'center',
                  color: '#fff',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={pinInput.length !== 6}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '15px' }}
              >
                Verify & Enter
              </button>
            </form>

            <button
              type="button"
              onClick={() => setShow2FAPrompt(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                marginTop: '16px',
                cursor: 'pointer',
              }}
            >
              ← Back to Login
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(234, 67, 53, 0.12)',
                  borderLeft: '4px solid var(--danger)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  color: '#ff8080',
                  fontSize: '13.5px',
                  marginBottom: '20px',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Username or Email
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(26, 34, 51, 0.7)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    gap: '10px',
                  }}
                >
                  <User size={18} style={{ color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    placeholder="Enter your username or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      flex: 1,
                      fontSize: '14.5px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Password
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(26, 34, 51, 0.7)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    gap: '10px',
                  }}
                >
                  <Lock size={18} style={{ color: 'var(--text-secondary)' }} />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      flex: 1,
                      fontSize: '14.5px',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setResetStatus(null);
                      setResetEmail('');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: '500',
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ marginTop: '10px', width: '100%', padding: '12px', borderRadius: '12px' }}
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
                Register here
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Forgot Password Flow Modal (Section 7) */}
      {showForgotPassword && (
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              backgroundColor: '#0D1220',
              borderRadius: '20px',
              padding: '30px 24px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Reset password
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '18px' }}>
              Enter your email and we'll send a link to reset your password.
            </p>

            {resetStatus === 'sent' ? (
              <div
                className="fade-in"
                style={{
                  backgroundColor: 'rgba(57, 217, 138, 0.12)',
                  border: '1px solid rgba(57, 217, 138, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  marginBottom: '20px',
                }}
              >
                <CheckCircle size={28} color="var(--online)" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                  Reset link sent!
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Check your inbox for password reset instructions.
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!resetEmail.trim()) return;
                  setResetStatus('sending');
                  setTimeout(() => setResetStatus('sent'), 600);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <div>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    Email Address
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'rgba(26, 34, 51, 0.7)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '9px 12px',
                      gap: '10px',
                    }}
                  >
                    <Mail size={18} style={{ color: 'var(--text-secondary)' }} />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      style={{
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        flex: 1,
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={resetStatus === 'sending'}
                  style={{ width: '100%', padding: '11px', borderRadius: '12px', marginTop: '4px' }}
                >
                  {resetStatus === 'sending' ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              style={{
                width: '100%',
                marginTop: '16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to sign in</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
