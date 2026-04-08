// pages/managerDashboard/ManagerDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate }         from "react-router-dom";
import ManagerLayout           from "../../components/dashboard/Layout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import { fetchApplications }  from "../api/applicationApi";
import UserTable              from "../userManagement/UserTable";
import IntakeManagement       from "../userManagement/IntakePage";
import InterviewSlots         from "../userManagement/InterviewSlot";
import "../../css/dashboard/adminDashboard.css";

// ── Nav config ─────────────────────────────────────────────
const APP_MANAGEMENT_ITEMS = [
  {
    id:    "application",
    label: "Applications",
    icon:  "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  },
  {
    id:    "intake",
    label: "Intakes",
    icon:  "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
  {
    id:    "interview_slot",
    label: "Interview Slots",
    icon:  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 2 2z",
  },
];

const PAGE_TITLES = {
  overview:       "Overview",
  application:    "Applications",
  intake:         "Intakes",
  interview_slot: "Interview Slots",
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
          <p className="adm-logo-text-sub">Manager Panel</p>
        </div>
      </div>

      <nav className="adm-nav">
        <p className="adm-nav-section-label">Main</p>
        <button
          className={`adm-nav-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => handleNav("overview")}
        >
          <NavIcon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />
          Overview
        </button>

        <p className="adm-nav-section-label" style={{ marginTop: "12px" }}>Application Management</p>
        {APP_MANAGEMENT_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`adm-nav-btn ${activeTab === item.id ? "active" : ""}`}
            onClick={() => handleNav(item.id)}
          >
            <NavIcon d={item.icon} />
            {item.label}
          </button>
        ))}
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
    <div style={{
      background: "#0f172a", borderRadius: "10px", padding: "10px 14px",
      fontSize: "12.5px", color: "white", boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    }}>
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

// ── Overview ───────────────────────────────────────────────
function Overview({ onNavigate }) {
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);

  useEffect(() => {
    fetchApplications()
      .then(setApplications)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <p className="loading-text" style={{ color: "#ef4444" }}>
          Failed to load dashboard. Please try again.
        </p>
      </div>
    );
  }

  // ── Derived stats ────────────────────────────────────────
  const total     = applications.length;
  const appCount  = (...ss) =>
    applications.filter((a) => ss.includes(a.status?.toLowerCase())).length;

  const pending   = appCount("pending", "submitted");
  const attended  = appCount("attended");
  const absent    = appCount("absent");
  const passed    = appCount("passed", "accepted");
  const failed    = appCount("failed");

  const passRate  = attended + failed > 0
    ? Math.round((passed / (attended + absent + passed + failed)) * 100)
    : 0;

  // ── Monthly submissions (last 8 months) ──────────────────
  const monthlyData = (() => {
    const now    = new Date();
    const months = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1);
      return {
        month: d.toLocaleString("en-MY", { month: "short" }),
        year:  d.getFullYear(),
        mon:   d.getMonth(),
        submitted: 0,
        passed:    0,
      };
    });
    applications.forEach((a) => {
      const d   = new Date(a.created_at);
      const idx = months.findIndex((m) => m.year === d.getFullYear() && m.mon === d.getMonth());
      if (idx === -1) return;
      months[idx].submitted++;
      if (a.status?.toLowerCase() === "passed" || a.status?.toLowerCase() === "accepted") {
        months[idx].passed++;
      }
    });
    return months.map(({ month, submitted, passed }) => ({ month, submitted, passed }));
  })();

  // ── Monthly pass rate line ───────────────────────────────
  const passRateLine = (() => {
    const now    = new Date();
    const months = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1);
      return {
        month: d.toLocaleString("en-MY", { month: "short" }),
        year:  d.getFullYear(),
        mon:   d.getMonth(),
        total: 0, passed: 0,
      };
    });
    applications.forEach((a) => {
      const s   = a.status?.toLowerCase();
      const d   = new Date(a.created_at);
      const idx = months.findIndex((m) => m.year === d.getFullYear() && m.mon === d.getMonth());
      if (idx === -1) return;
      if (["attended", "absent", "passed", "accepted", "failed"].includes(s)) months[idx].total++;
      if (s === "passed" || s === "accepted") months[idx].passed++;
    });
    return months.map(({ month, total, passed }) => ({
      month,
      rate: total > 0 ? Math.round((passed / total) * 100) : 0,
    }));
  })();

  // ── Pie: status breakdown ────────────────────────────────
  const pieData = [
    { name: "Pending",  value: pending  },
    { name: "Attended", value: attended },
    { name: "Absent",   value: absent   },
    { name: "Passed",   value: passed   },
    { name: "Failed",   value: failed   },
  ];
  const PIE_COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444"];

  // ── Distribution rows ────────────────────────────────────
  const distRows = [
    { label: "Pending",  count: pending,  color: "#6366f1" },
    { label: "Attended", count: attended, color: "#0ea5e9" },
    { label: "Absent",   count: absent,   color: "#f59e0b" },
    { label: "Passed",   count: passed,   color: "#10b981" },
    { label: "Failed",   count: failed,   color: "#ef4444" },
  ];
  const safeTotal = total || 1;

  const iconPaths = {
    total:    "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2",
    pending:  "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
    passed:   "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z",
    failed:   "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  };

  return (
    <div>

      {/* ── Stat cards ────────────────────────────────────── */}
      <div className="stat-cards-grid">
        <StatCard
          label="Total Applications"
          value={total}
          sub={`${pending} pending review`}
          color="#1b3a6b"
          icon={iconPaths.total}
          onClick={() => onNavigate("application")}
        />
        <StatCard
          label="Pending"
          value={pending}
          sub="Awaiting interview"
          color="#6366f1"
          icon={iconPaths.pending}
        />
        <StatCard
          label="Passed"
          value={passed}
          sub={`${passRate}% pass rate overall`}
          color="#10b981"
          icon={iconPaths.passed}
        />
        <StatCard
          label="Failed / Absent"
          value={failed + absent}
          sub={`${failed} failed · ${absent} absent`}
          color="#ef4444"
          icon={iconPaths.failed}
        />
      </div>

      {/* ── Secondary stat row ────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Pass rate",       value: `${passRate}%`, color: "#10b981" },
          { label: "Attended",        value: attended,        color: "#0ea5e9" },
          { label: "Absent",          value: absent,          color: "#f59e0b" },
          { label: "Failed",          value: failed,          color: "#ef4444" },
        ].map((c) => (
          <div key={c.label} style={{
            background: "white", borderRadius: "12px", padding: "16px 18px",
            border: "1px solid #e2e8f0", borderTop: `3px solid ${c.color}`,
          }}>
            <p style={{ fontSize: "11.5px", color: "#94a3b8", marginBottom: "4px", fontWeight: "500" }}>{c.label}</p>
            <p style={{ fontSize: "24px", fontWeight: "800", color: c.color, letterSpacing: "-0.5px", margin: 0 }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts row ────────────────────────────────────── */}
      <div className="charts-grid">

        {/* Bar chart: monthly submissions vs passed */}
        <div className="chart-card">
          <p className="chart-card-title">Monthly Applications</p>
          <p className="chart-card-subtitle">Applications submitted and passed over the past 8 months</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={3} barCategoryGap="30%">
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

        {/* Pie chart: status breakdown */}
        <div className="chart-card">
          <p className="chart-card-title">Application Status</p>
          <p className="chart-card-subtitle">Distribution by current status</p>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <PieLegend data={pieData} colors={PIE_COLORS} />
          </div>
        </div>

      </div>

      {/* ── Line chart: monthly pass rate ────────────────── */}
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

      {/* ── Progress bars: stage distribution ────────────── */}
      <div className="chart-card">
        <p className="chart-card-title" style={{ marginBottom: "16px" }}>Application Stage Distribution</p>
        {distRows.map(({ label, count, color }) => (
          <div key={label} style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "12.5px", color: "#475569", fontWeight: "500" }}>{label}</span>
              <span style={{ fontSize: "12.5px", color: "#94a3b8" }}>
                {count} <span style={{ color: "#cbd5e1" }}>/ {total}</span>
              </span>
            </div>
            <div className="progress-bar-wrap">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.round((count / safeTotal) * 100)}%`, background: color }}
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────
export default function ManagerDashboard() {
  const navigate                  = useNavigate();
  const [activeTab, setTab]       = useState("overview");
  const [sidebarOpen, setSidebar] = useState(false);

  return (
    <ManagerLayout
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
          {activeTab !== "overview" && (
            <p style={{ fontSize: "11.5px", color: "#94a3b8", marginBottom: "1px" }}>
              Application Management
              <span style={{ margin: "0 5px", color: "#cbd5e1" }}>›</span>
              <span style={{ color: "#64748b" }}>{PAGE_TITLES[activeTab]}</span>
            </p>
          )}
          <h1 className="adm-page-title">{PAGE_TITLES[activeTab]}</h1>
          <p className="adm-page-subtitle">Vitrox Academy — Manager Panel</p>
        </div>
      </div>

      {activeTab === "overview"       && <Overview onNavigate={setTab} />}
      {activeTab === "application"    && <UserTable key="application" type="application" />}
      {activeTab === "intake"         && <IntakeManagement />}
      {activeTab === "interview_slot" && <InterviewSlots />}
    </ManagerLayout>
  );
}