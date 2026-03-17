// pages/ResetPassword.jsx
// Route: /reset-password?token=<resetToken>
// User sets a brand new password after clicking the email link

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import "../../css/userManagement/forgotPassword.css";

const API = process.env.REACT_APP_API_URL;

// ── Password strength ──────────────────────────────────────
const getStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8)             score++;
  if (/[A-Z]/.test(pw))           score++;
  if (/[0-9]/.test(pw))           score++;
  if (/[^A-Za-z0-9]/.test(pw))   score++;
  return score; // 0–4
};

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

export default function ResetPassword() {
  const [searchParams]            = useSearchParams();
  const navigate                  = useNavigate();
  const token                     = searchParams.get('token') || '';

  const [newPass, setNew]         = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showNew, setShowNew]     = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [tokenValid, setTokenValid] = useState(null); // null=checking, true, false
  const [success, setSuccess]     = useState(false);

  const strength      = getStrength(newPass);
  const strengthPct   = (strength / 4) * 100;
  const passwordsMatch = newPass && confirm && newPass === confirm;
  const mismatch       = confirm.length > 0 && newPass !== confirm;

  const requirements = [
    { label: 'At least 8 characters',      met: newPass.length >= 8 },
    { label: 'One uppercase letter (A–Z)',  met: /[A-Z]/.test(newPass) },
    { label: 'One number (0–9)',            met: /[0-9]/.test(newPass) },
  ];
  const reqMet = requirements.every((r) => r.met);

  // ── Validate token on mount ────────────────────────────────
  useEffect(() => {
    if (!token) { setTokenValid(false); return; }

    fetch(`${API}/validate-reset-token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    })
      .then((res) => setTokenValid(res.ok))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reqMet)        { setError('Please meet all password requirements.'); return; }
    if (!passwordsMatch){ setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);

    try {
      const res  = await fetch(`${API}/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, newPassword: newPass, confirmPassword: confirm }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to reset password. Please try again.');
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3500);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Token checking ─────────────────────────────────────────
  if (tokenValid === null) {
    return (
      <div className="fp-page">
        <div className="fp-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 0' }}>
            <span className="fp-spinner" style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#1a56db' }} />
            <p style={{ fontSize: 14, color: '#64748b' }}>Validating your reset link…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Invalid / expired token ────────────────────────────────
  if (tokenValid === false) {
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
            <span className="fp-success-icon">⛔</span>
            <p className="fp-success-title">Link expired or invalid</p>
            <p className="fp-success-text">
              This password reset link is either invalid or has already expired.
              Reset links are only valid for <strong>15 minutes</strong>.
            </p>

            <Link to="/forgot-password" className="fp-btn" style={{ textDecoration: 'none', marginTop: 4 }}>
              Request a New Link
            </Link>
          </div>

          <div className="fp-divider" />
          <div className="fp-footer">
            <Link to="/login" className="fp-link">← Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────
  if (success) {
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
            <span className="fp-success-icon">✅</span>
            <p className="fp-success-title">Password updated!</p>
            <p className="fp-success-text">
              Your password has been reset successfully.
              You'll be redirected to the login page in a moment.
            </p>

            <button className="fp-btn" onClick={() => navigate('/login')}>
              Go to Login →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── New password form ──────────────────────────────────────
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
        <div className="fp-icon-bubble green">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <h1 className="fp-title">Set a new password</h1>
        <p className="fp-subtitle">
          Create a strong password to secure your Vitrox Academy account.
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

          {/* New password field */}
          <div className="fp-field">
            <label className="fp-label" htmlFor="newPass">New Password</label>
            <div className="fp-input-wrap">
              <svg className="fp-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="newPass"
                type={showNew ? 'text' : 'password'}
                className="fp-input"
                value={newPass}
                onChange={(e) => setNew(e.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
                autoFocus
              />
              <button type="button" className="fp-eye-btn" onClick={() => setShowNew((v) => !v)} tabIndex={-1}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showNew
                    ? <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                    : <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0" />
                  }
                </svg>
              </button>
            </div>

            {/* Strength bar */}
            {newPass && (
              <div className="fp-strength-wrap">
                <div className="fp-strength-row">
                  <span className="fp-strength-label">Password strength</span>
                  <span className="fp-strength-value" style={{ color: STRENGTH_COLORS[strength] }}>
                    {STRENGTH_LABELS[strength]}
                  </span>
                </div>
                <div className="fp-strength-bar-bg">
                  <div
                    className="fp-strength-bar-fill"
                    style={{ width: `${strengthPct}%`, background: STRENGTH_COLORS[strength] }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm password field */}
          <div className="fp-field">
            <label className="fp-label" htmlFor="confirm">Confirm New Password</label>
            <div className={`fp-input-wrap ${mismatch ? 'invalid' : passwordsMatch ? 'valid' : ''}`}>
              <svg className="fp-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="confirm"
                type={showConf ? 'text' : 'password'}
                className="fp-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              <button type="button" className="fp-eye-btn" onClick={() => setShowConf((v) => !v)} tabIndex={-1}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showConf
                    ? <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                    : <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0" />
                  }
                </svg>
              </button>
            </div>
            {mismatch       && <span className="fp-field-hint error">✗ Passwords do not match</span>}
            {passwordsMatch && <span className="fp-field-hint success">✓ Passwords match</span>}
          </div>

          {/* Requirements checklist */}
          <div className="fp-requirements">
            {requirements.map((r) => (
              <div key={r.label} className={`fp-req-item ${r.met ? 'met' : ''}`}>
                <span className="fp-req-dot">{r.met ? '✓' : '·'}</span>
                {r.label}
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="fp-btn"
            disabled={loading || mismatch || !newPass || !confirm || !reqMet}
          >
            {loading
              ? <><span className="fp-spinner" /> Updating password…</>
              : 'Reset Password'
            }
          </button>
        </form>

        <div className="fp-divider" />
        <div className="fp-footer">
          <Link to="/login" className="fp-link">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}