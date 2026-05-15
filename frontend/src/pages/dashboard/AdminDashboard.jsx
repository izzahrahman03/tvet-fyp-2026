// pages/adminDashboard/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/dashboard/Layout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import "../../css/dashboard/adminDashboard.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const apiFetch = (path) =>
  fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

// ── Palette ───────────────────────────────────────────────
const C = {
  navy:   "#1b3a6b", blue:   "#2563eb", teal:   "#0ea5e9",
  green:  "#10b981", amber:  "#f59e0b", red:    "#ef4444",
  purple: "#6366f1", slate:  "#64748b", border: "#dce6f0",
};

const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

// ── Shared dropdown style (matches Partner) ────────────────
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

// ── Custom tooltip ────────────────────────────────────────
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0f172a", borderRadius: 8, padding: "10px 14px",
      fontSize: 12.5, color: "white", boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: "#94a3b8" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color || p.fill || p.stroke, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Stat card (matches Partner's StatCard) ────────────────
function StatCard({ label, value, accent, sublabel, icon }) {
  return (
    <div className="dash-card" style={{
      background: "#fff", border: "1px solid #dce6f0",
      borderTop: `3px solid ${accent}`, borderRadius: 2,
      padding: "20px 22px", display: "flex", flexDirection: "column", gap: 6,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {label}
        </p>
        {icon && <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>}
      </div>
      <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: accent, lineHeight: 1 }}>{value}</p>
      {sublabel && <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{sublabel}</p>}
    </div>
  );
}

// ── Chart card (matches Partner's dash-card style) ────────
function Card({ title, subtitle, children, style = {} }) {
  return (
    <div className="dash-card" style={{
      background: "#fff", border: "1px solid #dce6f0", borderRadius: 2,
      padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", ...style,
    }}>
      <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {title}
      </p>
      {subtitle && <p style={{ margin: "0 0 16px", fontSize: 11, color: "#94a3b8" }}>{subtitle}</p>}
      {!subtitle && <div style={{ marginBottom: 16 }} />}
      {children}
    </div>
  );
}

// ── Pie legend (matches Partner) ─────────────────────────
function PieLegend({ data }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
      {data.map((d) => (
        <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.fill, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "#475569", flex: 1 }}>{d.name}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const navigate   = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [filters,  setFilters]  = useState({ intake: "" });
  const [intakes,  setIntakes]  = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setFetching(true);
    const params = new URLSearchParams();
    if (filters.intake) params.set("intake", filters.intake);

    apiFetch(`/admin-dashboard?${params}`)
      .then((d) => { setData(d); setIntakes(d.meta?.intakes ?? []); })
      .catch(() => setError(true))
      .finally(() => { setLoading(false); setFetching(false); });
  }, [filters.intake]);

  const setFilter  = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const clearAll   = ()         => setFilters({ intake: "" });
  const hasFilters = !!filters.intake;

  const intakeName = intakes.find(i => String(i.intake_id) === String(filters.intake))?.intake_name ?? "";

  // ── Loading / error screens ───────────────────────────
  if (loading) return (
    <AdminLayout>
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading dashboard…</p>
      </div>
    </AdminLayout>
  );

  if (!data.applications || !data.internship || !data.attendance) return (
    <AdminLayout>
      <div style={{ padding: 40, textAlign: "center", color: C.red, fontSize: 14 }}>
        Incomplete data received. Please refresh the page.
      </div>
    </AdminLayout>
  );

  const { users, applications, internship, attendance } = data;
  const ap = applications.pipeline;
  const pl = internship.placement;
  const at = attendance.summary;

  // ── KPI calculations ──────────────────────────────────
  const evaluated      = ap.attended + ap.absent + ap.passed + ap.failed;
  const passRate       = pct(ap.passed,                      evaluated);
  const acceptRate     = pct(applications.response.accepted, ap.passed);
  const placementRate  = pct(pl.placed,                      pl.total);
  const attendanceRate = pct(at.present,                     at.present + at.absent);

  // ── Status pie data ───────────────────────────────────
  const statusPie = [
    { name: "Submitted", value: ap.submitted, fill: C.blue   },
    { name: "Attended",  value: ap.attended,  fill: C.teal   },
    { name: "Absent",    value: ap.absent,    fill: C.amber  },
    { name: "Passed",    value: ap.passed,    fill: C.green  },
    { name: "Failed",    value: ap.failed,    fill: C.red    },
  ].filter((d) => d.value > 0);

  // ── Users bar data ────────────────────────────────────
  const usersBar = [
    { name: "Applicants",   value: users.counts.applicants,   fill: C.purple },
    { name: "Students",     value: users.counts.students,     fill: C.teal   },
    { name: "Partners",     value: users.counts.partners,     fill: C.green  },
    { name: "Supervisors",  value: users.counts.supervisors,  fill: C.amber  },
    { name: "Interviewers", value: users.counts.interviewers, fill: C.red    },
    { name: "Managers",     value: users.counts.managers,     fill: C.navy   },
  ];

  // ── Company bar data ──────────────────────────────────
  const companyBar = (internship.placementByCompany || []).map((r) => ({
    name:     r.company_name?.length > 22 ? r.company_name.slice(0, 22) + "…" : r.company_name,
    students: Number(r.student_count) || 0,
  }));

  // ── Greeting ──────────────────────────────────────────
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  return (
    <AdminLayout>

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
        .filter-select:focus { border-color: #1b3a6b; }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* ── Welcome banner ─────────────────────────── */}
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
              {greeting}
            </p>
            <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              {storedUser?.name || "Admin"}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              {[
                attendance.leave.pending > 0 && `${attendance.leave.pending} leave request${attendance.leave.pending > 1 ? "s" : ""} pending`,
                ap.submitted > 0            && `${ap.submitted} application${ap.submitted > 1 ? "s" : ""} submitted`,
                pl.not_placed > 0           && `${pl.not_placed} student${pl.not_placed > 1 ? "s" : ""} not yet placed`,
              ].filter(Boolean).join("  ·  ") || "All systems normal"}
            </p>
          </div>
          <div style={{ position: "relative", display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "Pass Rate",    value: `${passRate}%`,    color: passRate >= 60 ? C.green : C.amber },
              { label: "Placement",    value: `${placementRate}%`, color: placementRate >= 70 ? C.green : C.teal },
              { label: "Total Students", value: users.counts.students, color: "#fff" },
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
          <span style={{ fontSize: 11, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.07em", flexShrink: 0 }}>
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
                borderColor: filters.intake ? C.blue : "#dce6f0",
                color: filters.intake ? C.blue : C.navy,
              }}
            >
              <option value="">All Intakes</option>
              {intakes.map((i) => (
                <option key={i.intake_id} value={i.intake_id}>{i.intake_name}</option>
              ))}
            </select>
          </div>

          {fetching && (
            <span style={{ fontSize: 12, color: C.slate, fontStyle: "italic" }}>Updating…</span>
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

        {/* ── Filter scope note ──────────────────────── */}
        {hasFilters && (
          <div style={{
            background: "#fffbeb", border: "1px solid #fde68a",
            borderRadius: 2, padding: "8px 14px", marginBottom: 20,
            fontSize: 12, color: "#92400e",
          }}>
            <strong>Note:</strong> Intake filter applies to: application pipeline, internship placement, attendance &amp; company chart.
            User counts are always shown globally.
          </div>
        )}

        {/* ── 4 KPI stat cards ───────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 20 }}>
          <StatCard
            label="Application Pass Rate"
            value={`${passRate}%`}
            accent={passRate >= 60 ? C.green : passRate >= 40 ? C.amber : C.red}
            sublabel={`${ap.passed} of ${evaluated} evaluated`}
          />
          <StatCard
            label="Acceptance Rate"
            value={`${acceptRate}%`}
            accent={acceptRate >= 70 ? C.green : acceptRate >= 40 ? C.amber : C.red}
            sublabel={`${applications.response.accepted} of ${ap.passed} passed`}
          />
          <StatCard
            label={`Internship Placement${intakeName ? ` · ${intakeName}` : ""}`}
            value={`${placementRate}%`}
            accent={placementRate >= 70 ? C.green : placementRate >= 40 ? C.teal : C.amber}
            sublabel={`${pl.placed} placed · ${pl.pending} pending · ${pl.not_placed} not placed`}
          />
          <StatCard
            label="Attendance Rate"
            value={`${attendanceRate}%`}
            accent={attendanceRate >= 90 ? C.green : attendanceRate >= 75 ? C.amber : C.red}
            sublabel={`${at.present} present · ${at.absent} absent · ${at.pending} unverified`}
          />
        </div>

        {/* ── Leave & Overtime summary ─────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          <Card title="Leave Requests" subtitle="Overall leave request status">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { label: "Pending",  value: attendance.leave.pending,  color: C.amber },
                { label: "Approved", value: attendance.leave.approved, color: C.green },
                { label: "Rejected", value: attendance.leave.rejected, color: C.red   },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2,
                  padding: "12px 14px", borderLeft: `3px solid ${color}`,
                }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b", fontWeight: 600 }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color }}>{value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Overtime Requests" subtitle="Overall overtime request status">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { label: "Pending",  value: attendance.overtime.pending,  color: C.amber },
                { label: "Approved", value: attendance.overtime.approved, color: C.green },
                { label: "Rejected", value: attendance.overtime.rejected, color: C.red   },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2,
                  padding: "12px 14px", borderLeft: `3px solid ${color}`,
                }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b", fontWeight: 600 }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color }}>{value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Row 2: Monthly applications + Status pie ─ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          <Card title="Monthly Applications" subtitle="Application submissions trend (last 6 months)">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={applications.monthly} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="total_applications" name="Applications" fill={C.navy} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Application Status" subtitle="Distribution by review status">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ width: 180 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                      {statusPie.map((d, i) => <Cell key={i} fill={d.fill} stroke="none" />)}
                    </Pie>
                    <Tooltip content={<Tip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                {statusPie.map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.fill, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: "#475569", gap: 8 }}>{d.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{d.value}</span>
                  </div>
                ))}
                {statusPie.length === 0 && (
                  <p style={{ fontSize: 13, color: C.slate, margin: 0 }}>No evaluated applications yet.</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* ── Row 3: Users bar + Company placement bar ─ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          <Card title="Users by Role" subtitle="Total registered users per role">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={usersBar} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#475569" }} width={90} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" name="Users" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {usersBar.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card
            title={`Placement by Company${intakeName ? ` · ${intakeName}` : ""}`}
            subtitle="Top companies by students placed"
          >
            {companyBar.length === 0 ? (
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: 13, color: C.slate }}>
                  No placements recorded{intakeName ? ` for ${intakeName}` : ""}.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, companyBar.length * 36)}>
                <BarChart data={companyBar} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11.5, fill: "#475569" }} width={140} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="students" name="Students Placed" fill={C.teal} radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

      </div>
    </AdminLayout>
  );
}