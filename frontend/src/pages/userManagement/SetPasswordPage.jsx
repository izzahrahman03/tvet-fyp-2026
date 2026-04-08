import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../css/pages/login.css";
import "../../css/userManagement/activationPage.css";
import PasswordFields, { getStrength } from "../../components/PasswordFields"; // ← import

const API = process.env.REACT_APP_API_URL;

const SetPasswordPage = () => {
  const navigate       = useNavigate();
  const { state }      = useLocation();
  const resetToken     = state?.resetToken || "";
  const userName       = state?.name || "there";

  const [newPass,  setNew]      = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [errors,   setErrors]   = useState({});
  const [success,  setSuccess]  = useState(false);

  useEffect(() => {
    if (!resetToken) navigate("/activate", { replace: true });
  }, [resetToken, navigate]);

  const passwordsMatch = newPass && confirm && newPass === confirm;
  const mismatch       = confirm && newPass !== confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!newPass)  errs.newPass  = "Please enter a new password.";
    if (!confirm)  errs.confirm  = "Please confirm your password.";
    if (Object.keys(errs).length > 0) { setErrors(errs); setError(""); return; }
    setErrors({});
    if (newPass !== confirm)   { setErrors({ confirm: "Passwords do not match." }); return; }
    if (getStrength(newPass) < 4) { setError("Please choose a stronger password."); return; }
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/set-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ resetToken, newPassword: newPass, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to set password. Please try again."); return; }
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ── */
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-side">
          <div className="auth-side-blob" style={{ width: 500, height: 500, top: -200, left: -150 }} />
          <div className="auth-side-blob" style={{ width: 350, height: 350, bottom: -100, right: -100 }} />
          <div className="auth-side-content">
            <div className="auth-side-logo" onClick={() => navigate("/")}>
              <img src="https://learn.vitrox.academy/pluginfile.php/1/theme_edumy/headerlogo_mobile/1663920908/Vitrox%20Academy%20Logo%20FINAL-20%20MAY%202020-high%20res%20%281%29.png" alt="ViTrox Academy" style={{ height: 36, width: "auto" }} />
            </div>
            <h2 className="auth-side-title">Account Activation</h2>
            <p className="auth-side-sub">Your account is now fully set up and ready to use.</p>
          </div>
        </div>
        <div className="auth-form-side" style={{ justifyContent: "center", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h1 className="auth-form-title" style={{ marginTop: "1.2rem" }}>Account Activated</h1>
          <p style={{ color: "#64748B", fontSize: ".9rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Your password has been set successfully. You will be redirected to the login page shortly.
          </p>
          <button className="btn-act" style={{ maxWidth: 260 }} onClick={() => navigate("/login")}>
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* ── Left panel ── */}
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
          <h2 className="auth-side-title">Account Activation</h2>
          <p className="auth-side-sub">
            You are almost done. Set a strong password to secure your ViTrox Academy account.
          </p>
          <div className="act-side-steps">
            <div className="act-side-step done">
              <div className="act-side-step-num done">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <div className="act-side-step-title">Verify Identity</div>
                <div className="act-side-step-desc">Completed</div>
              </div>
            </div>
            <div className="act-side-step-connector" />
            <div className="act-side-step active">
              <div className="act-side-step-num active">2</div>
              <div>
                <div className="act-side-step-title">Set Password</div>
                <div className="act-side-step-desc">Create your permanent password</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-side">
        <div className="act-steps-bar">
          <div className="act-step-pill done">
            <span className="act-step-num done">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <span>Verify Identity</span>
          </div>
          <div className="act-step-line active" />
          <div className="act-step-pill active">
            <span className="act-step-num">2</span>
            <span>Set Password</span>
          </div>
        </div>

        <div className="auth-form-header">
          <h1 className="auth-form-title">Set your password, {userName.split(" ")[0]}</h1>
          <p className="auth-form-sub" style={{ color: "#64748B", fontWeight: 400 }}>
            Create a strong password you will use to log in to ViTrox Academy.
          </p>
        </div>

        {error && (
          <div className="act-alert error">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Shared password + confirm + requirements ── */}
          <PasswordFields
            password={newPass}
            onPasswordChange={(val) => { setNew(val); setErrors(prev => ({ ...prev, newPass: "" })); }}
            confirm={confirm}
            onConfirmChange={(val) => { setConfirm(val); setErrors(prev => ({ ...prev, confirm: "" })); }}
            passwordLabel="New Password"
            confirmLabel="Confirm New Password"
          />
          {errors.newPass && <p className="auth-field-error" style={{ marginTop: '-0.6rem', marginBottom: '0.8rem' }}>{errors.newPass}</p>}
          {errors.confirm && <p className="auth-field-error" style={{ marginTop: '-0.6rem', marginBottom: '0.8rem' }}>{errors.confirm}</p>}

          <button
            type="submit"
            className="btn-act"
            disabled={loading || !!mismatch || !newPass || !confirm}
          >
            {loading
              ? <><span className="act-spinner" /> Setting password…</>
              : "Activate Account →"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordPage;