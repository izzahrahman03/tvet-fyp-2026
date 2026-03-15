import { useNavigate } from "react-router-dom";

// ── Helper ─────────────────────────────────────────────────
const getInitials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

// ══════════════════════════════════════════════════════════
// ApplicantTopbar
// Props:
//   onMenuClick — function  (opens mobile sidebar)
//   title       — string   (optional page title shown on mobile)
// ══════════════════════════════════════════════════════════
export default function Topbar({ onMenuClick, title }) {
  const navigate   = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName   = storedUser?.name || "Guest";
  const avatarUrl  = storedUser?.avatar_url || null;

  return (
    <div className="db-topbar">
      {/* Hamburger — mobile only */}
      <button className="db-hamburger" onClick={onMenuClick} aria-label="Open menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Page title (visible on mobile when search is hidden) */}
      {title && <p className="db-topbar-title">{title}</p>}

      {/* Search */}
      <div className="db-search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="db-search-input"
          placeholder="Search Courses, Documents, Activities..."
        />
      </div>

      {/* User chip — clicking goes to /profile */}
      <button className="db-user-chip" onClick={() => navigate("/profile")} title="My Profile">
        <div className="db-user-avatar">
          {avatarUrl
            ? <img src={avatarUrl} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            : getInitials(userName)
          }
        </div>
        <span className="db-username">{userName}</span>
      </button>
    </div>
  );
}