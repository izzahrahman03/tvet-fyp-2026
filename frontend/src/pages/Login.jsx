import { useState } from 'react';
import api from '../utils/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import "../css/pages/login.css";
// import { GoogleIcon } from "../components/Icons";
import { getStrength, EyeIcon } from '../components/PasswordFields';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email,    setEmail]    = useState("");
  const [pass,     setPass]     = useState("");
  const [showPass, setShowPass] = useState(false);
  const [alert,    setAlert]    = useState(null);
  const [errors,   setErrors]   = useState({});

  const handleSubmit = async e => {
    e.preventDefault();

    const errs = {};
    if (!email.trim()) errs.email    = "Please enter your email address.";
    if (!pass.trim())  errs.password = "Please enter your password.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setAlert({ type: "error", text: "Please fill in all required fields before continuing." });
      return;
    }

    setErrors({});
    setAlert(null);

    try {
      const res = await api.post('http://localhost:5001/api/login', { email, password: pass });

      setAlert({ type: "success", text: res.data.message });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({
        name:         res.data.name,
        email:        res.data.email,
        role:         res.data.role,
        matricNumber: res.data.matricNumber || "",
      }));

      // ✅ Go back to intended page, or fall back to role-based dashboard
      const destination = location.state?.from;

      if (destination) {
        navigate(destination, { replace: true });
      } else {
        switch (res.data.role) {
          case "admin":               navigate("/admin-dashboard");      break;
          case "applicant":           navigate("/applicant-dashboard");  break;
          case "student":             navigate("/student-dashboard");    break;
          case "industry_partner":    navigate("/partner-dashboard");    break;
          case "industry_supervisor": navigate("/supervisor-dashboard"); break;
          case "manager":             navigate("/manager-dashboard");    break;
          default:                    navigate("/");
        }
      }

    } catch (err) {
      setAlert({ type: "error", text: err.response?.data?.message || "Login failed. Please try again." });
    }
  };

  return (
    <div className="auth-page">

      {/* ── Left dark panel ── */}
      <div className="auth-side">
        <div className="auth-side-blob" style={{ width: 500, height: 500, top: -200, left: -150 }} />
        <div className="auth-side-blob" style={{ width: 350, height: 350, bottom: -100, right: -100 }} />

        <div className="dot-grid" style={{ bottom: 80, right: 60 }}>
          {Array(25).fill(null).map((_, i) => <span key={i} />)}
        </div>

        <div className="auth-side-content">
          <div className="auth-side-logo" onClick={() => navigate("/")}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#60A5FA" }} />
            K-Youth Development Programme
          </div>

          <h2 className="auth-side-title anim-fade-up">Welcome back!</h2>
          <p className="auth-side-sub anim-fade-up delay-1">
            Log in to access your personalized dashboard.
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-side">
        <div className="auth-form-header anim-fade-up">
          <h1 className="auth-form-title">Log in to your account</h1>
          <p className="auth-form-sub">
            New here?{" "}
            <span onClick={() => navigate("/signup")}>Create a free account</span>
          </p>
        </div>

        {/* <button className="btn-google anim-fade-up delay-1">
          <GoogleIcon /> Continue with Google
        </button>

        <div className="auth-divider anim-fade-up delay-2">
          or log in with email
        </div> */}

        {/* ── Banner alert ── */}
        {alert && (
          <div className={`auth-alert ${alert.type}`}>
            <svg
              width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              {alert.type === "success"
                ? <polyline points="20 6 9 17 4 12" />
                : <>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </>
              }
            </svg>
            {alert.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div className="form-group anim-fade-up delay-3" style={{ marginTop: "1.2rem" }}>
            <label className="form-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors(prev => ({ ...prev, email: '' }));
                if (alert?.type === "error") setAlert(null);
              }}
            />
            {errors.email && <p className="auth-field-error">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="form-group anim-fade-up delay-3">
            <div className="form-between">
              <label className="form-label" htmlFor="login-password" style={{ marginBottom: 0 }}>
                Password
              </label>
              <span className="form-forgot" onClick={() => navigate("/forgot-password")}>
                Forgot password?
              </span>
            </div>
            <div className="password-wrapper" style={{ marginTop: ".45rem" }}>
              <input
                id="login-password"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={pass}
                onChange={(e) => {
                  setPass(e.target.value);
                  setErrors(prev => ({ ...prev, password: '' }));
                  if (alert?.type === "error") setAlert(null);
                }}
                style={{ paddingRight: "2.8rem" }}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPass((v) => !v)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <EyeIcon visible={showPass} />
                </svg>
              </button>
            </div>
            {errors.password && <p className="auth-field-error">{errors.password}</p>}
          </div>

          <button type="submit" className="btn-auth anim-fade-up delay-4">
            Log in
          </button>

        </form>
      </div>
    </div>
  );
};

export default Login;