// pages/InterviewerApplications.jsx
import { useState, useEffect, useCallback } from "react";
import {
  fetchMyApplications,
  fetchEvaluation,
  submitEvaluation,
} from "../api/interviewerApplicationsApi";
import useToast from "../userManagement/userTable/useToast";
import "../../css/userManagement/userTable.css";

// ── Helpers ───────────────────────────────────────────────
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "—";

// ── Score colour ──────────────────────────────────────────
const scoreColor = (score) => {
  if (score === null || score === undefined) return "#94a3b8";
  if (score >= 75) return "#16a34a";
  if (score >= 50) return "#f59e0b";
  return "#dc2626";
};

// ── Sort icon ─────────────────────────────────────────────
function SortIcon({ active, dir }) {
  if (!active)
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
        <path d="M3 6h18 M7 12h10 M10 18h4" />
      </svg>
    );
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2.5">
      <path d={dir === "asc" ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
    </svg>
  );
}

// ── Status badge ──────────────────────────────────────────
const STATUS_COLOR = {
  interview: { bg: "#dbeafe", color: "#1d4ed8" },
  attended:  { bg: "#d1fae5", color: "#065f46" },
  passed:    { bg: "#dcfce7", color: "#15803d" },
  failed:    { bg: "#fee2e2", color: "#b91c1c" },
};
function StatusBadge({ status }) {
  const s = status?.toLowerCase() ?? "";
  const style = STATUS_COLOR[s] ?? { bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px",
      borderRadius: "2px", fontSize: 11, fontWeight: 700,
      background: style.bg, color: style.color,
      textTransform: "capitalize", letterSpacing: "0.04em",
    }}>
      {status ?? "—"}
    </span>
  );
}

// ══════════════════════════════════════════════════════════
// EVALUATION SECTIONS CONFIG
// ══════════════════════════════════════════════════════════
const SECTIONS = [
  {
    id: "A", label: "Communication Skills",
    criteria: [
      { key: "a1_score", label: "Clarity of Expression",   desc: "Ability to articulate thoughts clearly and coherently." },
      { key: "a2_score", label: "Listening Skills",        desc: "Attentiveness and ability to understand questions." },
      { key: "a3_score", label: "Confidence & Delivery",   desc: "Composure, eye contact, and overall presentation." },
    ],
  },
  {
    id: "B", label: "Academic / Technical Knowledge",
    criteria: [
      { key: "b1_score", label: "Domain Knowledge",        desc: "Understanding of relevant subject matter." },
      { key: "b2_score", label: "Problem-Solving Ability", desc: "Logical approach to challenges and scenarios." },
      { key: "b3_score", label: "Analytical Thinking",     desc: "Ability to break down and reason through problems." },
    ],
  },
  {
    id: "C", label: "Personal Qualities",
    criteria: [
      { key: "c1_score", label: "Attitude & Motivation",    desc: "Enthusiasm, positivity, and drive to learn." },
      { key: "c2_score", label: "Teamwork & Collaboration", desc: "Ability and willingness to work with others." },
      { key: "c3_score", label: "Initiative & Creativity",  desc: "Proactiveness and originality of ideas." },
    ],
  },
  {
    id: "D", label: "Overall Assessment",
    criteria: [
      { key: "d1_score", label: "Professionalism",           desc: "Punctuality, appearance, and conduct." },
      { key: "d2_score", label: "Suitability for Programme", desc: "Fit for the K-Youth programme requirements." },
      { key: "d3_score", label: "Overall Recommendation",    desc: "General impression and recommendation to proceed." },
    ],
  },
];

const ALL_SCORE_KEYS = SECTIONS.flatMap((s) => s.criteria.map((c) => c.key));
const EMPTY_SCORES   = Object.fromEntries(ALL_SCORE_KEYS.map((k) => [k, ""]));

