import { useNavigate } from "react-router-dom";

const getInitials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

export default function Topbar({ onMenuClick, title }) {
  const navigate   = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName   = storedUser?.name || "Guest";
  const avatarUrl  = storedUser?.avatar_url || null;

  return (
    <div className="db-topbar">
      {/* Hamburger — mobile only (desktop uses sidebar's own toggle) */}
      <button className="db-hamburger" onClick={onMenuClick} aria-label="Toggle menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6"  x2="21" y2="6"  />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {title && <span className="db-topbar-title">{title}</span>}

      {/* User chip */}
      <button
        className="db-user-chip"
        onClick={() => navigate("/profile")}
        title="My Profile"
        style={{ marginLeft: "auto" }}
      >
        <div className="db-user-avatar">
          {avatarUrl
            ? <img src={avatarUrl} alt={userName}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            : getInitials(userName)
          }
        </div>
        <span className="db-username">{userName}</span>
      </button>
    </div>
  );
}