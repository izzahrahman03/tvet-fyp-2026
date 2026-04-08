import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const NAV_ITEMS = [
  {
    label: "Dashboard",
    id:    "dashboard",
    path:  "/manager-dashboard",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Application Management",
    id:    "application-management",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
        <line x1="8" y1="9"  x2="10" y2="9"  />
      </svg>
    ),
    children: [
      {
        label: "Intakes",
        id:    "intakes",
        path:  "/intakes",
        icon: (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
            <line x1="8" y1="9"  x2="10" y2="9"  />
          </svg>
        ),
      },
      {
        label: "Interview Slots",
        id:    "interview-slots",
        path:  "/interview-slots",
        icon: (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8"  y1="2" x2="8"  y2="6" />
            <line x1="3"  y1="10" x2="21" y2="10" />
          </svg>
        ),
      },
      {
        label: "Applications",
        id:    "applications",
        path:  "/applications",
        icon: (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
            <line x1="8" y1="9"  x2="10" y2="9"  />
          </svg>
        ),
      },
    ],
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

export default function ManagerSidebar({ isOpen, onClose, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const initialOpen = NAV_ITEMS.reduce((acc, item) => {
    if (item.children) {
      acc[item.id] = item.children.some((c) => c.path === location.pathname);
    }
    return acc;
  }, {});

  const [openMenus, setOpenMenus] = useState(initialOpen);

  const toggleMenu = (id) =>
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));

  const activeId =
    [
      ...NAV_ITEMS.filter((i) => !i.children).map((i) => ({ id: i.id, path: i.path })),
      ...NAV_ITEMS.flatMap((i) => i.children ?? []).map((c) => ({ id: c.id, path: c.path })),
    ].find((item) => location.pathname === item.path)?.id ?? "dashboard";

  const handleNav = (path) => {
    navigate(path);
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

        {/* Toggle button */}
        <button className="db-sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          <HamburgerIcon />
        </button>

        <VitroxLogo isOpen={isOpen} />

        <nav className="db-nav">
          {NAV_ITEMS.map((item) => {
            if (!item.children) {
              return (
                <button
                  key={item.id}
                  className={`db-nav-btn ${activeId === item.id ? "active" : ""}`}
                  onClick={() => handleNav(item.path)}
                  title={!isOpen ? item.label : undefined}
                >
                  <span className="db-nav-icon">{item.icon}</span>
                  {isOpen && <span className="db-nav-label">{item.label}</span>}
                </button>
              );
            }

            const isParentActive = item.children.some((c) => c.id === activeId);
            const isMenuOpen = !!openMenus[item.id];

            return (
              <div key={item.id}>
                <button
                  className={`db-nav-btn ${isParentActive ? "active" : ""}`}
                  onClick={() => isOpen ? toggleMenu(item.id) : null}
                  title={!isOpen ? item.label : undefined}
                >
                  <span className="db-nav-icon">{item.icon}</span>
                  {isOpen && <span className="db-nav-label">{item.label}</span>}
                  {isOpen && (
                    <svg
                      className="db-chevron"
                      style={{
                        marginLeft: "auto",
                        transition: "transform 0.2s",
                        transform: isMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                        flexShrink: 0,
                      }}
                      width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </button>

                {isOpen && isMenuOpen && (
                  <div className="db-subnav">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        className={`db-nav-btn db-subnav-btn ${activeId === child.id ? "active" : ""}`}
                        onClick={() => handleNav(child.path)}
                      >
                        <span className="db-nav-icon">{child.icon}</span>
                        <span className="db-nav-label">{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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