// ── Score ring ────────────────────────────────────────────
function ScoreRing({ score }) {
  const radius = 36;
  const circ   = 2 * Math.PI * radius;
  const pct    = score != null ? score / 100 : 0;
  const color  = scoreColor(score);
  return (
    <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
      <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="7" />
        <circle
          cx="48" cy="48" r={radius} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>
          {score != null ? `${score}` : "—"}
        </span>
        <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em" }}>/ 100</span>
      </div>
    </div>
  );
}

// ── Rating input (1-5 buttons) ────────────────────────────
function RatingInput({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = Number(value) >= n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === String(n) ? "" : String(n))}
            style={{
              width: 34, height: 34, borderRadius: 2,
              border: `1.5px solid ${active ? "#1b3a6b" : "#c8d5e8"}`,
              background: active ? "#1b3a6b" : "#f8fafc",
              color: active ? "#fff" : "#94a3b8",
              fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// EVALUATION MODAL — interviewer scores criteria + remarks only.
// Verdict (pass/fail) is decided by admin/manager separately.
// ══════════════════════════════════════════════════════════
function EvaluationModal({ application, onClose, onSaved }) {
  const [scores,      setScores]      = useState(EMPTY_SCORES);
  const [remarks,     setRemarks]     = useState("");
  const [saving,      setSaving]      = useState(false);
  const [loadingEval, setLoadingEval] = useState(true);
  const [apiErr,      setApiErr]      = useState("");

  // Pre-fill if evaluation already exists
  useEffect(() => {
    setLoadingEval(true);
    fetchEvaluation(application.id)
      .then((ev) => {
        if (ev) {
          const filled = {};
          ALL_SCORE_KEYS.forEach((k) => { filled[k] = ev[k] != null ? String(ev[k]) : ""; });
          setScores(filled);
          setRemarks(ev.remarks ?? "");
        }
      })
      .catch(() => {/* 404 = no evaluation yet, that's fine */})
      .finally(() => setLoadingEval(false));
  }, [application.id]);

  // Live score: (sum / 60) × 100
  const filledNums = ALL_SCORE_KEYS.map((k) => parseInt(scores[k], 10)).filter((n) => !isNaN(n));
  const sum        = filledNums.reduce((a, b) => a + b, 0);
  const allFilled  = filledNums.length === ALL_SCORE_KEYS.length;
  const liveScore  = allFilled ? parseFloat(((sum / 60) * 100).toFixed(1)) : null;

  const handleSubmit = async () => {
    setApiErr("");
    if (!allFilled) { setApiErr("Please rate all 12 criteria before submitting."); return; }
    setSaving(true);
    try {
      await submitEvaluation(application.id, { ...scores, remarks });
      onSaved(application.id, liveScore);
      onClose();
    } catch (err) {
      setApiErr(err?.response?.data?.message || "Failed to submit evaluation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "24px 16px", overflowY: "auto",
    }}>
      <div style={{
        background: "#fff", borderRadius: 2, width: "100%", maxWidth: 820,
        boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        border: "1px solid #c8d5e8", borderTop: "3px solid #1b3a6b",
        display: "flex", flexDirection: "column", marginBottom: 24,
      }}>

        {/* Header */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #dce6f0", background: "#f4f7fb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b3a6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Interview Evaluation</p>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{application.applicant_name} · {fmtDateTime(application.interview_datetime)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 22, lineHeight: 1, padding: "4px 8px" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#475569"}
            onMouseLeave={(e)  => e.currentTarget.style.color = "#94a3b8"}>×</button>
        </div>

        {loadingEval ? (
          <div className="loading-container" style={{ padding: 48 }}>
            <div className="loading-spinner" />
            <p className="loading-text">Loading evaluation…</p>
          </div>
        ) : (
          <>
            {/* Live score strip — no verdict buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "20px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", flexWrap: "wrap" }}>
              <ScoreRing score={liveScore} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Live Score</p>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "#475569" }}>
                  {allFilled
                    ? `${sum} / 60 points · ${liveScore}%`
                    : `${filledNums.length} of ${ALL_SCORE_KEYS.length} criteria rated`}
                </p>
                {/* Info note — verdict is admin/manager's responsibility */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 2 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <span style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 600 }}>
                    Pass / Fail verdict will be set by admin or manager after reviewing your score.
                  </span>
                </div>
              </div>
            </div>

            {/* Scoring sections */}
            <div style={{ padding: "0 24px 8px" }}>
              {SECTIONS.map((section) => (
                <div key={section.id} style={{ marginTop: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: "1.5px solid #e2e8f0" }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#1b3a6b", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {section.id}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1b3a6b" }}>{section.label}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>
                      {section.criteria.map((c) => parseInt(scores[c.key], 10) || 0).reduce((a, b) => a + b, 0)} / 15
                    </span>
                  </div>

                  {section.criteria.map((criterion, ci) => (
                    <div key={criterion.key} style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 0", borderBottom: ci < section.criteria.length - 1 ? "1px solid #f1f5f9" : "none", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                          {section.id}{ci + 1}. {criterion.label}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{criterion.desc}</p>
                      </div>
                      <RatingInput
                        value={scores[criterion.key]}
                        onChange={(v) => setScores((p) => ({ ...p, [criterion.key]: v }))}
                      />
                      <span style={{ width: 28, textAlign: "right", fontSize: 14, fontWeight: 700, color: scores[criterion.key] ? "#1b3a6b" : "#cbd5e1" }}>
                        {scores[criterion.key] || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              ))}

              {/* Remarks */}
              <div style={{ marginTop: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#1b3a6b", display: "block", marginBottom: 6 }}>
                  Remarks <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Additional notes about the applicant…"
                  style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1.5px solid #c8d5e8", borderRadius: 2, outline: "none", resize: "vertical", color: "#0f172a", fontFamily: "inherit", boxSizing: "border-box" }}
                  onFocus={(e) => e.target.style.borderColor = "#1b3a6b"}
                  onBlur={(e)  => e.target.style.borderColor = "#c8d5e8"}
                />
              </div>
            </div>

            {/* API error */}
            {apiErr && (
              <div className="form-error" style={{ margin: "8px 24px 0", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                {apiErr}
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #dce6f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                Score = (sum of all ratings ÷ 60) × 100
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="ut-btn-primary" onClick={handleSubmit} disabled={saving}>
                  {saving ? "Submitting…" : "Submit Evaluation"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════
export default function InterviewerApplications() {
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey,      setSortKey]      = useState("interview_datetime");
  const [sortDir,      setSortDir]      = useState("desc");
  const [evalApp,      setEvalApp]      = useState(null);

  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyApplications();
      setApplications(data);
    } catch {
      show("Failed to load applications.", "error");
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = [...applications]
    .filter((a) => {
      const statusMatch = statusFilter === "all" || a.status === statusFilter;
      const q = search.toLowerCase();
      const searchMatch = !q || [a.applicant_name, a.applicant_email, a.status, a.state, fmtDateTime(a.interview_datetime)].some((v) => String(v ?? "").toLowerCase().includes(q));
      return statusMatch && searchMatch;
    })
    .sort((a, b) => {
      if (sortKey === "interview_datetime") {
        const va = new Date(a.interview_datetime), vb = new Date(b.interview_datetime);
        return sortDir === "asc" ? va - vb : vb - va;
      }
      if (sortKey === "total_score") {
        const va = a.total_score ?? -1, vb = b.total_score ?? -1;
        return sortDir === "asc" ? va - vb : vb - va;
      }
      const va = String(a[sortKey] ?? "").toLowerCase(), vb = String(b[sortKey] ?? "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const total     = applications.length;
  const evaluated = applications.filter((a) => a.evaluation_id != null).length;
  const pending = applications.filter((a) => a.evaluation_id == null && ["attended", "passed", "failed"].includes(a.status)).length;

  // After saving, update score in local state (no verdict to update here)
  const handleEvalSaved = (appId, score) => {
    setApplications((prev) =>
      prev.map((a) => a.id === appId ? { ...a, total_score: score, evaluation_id: 1 } : a)
    );
    show("Evaluation submitted successfully!");
  };

  // Score column only — verdict column removed (admin/manager decides that)
  const COLS = [
    { key: "applicant_name",     label: "Applicant",  sortable: true  },
    { key: "applicant_email",    label: "Email",      sortable: true  },
    { key: "interview_datetime", label: "Interview",  sortable: true  },
    { key: "status",             label: "Status",     sortable: true  },
    { key: "total_score",        label: "Score",      sortable: true  },
  ];

  return (
    <div>
      {toast && <div className={`ut-toast ${toast.kind}`}>{toast.msg}</div>}

      {evalApp && (
        <EvaluationModal
          application={evalApp}
          onClose={() => setEvalApp(null)}
          onSaved={handleEvalSaved}
        />
      )}

      <div style={{ padding: "28px 32px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>My Assigned Applications</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 0 }}>
            Rate each applicant after the interview — admin/manager will set the final pass/fail verdict.
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Assigned", value: total,     color: "#1b3a6b" },
            { label: "Pending Eval",   value: pending,   color: "#f59e0b" },
            { label: "Evaluated",      value: evaluated, color: "#16a34a" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "white", border: "1px solid #c8d5e8", borderRadius: 2, padding: "16px 20px", borderTop: `3px solid ${color}` }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <div className="table-toolbar">
            <div className="ut-table-search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input className="ut-table-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applicant, email, status…" />
              {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 0 }}>×</button>}
            </div>
            <select className="ut-table-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="interview">Interview</option>
              <option value="attended">Attended</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <p className="table-count">
            Showing <strong>{filtered.length}</strong> of {applications.length} application{applications.length !== 1 ? "s" : ""}
            {search && ` for "${search}"`}
          </p>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p className="loading-text">Loading applications…</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "48px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>#</th>
                    {COLS.map((col) => (
                      <th key={col.key} onClick={() => col.sortable && handleSort(col.key)} style={{ cursor: col.sortable ? "pointer" : "default" }}>
                        <span className="th-inner">
                          {col.label}
                          {col.sortable && <SortIcon active={sortKey === col.key} dir={sortDir} />}
                        </span>
                      </th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={COLS.length + 2}>
                        <div className="empty-state">
                          <p className="empty-state-text">
                            {applications.length === 0 ? "No applications assigned to your slots yet." : "No applications match your search."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map((app, idx) => {
                    const hasEval = app.evaluation_id != null;
                    const canEval = ["attended", "passed", "failed"].includes(app.status);
                    return (
                      <tr key={app.id}>
                        <td style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", width: "48px" }}>{idx + 1}</td>
                        <td><span className="cell-name">{app.applicant_name ?? "—"}</span></td>
                        <td><span style={{ fontSize: 13, color: "#475569" }}>{app.applicant_email ?? "—"}</span></td>
                        <td><span className="cell-muted">{fmtDateTime(app.interview_datetime)}</span></td>
                        <td><StatusBadge status={app.status} /></td>

                        {/* Score */}
                        <td>
                          {app.total_score != null ? (
                            <span style={{ fontWeight: 700, fontSize: 13, color: scoreColor(app.total_score) }}>
                              {app.total_score}%
                            </span>
                          ) : (
                            <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="ut-action-btn-wrap">
                            <button
                              title={!canEval ? "Available after applicant attends" : hasEval ? "Edit Evaluation" : "Evaluate"}
                              className={`ut-action-btn ${hasEval ? "ut-action-btn-edit" : "ut-action-btn-detail"}`}
                              onClick={() => canEval && setEvalApp(app)}
                              disabled={!canEval}
                              style={{ opacity: canEval ? 1 : 0.4, cursor: canEval ? "pointer" : "not-allowed" }}
                            >
                              {hasEval ? (
                                <>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                  Edit
                                </>
                              ) : (
                                <>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
                                    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                  </svg>
                                  Evaluate
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
          Evaluation available once status is <strong>Attended</strong>. Score = (total ratings ÷ 60) × 100. Admin/manager sets the final pass/fail.
        </p>
      </div>
    </div>
  );
}