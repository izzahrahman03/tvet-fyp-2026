// pages/SetPasswordPage.jsx
// Route: /set-password  (navigated to from ActivationPage with state)
// Step 2 of 2: user sets their permanent password

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../css/userManagement/activationPage.css";

const API = process.env.REACT_APP_API_URL;

// ─── Password strength checker ────────────────────────────
const getStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8)        score++;
  if (/[A-Z]/.test(pw))      score++;
  if (/[0-9]/.test(pw))      score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
};

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

const SetPasswordPage = () => {
  const navigate             = useNavigate();
  const { state }            = useLocation();
  const resetToken           = state?.resetToken || "";
  const userName             = state?.name || "there";

  const [newPass, setNew]    = useState("");
  const [confirm, setConfirm]= useState("");
  const [showNew, setShowNew]= useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading]= useState(false);
  const [error, setError]    = useState("");
  const [success, setSuccess]= useState(false);

  // Guard: if someone navigates here directly without a token, redirect
  useEffect(() => {
    if (!resetToken) navigate("/activate", { replace: true });
  }, [resetToken, navigate]);

  const strength     = getStrength(newPass);
  const strengthPct  = (strength / 4) * 100;
  const passwordsMatch = newPass && confirm && newPass === confirm;
  const mismatch       = confirm && newPass !== confirm;

  const requirements = [
    { label: "At least 8 characters",     met: newPass.length >= 8 },
    { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(newPass) },
    { label: "One number (0-9)",           met: /[0-9]/.test(newPass) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPass || !confirm)    { setError("Please fill in both fields."); return; }
    if (newPass !== confirm)     { setError("Passwords do not match."); return; }
    if (strength < 2)            { setError("Please choose a stronger password."); return; }
    setError("");
    setLoading(true);

    try {
      const res  = await fetch(`${API}/set-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ resetToken, newPassword: newPass, confirmPassword: confirm }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to set password. Please try again.");
        return;
      }

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate("/login"), 3000);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ─────────────────────────────────────────
  if (success) {
    return (
      <div className="act-page">
        <div className="act-card" style={{ textAlign: "center" }}>
          <div className="act-success-icon">✅</div>
          <h1 className="act-title" style={{ marginTop: "16px" }}>Account Activated!</h1>
          <p className="act-subtitle">
            Your password has been set successfully. You'll be redirected to the login page in a moment.
          </p>
          <button className="act-submit-btn" style={{ marginTop: "24px" }} onClick={() => navigate("/login")}>
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="act-page">
      <div className="act-card">

        {/* Logo */}
        <div className="act-logo">
          <div className="act-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          </div>
          <div>
            <p className="act-logo-name">Vitrox Academy</p>
            <p className="act-logo-sub">Account Activation</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="act-steps">
          <div className="act-step done">
            <span className="act-step-dot">✓</span>
            <span className="act-step-label">Verify Identity</span>
          </div>
          <div className="act-step-line active" />
          <div className="act-step active">
            <span className="act-step-dot">2</span>
            <span className="act-step-label">Set Password</span>
          </div>
        </div>

        <h1 className="act-title">Set your password, {userName.split(" ")[0]}</h1>
        <p className="act-subtitle">
          Create a strong password you'll use to log in to Vitrox Academy.
        </p>

        {error && (
          <div className="act-error">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01"/></svg>
            {error}
          </div>
        )}

        <form className="act-form" onSubmit={handleSubmit} noValidate>

          {/* New password */}
          <div className="act-field">
            <label htmlFor="newPass">New Password</label>
            <div className="act-input-wrap">
              <svg className="act-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input
                id="newPass"
                type={showNew ? "text" : "password"}
                className="act-input"
                value={newPass}
                onChange={(e) => setNew(e.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
                autoFocus
              />
              <button type="button" className="act-eye-btn" onClick={() => setShowNew((v) => !v)} tabIndex={-1}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showNew
                    ? <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22"/>
                    : <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0"/>
                  }
                </svg>
              </button>
            </div>

            {/* Strength bar */}
            {newPass && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>Password strength</span>
                  <span style={{ fontSize: "11.5px", fontWeight: "700", color: STRENGTH_COLORS[strength] }}>
                    {STRENGTH_LABELS[strength]}
                  </span>
                </div>
                <div style={{ background: "#f1f5f9", borderRadius: "999px", height: "5px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "999px",
                    width: `${strengthPct}%`,
                    background: STRENGTH_COLORS[strength],
                    transition: "width 0.3s ease, background 0.3s ease",
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="act-field">
            <label htmlFor="confirm">Confirm New Password</label>
            <div className="act-input-wrap" style={{ borderColor: mismatch ? "#ef4444" : passwordsMatch ? "#10b981" : undefined }}>
              <svg className="act-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input
                id="confirm"
                type={showConf ? "text" : "password"}
                className="act-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              <button type="button" className="act-eye-btn" onClick={() => setShowConf((v) => !v)} tabIndex={-1}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showConf
                    ? <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22"/>
                    : <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0"/>
                  }
                </svg>
              </button>
            </div>
            {mismatch      && <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "5px" }}>✗ Passwords do not match</p>}
            {passwordsMatch && <p style={{ fontSize: "12px", color: "#10b981", marginTop: "5px" }}>✓ Passwords match</p>}
          </div>

          {/* Requirements checklist */}
          <div className="act-requirements">
            {requirements.map((r) => (
              <div key={r.label} className={`act-req-item ${r.met ? "met" : ""}`}>
                <span className="act-req-dot">{r.met ? "✓" : "·"}</span>
                {r.label}
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="act-submit-btn"
            disabled={loading || mismatch || !newPass || !confirm}
            style={{ opacity: (loading || mismatch || !newPass || !confirm) ? 0.6 : 1 }}
          >
            {loading
              ? <><span className="act-spinner" /> Setting password…</>
              : "Activate Account →"
            }
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordPage;