import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Lock, User, Mail, FileText, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setError('Please fill in username, email, and password.');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), password, bio.trim());
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
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
        backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
      }}
    >
      <div
        className="fade-in"
        style={{
          width: '90%',
          maxWidth: '440px',
          backgroundColor: 'rgba(17, 21, 34, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--aurora-gradient)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
            }}
          >
            <MessageSquare size={24} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#F8FAFC', letterSpacing: '-0.5px' }}>Create an Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
            Conversations,<br/>without the clutter.
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(234, 67, 53, 0.12)',
              borderLeft: '4px solid var(--danger)',
              padding: '10px 12px',
              borderRadius: '6px',
              color: '#ff8080',
              fontSize: '13.5px',
              marginBottom: '18px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
              Username
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
              <User size={18} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  flex: 1,
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  flex: 1,
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
              Password
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
              <Lock size={18} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  flex: 1,
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Password Validation Checklist (Section 6) */}
            {password.length > 0 && (
              <div
                className="fade-in"
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '12px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(20, 27, 43, 0.6)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: password.length >= 8 ? 'var(--online)' : 'var(--text-muted)' }}>
                  {password.length >= 8 ? <Check size={13} color="var(--online)" /> : <span style={{ width: '13px', textAlign: 'center' }}>•</span>}
                  <span>8+ characters</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: /[A-Z]/.test(password) ? 'var(--online)' : 'var(--text-muted)' }}>
                  {/[A-Z]/.test(password) ? <Check size={13} color="var(--online)" /> : <span style={{ width: '13px', textAlign: 'center' }}>•</span>}
                  <span>One uppercase letter</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: /[0-9]/.test(password) ? 'var(--online)' : 'var(--text-muted)' }}>
                  {/[0-9]/.test(password) ? <Check size={13} color="var(--online)" /> : <span style={{ width: '13px', textAlign: 'center' }}>•</span>}
                  <span>One number</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
              About / Bio (Optional)
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
              <FileText size={18} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Hey there! I am using Aurora Chat."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
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
            disabled={submitting}
            style={{ marginTop: '10px', width: '100%', padding: '12px', borderRadius: '12px' }}
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
