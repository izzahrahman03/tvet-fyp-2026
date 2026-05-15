// pages/internshipManagement/AdminInternshipEvaluationPage.jsx
// Admin: monitor evaluation status across all accepted internship placements (read-only).

import React, { useState, useEffect } from "react";
import useToast from "../userManagement/userTable/useToast";
import ExportModal from "../userManagement/userTable/ExportModal";
import "../../css/userManagement/userTable.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Grade / score config ──────────────────────────────────────────────────────
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
  { id: "po2", label: "PO2 – Critical Thinking & Problem Solving (CTPS)", pct: "15%",
    criteria: [
      { key: "po2_data_handling", label: "Data Handling and Analysis" },
      { key: "po2_dev_tools",     label: "Use of Development Environments and Tools" },
      { key: "po2_debugging",     label: "Debugging and Troubleshooting" },
    ] },
  { id: "po3", label: "PO3 – Critical Thinking & Problem Solving (CTPS)", pct: "15%",
    criteria: [
      { key: "po3_issues",    label: "Ability to identify issues/problems and provide solutions" },
      { key: "po3_ideas",     label: "Ability to generate ideas" },
      { key: "po3_solutions", label: "Ability to interpret solutions" },
    ] },
  { id: "po4", label: "PO4 – Communication Skills", pct: "20%",
    criteria: [
      { key: "po4_work_relationship", label: "Work relationship & frequency of meeting" },
      { key: "po4_communication",     label: "Listening, questioning & discussion" },
    ] },
  { id: "po5", label: "PO5 – Social, Teamwork & Responsibility", pct: "20%",
    criteria: [
      { key: "po5_attendance",      label: "Attendance and punctualities" },
      { key: "po5_time_management", label: "Manages time and projects effectively" },
      { key: "po5_teamwork",        label: "Teamwork" },
    ] },
  { id: "po6", label: "PO6 – Values, Ethics, Moral & Professionalism", pct: "20%",
    criteria: [
      { key: "po6_ethics",       label: "Works positively and ethically" },
      { key: "po6_perseverance", label: "Perseverance and dedication" },
      { key: "po6_independence", label: "Independence" },
    ] },
  { id: "po7", label: "PO7 – Information Management & Lifelong Learning", pct: "5%",
    criteria: [{ key: "po7_passion", label: "Passion for learning" }] },
  { id: "po9", label: "PO9 – Leadership Skills", pct: "10%",
    criteria: [
      { key: "po9_coordination",   label: "Activity coordination" },
      { key: "po9_responsibility", label: "Group responsibility" },
      { key: "po9_emotion",        label: "Emotion control" },
      { key: "po9_tolerance",      label: "Tolerance" },
      { key: "po9_decision",       label: "Decision making" },
    ] },
  { id: "p10", label: "P10 – Digital Skills", pct: "5%",
    criteria: [{ key: "p10_digital", label: "Ability to use information/digital technologies" }] },
];

// ── Eval status helpers ───────────────────────────────────────────────────────
const evalStatus = (row) => {
  if (!row.evaluation_id)       return "not_evaluated";
  if (row.submission_confirmed) return "submitted";
  return "in_progress";
};

