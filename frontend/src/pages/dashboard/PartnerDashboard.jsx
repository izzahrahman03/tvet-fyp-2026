import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/dashboard/applicantDashboard.css";

// Icons and illustrations
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SignOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const VitroxLogo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <div style={{
      width: "36px", height: "36px",
      background: "linear-gradient(135deg, #1a56db, #3b82f6)",
      borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      </svg>
    </div>
    <div>
      <div style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b", lineHeight: "1.1" }}>Vitrox</div>
      <div style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b", lineHeight: "1.1" }}>Academy</div>
    </div>
  </div>
);

const ScientistIllustration = () => (
  <svg width="130" height="120" viewBox="0 0 130 120" fill="none">
    {/* ... keep your SVG paths ... */}
  </svg>
);

const navItems = [
  { label: "Dashboard", id: "dashboard" },
  { label: "Vacancy Form", id: "form" },
];

export default function PartnerDashboard({ user }) {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [searchValue, setSearchValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem('user'));
  const userName = storedUser?.name || "Guest";
  const userRole = storedUser?.role;

  const handleSignOut = () => {
    // Clear user session if needed
    navigate("/login");
  };

  const goToProfile = () => navigate("/profile"); // <-- navigate to profile page

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`db-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="db-layout">

        {/* Sidebar */}
        <aside className={`db-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div style={{ marginBottom: "40px" }}>
            <VitroxLogo />
          </div>

          <nav style={{ flex: 1 }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "10px 14px", borderRadius: "8px", border: "none",
                  cursor: "pointer", fontSize: "14px", fontWeight: "500",
                  marginBottom: "4px", transition: "all 0.15s ease",
                  background: activeNav === item.id ? "#1a56db" : "transparent",
                  color: activeNav === item.id ? "white" : "#64748b",
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            onClick={handleSignOut}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "none", border: "none", cursor: "pointer",
              color: "#ef4444", fontSize: "14px", fontWeight: "600", padding: "8px 4px",
            }}
          >
            <SignOutIcon /> Sign Out
          </button>
        </aside>

        {/* Main content */}
        <main className="db-main">

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>

            {/* Hamburger (mobile only) */}
            <button className="db-hamburger" onClick={() => setSidebarOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Search bar */}
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: "10px",
              background: "white", borderRadius: "10px", padding: "10px 16px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0",
            }}>
              <span style={{ color: "#94a3b8", flexShrink: 0 }}><SearchIcon /></span>
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search Courses, Documents, Activities..."
                style={{
                  border: "none", outline: "none", background: "none",
                  fontSize: "14px", color: "#475569", width: "100%",
                }}
              />
            </div>

            {/* User avatar */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, cursor: "pointer" }}
              onClick={goToProfile} // <-- go to profile
            >
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "linear-gradient(135deg, #f97316, #ec4899)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: "13px", fontWeight: "700", flexShrink: 0,
              }}>
                {userName.charAt(0)}
              </div>
              <span className="db-username">{userName}</span>
            </div>
          </div>

          {/* Welcome banner */}
          <div style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #1a56db 60%, #2563eb 100%)",
            borderRadius: "16px", padding: "28px 32px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "28px", overflow: "hidden",
          }}>
            <h1 className="db-welcome-title" style={{ color: "white", fontSize: "24px", fontWeight: "700", margin: 0 }}>
              Welcome back, {userName}
            </h1>
            <div className="db-illustration">
              <ScientistIllustration />
            </div>
          </div>

          {/* Application status card */}
          <div className="db-status-card" style={{
            background: "white", borderRadius: "14px", padding: "24px 28px", maxWidth: "380px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0",
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", marginBottom: "20px" }}>
              My Application Status
            </h3>
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                You have not submitted any applications yet.
              </p>
              <button style={{
                background: "#1a56db", color: "white", border: "none",
                borderRadius: "8px", padding: "10px 24px",
                fontSize: "14px", fontWeight: "600", cursor: "pointer",
                transition: "background 0.15s ease",
              }}
                onMouseOver={(e) => (e.target.style.background = "#1e40af")}
                onMouseOut={(e) => (e.target.style.background = "#1a56db")}
              >
                Create Application
              </button>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}