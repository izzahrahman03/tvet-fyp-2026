// pages/UpdateProfile.jsx
// Route: /profile
// All roles can update: name, email, phone, avatar, password

import { useState, useEffect, useRef, useCallback } from 'react';
import "../../css/userManagement/updateProfile.css";

const API = process.env.REACT_APP_API_URL;

// ── Helpers ────────────────────────────────────────────────
const getToken  = () => localStorage.getItem('token');
const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone  = (v) => !v || /^[0-9\-\+\s\(\)]{7,15}$/.test(v);

const getStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

const ROLE_LABELS = {
  applicant:            'Applicant',
  student:              'Student',
  industry_partner:     'Industry Partner',
  industry_supervisor:  'Industry Supervisor',
  admin:                'Administrator',
};

// ── Reusable SVG icons ─────────────────────────────────────
const Icon = ({ d, size = 15, color = 'currentColor', stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// ── Toast ──────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`up-toast ${type}`}>
      {type === 'success'
        ? <Icon d="M20 6L9 17l-5-5" color="white" stroke={2.5} />
        : <Icon d="M18 6L6 18M6 6l12 12" color="white" stroke={2.5} />
      }
      {msg}
    </div>
  );
}

// ── Section card wrapper ───────────────────────────────────
function SectionCard({ iconD, iconBg, iconColor, title, subtitle, children, footer }) {
  return (
    <div className="up-card">
      <div className="up-card-header">
        <div className="up-card-header-icon" style={{ background: iconBg }}>
          <Icon d={iconD} color={iconColor} size={17} />
        </div>
        <div>
          <p className="up-card-title">{title}</p>
          {subtitle && <p className="up-card-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="up-card-body">{children}</div>
      {footer && <div className="up-card-footer">{footer}</div>}
    </div>
  );
}

// ── Input with icon ────────────────────────────────────────
function InputField({ label, id, iconD, type = 'text', value, onChange, onBlur,
  placeholder, disabled, error, hint, badge, rightEl }) {
  return (
    <div className="up-field">
      <label className="up-label" htmlFor={id}>
        {label}
        {badge && <span className="up-label-badge">{badge}</span>}
      </label>
      <div className={`up-input-wrap ${disabled ? 'disabled' : ''} ${error ? 'error' : ''}`}>
        {iconD && <Icon d={iconD} size={15} color="#94a3b8" />}
        <input
          id={id}
          type={type}
          className="up-input"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
        {rightEl}
      </div>
      {error && <span className="up-field-error"><Icon d="M18 6L6 18M6 6l12 12" size={11} color="#ef4444" />{error}</span>}
      {!error && hint && <span className="up-field-hint">{hint}</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
const UpdateProfile = () => {
  // ── Profile state ──────────────────────────────────────────
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchErr] = useState('');

  // ── Info form ──────────────────────────────────────────────
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [infoTouched, setInfoTouched] = useState({});
  const [infoSaving, setInfoSaving]   = useState(false);
  const [infoAlert, setInfoAlert]     = useState(null);

  // ── Avatar ─────────────────────────────────────────────────
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarSaving, setAvatarSaving]   = useState(false);
  const avatarInputRef = useRef();

  // ── Password form ──────────────────────────────────────────
  const [currPass, setCurrPass]   = useState('');
  const [newPass,  setNewPass]    = useState('');
  const [confPass, setConfPass]   = useState('');
  const [showCurr, setShowCurr]   = useState(false);
  const [showNew,  setShowNew]    = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwAlert,  setPwAlert]    = useState(null);

  // ── Toast ──────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  const strength      = getStrength(newPass);
  const strengthPct   = (strength / 4) * 100;
  const pwMatch       = newPass && confPass && newPass === confPass;
  const pwMismatch    = confPass.length > 0 && newPass !== confPass;
  const pwReqs = [
    { label: 'At least 8 characters',     met: newPass.length >= 8 },
    { label: 'One uppercase letter (A–Z)', met: /[A-Z]/.test(newPass) },
    { label: 'One number (0–9)',           met: /[0-9]/.test(newPass) },
  ];

  // ── Fetch profile on mount ─────────────────────────────────
  useEffect(() => {
    fetch(`${API}/auth/profile`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setProfile(data.user);
          setName(data.user.name  || '');
          setEmail(data.user.email || '');
          setPhone(data.user.phone || '');
          if (data.user.avatar_url) setAvatarPreview(data.user.avatar_url);
        } else {
          setFetchErr('Failed to load profile. Please refresh.');
        }
      })
      .catch(() => setFetchErr('Network error. Please check your connection.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Info validation ────────────────────────────────────────
  const nameError  = infoTouched.name  && !name.trim()       ? 'Name is required.'            : '';
  const emailError = infoTouched.email && !isValidEmail(email)? 'Enter a valid email address.' : '';
  const phoneError = infoTouched.phone && !isValidPhone(phone)? 'Enter a valid phone number.'  : '';
  const infoValid  = name.trim() && isValidEmail(email) && isValidPhone(phone);

  // ── Save profile info ──────────────────────────────────────
  const handleInfoSave = async (e) => {
    e.preventDefault();
    setInfoTouched({ name: true, email: true, phone: true });
    if (!infoValid) return;

    setInfoSaving(true);
    setInfoAlert(null);

    try {
      const res  = await fetch(`${API}/auth/profile`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ name, email, phone }),
      });
      const data = await res.json();

      if (!res.ok) { setInfoAlert({ type: 'error', msg: data.message || 'Update failed.' }); return; }

      setProfile((p) => ({ ...p, name, email, phone }));
      // Update stored name in localStorage if you keep it there
      localStorage.setItem('name', name);
      showToast('Profile updated successfully!');
    } catch {
      setInfoAlert({ type: 'error', msg: 'Network error. Please try again.' });
    } finally {
      setInfoSaving(false);
    }
  };

  const handleInfoReset = () => {
    setName(profile?.name  || '');
    setEmail(profile?.email || '');
    setPhone(profile?.phone || '');
    setInfoTouched({});
    setInfoAlert(null);
  };

  // ── Avatar ─────────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2 MB.', 'error'); return; }
    if (!file.type.startsWith('image/')) { showToast('Please select an image file.', 'error'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarSaving(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const res  = await fetch(`${API}/auth/profile/avatar`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body:    formData,
      });
      const data = await res.json();

      if (!res.ok) { showToast(data.message || 'Upload failed.', 'error'); return; }

      setProfile((p) => ({ ...p, avatar_url: data.avatar_url }));
      setAvatarFile(null);
      showToast('Profile photo updated!');
    } catch {
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleAvatarRemove = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  // ── Change password ────────────────────────────────────────
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!currPass)    { setPwAlert({ type: 'error', msg: 'Enter your current password.' }); return; }
    if (!pwReqs.every((r) => r.met)) { setPwAlert({ type: 'error', msg: 'New password doesn\'t meet all requirements.' }); return; }
    if (!pwMatch)     { setPwAlert({ type: 'error', msg: 'Passwords do not match.' }); return; }

    setPwSaving(true);
    setPwAlert(null);

    try {
      const res  = await fetch(`${API}/auth/profile/change-password`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ currentPassword: currPass, newPassword: newPass, confirmPassword: confPass }),
      });
      const data = await res.json();

      if (!res.ok) { setPwAlert({ type: 'error', msg: data.message || 'Failed to change password.' }); return; }

      setCurrPass(''); setNewPass(''); setConfPass('');
      showToast('Password changed successfully!');
    } catch {
      setPwAlert({ type: 'error', msg: 'Network error. Please try again.' });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Eye button helper ──────────────────────────────────────
  const EyeBtn = ({ show, onToggle }) => (
    <button type="button" className="up-eye-btn" onClick={onToggle} tabIndex={-1}>
      <Icon size={15} d={show
        ? 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22'
        : 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0'
      } />
    </button>
  );

  // ── Alert block ────────────────────────────────────────────
  const AlertBlock = ({ alert }) => alert ? (
    <div className={`up-alert ${alert.type}`}>
      <Icon size={15} className="up-alert-icon"
        d={alert.type === 'success'
          ? 'M20 6L9 17l-5-5'
          : 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01'
        }
      />
      {alert.msg}
    </div>
  ) : null;

  // ── Loading / error states ─────────────────────────────────
  if (loading) {
    return (
      <div className="up-page">
        <div className="up-container">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', gap: 12, flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#1a56db', borderRadius: '50%', animation: 'up-spin 0.65s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Loading profile…</p>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="up-page">
        <div className="up-container">
          <div className="up-alert error" style={{ marginTop: 40 }}>
            <Icon d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" size={15} />
            {fetchError}
          </div>
        </div>
      </div>
    );
  }

  const infoChanged = name !== profile?.name || email !== profile?.email || phone !== (profile?.phone || '');

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="up-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="up-container">

        {/* Page header */}
        <div className="up-page-header">
          <button className="up-back-btn" onClick={() => window.history.back()}>
            <Icon d="M19 12H5M12 19l-7-7 7-7" size={14} />
            Back
          </button>
          <h1 className="up-page-title">My Profile</h1>
          <p className="up-page-subtitle">Manage your personal information and account security</p>
        </div>

        {/* ── Avatar card ── */}
        <div className="up-card">
          <div className="up-avatar-section">
            {/* Avatar display */}
            <div className="up-avatar-wrap">
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" className="up-avatar" />
                : <div className="up-avatar-initials">{getInitials(name)}</div>
              }
              <button
                className="up-avatar-edit-btn"
                onClick={() => avatarInputRef.current?.click()}
                title="Change photo"
              >
                <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" size={12} color="white" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </div>

            {/* Avatar info + actions */}
            <div className="up-avatar-info">
              <p className="up-avatar-name">{name || 'Your Name'}</p>
              <p className="up-avatar-role">{ROLE_LABELS[profile?.role] || profile?.role} · {profile?.email}</p>
              <div className="up-avatar-actions">
                <button className="up-btn-secondary up-btn-sm" onClick={() => avatarInputRef.current?.click()}>
                  <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" size={13} />
                  Upload Photo
                </button>
                {avatarFile && (
                  <button className="up-btn-primary up-btn-sm" onClick={handleAvatarUpload} disabled={avatarSaving}>
                    {avatarSaving ? <><span className="up-spinner" /> Saving…</> : '✓ Save Photo'}
                  </button>
                )}
                {(avatarPreview && !avatarFile) && (
                  <button className="up-btn-danger up-btn-sm" onClick={handleAvatarRemove}>
                    Remove
                  </button>
                )}
                {avatarFile && (
                  <button className="up-btn-secondary up-btn-sm" onClick={handleAvatarRemove}>
                    Cancel
                  </button>
                )}
              </div>
              <p className="up-avatar-hint">JPG, PNG or GIF · Max 2 MB</p>
            </div>
          </div>
        </div>

        {/* ── Personal info card ── */}
        <SectionCard
          iconD="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
          iconBg="#eff6ff" iconColor="#1a56db"
          title="Personal Information"
          subtitle="Update your name, email and phone number"
          footer={
            <>
              <button className="up-btn-secondary" onClick={handleInfoReset} disabled={infoSaving}>
                Reset
              </button>
              <button
                className="up-btn-primary"
                onClick={handleInfoSave}
                disabled={infoSaving || !infoChanged}
              >
                {infoSaving
                  ? <><span className="up-spinner" /> Saving…</>
                  : <><Icon d="M20 6L9 17l-5-5" size={14} color="white" /> Save Changes</>
                }
              </button>
            </>
          }
        >
          <AlertBlock alert={infoAlert} />
          <form onSubmit={handleInfoSave} noValidate>
            <div className="up-form-grid">
              <InputField
                label="Full Name" id="name"
                iconD="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setInfoTouched((p) => ({ ...p, name: true }))}
                placeholder="Your full name"
                error={nameError}
              />
              <InputField
                label="Email Address" id="email" type="email"
                iconD="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setInfoTouched((p) => ({ ...p, email: true }))}
                placeholder="your@email.com"
                error={emailError}
                hint="Changing email will require you to log in again."
              />
              <InputField
                label="Phone Number" id="phone"
                iconD="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setInfoTouched((p) => ({ ...p, phone: true }))}
                placeholder="e.g. 012-3456789"
                error={phoneError}
              />
              <InputField
                label="Role" id="role"
                iconD="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                value={ROLE_LABELS[profile?.role] || profile?.role || ''}
                disabled
                badge="Read only"
              />
            </div>
          </form>
        </SectionCard>

        {/* ── Change password card ── */}
        <SectionCard
          iconD="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"
          iconBg="#f0fdf4" iconColor="#10b981"
          title="Change Password"
          subtitle="Use a strong password you don't use elsewhere"
          footer={
            <>
              <button
                className="up-btn-secondary"
                onClick={() => { setCurrPass(''); setNewPass(''); setConfPass(''); setPwAlert(null); }}
                disabled={pwSaving}
              >
                Clear
              </button>
              <button
                className="up-btn-primary"
                onClick={handlePasswordSave}
                disabled={pwSaving || !currPass || !newPass || !confPass || pwMismatch}
              >
                {pwSaving
                  ? <><span className="up-spinner" /> Updating…</>
                  : <><Icon d="M20 6L9 17l-5-5" size={14} color="white" /> Update Password</>
                }
              </button>
            </>
          }
        >
          <AlertBlock alert={pwAlert} />
          <form onSubmit={handlePasswordSave} noValidate>
            <div className="up-form-grid single">

              {/* Current password */}
              <InputField
                label="Current Password" id="currPass"
                iconD="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"
                type={showCurr ? 'text' : 'password'}
                value={currPass}
                onChange={(e) => setCurrPass(e.target.value)}
                placeholder="Your current password"
                rightEl={<EyeBtn show={showCurr} onToggle={() => setShowCurr((v) => !v)} />}
              />

              {/* New password */}
              <div className="up-field">
                <label className="up-label" htmlFor="newPass">New Password</label>
                <div className="up-input-wrap">
                  <Icon d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" size={15} color="#94a3b8" />
                  <input
                    id="newPass"
                    type={showNew ? 'text' : 'password'}
                    className="up-input"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Create a new password"
                    autoComplete="new-password"
                  />
                  <EyeBtn show={showNew} onToggle={() => setShowNew((v) => !v)} />
                </div>
                {newPass && (
                  <div className="up-strength-wrap">
                    <div className="up-strength-row">
                      <span className="up-strength-label">Password strength</span>
                      <span className="up-strength-value" style={{ color: STRENGTH_COLORS[strength] }}>
                        {STRENGTH_LABELS[strength]}
                      </span>
                    </div>
                    <div className="up-strength-bar-bg">
                      <div className="up-strength-bar-fill"
                        style={{ width: `${strengthPct}%`, background: STRENGTH_COLORS[strength] }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Requirements */}
              {newPass && (
                <div className="up-requirements">
                  {pwReqs.map((r) => (
                    <div key={r.label} className={`up-req-item ${r.met ? 'met' : ''}`}>
                      <span className="up-req-dot">{r.met ? '✓' : '·'}</span>
                      {r.label}
                    </div>
                  ))}
                </div>
              )}

              {/* Confirm password */}
              <InputField
                label="Confirm New Password" id="confPass"
                iconD="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"
                type={showConf ? 'text' : 'password'}
                value={confPass}
                onChange={(e) => setConfPass(e.target.value)}
                placeholder="Re-enter your new password"
                error={pwMismatch ? 'Passwords do not match' : ''}
                hint={pwMatch ? '✓ Passwords match' : ''}
                rightEl={<EyeBtn show={showConf} onToggle={() => setShowConf((v) => !v)} />}
              />
            </div>
          </form>
        </SectionCard>

        {/* ── Account info (read-only) ── */}
        <SectionCard
          iconD="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM13 2v7h7"
          iconBg="#f8fafc" iconColor="#64748b"
          title="Account Information"
          subtitle="Read-only details about your account"
        >
          <div className="up-form-grid">
            <InputField
              label="Account Status" id="status"
              iconD="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"
              value={profile?.active_status === 'active' ? 'Active' : 'Inactive'}
              disabled badge="Read only"
            />
            <InputField
              label="Member Since" id="created"
              iconD="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
              value={profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—'}
              disabled badge="Read only"
            />
            <InputField
              label="Last Login" id="last_login"
              iconD="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2"
              value={profile?.last_login
                ? new Date(profile.last_login).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Never'}
              disabled badge="Read only"
            />
          </div>
        </SectionCard>

      </div>
    </div>
  );
};

export default UpdateProfile;