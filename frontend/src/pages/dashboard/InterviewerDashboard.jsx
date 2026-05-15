// pages/InterviewerDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InterviewerLayout from "../../components/dashboard/Layout";
import { fetchMyApplications } from "../api/interviewerApplicationsApi";

// ── Helpers ───────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" }) : "—";
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—";

const scoreColor = (s) => {
  if (s == null) return "#94a3b8";
  if (s >= 75)   return "#16a34a";
  if (s >= 50)   return "#f59e0b";
  return "#dc2626";
};

// ── Tiny score pill ───────────────────────────────────────
function ScorePill({ score }) {
  if (score == null) return <span style={{ fontSize: 11, color: "#cbd5e1" }}>Not rated</span>;
  const color = scoreColor(score);
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 99,
      fontSize: 11, fontWeight: 700,
      background: color + "22", color,
    }}>
      {score}%
    </span>
  );
}

// ── Status pill ───────────────────────────────────────────
const STATUS_STYLE = {
  interview: { bg: "#dbeafe", color: "#1d4ed8" },
  attended:  { bg: "#d1fae5", color: "#065f46" },
  passed:    { bg: "#dcfce7", color: "#15803d" },
  failed:    { bg: "#fee2e2", color: "#b91c1c" },
};
function StatusPill({ status }) {
  const s = status?.toLowerCase() ?? "";
  const st = STATUS_STYLE[s] ?? { bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 700, background: st.bg, color: st.color,
      textTransform: "capitalize",
    }}>{status}</span>
  );
}

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
function ProgressRing({ pct, color, size = 56, stroke = 5 }) {
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

// ══════════════════════════════════════════════════════════
export default function InterviewerDashboard() {
  const navigate   = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName   = storedUser?.name || "Interviewer";

  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  fetchMyApplications()
    .then((data) => {
      console.log("RAW row:", data[0]);  // ← add this

      const normalised = data.map((a) => ({
        ...a,
        status:             a.status || a.application_status,
        interview_datetime: a.interview_datetime || a.preferred_slot_datetime,
      }));

      console.log("NORMALISED row:", normalised[0]);  // ← and this
      console.log("upcoming count:", normalised.filter((a) =>
        a.interview_datetime &&
        new Date(a.interview_datetime) > new Date() &&
        !["attended", "absent", "passed", "failed"].includes(a.status)
      ).length);

      setApps(normalised);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);

  // ── Derived stats ─────────────────────────────────────────
  const now        = new Date();
  const total      = apps.length;
  const evaluable = apps.filter((a) => ["attended", "passed", "failed"].includes(a.status)).length;
  const evaluated = apps.filter((a) => a.evaluation_id != null).length;
  const pending = apps.filter((a) => a.evaluation_id == null && ["attended", "passed", "failed"].includes(a.status)).length;
  const upcoming = apps.filter((a) =>
    a.interview_datetime &&
    new Date(a.interview_datetime) > now &&
    a.evaluation_id == null
  );
  const evalPct   = evaluable > 0 ? evaluated / evaluable : 0;

  const scores     = apps.filter((a) => a.total_score != null).map((a) => Number(a.total_score));
  const avgScore   = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;

  // Next 3 upcoming interviews
  const nextSlots  = [...upcoming]
    .sort((a, b) => new Date(a.interview_datetime) - new Date(b.interview_datetime))
    .slice(0, 3);

  // Recent evaluated (last 4)
  const recentEval = [...apps]
    .filter((a) => a.total_score != null)
    .sort((a, b) => new Date(b.evaluated_at ?? 0) - new Date(a.evaluated_at ?? 0))
    .slice(0, 4);

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <InterviewerLayout title="Dashboard">

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
          border-radius: 2px; padding: 14px 18px;
          cursor: pointer; transition: box-shadow 0.15s, transform 0.15s;
          text-align: left; width: 100%;
        }
        .quick-btn:hover { box-shadow: 0 4px 16px rgba(27,58,107,0.12); transform: translateY(-1px); }
        .slot-row { transition: background 0.12s; }
        .slot-row:hover { background: #f8fafc !important; }
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
        {/* decorative circle */}
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
            {pending > 0
              ? `You have ${pending} applicant${pending > 1 ? "s" : ""} awaiting evaluation.`
              : upcoming.length > 0
              ? `${upcoming.length} upcoming interview${upcoming.length > 1 ? "s" : ""} scheduled.`
              : "All evaluations are up to date."}
          </p>
        </div>

        <button
          onClick={() => navigate("/interviewer/applications")}
          style={{
            position: "relative", display: "flex", alignItems: "center", gap: 8,
            background: "#fff", color: "#1b3a6b", border: "none",
            borderRadius: 2, padding: "11px 22px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1b3a6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          View Applications
        </button>
      </div>

      {/* ── Stat cards ───────────────────────────────────── */}
      <div
        className="dash-card"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 28 }}
      >
        <StatCard label="Total Assigned"   value={loading ? "…" : total}     accent="#1b3a6b" sublabel="applications in your slots" />
        <StatCard label="Upcoming"         value={loading ? "…" : upcoming.length} accent="#2563eb" sublabel="interviews scheduled" />
        <StatCard label="Pending Eval"     value={loading ? "…" : pending}   accent="#f59e0b" sublabel="awaiting your rating" />
        <StatCard label="Avg Score"        value={loading ? "…" : avgScore != null ? `${avgScore}%` : "—"} accent="#16a34a" sublabel={scores.length ? `from ${scores.length} evaluation${scores.length > 1 ? "s" : ""}` : "no scores yet"} />
      </div>

      {/* ── Two-column section ────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>

        {/* Evaluation progress */}
        <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Evaluation Progress
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <ProgressRing pct={evalPct} color={evalPct >= 0.75 ? "#16a34a" : evalPct >= 0.4 ? "#f59e0b" : "#2563eb"} size={72} stroke={6} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#1b3a6b" }}>{Math.round(evalPct * 100)}%</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, color: "#475569" }}>
                <strong style={{ color: "#1b3a6b" }}>{evaluated}</strong> of <strong style={{ color: "#1b3a6b" }}>{evaluable}</strong> evaluated
              </p>
              <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  background: evalPct >= 0.75 ? "#16a34a" : evalPct >= 0.4 ? "#f59e0b" : "#2563eb",
                  width: `${Math.round(evalPct * 100)}%`,
                  transition: "width 0.8s ease",
                }} />
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#94a3b8" }}>
                {pending > 0 ? `${pending} still awaiting evaluation` : evaluated > 0 ? "All attended applicants evaluated ✓" : "No evaluations yet"}
              </p>
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Score Breakdown
          </p>
          {loading ? (
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Loading…</p>
          ) : scores.length === 0 ? (
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>No scores submitted yet.</p>
          ) : (() => {
            const strong  = scores.filter((s) => s >= 75).length;
            const average = scores.filter((s) => s >= 50 && s < 75).length;
            const weak    = scores.filter((s) => s < 50).length;
            const bars    = [
              { label: "Strong (≥75%)",    count: strong,  color: "#16a34a" },
              { label: "Average (50–74%)", count: average, color: "#f59e0b" },
              { label: "Weak (<50%)",      count: weak,    color: "#dc2626" },
            ];
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {bars.map(({ label, count, color }) => (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color }}>{count}</span>
                    </div>
                    <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, background: color, width: `${scores.length ? (count / scores.length) * 100 : 0}%`, transition: "width 0.8s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Bottom two-column section ─────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>

        {/* Upcoming interviews */}
        <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Upcoming Interviews
            </p>
            {upcoming.length > 3 && (
              <button onClick={() => navigate("/interviewer/applications")} style={{ background: "none", border: "none", fontSize: 12, color: "#2563eb", cursor: "pointer", fontWeight: 600 }}>
                View all →
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: "24px 20px", color: "#94a3b8", fontSize: 13 }}>Loading…</div>
          ) : nextSlots.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 28, margin: "0 0 8px" }}></p>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>No upcoming interviews scheduled.</p>
            </div>
          ) : nextSlots.map((app, i) => {
            const isToday = fmtDate(app.interview_datetime) === fmtDate(new Date());
            return (
              <div key={app.id} className="slot-row" style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "13px 20px",
                borderBottom: i < nextSlots.length - 1 ? "1px solid #f1f5f9" : "none",
                background: isToday ? "#eff6ff" : "#fff",
              }}>
                {/* Date block */}
                <div style={{
                  width: 44, flexShrink: 0, textAlign: "center",
                  background: isToday ? "#1b3a6b" : "#f4f7fb",
                  borderRadius: 2, padding: "6px 0",
                }}>
                  <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: isToday ? "rgba(255,255,255,0.7)" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {new Date(app.interview_datetime).toLocaleDateString("en-MY", { month: "short" })}
                  </p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.1, color: isToday ? "#fff" : "#1b3a6b" }}>
                    {new Date(app.interview_datetime).getDate()}
                  </p>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {app.applicant_name}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{fmtTime(app.interview_datetime)}</p>
                </div>
                {isToday && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#dbeafe", color: "#1d4ed8", padding: "2px 7px", borderRadius: 99, flexShrink: 0 }}>TODAY</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick actions + recent evals */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Quick actions */}
          <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Quick Actions</p>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                {
                  label: "View All Applications",
                  sub:   "See your full assigned list",
                  icon:  (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1b3a6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                  ),
                  onClick: () => navigate("/interviewer/applications"),
                },
                {
                  label: "Pending Evaluations",
                  sub:   `${pending} awaiting your rating`,
                  icon:  (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                  ),
                  onClick: () => navigate("/interviewer/applications"),
                  accent: "#f59e0b",
                },
              ].map(({ label, sub, icon, onClick, accent = "#1b3a6b" }) => (
                <button key={label} className="quick-btn" onClick={onClick} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#fff", border: "1px solid #dce6f0",
                  borderLeft: `3px solid ${accent}`,
                  borderRadius: 2, padding: "11px 14px",
                  cursor: "pointer", textAlign: "left", width: "100%",
                  transition: "box-shadow 0.15s, transform 0.15s",
                }}>
                  <span style={{ flexShrink: 0 }}>{icon}</span>
                  <div>
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

          {/* Recent evaluations */}
          <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flex: 1 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Recent Evaluations</p>
            </div>
            {loading ? (
              <div style={{ padding: "16px 20px", color: "#94a3b8", fontSize: 13 }}>Loading…</div>
            ) : recentEval.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>No evaluations submitted yet.</p>
              </div>
            ) : recentEval.map((app, i) => (
              <div key={app.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 20px",
                borderBottom: i < recentEval.length - 1 ? "1px solid #f1f5f9" : "none",
              }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>
                    {app.applicant_name}
                  </p>
                  <StatusPill status={app.status} />
                </div>
                <ScorePill score={app.total_score} />
              </div>
            ))}
          </div>

        </div>
      </div>

    </InterviewerLayout>
  );
}