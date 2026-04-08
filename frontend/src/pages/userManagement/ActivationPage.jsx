import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../css/pages/login.css";
import "../../css/userManagement/activationPage.css";

const API = process.env.REACT_APP_API_URL;

const ActivationPage = () => {
  const [searchParams]        = useSearchParams();
  const navigate              = useNavigate();
  const token                 = searchParams.get("token") || "";

  const [email, setEmail]     = useState("");
  const [tempPass, setTemp]   = useState("");
  const [showPass, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    if (!token) setError("Invalid activation link. Please check your email.");
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!email)   errs.email   = "Please enter your email address.";
    if (!tempPass) errs.tempPass = "Please enter your temporary password.";
    if (Object.keys(errs).length > 0) { setErrors(errs); setError(""); return; }
    setErrors({});
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/verify-activation`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, email, tempPassword: tempPass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Verification failed. Please try again."); return; }
      navigate("/set-password", { state: { resetToken: data.resetToken, name: data.name } });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

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
            <img
              src="https://learn.vitrox.academy/pluginfile.php/1/theme_edumy/headerlogo_mobile/1663920908/Vitrox%20Academy%20Logo%20FINAL-20%20MAY%202020-high%20res%20%281%29.png"
              alt="ViTrox Academy"
              style={{ height: 36, width: "auto" }}
            />
          </div>

          <h2 className="auth-side-title">Account Activation</h2>
          <p className="auth-side-sub">
            Complete your two-step verification to activate your ViTrox Academy account
            and gain access to your learning dashboard.
          </p>

          <div className="act-side-steps">
            <div className="act-side-step active">
              <div className="act-side-step-num">1</div>
              <div>
                <div className="act-side-step-title">Verify Identity</div>
                <div className="act-side-step-desc">Confirm your email and temporary password</div>
              </div>
            </div>
            <div className="act-side-step-connector" />
            <div className="act-side-step">
              <div className="act-side-step-num">2</div>
              <div>
                <div className="act-side-step-title">Set Password</div>
                <div className="act-side-step-desc">Create your permanent login password</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-side">

        {/* Step indicator */}
        <div className="act-steps-bar">
          <div className="act-step-pill active">
            <span className="act-step-num">1</span>
            <span>Verify Identity</span>
          </div>
          <div className="act-step-line" />
          <div className="act-step-pill">
            <span className="act-step-num">2</span>
            <span>Set Password</span>
          </div>
        </div>

        <div className="auth-form-header">
          <h1 className="auth-form-title">Verify your identity</h1>
          <p className="auth-form-sub" style={{ color: "#64748B", fontWeight: 400 }}>
            Enter the email and temporary password from your activation email.
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
          <div className="form-group">
            <label className="form-label" htmlFor="act-email">Email Address</label>
            <div className="act-input-wrap">
              <svg className="act-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                id="act-email"
                type="email"
                className="act-inner-input"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: "" })); }}
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
              />
            </div>
            {errors.email && <p className="auth-field-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="act-temp">Temporary Password</label>
            <div className="act-input-wrap">
              <svg className="act-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                id="act-temp"
                type={showPass ? "text" : "password"}
                className="act-inner-input"
                value={tempPass}
                onChange={(e) => { setTemp(e.target.value); setErrors(prev => ({ ...prev, tempPass: "" })); }}
                placeholder="From your activation email"
                autoComplete="off"
              />
              <button type="button" className="act-eye-btn" onClick={() => setShow((v) => !v)} tabIndex={-1}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPass
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  }
                </svg>
              </button>
            </div>
            {errors.tempPass && <p className="auth-field-error">{errors.tempPass}</p>}
          </div>

          <button type="submit" className="btn-act" disabled={loading || !token}>
            {loading ? <><span className="act-spinner" /> Verifying…</> : "Continue →"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: ".8rem", color: "#94A3B8", marginTop: "1.5rem" }}>
          Didn't receive an email? Contact your administrator.
        </p>
      </div>
    </div>
  );
};

export default ActivationPage;