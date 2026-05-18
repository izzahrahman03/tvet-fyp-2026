// pages/partnerDashboard/PartnerDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import PartnerLayout from "../../components/dashboard/Layout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import { fetchVacancies }              from "../api/vacancyApi";
import { fetchInternshipApplications } from "../api/internshipApplicationApi";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const apiFetch = (path) =>
  fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

// ── Custom tooltip ─────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0f172a", borderRadius: 8, padding: "10px 14px",
      fontSize: 12.5, color: "white", boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: "#94a3b8" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill || p.stroke, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Stat card ──────────────────────────────────────────────
function StatCard({ label, value, accent, icon, sublabel }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #dce6f0",
      borderTop: `3px solid ${accent}`, borderRadius: 2,
      padding: "20px 22px", display: "flex", flexDirection: "column", gap: 6,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {label}
        </p>
        <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      </div>
      <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: accent, lineHeight: 1 }}>{value ?? "—"}</p>
      {sublabel && <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{sublabel}</p>}
    </div>
  );
}

// ── Mini progress ring ─────────────────────────────────────
function ProgressRing({ pct, color, size = 56, stroke = 5 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - Math.min(pct, 1))}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

// ── Pie legend ─────────────────────────────────────────────
function PieLegend({ data, colors }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
      {data.map((d, i) => (
        <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: colors[i], flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "#475569", flex: 1 }}>{d.name}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Shared dropdown style ──────────────────────────────────
const selectStyle = {
  border: "1.5px solid #dce6f0", borderRadius: 6,
  padding: "5px 10px", fontSize: 12, fontWeight: 600,
  color: "#1b3a6b", background: "#fff", cursor: "pointer",
  outline: "none", appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
  paddingRight: 28,
};

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function PartnerDashboard() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName   = storedUser?.name || "Guest";

  const [vacancies,    setVacancies]    = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);
  const [filters,  setFilters]  = useState({ intake: "" });
  const [intakes,  setIntakes]  = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setFetching(true);
    const params = new URLSearchParams();
    if (filters.intake) params.set("intake", filters.intake);

    Promise.all([
      fetchVacancies(filters.intake),
      fetchInternshipApplications(filters.intake),
      apiFetch("/intakes"),
    ])
      .then(([vacs, apps, intakeData]) => {
        setVacancies(vacs);
        setApplications(apps);
        setIntakes(intakeData.intakes ?? []);
      })
      .catch(() => setError(true))
      .finally(() => { setLoading(false); setFetching(false); });
  }, [filters.intake]);

  const setFilter  = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const clearAll   = ()         => setFilters({ intake: "" });
  const hasFilters = !!filters.intake;
  const intakeName = intakes.find(i => String(i.intake_id) === String(filters.intake))?.intake_name ?? "";

  // ── Normalised status helpers ──────────────────────────
  const getStatus = (app) =>
    (app.status || app.application_status || app.partner_status || "").toString().toLowerCase();

  const getStudentStatus = (app) =>
    (app.internship_applicant_response || app.applicant_status || app.applicant_response || "").toString().toLowerCase();

  // ── Base stats ─────────────────────────────────────────
  const totalVacancies  = vacancies.length;
  const openVacancies   = vacancies.filter((v) => v.status?.toLowerCase() === "open").length;
  const closedVacancies = vacancies.filter((v) => v.status?.toLowerCase() === "closed").length;
  const totalApplicants = applications.length;

  const pendingApps    = applications.filter((a) => ["pending", "reviewing"].includes(getStatus(a))).length;
  const interviewApps  = applications.filter((a) => ["interview", "interview_scheduled"].includes(getStatus(a))).length;
  const passedApps     = applications.filter((a) => ["passed", "offer_sent"].includes(getStatus(a))).length;
  const acceptedApps   = applications.filter((a) => getStudentStatus(a) === "accepted").length;
  const failedApps     = applications.filter((a) => ["failed", "rejected", "declined", "absent"].includes(getStatus(a))).length;
  const withdrawnApps  = applications.filter((a) => ["withdrawn", "withdraw_requested"].includes(getStudentStatus(a))).length;
  const terminatedApps = applications.filter((a) => ["terminated"].includes(getStatus(a))).length;
  const acceptancePct  = totalApplicants > 0 ? Math.round((acceptedApps / totalApplicants) * 100) : 0;

  // ── Monthly bar chart data ─────────────────────────────
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (6 - 1 - i), 1);
      return {
        month: d.toLocaleString("en-MY", { month: "short" }),
        year:  d.getFullYear(),
        mon:   d.getMonth(),
        applications: 0,
        accepted: 0,
      };
    });

    applications.forEach((a) => {
      const dateStr = a.created_at || a.applied_date || a.applied_at;
      if (!dateStr) return;
      const d   = new Date(dateStr);
      if (isNaN(d)) return;
      const idx = months.findIndex((m) => m.year === d.getFullYear() && m.mon === d.getMonth());
      if (idx === -1) return;
      months[idx].applications++;
      if (getStudentStatus(a) === "accepted") months[idx].accepted++;
    });

    return months.map(({ month, applications, accepted }) => ({ month, applications, accepted }));
  }, [applications]);

  // ── Vacancy postings line chart ────────────────────────
  const vacPostingsData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (6 - 1 - i), 1);
      return {
        month: d.toLocaleString("en-MY", { month: "short" }),
        year:  d.getFullYear(),
        mon:   d.getMonth(),
        vacancies: 0,
      };
    });

    vacancies.forEach((v) => {
      const dateStr = v.created_at || v.start_date || v.posted_at;
      if (!dateStr) return;
      const d   = new Date(dateStr);
      if (isNaN(d)) return;
      const idx = months.findIndex((m) => m.year === d.getFullYear() && m.mon === d.getMonth());
      if (idx !== -1) months[idx].vacancies++;
    });

    return months.map(({ month, vacancies }) => ({ month, vacancies }));
  }, [vacancies]);

  // ── Loading / error guards ─────────────────────────────
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

  // ── Pie chart data ─────────────────────────────────────
  const vacPieData = [
    { name: "Open",   value: openVacancies   },
    { name: "Closed", value: closedVacancies },
  ];
  const VAC_COLORS = ["#10b981", "#ef4444"];

  const appPieData = [
    { name: "Pending",    value: pendingApps    },
    { name: "Interview",  value: interviewApps  },
    { name: "Passed",     value: passedApps     },
    { name: "Accepted",   value: acceptedApps   },
    { name: "Failed",     value: failedApps     },
    { name: "Withdrawn",  value: withdrawnApps  },
    { name: "Terminated", value: terminatedApps },
  ];
  const APP_COLORS = ["#f59e0b", "#6d28d9", "#0ea5e9", "#10b981", "#ef4444", "#ff7434", "#f71d00"];

  // ── Greeting ───────────────────────────────────────────
  const now = new Date();
  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const iconPaths = {
    vacancy:   "M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9zM3 9l2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9M12 3v6",
    open:      "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z",
    applicant: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    accepted:  "M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5",
  };

  return (
    <PartnerLayout title="Dashboard">

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-card { animation: fadeUp 0.35s ease both; }
        .dash-card:nth-child(1) { animation-delay: 0.05s; }
        .dash-card:nth-child(2) { animation-delay: 0.10s; }
        .dash-card:nth-child(3) { animation-delay: 0.15s; }
        .dash-card:nth-child(4) { animation-delay: 0.20s; }
        .slot-row:hover { background: #f8fafc !important; }
        .filter-select:focus { border-color: #1b3a6b; }
      `}</style>

      {/* ── Welcome banner ────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(120deg, #1b3a6b 60%, #2563eb)",
        borderRadius: 2, padding: "28px 32px", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
        boxShadow: "0 4px 20px rgba(27,58,107,0.2)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", right: 60, bottom: -60, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "relative" }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {greeting()}
          </p>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            {userName}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            {pendingApps > 0
              ? `${pendingApps} application${pendingApps !== 1 ? "s" : ""} pending review.`
              : openVacancies > 0
              ? `${openVacancies} open vacanc${openVacancies !== 1 ? "ies" : "y"} accepting applications.`
              : "All applications are up to date."}
          </p>
        </div>
        <div style={{ position: "relative", display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Acceptance Rate",  value: `${acceptancePct}%`, color: "#10b981" },
            { label: "Total Applicants", value: totalApplicants,     color: "#fff"    },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 2, padding: "10px 18px", textAlign: "center",
            }}>
              <p style={{ margin: "0 0 2px", fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────── */}
      <div style={{
        background: "#fff", border: "1px solid #dce6f0", borderRadius: 2,
        padding: "14px 20px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em", flexShrink: 0 }}>
          Filters
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>Intake:</label>
          <select
            className="filter-select"
            value={filters.intake}
            onChange={(e) => setFilter("intake", e.target.value)}
            style={{
              ...selectStyle,
              borderColor: filters.intake ? "#2563eb" : "#dce6f0",
              color: filters.intake ? "#2563eb" : "#1b3a6b",
            }}
          >
            <option value="">All Intakes</option>
            {intakes.map((i) => (
              <option key={i.intake_id} value={i.intake_id}>{i.intake_name}</option>
            ))}
          </select>
        </div>

        {fetching && (
          <span style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>Updating…</span>
        )}

        {hasFilters && (
          <button
            onClick={clearAll}
            style={{
              marginLeft: "auto", padding: "5px 14px", borderRadius: 2,
              border: "1px solid #fecaca", background: "#fff5f5",
              color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            ✕ Reset
          </button>
        )}
      </div>

      {/* Filter scope note */}
      {hasFilters && (
        <div style={{
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 2, padding: "8px 14px", marginBottom: 20,
          fontSize: 12, color: "#92400e",
        }}>
          <strong>Note:</strong> Intake filter applies to vacancy and application data shown below.
        </div>
      )}

      {/* ── Stat cards ────────────────────────────────────── */}
      <div
        className="dash-card"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 28 }}
      >
        <StatCard label="Total Vacancies"  value={totalVacancies}  accent="#1b3a6b" sublabel={`${openVacancies} open · ${closedVacancies} closed`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b3a6b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths.vacancy}/></svg>} />
        <StatCard label="Open Vacancies"   value={openVacancies}   accent="#10b981" sublabel="Currently accepting"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths.open}/></svg>} />
        <StatCard label="Total Applicants" value={totalApplicants} accent="#6366f1" sublabel={`${pendingApps} pending review`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths.applicant}/></svg>} />
        <StatCard label="Active Interns"   value={acceptedApps}    accent="#0ea5e9" sublabel={`${passedApps} offer${passedApps !== 1 ? "s" : ""} awaiting response`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths.accepted}/></svg>} />
      </div>

      {/* ── Two-column: Acceptance progress + Vacancy status ─ */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Acceptance Progress ring */}
        <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Acceptance Progress
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <ProgressRing
                pct={totalApplicants > 0 ? acceptedApps / totalApplicants : 0}
                color={acceptancePct >= 50 ? "#10b981" : acceptancePct >= 25 ? "#f59e0b" : "#2563eb"}
                size={72} stroke={6}
              />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#1b3a6b" }}>{acceptancePct}%</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, color: "#475569" }}>
                <strong style={{ color: "#1b3a6b" }}>{acceptedApps}</strong> of <strong style={{ color: "#1b3a6b" }}>{totalApplicants}</strong> accepted
              </p>
              <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  background: acceptancePct >= 50 ? "#10b981" : acceptancePct >= 25 ? "#f59e0b" : "#2563eb",
                  width: `${acceptancePct}%`, transition: "width 0.8s ease",
                }} />
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#94a3b8" }}>
                {passedApps > 0 ? `${passedApps} offer${passedApps !== 1 ? "s" : ""} awaiting student response` : "No pending offers"}
              </p>
            </div>
          </div>
        </div>

        {/* Vacancy status donut */}
        <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Vacancy Status
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 11, color: "#94a3b8" }}>Open vs closed breakdown</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%" }}>
            <div style={{ width: 180 }}>
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={vacPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                    {vacPieData.map((_, i) => <Cell key={i} fill={VAC_COLORS[i]} stroke="none" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <PieLegend data={vacPieData} colors={VAC_COLORS} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts row ────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Bar chart: monthly applications */}
        <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Monthly Applications
          </p>
          <p style={{ margin: "0 0 16px", fontSize: 11, color: "#94a3b8" }}>Applications received and accepted (last 6 months)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barGap={3} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="applications" name="Applications" fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="accepted"     name="Accepted"     fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart: application status */}
        <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Applicant Status
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 11, color: "#94a3b8" }}>Distribution by review status</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%" }}>
            <div style={{ width: 180 }}>
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={appPieData} cx="50%" cy="50%" innerRadius={34} outerRadius={56} paddingAngle={3} dataKey="value">
                    {appPieData.map((_, i) => <Cell key={i} fill={APP_COLORS[i]} stroke="none" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <PieLegend data={appPieData} colors={APP_COLORS} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Line chart: vacancy postings ─────────────────── */}
      <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "20px 22px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Vacancy Postings Over Time
        </p>
        <p style={{ margin: "0 0 16px", fontSize: 11, color: "#94a3b8" }}>
          Applications received and accepted (last 6 months)
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={vacPostingsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="vacancies" name="Vacancies" stroke="#1b3a6b" strokeWidth={2.5}
              dot={{ r: 4, fill: "#1b3a6b", stroke: "white", strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </PartnerLayout>
  );
}