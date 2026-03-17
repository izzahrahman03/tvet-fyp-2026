// pages/ForgotPassword.jsx
// Route: /forgot-password
// User enters their email → receives a password reset link

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import "../../css/userManagement/forgotPassword.css";

const API = process.env.REACT_APP_API_URL;

// ── Email validator ────────────────────────────────────────
const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

export default function ForgotPassword() {
  const [email, setEmail]       = useState('');
  const [touched, setTouched]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [sent, setSent]         = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  // Countdown for resend button (60 seconds)
  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const emailValid   = isValidEmail(email);
  const showError    = touched && !emailValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!emailValid) return;
    setError('');
    setLoading(true);

    try {
      const res  = await fetch(`${API}/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Only show a generic error — never confirm whether email exists (security)
        setError(data.message || 'Something went wrong. Please try again.');
        return;
      }

      setSent(true);
      startCountdown();
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);

    try {
      await fetch(`${API}/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      startCountdown();
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Sent / success state ───────────────────────────────────
  if (sent) {
    return (
      <div className="fp-page">
        <div className="fp-card">
          <div className="fp-logo">
            <div className="fp-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
            </div>
            <div>
              <p className="fp-logo-name">Vitrox Academy</p>
              <p className="fp-logo-sub">Password Reset</p>
            </div>
          </div>

          <div className="fp-success-wrap">
            <span className="fp-success-icon">📬</span>
            <p className="fp-success-title">Check your inbox</p>
            <p className="fp-success-text">
              We've sent a password reset link to{' '}
              <strong>{email}</strong>.<br />
              The link expires in <strong>15 minutes</strong>.
            </p>

            <div className="fp-alert info" style={{ textAlign: 'left' }}>
              <svg className="fp-alert-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
              <span>Can't find it? Check your spam or junk folder.</span>
            </div>

            <div className="fp-resend-wrap">
              Didn't receive it?
              <button
                className="fp-resend-btn"
                onClick={handleResend}
                disabled={countdown > 0 || loading}
              >
                {countdown > 0
                  ? <>Resend in <span className="fp-countdown">{countdown}s</span></>
                  : loading ? 'Sending…' : 'Resend email'
                }
              </button>
            </div>
          </div>

          <div className="fp-divider" />

          <div className="fp-footer">
            <Link to="/login" className="fp-link">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Email entry form ───────────────────────────────────────
  return (
    <div className="fp-page">
      <div className="fp-card">

        {/* Logo */}
        <div className="fp-logo">
          <div className="fp-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          </div>
          <div>
            <p className="fp-logo-name">Vitrox Academy</p>
            <p className="fp-logo-sub">Password Reset</p>
          </div>
        </div>

        {/* Icon */}
        <div className="fp-icon-bubble blue">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 className="fp-title">Forgot your password?</h1>
        <p className="fp-subtitle">
          Enter your registered email address and we'll send you a link to reset your password.
        </p>

        {/* Error */}
        {error && (
          <div className="fp-alert error">
            <svg className="fp-alert-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
            </svg>
            {error}
          </div>
        )}

        <form className="fp-form" onSubmit={handleSubmit} noValidate>
          <div className="fp-field">
            <label className="fp-label" htmlFor="email">Email Address</label>
            <div className={`fp-input-wrap ${showError ? 'invalid' : emailValid && touched ? 'valid' : ''}`}>
              <svg className="fp-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" />
              </svg>
              <input
                id="email"
                type="email"
                className="fp-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
              />
              {/* Inline validation tick / cross */}
              {touched && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke={emailValid ? '#10b981' : '#ef4444'} strokeWidth="2.5">
                  {emailValid
                    ? <path d="M20 6L9 17l-5-5" />
                    : <path d="M18 6L6 18M6 6l12 12" />
                  }
                </svg>
              )}
            </div>
            {showError && (
              <span className="fp-field-hint error">Please enter a valid email address.</span>
            )}
          </div>

          <button type="submit" className="fp-btn" disabled={loading}>
            {loading
              ? <><span className="fp-spinner" /> Sending reset link…</>
              : 'Send Reset Link'
            }
          </button>
        </form>

        <div className="fp-divider" />

        <div className="fp-footer">
          <span className="fp-footer-text">Remember your password? </span>
          <Link to="/login" className="fp-link">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}