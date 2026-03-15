import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../css/pages/login.css";
import "../css/pages/signup.css";
import { GoogleIcon, CheckIcon } from "../components/Icons";

const BENEFITS = [
  "Opportunity to upskill and reskill in high-demand areas",
  "Access to industry-relevant courses and certifications",
  "Personalized learning paths based on your goals",
  "Mentorship and networking with industry professionals",
  "Career support and job placement assistance",
];

// Strength helpers
const getStrength = (pwd) => {
  if (!pwd) return 0;
  if (pwd.length < 6) return 1;
  if (pwd.length < 10) return 2;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 4;
  return 3;
};

const STRENGTH_COLORS = ["#DBEAFE", "#EF4444", "#F59E0B", "#3B82F6", "#22C55E"];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    topic: "",
    newsletter: true,
    terms: false
  });

  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState("");

  const strength      = getStrength(form.password);
  const strengthColor = STRENGTH_COLORS[strength];
  const strengthLabel = STRENGTH_LABELS[strength];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5001/api/signup", form);
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="auth-page">

      {/* ── Left dark panel ── */}
      <div className="auth-side">
        <div className="auth-side-blob" style={{ width: 500, height: 500, top: -150, right: -200 }} />
        <div className="auth-side-blob" style={{ width: 300, height: 300, bottom: -50, left: -80 }} />

        <div className="dot-grid" style={{ top: 80, left: 60 }}>
          {Array(25).fill(null).map((_, i) => <span key={i} />)}
        </div>

        <div className="auth-side-content">
          {/* Logo */}
          <div className="auth-side-logo" onClick={() => navigate("home")}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#60A5FA" }} />
            K-Youth Development Programme
          </div>

          <h2 className="auth-side-title anim-fade-up">
            Start your learning journey.
          </h2>
          <p className="auth-side-sub anim-fade-up delay-1">
            Create your free account and be part of us!
          </p>

          {/* Benefits checklist */}
          <div className="signup-benefits anim-fade-up delay-2">
            {BENEFITS.map((item) => (
              <div key={item} className="signup-benefit-item">
                <div className="signup-benefit-check">✓</div>
                <span className="signup-benefit-text">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-side" style={{ overflowY: "auto" }}>
        <div className="auth-form-header anim-fade-up">
          <h1 className="auth-form-title">Create your free account</h1>
          <p className="auth-form-sub">
            Already have one?{" "}
            <span onClick={() => navigate("/login")}>Log in here</span>
          </p>
        </div>

        {/* Google */}
        <button className="btn-google anim-fade-up delay-1">
          <GoogleIcon /> Sign up with Google
        </button>

        <div className="auth-divider anim-fade-up delay-2">
          or sign up with email
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Name row */}
          <div className="form-group anim-fade-up delay-3" style={{ marginTop: "1.2rem" }}>
              <label className="form-label" htmlFor="signup-first">
                Full name
              </label>
              <input
                id="signup-first"
                className="form-input"
                type="text"
                placeholder="Jane"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

          {/* Email */}
          <div className="form-group anim-fade-up delay-3" style={{ marginTop: "1.2rem" }}>
            <label className="form-label" htmlFor="signup-email">
              Email address
            </label>
            <input
              id="signup-email"
              className="form-input"
              type="email"
              placeholder="you@example.com"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password + strength meter */}
          <div className="form-group anim-fade-up delay-3">
            <div className="form-between">
              <label className="form-label" htmlFor="signup-password" style={{ marginBottom: 0 }}>
                Password
              </label>
              {strength > 0 && (
                <span className="strength-label" style={{ color: strengthColor }}>
                  {strengthLabel}
                </span>
              )}
            </div>
            <div className="password-wrapper" style={{ marginTop: ".45rem" }}>
              <input
                id="signup-password"
                className="form-input"
                type={showPass ? "text" : "password"}
                placeholder="At least 8 characters"
                name="password"
                value={form.password}
                onChange={handleChange}
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
            <div className="strength-bar">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="strength-seg"
                  style={{ background: n <= strength ? strengthColor : "#DBEAFE" }}
                />
              ))}
            </div>
          </div>

          {/* Consents */}
          <div className="form-check anim-fade-up delay-4">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              checked={form.terms}
              onChange={handleChange}
              required
            />
            <label htmlFor="terms">
              I agree to the <span>Terms of Service</span> and{" "}
              <span>Privacy Policy</span>
            </label>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-auth anim-fade-up delay-5">
            Create free account →
          </button>

          {/* Message */}
          {message && <p className="form-message anim-fade-up delay-6">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default Signup;