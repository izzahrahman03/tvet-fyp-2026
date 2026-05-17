// pages/studentDashboard/MyEvaluationPage.jsx
import React, { useState, useEffect } from "react";
import StudentLayout from "../../components/dashboard/Layout";
import "../../css/userManagement/userTable.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Shared card style ──────────────────────────────────────
const card = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "2px",
  padding: "24px 28px",
  marginBottom: "16px",
};

const sectionLabel = {
  margin: "0 0 14px",
  fontSize: "10px",
  fontWeight: "800",
  color: "#1b3a6b",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  paddingBottom: "10px",
  borderBottom: "1.5px solid #e2e8f0",
};

const toLetterGrade = (total_score) => {
  if (total_score === null || total_score === undefined) return "—";
  if (total_score >= 80.00) return "A";
  if (total_score >= 65.00) return "B";
  if (total_score >= 50.00) return "C";
  if (total_score >= 40.00) return "D";
  return "E";
};

// ── Info row helper ────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #f1f5f9", padding: "9px 0" }}>
      <span style={{ fontSize: "13px", color: "#64748b", minWidth: "160px", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{value ?? "—"}</span>
    </div>
  );
}


// ══════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════
export default function MyEvaluationPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch(`${API}/student/my-evaluation`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setError("Failed to load evaluation. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const app = data?.application ?? null;
  const ev  = data?.evaluation  ?? null;

  return (
    <StudentLayout title="My Evaluation">
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        {/* ── Page heading ─────────────────────────────── */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.3px" }}>
            My Evaluation
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Industrial Training Performance Evaluation — School of Computer Sciences
          </p>
        </div>

        {/* ── Loading ──────────────────────────────────── */}
        {loading && (
          <div className="loading-container" style={{ marginTop: "60px" }}>
            <div className="loading-spinner" />
            <p className="loading-text">Loading evaluation…</p>
          </div>
        )}

        {/* ── Error ────────────────────────────────────── */}
        {!loading && error && (
          <div style={{ ...card, borderLeft: "3px solid #e2e8f0", color: "#b91c1c", fontSize: "13.5px" }}>
            {error}
          </div>
        )}

        {/* ── No internship ─────────────────────────────── */}
        {!loading && !error && !app && (
          <div style={{ ...card, padding: "48px 28px", textAlign: "center" }}>
            <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: "700", color: "#374151" }}>
              No active internship found.
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
              Your evaluation will appear here once you have an accepted internship and your supervisor confirms submission.
            </p>
          </div>
        )}

        {/* ── Pending ───────────────────────────────────── */}
        {!loading && !error && app && !ev && (
          <>
            <div style={card}>
              <p style={sectionLabel}>Internship Information</p>
              <InfoRow label="Position"   value={app.position_name} />
              <InfoRow label="Company"    value={app.company_name} />
              <InfoRow label="Period"     value={`${fmtDate(app.start_date)} – ${fmtDate(app.end_date)}`} />
              <InfoRow label="Supervisor" value={app.supervisor_name ?? "Not yet assigned"} />
            </div>

            <div style={{ ...card, borderLeft: "3px solid #cbd5e1" }}>
              <p style={{ margin: "0 0 4px", fontWeight: "700", fontSize: "13.5px", color: "#374151" }}>
                Evaluation Not Yet Available
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.7" }}>
                Your supervisor has not yet confirmed the submission of your evaluation form.
                The results will be visible here once the evaluation is finalised.
              </p>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════
            EVALUATION RESULT
        ══════════════════════════════════════════════ */}
        {!loading && !error && app && ev && (
          <>

            {/* ── 1. Internship & Supervisor Info ─────── */}
            <div style={card}>
              <p style={sectionLabel}>Internship Information</p>
              <InfoRow label="Position"         value={app.position_name} />
              <InfoRow label="Company"          value={app.company_name} />
              <InfoRow label="Period"           value={`${fmtDate(app.start_date)} – ${fmtDate(app.end_date)}`} />
              <InfoRow label="Supervisor"       value={app.supervisor_name} />
              <InfoRow label="Supervisor Title" value={app.supervisor_position} />
            </div>

            {/* ── 2. Supervisor Comments ──────────────── */}
            {ev.comments && (
              <div style={card}>
                <p style={sectionLabel}>Supervisor's General Comments</p>
                <p style={{ margin: 0, fontSize: "13.5px", color: "#374151", lineHeight: "1.8" }}>
                  {ev.comments}
                </p>
              </div>
            )}

            {/* ── 3. Recommendations ──────────────────── */}
            <div style={card}>
              <p style={sectionLabel}>Recommendations</p>
              {[
                ["Recommended Pass",                              ev.recommend_pass],
                ["Industrial Training Certificate of Excellence", ev.recommend_excellence],
                ["Best Intern Award",                             ev.award_best_intern],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", padding: "9px 0" }}>
                  <span style={{ fontSize: "11px", color: "#374151" }}>{label}</span>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: val ? "#15803d" : "#b91c1c" }}>
                    {val ? "Yes" : "No"}
                  </span>
                </div>
              ))}
            </div>

            {/* ── 4. Final Grade ───────────────────────── */}
            <div style={card}>
              <p style={sectionLabel}>Final Grade</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0" }}>
                <span style={{ fontSize: "13px", color: "#374151" }}>Overall Industrial Training Grade</span>
                <span style={{
                  fontSize: "13px", fontWeight: "800", color: "#1b3a6b",
                  padding: "4px 18px", letterSpacing: "0.05em",
                }}>
                  {toLetterGrade(ev.total_score)}
                </span>
              </div>
            </div>

            {/* ── Submission date ──────────────────────── */}
            {ev.updated_at && (
              <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#94a3b8", textAlign: "right" }}>
                Evaluation submitted on {fmtDate(ev.updated_at)}
              </p>
            )}

          </>
        )}

      </div>
    </StudentLayout>
  );
}