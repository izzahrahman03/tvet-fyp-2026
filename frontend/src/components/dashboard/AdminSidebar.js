import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ── Nav items ──────────────────────────────────────────────
export const NAV_ITEMS = [
  {
    label: "Dashboard",
    id:    "dashboard",
    path:  "/admin-dashboard",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "User Management",
    id:    "user-management",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    children: [
      {
        label: "Applicants",
        id:    "applicants",
        path:  "/admin/users/applicants",
        icon: (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
      {
        label: "Students",
        id:    "students",
        path:  "/admin/users/students",
        icon: (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        ),
      },
      {
        label: "Industry Partners",
        id:    "industry-partners",
        path:  "/admin/users/industry-partners",
        icon: (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        ),
      },
      {
        label: "Industry Supervisors",
        id:    "industry-supervisors",
        path:  "/admin/users/industry-supervisors",
        icon: (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <polyline points="23 11 17 17 14 14" />
          </svg>
        ),
      },
    ],
  },
];

// ── Vitrox logo ────────────────────────────────────────────
function VitroxLogo() {
  return (
    <div className="db-logo">
      <div className="db-logo-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
        </svg>
      </div>
      <div>
        <div className="db-logo-text">Vitrox</div>
        <div className="db-logo-text">Academy</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// AdminSidebar
// Props:
//   isOpen  — boolean   (mobile drawer open state)
//   onClose — function  (called when overlay is clicked)
// ══════════════════════════════════════════════════════════
export default function AdminSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if any child path is active — if so, keep submenu open by default
  const userMgmtPaths = NAV_ITEMS.find((i) => i.id === "user-management").children.map((c) => c.path);
  const [userMgmtOpen, setUserMgmtOpen] = useState(
    userMgmtPaths.includes(location.pathname)
  );

  const activeId = [
    ...NAV_ITEMS.filter((i) => !i.children).map((i) => ({ id: i.id, path: i.path })),
    ...NAV_ITEMS.flatMap((i) => i.children ?? []).map((c) => ({ id: c.id, path: c.path })),
  ].find((item) => location.pathname === item.path)?.id ?? "dashboard";

  const handleNav = (path) => {
    navigate(path);
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
          {NAV_ITEMS.map((item) => {
            // ── Top-level item with no children ───────────
            if (!item.children) {
              return (
                <button
                  key={item.id}
                  className={`db-nav-btn ${activeId === item.id ? "active" : ""}`}
                  onClick={() => handleNav(item.path)}
                >
                  <span className="db-nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              );
            }

            // ── Top-level item WITH children (submenu) ────
            const isParentActive = item.children.some((c) => c.id === activeId);

            return (
              <div key={item.id}>
                {/* Parent toggle button */}
                <button
                  className={`db-nav-btn ${isParentActive ? "active" : ""}`}
                  onClick={() => setUserMgmtOpen((v) => !v)}
                >
                  <span className="db-nav-icon">{item.icon}</span>
                  {item.label}
                  {/* Chevron */}
                  <svg
                    style={{
                      marginLeft: "auto",
                      transition: "transform 0.2s",
                      transform: userMgmtOpen ? "rotate(180deg)" : "rotate(0deg)",
                      flexShrink: 0,
                    }}
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Children */}
                {userMgmtOpen && (
                  <div className="db-subnav">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        className={`db-nav-btn db-subnav-btn ${activeId === child.id ? "active" : ""}`}
                        onClick={() => handleNav(child.path)}
                      >
                        <span className="db-nav-icon">{child.icon}</span>
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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