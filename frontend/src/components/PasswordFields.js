import { useState } from "react";

// ── Strength helpers ──────────────────────────────────────────────────────────
const getStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8)            s++;
  if (/[A-Z]/.test(pw))          s++;
  if (/[0-9]/.test(pw))          s++;
  if (/[^A-Za-z0-9]/.test(pw))   s++;
  return s;
};
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

const EyeIcon = ({ visible }) =>
  visible ? (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </>
  ) : (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  );

const LockIcon = () => (
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>
);

/**
 * PasswordFields
 *
 * Props:
 *   password        {string}   – controlled value for the password field
 *   onPasswordChange{fn}       – setter for password  (receives raw string)
 *   confirm         {string}   – controlled value for the confirm field
 *   onConfirmChange {fn}       – setter for confirm   (receives raw string)
 *   passwordLabel   {string?}  – label override (default "Password")
 *   confirmLabel    {string?}  – label override (default "Confirm Password")
 *
 * The parent is responsible for keeping `password` and `confirm` in state;
 * this component owns only the show/hide toggles.
 */
const PasswordFields = ({
  password,
  onPasswordChange,
  confirm,
  onConfirmChange,
  passwordLabel = "Password",
  confirmLabel  = "Confirm Password",
}) => {
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);

  const strength       = getStrength(password);
  const strengthPct    = (strength / 4) * 100;
  const passwordsMatch = password && confirm && password === confirm;
  const mismatch       = confirm && password !== confirm;

  const requirements = [
    { label: "At least 8 characters",     met: password.length >= 8 },
    { label: "One uppercase letter (A–Z)", met: /[A-Z]/.test(password) },
    { label: "One number (0–9)",           met: /[0-9]/.test(password) },
  ];

  return (
    <>
      {/* ── Password ───────────────────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="pf-password">
          {passwordLabel}
        </label>
        <div className="act-input-wrap">
          <svg className="act-input-icon" width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <LockIcon />
          </svg>
          <input
            id="pf-password"
            type={showPass ? "text" : "password"}
            className="act-inner-input"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Create a strong password"
            autoComplete="new-password"
          />
          <button
            type="button"
            className="act-eye-btn"
            onClick={() => setShowPass((v) => !v)}
            tabIndex={-1}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <EyeIcon visible={showPass} />
            </svg>
          </button>
        </div>

        {/* Strength bar */}
        {password && (
          <div className="act-strength-wrap">
            <div className="act-strength-row">
              <span>Password strength</span>
              <span style={{ color: STRENGTH_COLORS[strength], fontWeight: 700 }}>
                {STRENGTH_LABELS[strength]}
              </span>
            </div>
            <div className="act-strength-bg">
              <div
                className="act-strength-fill"
                style={{
                  width:      `${strengthPct}%`,
                  background: STRENGTH_COLORS[strength],
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm Password ───────────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="pf-confirm">
          {confirmLabel}
        </label>
        <div
          className="act-input-wrap"
          style={{
            borderColor: mismatch
              ? "#ef4444"
              : passwordsMatch
              ? "#10b981"
              : undefined,
          }}
        >
          <svg className="act-input-icon" width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <LockIcon />
          </svg>
          <input
            id="pf-confirm"
            type={showConf ? "text" : "password"}
            className="act-inner-input"
            value={confirm}
            onChange={(e) => onConfirmChange(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />
          <button
            type="button"
            className="act-eye-btn"
            onClick={() => setShowConf((v) => !v)}
            tabIndex={-1}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <EyeIcon visible={showConf} />
            </svg>
          </button>
        </div>
        {mismatch       && <span className="act-hint error">Passwords do not match</span>}
        {passwordsMatch && <span className="act-hint success">Passwords match ✓</span>}
      </div>

      {/* ── Requirements checklist ─────────────────────────────────── */}
      <div className="act-requirements">
        {requirements.map((r) => (
          <div key={r.label} className={`act-req-item ${r.met ? "met" : ""}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              {r.met
                ? <polyline points="20 6 9 17 4 12" />
                : <circle cx="12" cy="12" r="2" />}
            </svg>
            {r.label}
          </div>
        ))}
      </div>
    </>
  );
};

export default PasswordFields;

// Also export the helper so callers can validate before submit
export { getStrength };