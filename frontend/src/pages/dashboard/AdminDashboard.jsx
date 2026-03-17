// AdminDashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/dashboard/Layout";
import "../../css/dashboard/adminDashboard.css";
import Overview  from "./Overview";
import UserTable from "../userManagement/UserTable";

// ─── Nav Config ───────────────────────────────────────────
const USER_MANAGEMENT_ITEMS = [
  { id: "applicant",           label: "Applicants",           icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { id: "student",             label: "Students",             icon: "M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" },
  { id: "industry_partner",    label: "Industry Partners",    icon: "M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z M3 9l2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9 M12 3v6" },
  { id: "industry_supervisor", label: "Industry Supervisors", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 11l-4 4-2-2" },
];

const PAGE_TITLES = {
  overview:            "Overview",
  applicant:           "Applicants",
  student:             "Students",
  industry_partner:    "Industry Partners",
  industry_supervisor: "Industry Supervisors",
};

// ─── SVG Icon helper ──────────────────────────────────────
function NavIcon({ d, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// ─── Sidebar ──────────────────────────────────────────────
function Sidebar({ activeTab, onNavigate, onClose, isOpen, onSignOut }) {
  const userMgmtActive = USER_MANAGEMENT_ITEMS.some((i) => i.id === activeTab);
  const [umOpen, setUmOpen] = useState(userMgmtActive);

  const handleNav = (id) => {
    onNavigate(id);
    onClose();
  };

  return (
    <aside className={`adm-sidebar ${isOpen ? "open" : ""}`}>

      {/* Logo */}
      <div className="adm-logo">
        <div className="adm-logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
          </svg>
        </div>
        <div>
          <p className="adm-logo-text-main">Vitrox</p>
          <p className="adm-logo-text-sub">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="adm-nav">
        <p className="adm-nav-section-label">Main</p>

        {/* Overview */}
        <button
          className={`adm-nav-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => handleNav("overview")}
        >
          <NavIcon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />
          Overview
        </button>

        {/* Divider */}
        <div style={{ height: "1px", background: "#1e293b", margin: "10px 0" }} />
        <p className="adm-nav-section-label">Management</p>

        {/* User Management group toggle */}
        <button
          className={`adm-nav-group-toggle ${umOpen ? "open" : ""}`}
          onClick={() => setUmOpen((v) => !v)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          User Management
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`adm-nav-group-chevron ${umOpen ? "open" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Sub-items */}
        <div className="adm-nav-group-children" style={{ maxHeight: umOpen ? "300px" : "0" }}>
          {USER_MANAGEMENT_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`adm-nav-sub-btn ${activeTab === item.id ? "active" : ""}`}
              onClick={() => handleNav(item.id)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Sign out */}
      <button className="adm-signout-btn" onClick={onSignOut}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
        </svg>
        Sign Out
      </button>
    </aside>
  );
}

// ─── Main Dashboard ───────────────────────────────────────
export default function AdminDashboard() {
  const navigate                  = useNavigate();
  const [activeTab, setTab]       = useState("overview");
  const [sidebarOpen, setSidebar] = useState(false);
  const adminName = "Admin";

  return (
    <AdminLayout
      sidebarOpen={sidebarOpen}
      onClose={() => setSidebar(false)}
      sidebar={
        <Sidebar
          activeTab={activeTab}
          onNavigate={setTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebar(false)}
          onSignOut={() => { localStorage.clear(); navigate("/login"); }}
        />
      }
    >
      {/* Topbar */}
      <div className="adm-topbar">
        {/* <button className="adm-hamburger" onClick={() => setSidebar(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
            <path d="M3 6h18 M3 12h18 M3 18h18" />
          </svg>
        </button> */}

        <div style={{ flex: 1 }}>
          {/* Breadcrumb for sub-pages */}
          {USER_MANAGEMENT_ITEMS.some((i) => i.id === activeTab) && (
            <p style={{ fontSize: "11.5px", color: "#94a3b8", marginBottom: "1px" }}>
              User Management
              <span style={{ margin: "0 5px", color: "#cbd5e1" }}>›</span>
              <span style={{ color: "#64748b" }}>{PAGE_TITLES[activeTab]}</span>
            </p>
          )}
          <h1 className="adm-page-title">{PAGE_TITLES[activeTab]}</h1>
          <p className="adm-page-subtitle">Vitrox Academy — Admin Panel</p>
        </div>

        {/* <div className="adm-topbar-right">
          <div className="adm-avatar">A</div>
          <span className="adm-admin-name">{adminName}</span>
        </div> */}
      </div>

      {/* Page content */}
      {activeTab === "overview"
        ? <Overview onNavigate={setTab} />
        : <UserTable key={activeTab} type={activeTab} />
      }
    </AdminLayout>
  );
}