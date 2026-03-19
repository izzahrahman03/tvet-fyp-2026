import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import "../../css/pages/login.css";
import "../../css/userManagement/forgotPassword.css";
import PasswordFields, { getStrength } from "../../components/PasswordFields";

const API = process.env.REACT_APP_API_URL;

export default function ResetPassword() {
  const [searchParams]              = useSearchParams();
  const navigate                    = useNavigate();
  const token                       = searchParams.get('token') || '';

  const [newPass,     setNew]       = useState('');
  const [confirm,     setConfirm]   = useState('');
  const [loading,     setLoading]   = useState(false);
  const [error,       setError]     = useState('');
  const [tokenValid,  setTokenValid] = useState(null);
  const [success,     setSuccess]   = useState(false);

  const passwordsMatch = newPass && confirm && newPass === confirm;
  const mismatch       = confirm.length > 0 && newPass !== confirm;
  const reqMet         = getStrength(newPass) >= 3;

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
    if (!reqMet)         { setError('Please meet all password requirements.'); return; }
    if (!passwordsMatch) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, newPassword: newPass, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to reset password. Please try again.'); return; }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3500);
    } catch {
      setError('Network error. Please check your connection and try again.');
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
        <div className="auth-side-logo" onClick={() => navigate('/')}>
          <img
            src="https://learn.vitrox.academy/pluginfile.php/1/theme_edumy/headerlogo_mobile/1663920908/Vitrox%20Academy%20Logo%20FINAL-20%20MAY%202020-high%20res%20%281%29.png"
            alt="ViTrox Academy"
            style={{ height: 36, width: 'auto' }}
          />
        </div>
        <h2 className="auth-side-title">Password Reset</h2>
        <p className="auth-side-sub">{subtitle}</p>
        <div className="fp-side-note">
          <div className="fp-side-note-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="fp-side-note-text">Use a combination of uppercase letters, numbers, and symbols for a stronger password.</div>
        </div>
      </div>
    </div>
  );

  /* ── Token checking ── */
  if (tokenValid === null) {
    return (
      <div className="auth-page">
        <SidePanel subtitle="Validating your reset link, please wait." />
        <div className="auth-form-side" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <span className="act-spinner" style={{ width: 32, height: 32, border: '3px solid #DBEAFE', borderTopColor: '#1A56DB' }} />
            <p style={{ fontSize: '.9rem', color: '#64748B' }}>Validating your reset link…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Invalid / expired token ── */
  if (tokenValid === false) {
    return (
      <div className="auth-page">
        <SidePanel subtitle="This reset link is no longer valid." />
        <div className="auth-form-side">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Link expired or invalid</h1>
            <p className="auth-form-sub" style={{ color: '#64748B', fontWeight: 400 }}>
              This password reset link is either invalid or has already expired. Reset links are valid for 15 minutes only.
            </p>
          </div>
          <Link to="/forgot-password" className="btn-act" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Request a New Link
          </Link>
          <div className="fp-divider" />
          <div style={{ textAlign: 'center' }}>
            <Link to="/login" className="fp-back-link">← Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div className="auth-page">
        <SidePanel subtitle="Your password has been updated successfully." />
        <div className="auth-form-side">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Password updated</h1>
            <p className="auth-form-sub" style={{ color: '#64748B', fontWeight: 400 }}>
              Your password has been reset successfully. You will be redirected to the login page shortly.
            </p>
          </div>
          <button className="btn-act" onClick={() => navigate('/login')}>Go to Login →</button>
        </div>
      </div>
    );
  }

  /* ── New password form ── */
  return (
    <div className="auth-page">
      <SidePanel subtitle="Create a new strong password to secure your ViTrox Academy account." />
      <div className="auth-form-side">
        <div className="auth-form-header">
          <h1 className="auth-form-title">Set a new password</h1>
          <p className="auth-form-sub" style={{ color: '#64748B', fontWeight: 400 }}>
            Create a strong password to secure your ViTrox Academy account.
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
          <PasswordFields
            password={newPass}
            onPasswordChange={(val) => { setNew(val); if (error) setError(''); }}
            confirm={confirm}
            onConfirmChange={(val) => { setConfirm(val); if (error) setError(''); }}
            passwordLabel="New Password"
            confirmLabel="Confirm New Password"
          />

          <button
            type="submit"
            className="btn-act"
            disabled={loading || !!mismatch || !newPass || !confirm || !reqMet}
          >
            {loading ? <><span className="act-spinner" /> Updating password…</> : 'Reset Password'}
          </button>
        </form>

        <div className="fp-divider" />
        <div style={{ textAlign: 'center' }}>
          <Link to="/login" className="fp-back-link">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}