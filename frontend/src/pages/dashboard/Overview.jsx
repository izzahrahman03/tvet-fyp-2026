// components/Overview.jsx
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import { fetchStats } from "../api/adminApi";

// ─── Mini Stat Card ───────────────────────────────────────
function StatCard({ label, value, sub, color, icon, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-card-icon" style={{ background: `${color}18` }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value" style={{ color }}>{value}</p>
      {sub && <p className="stat-card-footer">{sub}</p>}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────
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

// ─── Pie Legend ───────────────────────────────────────────
const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

function PieLegend({ data }) {
  const labels = ["Approved", "Pending", "Rejected"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
      {data.map((d, i) => (
        <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: PIE_COLORS[i], flexShrink: 0 }} />
          <span style={{ fontSize: "12.5px", color: "#475569", flex: 1 }}>{labels[i]}</span>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Overview Main ────────────────────────────────────────
export default function Overview({ onNavigate, role = 'admin' }) {
  const [stats, setStats]   = useState(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]  = useState(null);

 useEffect(() => {
    fetchStats(role)                                 // ← pass role
      .then(setStats)
      .catch(() => setError(true))                   // ← catch the denied error
      .finally(() => setLoad(false));
  }, [role]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading dashboard…</p>
      </div>
    );
  }

  // ← add this block before destructuring
  if (error || !stats) {
    return (
      <div className="loading-container">
        <p className="loading-text" style={{ color: '#ef4444' }}>
          Failed to load dashboard stats. Please try again.
        </p>
      </div>
    );
  }

  const { totals, applicantByStatus, activeStudents, activePartners, monthly } = stats;

  const pieData = [
    { name: "Approved", value: applicantByStatus.Approved },
    { name: "Pending",  value: applicantByStatus.Pending  },
    { name: "Rejected", value: applicantByStatus.Rejected },
  ];

  const iconPaths = {
    applicant:  "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    student:    "M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5",
    partner:    "M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z M3 9l2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9 M12 3v6",
    supervisor: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 11l-4 4-2-2",
  };

  return (
    <div>
      {/* ── Stat Cards ── */}
      <div className="stat-cards-grid">
        <StatCard label="Total Applicants"      value={totals.applicant}           color="#6366f1" icon={iconPaths.applicant}  sub={`${applicantByStatus.Pending} pending review`}        onClick={() => onNavigate("applicant")} />
        <StatCard label="Active Students"       value={activeStudents}             color="#0ea5e9" icon={iconPaths.student}    sub={`${totals.student - activeStudents} inactive`}        onClick={() => onNavigate("student")} />
        <StatCard label="Industry Partners"     value={totals.industry_partner}    color="#10b981" icon={iconPaths.partner}    sub={`${activePartners} active partnerships`}              onClick={() => onNavigate("industry_partner")} />
        <StatCard label="Industry Supervisors"  value={totals.industry_supervisor} color="#f59e0b" icon={iconPaths.supervisor} sub="Monitoring intern progress"                           onClick={() => onNavigate("industry_supervisor")} />
      </div>

      {/* ── Secondary stats row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Approval Rate", value: `${Math.round((applicantByStatus.Approved / totals.applicant) * 100)}%`,   color: "#10b981" },
          { label: "Pending Review", value: applicantByStatus.Pending,                                                 color: "#f59e0b" },
          { label: "Rejected",       value: applicantByStatus.Rejected,                                                color: "#ef4444" },
          { label: "Total Users",    value: totals.applicant + totals.student + totals.industry_partner + totals.industry_supervisor, color: "#6366f1" },
        ].map((c) => (
          <div key={c.label} style={{
            background: "white", borderRadius: "12px", padding: "16px 18px",
            border: "1px solid #e2e8f0", borderTop: `3px solid ${c.color}`,
          }}>
            <p style={{ fontSize: "11.5px", color: "#94a3b8", marginBottom: "4px", fontWeight: "500" }}>{c.label}</p>
            <p style={{ fontSize: "24px", fontWeight: "800", color: c.color, letterSpacing: "-0.5px" }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="charts-grid">

        {/* Bar chart: monthly registrations */}
        <div className="chart-card">
          <p className="chart-card-title">Monthly Registrations</p>
          <p className="chart-card-subtitle">Applicants and students registered over the past 8 months</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} barGap={3} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar dataKey="applicants" name="Applicants" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="students"   name="Students"   fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart: applicant status breakdown */}
        <div className="chart-card">
          <p className="chart-card-title">Applicant Status</p>
          <p className="chart-card-subtitle">Distribution by review status</p>
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
            <PieLegend data={pieData} />
          </div>
        </div>
      </div>

      {/* ── Line chart: partner growth ── */}
      <div className="chart-card" style={{ marginBottom: "24px" }}>
        <p className="chart-card-title">Industry Partner Onboarding</p>
        <p className="chart-card-subtitle">New industry partners joining each month</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="partners" name="Partners" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981", stroke: "white", strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Progress bars ── */}
      <div className="chart-card">
        <p className="chart-card-title" style={{ marginBottom: "16px" }}>User Type Distribution</p>
        {[
          { label: "Applicants",          count: totals.applicant,           total: totals.applicant + totals.student + totals.industry_partner + totals.industry_supervisor, color: "#6366f1" },
          { label: "Students",            count: totals.student,             total: totals.applicant + totals.student + totals.industry_partner + totals.industry_supervisor, color: "#0ea5e9" },
          { label: "Industry Partners",   count: totals.industry_partner,    total: totals.applicant + totals.student + totals.industry_partner + totals.industry_supervisor, color: "#10b981" },
          { label: "Industry Supervisors",count: totals.industry_supervisor, total: totals.applicant + totals.student + totals.industry_partner + totals.industry_supervisor, color: "#f59e0b" },
        ].map(({ label, count, total, color }) => (
          <div key={label} style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "12.5px", color: "#475569", fontWeight: "500" }}>{label}</span>
              <span style={{ fontSize: "12.5px", color: "#94a3b8" }}>{count} <span style={{ color: "#cbd5e1" }}>/ {total}</span></span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${(count / total) * 100}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}