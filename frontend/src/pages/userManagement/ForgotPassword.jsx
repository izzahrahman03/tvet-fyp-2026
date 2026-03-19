import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../../css/pages/login.css";
import "../../css/userManagement/forgotPassword.css";

const API = process.env.REACT_APP_API_URL;
const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail]         = useState('');
  const [touched, setTouched]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [sent, setSent]           = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(timerRef.current); return 0; } return c - 1; });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const emailValid = isValidEmail(email);
  const showError  = touched && !emailValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!emailValid) return;
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Something went wrong. Please try again.'); return; }
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
      await fetch(`${API}/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      startCountdown();
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const SidePanel = ({ subtitle }) => (
    <div className="auth-side">
      <div className="auth-side-blob" style={{ width: 500, height: 500, top: -200, left: -150 }} />
      <div className="auth-side-blob" style={{ width: 350, height: 350, bottom: -100, right: -100 }} />
      <div className="dot-grid" style={{ bottom: 80, right: 60 }}>
        {Array(25).fill(null).map((_, i) => <span key={i} />)}
      </div>
      <div className="auth-side-content">
        <div className="auth-side-logo" onClick={() => navigate("/")}>
          <img src="https://learn.vitrox.academy/pluginfile.php/1/theme_edumy/headerlogo_mobile/1663920908/Vitrox%20Academy%20Logo%20FINAL-20%20MAY%202020-high%20res%20%281%29.png" alt="ViTrox Academy" style={{ height: 36, width: "auto" }} />
        </div>
        <h2 className="auth-side-title">Password Reset</h2>
        <p className="auth-side-sub">{subtitle}</p>
        <div className="fp-side-note">
          <div className="fp-side-note-text">Reset links are valid for 15 minutes. Check your spam folder if you do not receive the email.</div>
        </div>
      </div>
    </div>
  );

  /* ── Sent / success state ── */
  if (sent) {
    return (
      <div className="auth-page">
        <SidePanel subtitle="A password reset link has been sent to your registered email address." />
        <div className="auth-form-side">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Check your inbox</h1>
            <p className="auth-form-sub" style={{ color: "#64748B", fontWeight: 400 }}>
              A password reset link has been sent to <strong style={{ color: "#0A1628" }}>{email}</strong>. The link expires in 15 minutes.
            </p>
          </div>

          <div className="fp-info-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
            <span>Cannot find the email? Check your spam or junk folder.</span>
          </div>

          <div className="fp-resend-row">
            Did not receive it?
            <button className="fp-resend-btn" onClick={handleResend} disabled={countdown > 0 || loading}>
              {countdown > 0 ? <>Resend in <strong>{countdown}s</strong></> : loading ? 'Sending…' : 'Resend email'}
            </button>
          </div>

          <div className="fp-divider" />
          <div style={{ textAlign: "center" }}>
            <Link to="/login" className="fp-back-link">← Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Email entry form ── */
  return (
    <div className="auth-page">
      <SidePanel subtitle="Enter your registered email address and we will send you a link to reset your password." />
      <div className="auth-form-side">
        <div className="auth-form-header">
          <h1 className="auth-form-title">Forgot your password?</h1>
          <p className="auth-form-sub" style={{ color: "#64748B", fontWeight: 400 }}>
            Enter your registered email address and we will send you a reset link.
          </p>
        </div>

        {error && (
          <div className="fp-alert error">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <form className="fp-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="fp-email">Email Address</label>
            <div className={`act-input-wrap ${showError ? 'invalid' : emailValid && touched ? 'valid' : ''}`}>
              <svg className="act-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                id="fp-email"
                type="email"
                className="act-inner-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
              />
              {touched && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={emailValid ? '#10b981' : '#ef4444'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {emailValid ? <polyline points="20 6 9 17 4 12"/> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
                </svg>
              )}
            </div>
            {showError && <span className="act-hint error">Please enter a valid email address.</span>}
          </div>

          <button type="submit" className="btn-act" disabled={loading}>
            {loading ? <><span className="act-spinner" /> Sending reset link…</> : 'Send Reset Link'}
          </button>
        </form>

        <div className="fp-divider" />
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: ".85rem", color: "#94A3B8" }}>Remember your password? </span>
          <Link to="/login" className="fp-back-link">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}