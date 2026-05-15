// pages/studentDashboard/MyEvaluationPage.jsx
import React, { useState, useEffect } from "react";
import StudentLayout from "../../components/dashboard/Layout";
import "../../css/userManagement/userTable.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Grade / score config ───────────────────────────────────
const GRADE_RATIO = { A: 1.0, B: 0.8, C: 0.6, D: 0.4, E: 0.2 };

const CRITERIA_MAX = {
  po2_data_handling: 5, po2_dev_tools: 5, po2_debugging: 5,
  po3_issues: 5, po3_ideas: 5, po3_solutions: 5,
  po4_work_relationship: 10, po4_communication: 5,
  po5_attendance: 5, po5_time_management: 5, po5_teamwork: 5,
  po6_ethics: 5, po6_perseverance: 5, po6_independence: 5,
  po7_passion: 10,
  po9_coordination: 2, po9_responsibility: 2, po9_emotion: 2,
  po9_tolerance: 2, po9_decision: 2,
  p10_digital: 5,
};

const scoreOf = (grade, key) => {
  if (!grade || GRADE_RATIO[grade] === undefined) return 0;
  return parseFloat((GRADE_RATIO[grade] * CRITERIA_MAX[key]).toFixed(2));
};

const PO_GROUPS = [
  {
    id: "po2", label: "PO2 – Critical Thinking & Problem Solving (CTPS) Skills", pct: "15%",
    criteria: [
      { key: "po2_data_handling", label: "Data Handling and Analysis" },
      { key: "po2_dev_tools",     label: "Use of Development Environments and Tools" },
      { key: "po2_debugging",     label: "Debugging and Troubleshooting" },
    ],
  },
  {
    id: "po3", label: "PO3 – Critical Thinking & Problem Solving (CTPS) Skills", pct: "15%",
    criteria: [
      { key: "po3_issues",    label: "Ability to identify issues/problems and provide solutions" },
      { key: "po3_ideas",     label: "Ability to generate ideas" },
      { key: "po3_solutions", label: "Ability to interpret solutions" },
    ],
  },
  {
    id: "po4", label: "PO4 – Communication Skills", pct: "20%",
    criteria: [
      { key: "po4_work_relationship", label: "Work relationship & frequency of meeting" },
      { key: "po4_communication",     label: "Listening, questioning & discussion" },
    ],
  },
  {
    id: "po5", label: "PO5 – Social, Teamwork & Responsibility", pct: "20%",
    criteria: [
      { key: "po5_attendance",      label: "Attendance and punctualities" },
      { key: "po5_time_management", label: "Manages time and projects effectively" },
      { key: "po5_teamwork",        label: "Teamwork" },
    ],
  },
  {
    id: "po6", label: "PO6 – Values, Ethics, Moral & Professionalism", pct: "20%",
    criteria: [
      { key: "po6_ethics",       label: "Works positively and ethically" },
      { key: "po6_perseverance", label: "Perseverance and dedication" },
      { key: "po6_independence", label: "Independence" },
    ],
  },
  {
    id: "po7", label: "PO7 – Information Management & Lifelong Learning", pct: "5%",
    criteria: [
      { key: "po7_passion", label: "Passion for learning" },
    ],
  },
  {
    id: "po9", label: "PO9 – Leadership Skills", pct: "10%",
    criteria: [
      { key: "po9_coordination",   label: "Activity coordination" },
      { key: "po9_responsibility", label: "Group responsibility" },
      { key: "po9_emotion",        label: "Emotion control" },
      { key: "po9_tolerance",      label: "Tolerance" },
      { key: "po9_decision",       label: "Decision making" },
    ],
  },
  {
    id: "p10", label: "P10 – Digital Skills", pct: "5%",
    criteria: [
      { key: "p10_digital", label: "Ability to use information/digital technologies" },
    ],
  },
];

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

  const app   = data?.application ?? null;
  const ev    = data?.evaluation  ?? null;
  const total = ev ? parseFloat(ev.total_score ?? 0) : 0;

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
            {/* Internship info */}
            <div style={card}>
              <p style={sectionLabel}>Internship Information</p>
              <InfoRow label="Position"   value={app.position_name} />
              <InfoRow label="Company"    value={app.company_name} />
              <InfoRow label="Period"     value={`${fmtDate(app.start_date)} – ${fmtDate(app.end_date)}`} />
              <InfoRow label="Supervisor" value={app.supervisor_name ?? "Not yet assigned"} />
            </div>

            {/* Pending notice */}
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
                ["Recommended Pass",                                 ev.recommend_pass],
                ["Industrial Training Certificate of Excellence",    ev.recommend_excellence],
                ["Best Intern Award",                                ev.award_best_intern],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", padding: "9px 0" }}>
                  <span style={{ fontSize: "13px", color: "#374151" }}>{label}</span>
                 <span style={{
                    fontSize: "13px", fontWeight: "700",
                    color: val ? "#15803d" : "#b91c1c",
                    }}>
                    {val ? "Yes" : "No"}
                    </span>
                </div>
              ))}
            </div>

            {/* ── 4. Evaluation Table ─────────────────── */}
            <div style={{ ...card, padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "20px 28px 14px", borderBottom: "1.5px solid #e2e8f0" }}>
                <p style={{ ...sectionLabel, margin: 0, border: "none", padding: 0 }}>
                  Intern's Evaluation
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                  Please state the grade based on the rubrics in the appendix
                </p>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#1b3a6b", color: "white" }}>
                    <th style={{ padding: "10px 20px", textAlign: "left", fontWeight: "700", fontSize: "12px" }}>
                      Evaluation Criteria
                    </th>
                    <th style={{ padding: "10px 16px", textAlign: "center", width: "100px", fontWeight: "700", fontSize: "12px" }}>
                      Grade
                    </th>
                    <th style={{ padding: "10px 16px", textAlign: "center", width: "120px", fontWeight: "700", fontSize: "12px" }}>
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PO_GROUPS.map((group) => {
                    const groupScore = group.criteria.reduce((s, c) => s + scoreOf(ev[c.key] ?? "", c.key), 0);
                    const groupMax   = group.criteria.reduce((s, c) => s + CRITERIA_MAX[c.key], 0);
                    return (
                      <React.Fragment key={group.id}>
                        {/* Group header row */}
                        <tr style={{ background: "#f1f5f9" }}>
                          <td colSpan={2} style={{ padding: "8px 20px", fontWeight: "700", fontSize: "11.5px", color: "#1b3a6b", borderTop: "1.5px solid #e2e8f0" }}>
                            {group.label}
                            <span style={{ fontWeight: "500", color: "#64748b", marginLeft: "6px" }}>({group.pct})</span>
                          </td>
                          <td style={{ padding: "8px 16px", textAlign: "center", fontWeight: "700", fontSize: "12px", color: "#374151", borderTop: "1.5px solid #e2e8f0" }}>
                            {parseFloat(groupScore.toFixed(2))} / {groupMax}
                          </td>
                        </tr>

                        {/* Criteria rows */}
                        {group.criteria.map((c) => {
                          const grade = ev[c.key] ?? "";
                          const sc    = scoreOf(grade, c.key);
                          return (
                            <tr key={c.key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "9px 20px 9px 32px", color: "#374151", fontSize: "13px" }}>
                                {c.label}
                              </td>
                              <td style={{ padding: "9px 16px", textAlign: "center", fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>
                                {grade || "—"}
                              </td>
                              <td style={{ padding: "9px 16px", textAlign: "center", fontSize: "13px", color: grade ? "#374151" : "#cbd5e1" }}>
                                {grade ? `${sc} / ${CRITERIA_MAX[c.key]}` : `— / ${CRITERIA_MAX[c.key]}`}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}

                  {/* Total row */}
                  <tr style={{ background: "#1b3a6b", color: "white" }}>
                    <td colSpan={2} style={{ padding: "12px 20px", fontWeight: "800", fontSize: "13.5px" }}>
                      Total Score (For internal use only)
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: "800", fontSize: "15px" }}>
                      {total.toFixed(2)} / 100
                    </td>
                  </tr>
                </tbody>
              </table>
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