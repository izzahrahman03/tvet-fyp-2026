import { useNavigate, useLocation } from "react-router-dom";

// ── Nav items — edit here to add/remove pages ──────────────
export const NAV_ITEMS = [
  {
    label: "Dashboard",
    id:    "dashboard",
    path:  "/applicant-dashboard",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "My Application",
    id:    "application",
    path:  "/my-application",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

// ── Vitrox logo ────────────────────────────────────────────
function VitroxLogo() {
  return (
    <div className="db-logo" style={{ display: "flex", alignItems: "center" }}>
      <img 
          src="https://learn.vitrox.academy/pluginfile.php/1/theme_edumy/headerlogo_mobile/1663920908/Vitrox%20Academy%20Logo%20FINAL-20%20MAY%202020-high%20res%20%281%29.png" 
          alt="ViTrox Academy" 
          className="nav-logo-img"></img>
          <span className="db-logo-text">ViTrox Academy</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ApplicantSidebar
// Props:
//   isOpen  — boolean   (mobile drawer open state)
//   onClose — function  (called when overlay is clicked)
// ══════════════════════════════════════════════════════════
export default function ApplicantSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Active item = whichever nav path matches current URL
  const activeId = NAV_ITEMS.find((item) => location.pathname === item.path)?.id ?? "dashboard";

  const handleNav = (item) => {
    navigate(item.path);
    onClose?.();
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`db-overlay ${isOpen ? "visible" : ""}`}
        onClick={onClose}
      />

      <aside className={`db-sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo */}
        <VitroxLogo />

        {/* Nav */}
        <nav className="db-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`db-nav-btn ${activeId === item.id ? "active" : ""}`}
              onClick={() => handleNav(item)}
            >
              <span className="db-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <button className="db-signout-btn" onClick={handleSignOut}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </aside>
    </>
  );
}