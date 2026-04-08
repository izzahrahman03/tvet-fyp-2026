import { useNavigate, useLocation } from "react-router-dom";

export const NAV_ITEMS = [
  {
    label: "Dashboard",
    id:    "dashboard",
    path:  "/supervisor-dashboard",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Internship",
    id:    "internship",
    path:  "/internship",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
];

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function VitroxLogo({ isOpen }) {
  return (
    <div className="db-logo">
      <img
        src="https://learn.vitrox.academy/pluginfile.php/1/theme_edumy/headerlogo_mobile/1663920908/Vitrox%20Academy%20Logo%20FINAL-20%20MAY%202020-high%20res%20%281%29.png"
        alt="ViTrox Academy"
        className="nav-logo-img"
      />
      {isOpen && <span className="db-logo-text">ViTrox Academy</span>}
    </div>
  );
}

export default function SupervisorSidebar({ isOpen, onClose, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeId = NAV_ITEMS.find((item) => location.pathname === item.path)?.id ?? "dashboard";

  const handleNav = (item) => {
    navigate(item.path);
    if (window.innerWidth < 769) onClose?.();
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <div className={`db-overlay ${isOpen ? "visible" : ""}`} onClick={onClose} />

      <aside className={`db-sidebar ${isOpen ? "open" : "closed"}`}>

        <button className="db-sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          <HamburgerIcon />
        </button>

        <VitroxLogo isOpen={isOpen} />

        <nav className="db-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`db-nav-btn ${activeId === item.id ? "active" : ""}`}
              onClick={() => handleNav(item)}
              title={!isOpen ? item.label : undefined}
            >
              <span className="db-nav-icon">{item.icon}</span>
              {isOpen && <span className="db-nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <button className="db-signout-btn" onClick={handleSignOut} title={!isOpen ? "Sign Out" : undefined}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {isOpen && <span>Sign Out</span>}
        </button>

      </aside>
    </>
  );
}