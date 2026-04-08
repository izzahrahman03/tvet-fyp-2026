// Navbar.jsx — EduLearn
// Styles: globals.css
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate   = useNavigate();
  const [open, setOpen] = useState(false);

  const scrollTo = (id) => {
    setOpen(false);
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => navigate("/")}>
        <img
          src="https://learn.vitrox.academy/pluginfile.php/1/theme_edumy/headerlogo_mobile/1663920908/Vitrox%20Academy%20Logo%20FINAL-20%20MAY%202020-high%20res%20%281%29.png"
          alt="ViTrox Academy"
          className="nav-logo-img"
        /> ViTrox Academy
      </div>

      {/* ── Hamburger button (visible on mobile only) ── */}
      <button
        className="nav-hamburger"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle menu"
      >
        {open ? (
          // X icon
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          // Hamburger icon
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* ── Nav links — desktop always visible, mobile toggled ── */}
      <div className={`nav-links ${open ? "nav-links--open" : ""}`}>
        <button className="nav-link" onClick={() => scrollTo("announcements")}>Announcements</button>
        <button className="nav-link" onClick={() => scrollTo("background")}>Background</button>
        <button className="nav-link" onClick={() => scrollTo("components")}>Programme Components</button>
        <button className="nav-link" onClick={() => scrollTo("application")}>Application Process</button>
        <button
          className="nav-btn nav-btn-outline"
          onClick={() => { setOpen(false); navigate("login"); }}
        >
          Log in
        </button>
        <button
          className="nav-btn nav-btn-solid"
          onClick={() => { setOpen(false); navigate("signup"); }}
        >
          Register
        </button>
      </div>
    </nav>
  );
};

export default Navbar;