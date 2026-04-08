// pages/adminDashboard/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/dashboard/Layout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import { fetchUsers }        from "../api/adminApi";
import { fetchApplications } from "../api/applicationApi";
import UserTable             from "../userManagement/UserTable";
import "../../css/dashboard/adminDashboard.css";

// ── Nav config ─────────────────────────────────────────────
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
  application:         "Applications",
};

// ── SVG icon helper ────────────────────────────────────────
function NavIcon({ d, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// ── Sidebar ────────────────────────────────────────────────
function Sidebar({ activeTab, onNavigate, onClose, isOpen, onSignOut }) {
  const userMgmtActive = USER_MANAGEMENT_ITEMS.some((i) => i.id === activeTab);
  const [umOpen, setUmOpen] = useState(userMgmtActive);
  const handleNav = (id) => { onNavigate(id); onClose(); };

  return (
    <aside className={`adm-sidebar ${isOpen ? "open" : ""}`}>
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

      <nav className="adm-nav">
        <p className="adm-nav-section-label">Main</p>
        <button className={`adm-nav-btn ${activeTab === "overview" ? "active" : ""}`} onClick={() => handleNav("overview")}>
          <NavIcon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />
          Overview
        </button>

        <div style={{ height: "1px", background: "#1e293b", margin: "10px 0" }} />
        <p className="adm-nav-section-label">Management</p>

        <button className={`adm-nav-btn ${activeTab === "application" ? "active" : ""}`} onClick={() => handleNav("application")}>
          <NavIcon d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2" />
          Applications
        </button>

        <button className={`adm-nav-group-toggle ${umOpen ? "open" : ""}`} onClick={() => setUmOpen((v) => !v)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          User Management
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`adm-nav-group-chevron ${umOpen ? "open" : ""}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div className="adm-nav-group-children" style={{ maxHeight: umOpen ? "300px" : "0" }}>
          {USER_MANAGEMENT_ITEMS.map((item) => (
            <button key={item.id} className={`adm-nav-sub-btn ${activeTab === item.id ? "active" : ""}`} onClick={() => handleNav(item.id)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <button className="adm-signout-btn" onClick={onSignOut}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
        </svg>
        Sign Out
      </button>
    </aside>
  );
}

// ── Custom tooltip ─────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f172a", borderRadius: "10px", padding: "10px 14px", fontSize: "12.5px", color: "white", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
      <p style={{ fontWeight: "700", marginBottom: "6px", color: "#94a3b8" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill || p.stroke, marginBottom: "2px" }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Stat card ──────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ borderLeft: `4px solid ${color}`, cursor: onClick ? "pointer" : "default" }}>
      <div className="stat-card-icon" style={{ background: `${color}18` }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value" style={{ color }}>{value ?? "—"}</p>
      {sub && <p className="stat-card-footer">{sub}</p>}
    </div>
  );
}

// ── Pie legend ─────────────────────────────────────────────
function PieLegend({ data, colors }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
      {data.map((d, i) => (
        <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: colors[i], flexShrink: 0 }} />
          <span style={{ fontSize: "12.5px", color: "#475569", flex: 1 }}>{d.name}</span>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Secondary stat mini cards ──────────────────────────────
function SecondaryStats({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" }}>
      {items.map((c) => (
        <div key={c.label} style={{ background: "white", borderRadius: "12px", padding: "16px 18px", border: "1px solid #e2e8f0", borderTop: `3px solid ${c.color}` }}>
          <p style={{ fontSize: "11.5px", color: "#94a3b8", marginBottom: "4px", fontWeight: "500" }}>{c.label}</p>
          <p style={{ fontSize: "24px", fontWeight: "800", color: c.color, letterSpacing: "-0.5px", margin: 0 }}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Tab bar ────────────────────────────────────────────────
function TabBar({ view, setView }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "24px" }}>
      {[{ id: "users", label: "Users" }, { id: "applications", label: "Applications" }].map((t) => {
        const active = view === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            style={{
              padding: "8px 22px", borderRadius: "2px",
              border: `1.5px solid ${active ? "#1b3a6b" : "#e2e8f0"}`,
              background: active ? "#1b3a6b" : "white",
              color: active ? "white" : "#475569",
              fontSize: "13px", fontWeight: "600",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Overview ───────────────────────────────────────────────
function Overview({ onNavigate }) {
  const [view,         setView]         = useState("users");
  const [users,        setUsers]        = useState({});
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);

  useEffect(() => {
    Promise.all([
      fetchUsers("applicant"),
      fetchUsers("student"),
      fetchUsers("industry_partner"),
      fetchUsers("industry_supervisor"),
      fetchApplications(),
    ])
      .then(([applicants, students, partners, supervisors, apps]) => {
        setUsers({ applicants, students, partners, supervisors });
        setApplications(apps);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p className="loading-text">Loading dashboard…</p>
    </div>
  );

  if (error) return (
    <div className="loading-container">
      <p className="loading-text" style={{ color: "#ef4444" }}>Failed to load dashboard. Please try again.</p>
    </div>
  );

  const { applicants = [], students = [], partners = [], supervisors = [] } = users;

  // ── User totals ─────────────────────────────────────────
  const totalUsers         = applicants.length + students.length + partners.length + supervisors.length;
  const activeStudents     = students.filter((s)   => s.status?.toLowerCase() === "active").length;
  const activePartners     = partners.filter((p)   => p.status?.toLowerCase() === "active").length;
  const approvedApplicants = applicants.filter((a) => a.status?.toLowerCase() === "active").length;
  const pendingApplicants  = applicants.filter((a) => a.status?.toLowerCase() === "pending").length;
  const rejectedApplicants = applicants.filter((a) => a.status?.toLowerCase() === "inactive").length;

  // ── Application stats (tallied with manager) ────────────
  const appCount = (...ss) =>
    applications.filter((a) => ss.includes(a.status?.toLowerCase())).length;

  const totalApps    = applications.length;
  const pendingApps  = appCount("pending", "submitted");
  const attendedApps = appCount("attended");
  const absentApps   = appCount("absent");
  const passedApps   = appCount("passed", "accepted");
  const failedApps   = appCount("failed");
  const passRate     = (attendedApps + absentApps + passedApps + failedApps) > 0
    ? Math.round((passedApps / (attendedApps + absentApps + passedApps + failedApps)) * 100)
    : 0;

  // ── Monthly: registrations ──────────────────────────────
  const monthlyData = (() => {
    const now    = new Date();
    const months = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1);
      return { month: d.toLocaleString("en-MY", { month: "short" }), year: d.getFullYear(), mon: d.getMonth(), applicants: 0, students: 0 };
    });
    [...applicants, ...students].forEach((u) => {
      const d   = new Date(u.created_at);
      const idx = months.findIndex((m) => m.year === d.getFullYear() && m.mon === d.getMonth());
      if (idx === -1) return;
      if (applicants.includes(u)) months[idx].applicants++;
      else months[idx].students++;
    });
    return months.map(({ month, applicants, students }) => ({ month, applicants, students }));
  })();

  // ── Monthly: partner onboarding ─────────────────────────
  const partnerMonthly = (() => {
    const now    = new Date();
    const months = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1);
      return { month: d.toLocaleString("en-MY", { month: "short" }), year: d.getFullYear(), mon: d.getMonth(), partners: 0 };
    });
    partners.forEach((p) => {
      const d   = new Date(p.created_at);
      const idx = months.findIndex((m) => m.year === d.getFullYear() && m.mon === d.getMonth());
      if (idx !== -1) months[idx].partners++;
    });
    return months.map(({ month, partners }) => ({ month, partners }));
  })();

  // ── Monthly: app submissions ────────────────────────────
  const appMonthlyData = (() => {
    const now    = new Date();
    const months = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1);
      return { month: d.toLocaleString("en-MY", { month: "short" }), year: d.getFullYear(), mon: d.getMonth(), submitted: 0, passed: 0 };
    });
    applications.forEach((a) => {
      const d   = new Date(a.created_at);
      const idx = months.findIndex((m) => m.year === d.getFullYear() && m.mon === d.getMonth());
      if (idx === -1) return;
      months[idx].submitted++;
      if (["passed", "accepted"].includes(a.status?.toLowerCase())) months[idx].passed++;
    });
    return months.map(({ month, submitted, passed }) => ({ month, submitted, passed }));
  })();

  // ── Monthly: pass rate ──────────────────────────────────
  const passRateLine = (() => {
    const now    = new Date();
    const months = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1);
      return { month: d.toLocaleString("en-MY", { month: "short" }), year: d.getFullYear(), mon: d.getMonth(), total: 0, passed: 0 };
    });
    applications.forEach((a) => {
      const s   = a.status?.toLowerCase();
      const d   = new Date(a.created_at);
      const idx = months.findIndex((m) => m.year === d.getFullYear() && m.mon === d.getMonth());
      if (idx === -1) return;
      if (["attended", "absent", "passed", "accepted", "failed"].includes(s)) months[idx].total++;
      if (["passed", "accepted"].includes(s)) months[idx].passed++;
    });
    return months.map(({ month, total, passed }) => ({ month, rate: total > 0 ? Math.round((passed / total) * 100) : 0 }));
  })();

  // ── Pie data ────────────────────────────────────────────
  const userPieData  = [
    { name: "Approved", value: approvedApplicants },
    { name: "Pending",  value: pendingApplicants  },
    { name: "Rejected", value: rejectedApplicants },
  ];
  const USER_PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

  const examPieData  = [
    { name: "Pending",  value: pendingApps  },
    { name: "Attended", value: attendedApps },
    { name: "Absent",   value: absentApps   },
    { name: "Passed",   value: passedApps   },
    { name: "Failed",   value: failedApps   },
  ];
  const EXAM_COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444"];

  const iconPaths = {
    applicant:  "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    student:    "M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5",
    partner:    "M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z M3 9l2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9 M12 3v6",
    supervisor: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 11l-4 4-2-2",
    total:      "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2",
    pending:    "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
    passed:     "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z",
    failed:     "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  };

  // ── Users view ──────────────────────────────────────────
  if (view === "users") return (
    <div>
      <TabBar view={view} setView={setView} />

      <div className="stat-cards-grid">
        <StatCard label="Total Applicants"     value={applicants.length}  sub={`${pendingApplicants} pending review`}          color="#6366f1" icon={iconPaths.applicant}  onClick={() => onNavigate("applicant")} />
        <StatCard label="Active Students"      value={activeStudents}     sub={`${students.length - activeStudents} inactive`} color="#0ea5e9" icon={iconPaths.student}    onClick={() => onNavigate("student")} />
        <StatCard label="Industry Partners"    value={partners.length}    sub={`${activePartners} active partnerships`}        color="#10b981" icon={iconPaths.partner}    onClick={() => onNavigate("industry_partner")} />
        <StatCard label="Industry Supervisors" value={supervisors.length} sub="Monitoring intern progress"                     color="#f59e0b" icon={iconPaths.supervisor} onClick={() => onNavigate("industry_supervisor")} />
      </div>

      <SecondaryStats items={[
        { label: "Approval rate",  value: applicants.length > 0 ? `${Math.round((approvedApplicants / applicants.length) * 100)}%` : "—", color: "#10b981" },
        { label: "Pending review", value: pendingApplicants,  color: "#f59e0b" },
        { label: "Rejected",       value: rejectedApplicants, color: "#ef4444" },
        { label: "Total users",    value: totalUsers,         color: "#6366f1" },
      ]} />

      <div className="charts-grid">
        <div className="chart-card">
          <p className="chart-card-title">Monthly Registrations</p>
          <p className="chart-card-subtitle">Applicants and students registered over the past 8 months</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={3} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar dataKey="applicants" name="Applicants" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="students"   name="Students"   fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <p className="chart-card-title">Applicant Status</p>
          <p className="chart-card-subtitle">Distribution by review status</p>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={userPieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                  {userPieData.map((_, i) => <Cell key={i} fill={USER_PIE_COLORS[i]} stroke="none" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <PieLegend data={userPieData} colors={USER_PIE_COLORS} />
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ marginBottom: 0 }}>
        <div className="chart-card" style={{ marginBottom: "24px" }}>
          <p className="chart-card-title">Industry Partner Onboarding</p>
          <p className="chart-card-subtitle">New industry partners joining each month</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={partnerMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="partners" name="Partners" stroke="#10b981" strokeWidth={2.5}
                dot={{ r: 4, fill: "#10b981", stroke: "white", strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card" style={{ marginBottom: "24px" }}>
          <p className="chart-card-title">Application Status</p>
          <p className="chart-card-subtitle">Exam and interview stage breakdown</p>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={examPieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                  {examPieData.map((_, i) => <Cell key={i} fill={EXAM_COLORS[i]} stroke="none" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <PieLegend data={examPieData} colors={EXAM_COLORS} />
          </div>
        </div>
      </div>

      <div className="chart-card">
        <p className="chart-card-title" style={{ marginBottom: "16px" }}>User Type Distribution</p>
        {[
          { label: "Applicants",           count: applicants.length,  color: "#6366f1" },
          { label: "Students",             count: students.length,    color: "#0ea5e9" },
          { label: "Industry Partners",    count: partners.length,    color: "#10b981" },
          { label: "Industry Supervisors", count: supervisors.length, color: "#f59e0b" },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "12.5px", color: "#475569", fontWeight: "500" }}>{label}</span>
              <span style={{ fontSize: "12.5px", color: "#94a3b8" }}>{count} <span style={{ color: "#cbd5e1" }}>/ {totalUsers}</span></span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${Math.round((count / (totalUsers || 1)) * 100)}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Applications view (identical to manager) ────────────
  return (
    <div>
      <TabBar view={view} setView={setView} />

      <div className="stat-cards-grid">
        <StatCard label="Total Applications" value={totalApps}               sub={`${pendingApps} pending review`}               color="#1b3a6b" icon={iconPaths.total}   onClick={() => onNavigate("application")} />
        <StatCard label="Pending"            value={pendingApps}             sub="Awaiting interview"                             color="#6366f1" icon={iconPaths.pending} />
        <StatCard label="Passed"             value={passedApps}              sub={`${passRate}% pass rate overall`}               color="#10b981" icon={iconPaths.passed}  />
        <StatCard label="Failed / Absent"    value={failedApps + absentApps} sub={`${failedApps} failed · ${absentApps} absent`} color="#ef4444" icon={iconPaths.failed}  />
      </div>

      <SecondaryStats items={[
        { label: "Pass rate", value: `${passRate}%`, color: "#10b981" },
        { label: "Attended",  value: attendedApps,   color: "#0ea5e9" },
        { label: "Absent",    value: absentApps,     color: "#f59e0b" },
        { label: "Failed",    value: failedApps,     color: "#ef4444" },
      ]} />

      <div className="charts-grid">
        <div className="chart-card">
          <p className="chart-card-title">Monthly Applications</p>
          <p className="chart-card-subtitle">Applications submitted and passed over the past 8 months</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={appMonthlyData} barGap={3} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar dataKey="submitted" name="Submitted" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="passed"    name="Passed"    fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <p className="chart-card-title">Application Status</p>
          <p className="chart-card-subtitle">Distribution by current status</p>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={examPieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                  {examPieData.map((_, i) => <Cell key={i} fill={EXAM_COLORS[i]} stroke="none" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <PieLegend data={examPieData} colors={EXAM_COLORS} />
          </div>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: "24px" }}>
        <p className="chart-card-title">Monthly Pass Rate</p>
        <p className="chart-card-subtitle">Percentage of interviewed applicants who passed each month</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={passRateLine}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 100]} unit="%" />
            <Tooltip content={<CustomTooltip />} formatter={(v) => `${v}%`} />
            <Line type="monotone" dataKey="rate" name="Pass rate" stroke="#10b981" strokeWidth={2.5}
              dot={{ r: 4, fill: "#10b981", stroke: "white", strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <p className="chart-card-title" style={{ marginBottom: "16px" }}>Application Stage Distribution</p>
        {[
          { label: "Pending",  count: pendingApps,  color: "#6366f1" },
          { label: "Attended", count: attendedApps, color: "#0ea5e9" },
          { label: "Absent",   count: absentApps,   color: "#f59e0b" },
          { label: "Passed",   count: passedApps,   color: "#10b981" },
          { label: "Failed",   count: failedApps,   color: "#ef4444" },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "12.5px", color: "#475569", fontWeight: "500" }}>{label}</span>
              <span style={{ fontSize: "12.5px", color: "#94a3b8" }}>{count} <span style={{ color: "#cbd5e1" }}>/ {totalApps}</span></span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${Math.round((count / (totalApps || 1)) * 100)}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────
export default function AdminDashboard() {
  const navigate                  = useNavigate();
  const [activeTab, setTab]       = useState("overview");
  const [sidebarOpen, setSidebar] = useState(false);

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
      <div className="adm-topbar">
        <div style={{ flex: 1 }}>
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
      </div>

      {activeTab === "overview"
        ? <Overview onNavigate={setTab} />
        : <UserTable key={activeTab} type={activeTab} />
      }
    </AdminLayout>
  );
}