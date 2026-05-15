// pages/supervisor/SupervisorDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SupervisorLayout from "../../components/dashboard/Layout";
import { fetchSupervisorAttendance }     from "../api/timeApi";
import { fetchSupervisorLeaveRequests }  from "../api/timeApi";
import { fetchSupervisorOvertimeRequests } from "../api/timeApi";

// ── Helpers ───────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" }) : "—";

// ── Stat card ─────────────────────────────────────────────
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
      <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: accent, lineHeight: 1 }}>{value}</p>
      {sublabel && <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{sublabel}</p>}
    </div>
  );
}

// ── Mini circular progress ────────────────────────────────
function ProgressRing({ pct, color, size = 72, stroke = 6 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - Math.min(pct, 1))}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

// ── Status badge ─────────────────────────────────────────
const STATUS_STYLE = {
  pending:  { bg: "#fffbeb", color: "#92400e" },
  present:  { bg: "#dcfce7", color: "#15803d" },
  absent:   { bg: "#fee2e2", color: "#b91c1c" },
  approved: { bg: "#dcfce7", color: "#15803d" },
  rejected: { bg: "#fee2e2", color: "#b91c1c" },
};
function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span style={{
      display: "inline-block", padding: "2px 9px", borderRadius: 99,
      fontSize: 10, fontWeight: 700, textTransform: "capitalize",
      background: s.bg, color: s.color,
    }}>
      {status}
    </span>
  );
}

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function SupervisorDashboard() {
  const navigate   = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName   = storedUser?.name || "Supervisor";

  const [attendance, setAttendance] = useState([]);
  const [leaves,     setLeaves]     = useState([]);
  const [overtimes,  setOvertimes]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      fetchSupervisorAttendance(),
      fetchSupervisorLeaveRequests(),
      fetchSupervisorOvertimeRequests(),
    ])
      .then(([att, lv, ot]) => {
        setAttendance(att);
        setLeaves(lv);
        setOvertimes(ot);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Derived stats ─────────────────────────────────────────
  const now = new Date();

  const totalStudents   = [...new Set(attendance.map((r) => r.student_name).filter(Boolean))].length;
  const pendingAtt      = attendance.filter((r) => r.status === "pending").length;
  const pendingLeave    = leaves.filter((r) => r.status === "pending").length;
  const pendingOvertime = overtimes.filter((r) => r.status === "pending").length;
  const totalPending    = pendingAtt + pendingLeave + pendingOvertime;

  // Attendance breakdown
  const attTotal   = attendance.length;
  const attPresent = attendance.filter((r) => r.status === "present").length;
  const attAbsent  = attendance.filter((r) => r.status === "absent").length;
  const attVerPct  = attTotal > 0 ? (attPresent + attAbsent) / attTotal : 0;

  // Recent attendance — last 5 by date desc
  const recentAtt = [...attendance]
    .sort((a, b) => new Date(b.attendance_date) - new Date(a.attendance_date))
    .slice(0, 5);

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SupervisorLayout title="Dashboard">

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .dash-card { animation: fadeUp 0.35s ease both; }
        .dash-card:nth-child(1) { animation-delay: 0.05s; }
        .dash-card:nth-child(2) { animation-delay: 0.10s; }
        .dash-card:nth-child(3) { animation-delay: 0.15s; }
        .dash-card:nth-child(4) { animation-delay: 0.20s; }
        .quick-btn {
          display: flex; align-items: center; gap: 10px;
          background: #fff; border: 1px solid #dce6f0;
          border-left: 3px solid #1b3a6b;
          border-radius: 2px; padding: 11px 14px;
          cursor: pointer; transition: box-shadow 0.15s, transform 0.15s;
          text-align: left; width: 100%;
        }
        .quick-btn:hover { box-shadow: 0 4px 16px rgba(27,58,107,0.12); transform: translateY(-1px); }
        .att-row { transition: background 0.12s; }
        .att-row:hover { background: #f8fafc !important; }
      `}</style>

      {/* ── Welcome banner ───────────────────────────────── */}
      <div style={{
        background: "linear-gradient(120deg, #1b3a6b 60%, #2563eb)",
        borderRadius: 2, padding: "28px 32px", marginBottom: 28,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
        boxShadow: "0 4px 20px rgba(27,58,107,0.2)",
        position: "relative", overflow: "hidden",
      }}>
        {/* decorative circles */}
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
            {totalPending > 0
              ? `You have ${totalPending} pending item${totalPending > 1 ? "s" : ""} awaiting your review.`
              : "All requests are up to date. Great work!"}
          </p>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────── */}
      <div
        className="dash-card"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 28 }}
      >
        <StatCard
          label="Total Students"
          value={loading ? "…" : totalStudents}
          accent="#1b3a6b"
          sublabel="under your supervision"
        />
        <StatCard
          label="Pending Attendance"
          value={loading ? "…" : pendingAtt}
          accent="#f59e0b"
          sublabel="records to verify"
        />
        <StatCard
          label="Pending Leave"
          value={loading ? "…" : pendingLeave}
          accent="#2563eb"
          sublabel="requests to review"
        />
        <StatCard
          label="Pending Overtime"
          value={loading ? "…" : pendingOvertime}
          accent="#7c3aed"
          sublabel="requests to process"
        />
      </div>

      {/* ── Middle two-column ─────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>

        {/* Attendance verification progress */}
        <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Attendance Verification Progress
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <ProgressRing
                pct={attVerPct}
                color={attVerPct >= 0.75 ? "#16a34a" : attVerPct >= 0.4 ? "#f59e0b" : "#2563eb"}
                size={72}
                stroke={6}
              />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#1b3a6b" }}>{Math.round(attVerPct * 100)}%</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, color: "#475569" }}>
                <strong style={{ color: "#1b3a6b" }}>{attPresent + attAbsent}</strong> of{" "}
                <strong style={{ color: "#1b3a6b" }}>{attTotal}</strong> records verified
              </p>
              <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  background: attVerPct >= 0.75 ? "#16a34a" : attVerPct >= 0.4 ? "#f59e0b" : "#2563eb",
                  width: `${Math.round(attVerPct * 100)}%`,
                  transition: "width 0.8s ease",
                }} />
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#94a3b8" }}>
                {pendingAtt > 0
                  ? `${pendingAtt} record${pendingAtt > 1 ? "s" : ""} still pending`
                  : attTotal > 0
                  ? "All attendance records verified"
                  : "No attendance records yet"}
              </p>
            </div>
          </div>
        </div>

        {/* Request breakdown */}
        <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Request Overview
          </p>
          {loading ? (
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Loading…</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                {
                  label: "Attendance",
                  pending: pendingAtt,
                  approved: attendance.filter((r) => r.status === "present").length,
                  rejected: attendance.filter((r) => r.status === "absent").length,
                  total: attTotal,
                  color: "#f59e0b",
                },
                {
                  label: "Leave Requests",
                  pending: pendingLeave,
                  approved: leaves.filter((r) => r.status === "approved").length,
                  rejected: leaves.filter((r) => r.status === "rejected").length,
                  total: leaves.length,
                  color: "#2563eb",
                },
                {
                  label: "Overtime",
                  pending: pendingOvertime,
                  approved: overtimes.filter((r) => r.status === "approved").length,
                  rejected: overtimes.filter((r) => r.status === "rejected").length,
                  total: overtimes.length,
                  color: "#7c3aed",
                },
              ].map(({ label, pending, approved, rejected, total, color }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{label}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      {pending > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: "#fffbeb", color: "#92400e", padding: "1px 6px", borderRadius: 99 }}>
                          {pending} pending
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{total} total</span>
                    </div>
                  </div>
                  {/* Stacked bar */}
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden", display: "flex" }}>
                    <div style={{ height: "100%", background: "#16a34a", width: total ? `${(approved / total) * 100}%` : "0%", transition: "width 0.8s ease" }} />
                    <div style={{ height: "100%", background: "#dc2626", width: total ? `${(rejected / total) * 100}%` : "0%", transition: "width 0.8s ease" }} />
                    <div style={{ height: "100%", background: color,     width: total ? `${(pending  / total) * 100}%` : "0%", transition: "width 0.8s ease" }} />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: "#16a34a" }}>Completed {approved}</span>
                    <span style={{ fontSize: 10, color: "#dc2626" }}>Rejected {rejected}</span>
                    <span style={{ fontSize: 10, color: "#f59e0b" }}>Pending {pending}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom two-column ─────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>

        {/* Recent attendance records */}
        <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Recent Attendance Records
            </p>
            <button
              onClick={() => navigate("/supervisor/attendance")}
              style={{ background: "none", border: "none", fontSize: 12, color: "#2563eb", cursor: "pointer", fontWeight: 600 }}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div style={{ padding: "24px 20px", color: "#94a3b8", fontSize: 13 }}>Loading…</div>
          ) : recentAtt.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 28, margin: "0 0 8px" }}>📋</p>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>No attendance records submitted yet.</p>
            </div>
          ) : recentAtt.map((r, i) => {
            const isToday = new Date(r.attendance_date).toDateString() === now.toDateString();
            return (
              <div
                key={r.attendance_id}
                className="att-row"
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "13px 20px",
                  borderBottom: i < recentAtt.length - 1 ? "1px solid #f1f5f9" : "none",
                  background: r.status === "pending" ? "#fffef5" : "#fff",
                }}
              >
                {/* Date block */}
                <div style={{
                  width: 44, flexShrink: 0, textAlign: "center",
                  background: isToday ? "#1b3a6b" : "#f4f7fb",
                  borderRadius: 2, padding: "6px 0",
                }}>
                  <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: isToday ? "rgba(255,255,255,0.7)" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {new Date(r.attendance_date).toLocaleDateString("en-MY", { month: "short" })}
                  </p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.1, color: isToday ? "#fff" : "#1b3a6b" }}>
                    {new Date(r.attendance_date).getDate()}
                  </p>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.student_name}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                    {r.clock_in?.slice(0, 5) || "—"} → {r.clock_out?.slice(0, 5) || "Not recorded"}
                  </p>
                </div>

                <StatusBadge status={r.status} />
              </div>
            );
          })}
        </div>

        {/* Right column: quick actions + pending leave/overtime */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Quick actions */}
          <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Quick Actions</p>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                {
                  label: "Verify Attendance",
                  sub:   `${pendingAtt} record${pendingAtt !== 1 ? "s" : ""} awaiting verification`,
                  accent: "#f59e0b",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                    </svg>
                  ),
                  onClick: () => navigate("/supervisor/attendance"),
                },
                {
                  label: "Review Leave Requests",
                  sub:   `${pendingLeave} request${pendingLeave !== 1 ? "s" : ""} pending`,
                  accent: "#2563eb",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                  ),
                  onClick: () => navigate("/supervisor/leave-requests"),
                },
                {
                  label: "Process Overtime",
                  sub:   `${pendingOvertime} request${pendingOvertime !== 1 ? "s" : ""} to review`,
                  accent: "#7c3aed",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                  ),
                  onClick: () => navigate("/supervisor/overtime-requests"),
                },
              ].map(({ label, sub, icon, onClick, accent }) => (
                <button
                  key={label}
                  className="quick-btn"
                  onClick={onClick}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "#fff", border: "1px solid #dce6f0",
                    borderLeft: `3px solid ${accent}`,
                    borderRadius: 2, padding: "11px 14px",
                    cursor: "pointer", textAlign: "left", width: "100%",
                    transition: "box-shadow 0.15s, transform 0.15s",
                  }}
                >
                  <span style={{ flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{sub}</p>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" style={{ marginLeft: "auto", flexShrink: 0 }}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Recent leave requests */}
          <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flex: 1 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Recent Requests</p>
              <button
                onClick={() => navigate("/supervisor/leave-requests")}
                style={{ background: "none", border: "none", fontSize: 12, color: "#2563eb", cursor: "pointer", fontWeight: 600 }}
              >
                View all →
              </button>
            </div>

            {loading ? (
              <div style={{ padding: "16px 20px", color: "#94a3b8", fontSize: 13 }}>Loading…</div>
            ) : leaves.length === 0 && overtimes.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>No requests submitted yet.</p>
              </div>
            ) : (
              [...leaves.map((r) => ({ ...r, _type: "Leave",    _id: r.leave_id,    _date: r.created_at })),
               ...overtimes.map((r) => ({ ...r, _type: "Overtime", _id: r.overtime_id, _date: r.created_at }))]
                .sort((a, b) => new Date(b._date) - new Date(a._date))
                .slice(0, 5)
                .map((r, i, arr) => (
                  <div key={`${r._type}-${r._id}`} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 20px",
                    borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none",
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                        {r.student_name}
                      </p>
                      <span style={{ fontSize: 10, color: r._type === "Leave" ? "#2563eb" : "#7c3aed", fontWeight: 700 }}>
                        {r._type}
                      </span>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))
            )}
          </div>

        </div>
      </div>

    </SupervisorLayout>
  );
}