import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../css/pages/login.css";
import { GoogleIcon, CheckIcon } from "../components/Icons";

const Login = () => {
  const [email,    setEmail]    = useState("");
  const [pass,     setPass]     = useState("");
  const [showPass, setShowPass] = useState(false);

  // const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const [message, setMessage] = useState(""); // add this at the top
  const navigate = useNavigate();             // add this at the top


  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5001/api/login', { email, password: pass });
      setMessage(res.data.message);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({ name: res.data.name, role: res.data.role }));
      switch (res.data.role) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "applicant":
          navigate("/applicant-dashboard");
          break;
        case "student":
          navigate("/student-dashboard");
          break;
        case "industry_partner":
          navigate("/industry-partner-dashboard");
          break;
        case "industry_supervisor":
          navigate("/industry-supervisor-dashboard");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
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
          {/* Logo */}

          <div className="auth-side-logo" onClick={() => navigate("/")}>    
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#60A5FA" }} />
            K-Youth Development Programme
          </div>

          <h2 className="auth-side-title anim-fade-up">
            Welcome back!
          </h2>
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

        {/* Google */}
        <button className="btn-google anim-fade-up delay-1">
          <GoogleIcon /> Continue with Google
        </button>

        <div className="auth-divider anim-fade-up delay-2">
          or log in with email
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group anim-fade-up delay-2">
            <label className="form-label" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group anim-fade-up delay-3">
            <div className="form-between">
              <label className="form-label" htmlFor="login-password" style={{ marginBottom: 0 }}>
                Password
              </label>
              <span className="form-forgot" onClick={() => navigate("/forgot-password")}>Forgot password?</span>
            </div>
            <div className="password-wrapper" style={{ marginTop: ".45rem" }}>
              <input
                id="login-password"
                className="form-input"
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                style={{ paddingRight: "2.8rem" }}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPass((v) => !v)}
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-auth anim-fade-up delay-4">
            Log in →
          </button>
        </form>

        {/* Security notice */}
        <div className="login-security-notice anim-fade-up delay-5">
          <CheckIcon />
          <p className="login-security-text">
            <strong>Secure login:</strong> We use 256-bit encryption and never
            store passwords in plain text.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;