function EvalBadge({ row }) {
  const st  = evalStatus(row);
  const cfg = {
      not_evaluated: { bg: "#f1f5f9", color: "#64748b", label: "Not Evaluated" },
      in_progress:   { bg: "#fffbeb", color: "#c2410c", label: "In Progress" },
      submitted:     { bg: "#dcfce7", color: "#166534", label: "Submitted" },
  }[st];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 9px", borderRadius: "2px", fontSize: "12px", fontWeight: "700",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}

// ── Yes / No pill ─────────────────────────────────────────────────────────────
function YesNoPill({ val }) {
  return val ? (
    <span style={{ fontSize: "12px", fontWeight: "700", color: "#166534", padding: "2px 8px", borderRadius: "2px" }}>Yes</span>
  ) : (
    <span style={{ fontSize: "12px", fontWeight: "700", color: "#94a3b8", padding: "2px 8px", borderRadius: "2px" }}>No</span>
  );
}


// ── Full Evaluation View Modal (read-only, with grade breakdown) ───────────────
function EvalViewModal({ row, onClose }) {
  const hasEval = !!row.evaluation_id;
  const total   = hasEval ? parseFloat(row.total_score ?? 0) : 0;

  const Field = ({ label, value }) => (
    <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "8px 0" }}>
      <span style={{ fontSize: "13px", color: "#64748b", minWidth: "170px", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{value ?? "—"}</span>
    </div>
  );

  const SectionHeader = ({ title, topGap }) => (
    <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0", marginTop: topGap ?? "12px" }}>
      <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {title}
      </span>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "700px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

        <div className="modal-header" style={{ flexShrink: 0 }}>
          <p className="modal-title">Evaluation Details</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-form">

            {/* ── Student ── */}
            <SectionHeader title="Student" topGap="0" />
            <Field label="Name"          value={row.student_name} />
            <Field label="Email"         value={row.student_email} />
            <Field label="Matric Number" value={row.matric_number} />

            {/* ── Internship ── */}
            <SectionHeader title="Internship" />
            <Field label="Company"  value={row.company_name} />
            <Field label="Position" value={row.position_name} />
            <Field label="Period"   value={`${fmtDate(row.start_date)} – ${fmtDate(row.end_date)}`} />

            {/* ── Supervisor ── */}
            <SectionHeader title="Industry Supervisor" />
            {row.supervisor_name ? (
              <>
                <Field label="Name"     value={row.supervisor_name} />
                <Field label="Position" value={row.supervisor_position} />
                <Field label="Email"    value={row.supervisor_email} />
                <Field label="Phone"    value={row.supervisor_phone} />
              </>
            ) : (
              <p style={{ margin: "8px 0", fontSize: "13px", color: "#94a3b8" }}>No supervisor assigned.</p>
            )}

            {/* ── Evaluation ── */}
            <SectionHeader title="Evaluation" />
            {!hasEval ? (
              <p style={{ margin: "8px 0", fontSize: "13px", color: "#94a3b8" }}>No evaluation submitted yet.</p>
            ) : (
              <>
                {/* Status & score */}
                <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "8px 0" }}>
                  <span style={{ fontSize: "13px", color: "#64748b", minWidth: "170px", flexShrink: 0 }}>Evaluation Status</span>
                  <EvalBadge row={row} />
                </div>
                <Field label="Total Score"  value={`${total.toFixed(2)} / 100`} />
                <Field label="Evaluated On" value={fmtDate(row.evaluated_at)} />

                {/* Recommendations */}
                {[
                  ["Recommended Pass",          row.recommend_pass],
                  ["Certificate of Excellence", row.recommend_excellence],
                  ["Best Intern Award",         row.award_best_intern],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #f1f5f9", padding: "8px 0" }}>
                    <span style={{ fontSize: "13px", color: "#64748b", minWidth: "170px", flexShrink: 0 }}>{label}</span>
                    <YesNoPill val={val} />
                  </div>
                ))}

                {/* Supervisor comments */}
                {row.eval_comments && (
                  <>
                    <div style={{ paddingBottom: "6px", borderBottom: "1.5px solid #dce6f0", marginTop: "12px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Supervisor's Comments</span>
                    </div>
                    <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#374151", lineHeight: "1.7" }}>
                      {row.eval_comments}
                    </p>
                  </>
                )}

                {/* Grade breakdown table */}
                <div style={{ paddingBottom: "6px", borderBottom: "1.5px solid #dce6f0", marginTop: "14px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Grade Breakdown</span>
                </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                    <thead>
                      <tr style={{ background: "#1b3a6b", color: "white" }}>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: "700" }}>Evaluation Criteria</th>
                        <th style={{ padding: "8px 12px", textAlign: "center", width: "70px", fontWeight: "700" }}>Grade</th>
                        <th style={{ padding: "8px 12px", textAlign: "center", width: "110px", fontWeight: "700" }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PO_GROUPS.map((group) => {
                        const groupScore = group.criteria.reduce((s, c) => s + scoreOf(row[c.key] ?? "", c.key), 0);
                        const groupMax   = group.criteria.reduce((s, c) => s + CRITERIA_MAX[c.key], 0);
                        return (
                          <React.Fragment key={group.id}>
                            <tr style={{ background: "#f1f5f9" }}>
                              <td colSpan={2} style={{ padding: "6px 12px", fontWeight: "700", fontSize: "11.5px", color: "#1b3a6b" }}>
                                {group.label} <span style={{ fontWeight: "500", color: "#64748b" }}>({group.pct})</span>
                              </td>
                              <td style={{ padding: "6px 12px", textAlign: "center", fontWeight: "700", fontSize: "12px", color: "#374151" }}>
                                {parseFloat(groupScore.toFixed(2))} / {groupMax}
                              </td>
                            </tr>
                            {group.criteria.map((c) => {
                              const grade = row[c.key] ?? "";
                              const sc    = scoreOf(grade, c.key);
                              return (
                                <tr key={c.key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                  <td style={{ padding: "7px 12px 7px 22px", color: "#374151" }}>{c.label}</td>
                                  <td style={{ padding: "7px 12px", textAlign: "center", fontWeight: "700", color: "#0f172a" }}>
                                    {grade || "—"}
                                  </td>
                                  <td style={{ padding: "7px 12px", textAlign: "center", color: grade ? "#374151" : "#cbd5e1" }}>
                                    {grade ? `${sc} / ${CRITERIA_MAX[c.key]}` : `— / ${CRITERIA_MAX[c.key]}`}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                      <tr style={{ background: "#1b3a6b", color: "white" }}>
                        <td colSpan={2} style={{ padding: "10px 12px", fontWeight: "800", fontSize: "13px" }}>Total Score</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: "800", fontSize: "14px" }}>
                          {total.toFixed(2)} / 100
                        </td>
                      </tr>
                    </tbody>
                  </table>
              </>
            )}

          </div>
        </div>
      </div>
  );
}


// ══════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════
const EVAL_STATUSES = [
  { value: "all",           label: "All Evaluations" },
  { value: "not_evaluated", label: "Not Evaluated" },
  { value: "in_progress",   label: "In Progress" },
  { value: "submitted",     label: "Submitted" },
];

export default function AdminInternshipEvaluationPage() {
  const [rows,       setRows]       = useState([]);
  const [intakes,      setIntakes]      = useState([]);
  const [intakeFilter, setIntakeFilter] = useState("all");
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [evalFilter, setEvalFilter] = useState("all");
  const [sortKey,    setSortKey]    = useState("created_at");
  const [sortDir,    setSortDir]    = useState("desc");
  const [viewRow,    setViewRow]    = useState(null);
  const [showExport, setShowExport] = useState(false);
  const { toast, show }             = useToast();

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    // Evaluations only exist for accepted placements — always pre-filter.
    params.set("status", "accepted");
    if (evalFilter !== "all") params.set("eval_status", evalFilter);
    if (intakeFilter !== "all") params.set("intake_id", intakeFilter);
    if (search)                params.set("search", search);

    fetch(`${API}/admin/internship/evaluations?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => setRows(d.evaluations ?? []))
      .catch(() => show("Failed to load evaluations.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch(`${API}/intakes`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then((d) => setIntakes(d.intakes ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [evalFilter, intakeFilter]);

  const handleSearch = (e) => {
    if (e.key === "Enter") load();
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...rows].sort((a, b) => {
    const va = String(a[sortKey] ?? "").toLowerCase();
    const vb = String(b[sortKey] ?? "").toLowerCase();
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  // Stats
  const total      = rows.length;
  const submitted  = rows.filter((r) =>  r.submission_confirmed).length;
  const inProgress = rows.filter((r) =>  r.evaluation_id && !r.submission_confirmed).length;
  const notEval    = rows.filter((r) => !r.evaluation_id).length;

  const SortIcon = ({ col }) =>
    sortKey !== col ? (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
        <path d="M3 6h18 M7 12h10 M10 18h4" />
      </svg>
    ) : (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2.5">
        <path d={sortDir === "asc" ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
      </svg>
    );

  const EXPORT_COLUMNS = [
    "student_name", "student_email", "matric_number",
    "company_name", "position_name", "supervisor_name",
    "total_score", "recommend_pass", "recommend_excellence",
    "award_best_intern", "evaluated_at",
  ];

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`ut-toast ${toast.kind}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={toast.kind === "error" ? "M18 6L6 18M6 6l12 12" : "M20 6L9 17l-5-5"} />
          </svg>
          {toast.msg}
        </div>
      )}

      {viewRow && <EvalViewModal row={viewRow} onClose={() => setViewRow(null)} />}
      
      {showExport && (
        <ExportModal
          rows={sorted}          
          selected={new Set()} 
          columns={EXPORT_COLUMNS}
          type="internship_evaluation"
          onClose={() => setShowExport(false)}
        />
      )}

      {/* ── Summary stat cards ─────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Accepted Placements", value: total,      color: "#1b3a6b" },
          { label: "Submitted",           value: submitted,  color: "#7c3aed" },
          { label: "In Progress",         value: inProgress, color: "#be123c" },
          { label: "Not Evaluated",       value: notEval,    color: "#64748b" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "white", border: "1px solid #c8d5e8", borderRadius: 2, padding: "16px 20px", borderTop: `3px solid ${color}`
          }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="table-wrapper">
        <div className="table-toolbar" style={{ flexDirection: "column", alignItems: "stretch", gap: "8px" }}>
          {/* Row 1 — Intake filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "600", color: "#64748b", whiteSpace: "nowrap", width: "110px", flexShrink: 0 }}>
              Filter by Intake
            </label>
            <select
              className="ut-table-filter-select"
              style={{ flex: 1 }}
              value={intakeFilter}
              onChange={(e) => setIntakeFilter(e.target.value)}
            >
              <option value="all">All Intakes</option>
              {intakes.map((i) => (
                <option key={i.intake_id} value={i.intake_id}>{i.intake_name}</option>
              ))}
            </select>
          </div>

          {/* Row 2 — Search + Eval filter + Export */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "600", color: "#64748b", whiteSpace: "nowrap", width: "110px", flexShrink: 0 }}>
              Search
            </label>
            <div className="ut-table-search-wrap" style={{ flex: 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="ut-table-search-input"
                placeholder="Search student, company, position…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearch}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 0 }}>×</button>
              )}
            </div>
            <select
              className="ut-table-filter-select"
              value={evalFilter}
              onChange={(e) => setEvalFilter(e.target.value)}
            >
              {EVAL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button className="ut-btn-secondary" onClick={() => setShowExport(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12" />
              </svg>
              Export
            </button>
          </div>

        </div>

        <p className="table-count">
          {loading ? "Loading…" : `${sorted.length} evaluation${sorted.length !== 1 ? "s" : ""}`}
        </p>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Loading evaluations…</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "48px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>#</th>
                  {[
                    { key: "student_name",         label: "Student" },
                    { key: "company_name",          label: "Company" },
                    { key: "position_name",         label: "Position" },
                    { key: "supervisor_name",       label: "Supervisor" },
                    { key: "evaluation_id",         label: "Evaluation" },
                    { key: "total_score",           label: "Score" },
                    { key: "recommend_pass",        label: "Pass" },
                    { key: "recommend_excellence",  label: "Excellence" },
                    { key: "award_best_intern",     label: "Best Intern" },
                    { key: "evaluated_at",          label: "Evaluated On" },
                  ].map(({ key, label }) => (
                    <th key={key} onClick={() => handleSort(key)} style={{ cursor: "pointer" }}>
                      <span className="th-inner">{label}<SortIcon col={key} /></span>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={12}>
                      <div className="empty-state">
                        <p className="empty-state-text">No evaluations found.</p>
                      </div>
                    </td>
                  </tr>
                ) : sorted.map((row, idx) => (
                  <tr key={row.id}>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>{idx + 1}</td>

                    {/* Student */}
                    <td>
                      <span className="cell-name">{row.student_name}</span>
                      {row.matric_number && (
                        <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b" }}>{row.matric_number}</p>
                      )}
                    </td>

                    {/* Company */}
                    <td>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{row.company_name}</span>
                      {row.location && (
                        <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b" }}>{row.location}</p>
                      )}
                    </td>

                    {/* Position */}
                    <td>
                      <span style={{ fontSize: "13px", color: "#374151" }}>{row.position_name}</span>
                    </td>

                    {/* Supervisor */}
                    <td>
                      {row.supervisor_name ? (
                        <div>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#1b3a6b" }}>{row.supervisor_name}</span>
                          {row.supervisor_position && (
                            <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b" }}>{row.supervisor_position}</p>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: "600" }}>Not assigned</span>
                      )}
                    </td>

                    {/* Evaluation status */}
                    <td><EvalBadge row={row} /></td>

                    {/* Score */}
                    <td>
                      {row.total_score != null ? (
                        <span style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>
                          {parseFloat(row.total_score).toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#cbd5e1" }}>—</span>
                      )}
                    </td>

                    {/* Recommendations */}
                    <td style={{ textAlign: "center" }}><YesNoPill val={row.recommend_pass} /></td>
                    <td style={{ textAlign: "center" }}><YesNoPill val={row.recommend_excellence} /></td>
                    <td style={{ textAlign: "center" }}><YesNoPill val={row.award_best_intern} /></td>

                    {/* Evaluated On */}
                    <td>
                      <span className="cell-muted">{fmtDate(row.evaluated_at)}</span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="ut-action-btn-wrap">
                        <button
                          title="View Evaluation"
                          className="ut-action-btn ut-action-btn-detail"
                          onClick={() => setViewRow(row)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ flexShrink: 0, display: "block" }}>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" fill="none" stroke="white" />
                          </svg>
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}