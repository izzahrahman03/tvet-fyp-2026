import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../css/pages/login.css";
import "../css/pages/signup.css";
import { GoogleIcon } from "../components/Icons";
import PasswordFields, { getStrength } from "../components/PasswordFields";

const BENEFITS = [
  "Opportunity to upskill and reskill in high-demand areas",
  "Access to industry-relevant courses and certifications",
  "Personalized learning paths based on your goals",
  "Mentorship and networking with industry professionals",
  "Career support and job placement assistance",
];

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:       "",
    email:      "",
    password:   "",
    confirm:    "",
    topic:      "",
    newsletter: true,
    terms:      false,
  });

  const [alert, setAlert] = useState(null); // { type: "error" | "success", text: string }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error alert as user starts correcting the form
    if (alert?.type === "error") setAlert(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      setAlert({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (getStrength(form.password) < 2) {
      setAlert({ type: "error", text: "Please choose a stronger password." });
      return;
    }

    try {
      await axios.post("http://localhost:5001/api/signup", form);
      setAlert({ type: "success", text: "Signup successful. Redirecting to login..." });
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Signup failed. Please try again.";
      setAlert({ type: "error", text: msg });
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

        {/* <button className="btn-google anim-fade-up delay-1">
          <GoogleIcon /> Sign up with Google
        </button>

        <div className="auth-divider anim-fade-up delay-2">
          or sign up with email
        </div> */}

        {/* ── Alert banner (error or success) ── */}
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

          {/* Full name */}
          <div className="form-group anim-fade-up delay-3" style={{ marginTop: "1.2rem" }}>
            <label className="form-label" htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
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
            <label className="form-label" htmlFor="signup-email">Email address</label>
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

          {/* Password + confirm + requirements */}
          <div className="anim-fade-up delay-3">
            <PasswordFields
              password={form.password}
              onPasswordChange={(val) => setForm(prev => ({ ...prev, password: val }))}
              confirm={form.confirm}
              onConfirmChange={(val) => setForm(prev => ({ ...prev, confirm: val }))}
            />
          </div>

          {/* Terms */}
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

          <button
            type="submit"
            className="btn-auth anim-fade-up delay-5"
            disabled={form.password !== form.confirm || !form.confirm}
          >
            Create free account
          </button>

        </form>
      </div>
    </div>
  );
};

export default Signup;