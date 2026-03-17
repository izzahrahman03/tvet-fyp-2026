import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

  // If no token in URL, show an error immediately
  useEffect(() => {
    if (!token) setError("Invalid activation link. Please check your email.");
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !tempPass) { setError("Please fill in both fields."); return; }
    setError("");
    setLoading(true);

    try {
      const res  = await fetch(`${API}/verify-activation`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, email, tempPassword: tempPass }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed. Please try again.");
        return;
      }

      // Pass the short-lived resetToken to the next step via state
      navigate("/set-password", {
        state: { resetToken: data.resetToken, name: data.name },
      });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

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
          <div className="act-step active">
            <span className="act-step-dot">1</span>
            <span className="act-step-label">Verify Identity</span>
          </div>
          <div className="act-step-line" />
          <div className="act-step">
            <span className="act-step-dot">2</span>
            <span className="act-step-label">Set Password</span>
          </div>
        </div>

        <h1 className="act-title">Verify your identity</h1>
        <p className="act-subtitle">
          Enter the email address your account was registered with, and the
          temporary password from your activation email.
        </p>

        {error && (
          <div className="act-error">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01"/></svg>
            {error}
          </div>
        )}

        <form className="act-form" onSubmit={handleSubmit} noValidate>
          <div className="act-field">
            <label htmlFor="email">Email Address</label>
            <div className="act-input-wrap">
              <svg className="act-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6"/></svg>
              <input
                id="email"
                type="email"
                className="act-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="act-field">
            <label htmlFor="tempPass">Temporary Password</label>
            <div className="act-input-wrap">
              <svg className="act-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              <input
                id="tempPass"
                type={showPass ? "text" : "password"}
                className="act-input"
                value={tempPass}
                onChange={(e) => setTemp(e.target.value)}
                placeholder="From your activation email"
                autoComplete="off"
              />
              <button type="button" className="act-eye-btn" onClick={() => setShow((v) => !v)} tabIndex={-1}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPass
                    ? <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22"/>
                    : <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0"/>
                  }
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" className="act-submit-btn" disabled={loading || !token}>
            {loading
              ? <><span className="act-spinner" /> Verifying…</>
              : "Continue →"
            }
          </button>
        </form>

        <p className="act-help">
          Didn't receive an email? Contact your administrator.
        </p>
      </div>
    </div>
  );
};

export default ActivationPage;
