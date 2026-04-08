// pages/partnerDashboard/PartnerDashboard.jsx
import { useState, useEffect } from "react";
import PartnerLayout from "../../components/dashboard/Layout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import { fetchVacancies }               from "../api/vacancyApi";
import { fetchInternshipApplications }  from "../api/internshipApplicationApi";

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

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function PartnerDashboard() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName   = storedUser?.name || "Guest";

  const [vacancies,     setVacancies]     = useState([]);
  const [applications,  setApplications]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(false);

  useEffect(() => {
    Promise.all([fetchVacancies(), fetchInternshipApplications()])
      .then(([vacs, apps]) => {
        setVacancies(vacs);
        setApplications(apps);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PartnerLayout title="Dashboard">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Loading dashboard…</p>
        </div>
      </PartnerLayout>
    );
  }

  if (error) {
    return (
      <PartnerLayout title="Dashboard">
        <div className="loading-container">
          <p className="loading-text" style={{ color: "#ef4444" }}>
            Failed to load dashboard. Please try again.
          </p>
        </div>
      </PartnerLayout>
    );
  }

  // ── Derived stats ──────────────────────────────────────
  const totalVacancies  = vacancies.length;
  const openVacancies   = vacancies.filter((v) => v.status?.toLowerCase() === "open").length;
  const closedVacancies = vacancies.filter((v) => v.status?.toLowerCase() === "closed").length;
  const totalApplicants = applications.length;

  const appCount = (...ss) =>
    applications.filter((a) => ss.includes(a.status?.toLowerCase())).length;

  const pendingApps   = appCount("pending");
  const interviewApps = appCount("interview");
  const passedApps    = appCount("passed");
  const acceptedApps  = appCount("accepted");
  const failedApps    = appCount("failed", "absent", "declined");
  const withdrawnApps = appCount("withdrawn", "withdrawn_requested");

  // ── Monthly applications (last 6 months) ───────────────
  const monthlyData = (() => {
    const now    = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        month: d.toLocaleString("en-MY", { month: "short" }),
        year:  d.getFullYear(),
        mon:   d.getMonth(),
        applications: 0,
        accepted: 0,
      };
    });
    applications.forEach((a) => {
      const d   = new Date(a.applied_date);
      const idx = months.findIndex((m) => m.year === d.getFullYear() && m.mon === d.getMonth());
      if (idx !== -1) {
        months[idx].applications++;
        if (a.status?.toLowerCase() === "accepted") months[idx].accepted++;
      }
    });
    return months.map(({ month, applications, accepted }) => ({ month, applications, accepted }));
  })();

  // ── Vacancy status pie data ────────────────────────────
  const vacPieData   = [
    { name: "Open",   value: openVacancies   },
    { name: "Closed", value: closedVacancies },
  ];
  const VAC_COLORS = ["#10b981", "#ef4444"];

  // ── Application status pie data ────────────────────────
  const appPieData = [
    { name: "Pending",   value: pendingApps   },
    { name: "Interview", value: interviewApps },
    { name: "Passed",    value: passedApps    },
    { name: "Accepted",  value: acceptedApps  },
    { name: "Failed",    value: failedApps    },
  ];
  const APP_COLORS = ["#f59e0b", "#6d28d9", "#0ea5e9", "#10b981", "#ef4444"];

  // ── Distribution rows ──────────────────────────────────
  const distRows = [
    { label: "Pending",   count: pendingApps,   total: totalApplicants, color: "#f59e0b" },
    { label: "Interview", count: interviewApps, total: totalApplicants, color: "#6d28d9" },
    { label: "Passed",    count: passedApps,    total: totalApplicants, color: "#0ea5e9" },
    { label: "Accepted",  count: acceptedApps,  total: totalApplicants, color: "#10b981" },
    { label: "Failed",    count: failedApps,    total: totalApplicants, color: "#ef4444" },
  ];
  const safeTotal = totalApplicants || 1;

  const iconPaths = {
    vacancy:    "M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9zM3 9l2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9M12 3v6",
    open:       "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z",
    applicant:  "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    accepted:   "M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5",
  };

  return (
    <PartnerLayout title="Dashboard">

      {/* ── Welcome banner ──────────────────────────────── */}
      <div style={{
        background: "#1b3a6b",
        borderRadius: "5px", padding: "28px 32px", marginBottom: "28px",
      }}>
        <h1 style={{ color: "white", fontSize: "22px", fontWeight: "700", margin: 0 }}>
          Welcome back, {userName}
        </h1>
      </div>

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="stat-cards-grid">
        <StatCard
          label="Total Vacancies"
          value={totalVacancies}
          sub={`${openVacancies} open · ${closedVacancies} closed`}
          color="#1b3a6b"
          icon={iconPaths.vacancy}
        />
        <StatCard
          label="Open Vacancies"
          value={openVacancies}
          sub="Currently accepting applications"
          color="#10b981"
          icon={iconPaths.open}
        />
        <StatCard
          label="Total Applicants"
          value={totalApplicants}
          sub={`${pendingApps} pending review`}
          color="#6366f1"
          icon={iconPaths.applicant}
        />
        <StatCard
          label="Active Interns"
          value={acceptedApps}
          sub={`${passedApps} offer${passedApps !== 1 ? "s" : ""} awaiting response`}
          color="#0ea5e9"
          icon={iconPaths.accepted}
        />
      </div>

      {/* ── Secondary stat row ──────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          {
            label: "Acceptance rate",
            value: totalApplicants > 0
              ? `${Math.round((acceptedApps / totalApplicants) * 100)}%`
              : "—",
            color: "#10b981",
          },
          { label: "Pending review",  value: pendingApps,   color: "#f59e0b" },
          { label: "In interview",    value: interviewApps, color: "#6d28d9" },
          { label: "Withdrawn",       value: withdrawnApps, color: "#ef4444" },
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

      {/* ── Charts row ──────────────────────────────────── */}
      <div className="charts-grid">

        {/* Bar chart: monthly applications */}
        <div className="chart-card">
          <p className="chart-card-title">Monthly Applications</p>
          <p className="chart-card-subtitle">Applications received and accepted over the past 6 months</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={3} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="applications" name="Applications" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="accepted"     name="Accepted"     fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart: application status */}
        <div className="chart-card">
          <p className="chart-card-title">Applicant Status</p>
          <p className="chart-card-subtitle">Distribution by review status</p>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={appPieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                  {appPieData.map((_, i) => (
                    <Cell key={i} fill={APP_COLORS[i]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <PieLegend data={appPieData} colors={APP_COLORS} />
          </div>
        </div>

      </div>

      {/* ── Line chart: vacancy postings ─────────────────── */}
      <div className="chart-card" style={{ marginBottom: "24px" }}>
        <p className="chart-card-title">Vacancy Postings Over Time</p>
        <p className="chart-card-subtitle">Number of vacancies posted per month</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={(() => {
            const now    = new Date();
            const months = Array.from({ length: 6 }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
              return { month: d.toLocaleString("en-MY", { month: "short" }), year: d.getFullYear(), mon: d.getMonth(), vacancies: 0 };
            });
            vacancies.forEach((v) => {
              const d   = new Date(v.start_date);
              const idx = months.findIndex((m) => m.year === d.getFullYear() && m.mon === d.getMonth());
              if (idx !== -1) months[idx].vacancies++;
            });
            return months.map(({ month, vacancies }) => ({ month, vacancies }));
          })()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="vacancies" name="Vacancies" stroke="#1b3a6b" strokeWidth={2.5}
              dot={{ r: 4, fill: "#1b3a6b", stroke: "white", strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Progress bars: applicant distribution ────────── */}
      <div className="chart-card">
        <p className="chart-card-title" style={{ marginBottom: "16px" }}>Applicant Stage Distribution</p>
        {distRows.map(({ label, count, total, color }) => (
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

    </PartnerLayout>
  );
}