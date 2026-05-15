// pages/supervisorDashboard/InternshipEvaluationPage.jsx
import React, { useState, useEffect } from "react";
import useToast from "../userManagement/userTable/useToast";
import "../../css/userManagement/userTable.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Grade / score config ───────────────────────────────────
const GRADES      = ["A", "B", "C", "D", "E"];
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

const computeTotal = (form) =>
  Object.keys(CRITERIA_MAX)
    .reduce((sum, key) => sum + scoreOf(form[key], key), 0)
    .toFixed(2);

const PO_GROUPS = [
  {
    id: "po2", label: "PO2 – CRITICAL THINKING AND PROBLEM SOLVING (CTPS) SKILLS", pct: "15%",
    criteria: [
      { key: "po2_data_handling", label: "Data Handling and Analysis" },
      { key: "po2_dev_tools",     label: "Use of Development Environments and Tools" },
      { key: "po2_debugging",     label: "Debugging and Troubleshooting" },
    ],
  },
  {
    id: "po3", label: "PO3 - CRITICAL THINKING AND PROBLEM SOLVING (CTPS) SKILLS", pct: "15%",
    criteria: [
      { key: "po3_issues",    label: "Ability to identify issues/problems and provide solutions" },
      { key: "po3_ideas",     label: "Ability to generate ideas" },
      { key: "po3_solutions", label: "Ability to interpret solutions" },
    ],
  },
  {
    id: "po4", label: "PO4 - COMMUNICATION SKILLS", pct: "20%",
    criteria: [
      { key: "po4_work_relationship", label: "Work relationship & frequency of meeting" },
      { key: "po4_communication",     label: "Listening, questioning & discussion" },
    ],
  },
  {
    id: "po5", label: "PO5 - SOCIAL, TEAMWORK AND RESPONSIBILITY", pct: "20%",
    criteria: [
      { key: "po5_attendance",      label: "Attendance and punctualities" },
      { key: "po5_time_management", label: "Manages time and projects effectively" },
      { key: "po5_teamwork",        label: "Teamwork" },
    ],
  },
  {
    id: "po6", label: "PO6 - VALUES, ETHICS, MORAL & PROFESSIONALISM", pct: "20%",
    criteria: [
      { key: "po6_ethics",       label: "Works positively and ethically" },
      { key: "po6_perseverance", label: "Perseverance and dedication" },
      { key: "po6_independence", label: "Independence" },
    ],
  },
  {
    id: "po7", label: "PO7 - INFORMATION MANAGEMENT AND LIFELONG LEARNING", pct: "5%",
    criteria: [
      { key: "po7_passion", label: "Passion for learning" },
    ],
  },
  {
    id: "po9", label: "PO9 - LEADERSHIP SKILLS", pct: "10%",
    criteria: [
      { key: "po9_coordination",   label: "Activity coordination" },
      { key: "po9_responsibility", label: "Group responsibility" },
      { key: "po9_emotion",        label: "Emotion control" },
      { key: "po9_tolerance",      label: "Tolerance" },
      { key: "po9_decision",       label: "Decision making" },
    ],
  },
  {
    id: "p10", label: "P10 – DIGITAL SKILLS", pct: "5%",
    criteria: [
      { key: "p10_digital", label: "Ability to use information/digital technologies" },
    ],
  },
];

const EMPTY_FORM = {
  comments: "", recommend_pass: false, recommend_excellence: false,
  award_best_intern: false, submission_confirmed: false,
  ...Object.fromEntries(Object.keys(CRITERIA_MAX).map((k) => [k, ""])),
};

// All grade field keys — used for validation
const ALL_GRADE_KEYS = Object.keys(CRITERIA_MAX);


// ══════════════════════════════════════════════════════════
// buildPrintHTML — 2-page layout matching the official PDF form.
// ══════════════════════════════════════════════════════════
function buildPrintHTML(student, form, supervisorName) {
  const total = computeTotal(form);

  const weightOf  = (key) => parseFloat((CRITERIA_MAX[key] / 4).toFixed(4));
  const fmtWeight = (key) => {
    const w = weightOf(key);
    return Number.isInteger(w) ? String(w) : parseFloat(w.toFixed(2)).toString();
  };
  const fmtScore = (grade, key) => {
    if (!grade) return "—";
    const s = scoreOf(grade, key);
    return Number.isInteger(s) ? String(s) : parseFloat(s.toFixed(2)).toString();
  };

  const yesNo = (val) =>
    val
      ? "<strong>Yes</strong> / <s>No</s>"
      : "<s>Yes</s> / <strong>No</strong>";

  const evalRows = PO_GROUPS.map((group) => {
    const header = `
      <tr style="background:#f0f0f0">
        <td colspan="3" style="padding:5px 8px;font-weight:bold;border:1px solid #999;font-size:9pt">
          ${group.label} (${group.pct})
        </td>
      </tr>`;
    const rows = group.criteria.map((c) => {
      const grade = form[c.key] || "";
      const cell  = grade ? `${grade} x ${fmtWeight(c.key)} = ${fmtScore(grade, c.key)}` : "";
      return `
        <tr>
          <td style="padding:5px 8px;border:1px solid #ccc">${c.label}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #ccc">${grade || ""}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #ccc">${cell}</td>
        </tr>`;
    }).join("");
    return header + rows;
  }).join("");

  return `
    <html>
    <head>
      <title>Evaluation – ${student.student_name}</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; font-size: 10pt; color: #000; }
        .page { padding: 28px 36px; }
        .page-break { page-break-after: always; }
        table { border-collapse: collapse; width: 100%; }
        @media print { body { margin: 0; } .page-break { page-break-after: always; } }
      </style>
    </head>
    <body>
      <div class="page page-break">
        <div style="text-align:center;margin-bottom:18px">
          <p style="margin:0;font-size:11pt;font-weight:bold">School of Computer Sciences</p>
          <p style="margin:4px 0 0;font-size:11pt;font-weight:bold">Industrial Training Evaluation Form for Industrial Supervisor</p>
        </div>
        <table style="border:1px solid #999;margin-bottom:0">
          <tbody>
            <tr>
              <td style="padding:10px 12px;border:1px solid #999;width:180px;vertical-align:top;font-size:9.5pt">Student Name:</td>
              <td style="padding:10px 12px;border:1px solid #999;font-size:9.5pt">${student.student_name ?? "—"}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #999;vertical-align:top;font-size:9.5pt">Matric Number:</td>
              <td style="padding:10px 12px;border:1px solid #999;font-size:9.5pt">${student.matric_number ?? "—"}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #999;vertical-align:top;font-size:9.5pt">Company:</td>
              <td style="padding:10px 12px;border:1px solid #999;font-size:9.5pt">${student.company_name ?? "—"}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #999;vertical-align:top;font-size:9.5pt">Industrial Supervisor's Name:</td>
              <td style="padding:10px 12px;border:1px solid #999;font-size:9.5pt">${supervisorName}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding:10px 12px;border:1px solid #999;font-size:9.5pt">
                <div style="margin-bottom:6px">Internship action during MCO</div>
                <div style="margin-left:12px;margin-bottom:4px">&#8226;&nbsp; WFH: From _________ to _________</div>
                <div style="margin-left:12px">&#8226;&nbsp; Leave: From _________ to _________</div>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:10px 12px;border:1px solid #999;font-size:9.5pt">
                <div style="margin-bottom:6px">Supervisor's General comments:</div>
                <div style="min-height:120px;white-space:pre-wrap">${form.comments || ""}</div>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:10px 12px;border:1px solid #999;font-size:9.5pt">
                <table style="width:100%;border:none">
                  <tr>
                    <td style="padding:3px 0;border:none;font-size:9.5pt">Do you recommend the student a Pass?</td>
                    <td style="padding:3px 0;border:none;text-align:right;font-size:9.5pt;white-space:nowrap">${yesNo(form.recommend_pass)}</td>
                  </tr>
                  <tr>
                    <td style="padding:3px 0;border:none;font-size:9.5pt">Do you recommend the student for the Industrial Training Certificate of Excellence?</td>
                    <td style="padding:3px 0;border:none;text-align:right;font-size:9.5pt;white-space:nowrap">${yesNo(form.recommend_excellence)}</td>
                  </tr>
                  <tr>
                    <td style="padding:3px 0;border:none;font-size:9.5pt">Do you recommend the student for the Best Intern Awards?</td>
                    <td style="padding:3px 0;border:none;text-align:right;font-size:9.5pt;white-space:nowrap">${yesNo(form.award_best_intern)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #999;min-height:70px;vertical-align:top;font-size:9.5pt">
                Supervisor signature &amp; stamp:
                <div style="min-height:60px"></div>
              </td>
              <td style="padding:10px 12px;border:1px solid #999;vertical-align:top;font-size:9.5pt">Date:</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="page">
        <p style="font-weight:bold;font-size:11pt;margin:0 0 4px">INTERN'S EVALUATION</p>
        <p style="font-size:9pt;margin:0 0 10px;font-style:italic">Please state the grade based on the rubrics in the appendix.</p>
        <table>
          <thead>
            <tr style="background:#1b3a6b;color:white">
              <th style="padding:7px 8px;text-align:left;border:1px solid #999;font-size:9pt">EVALUATION CRITERIA</th>
              <th style="padding:7px 8px;text-align:center;width:110px;border:1px solid #999;font-size:9pt">Grade by<br>Industrial<br>S/visor</th>
              <th style="padding:7px 8px;text-align:center;width:160px;border:1px solid #999;font-size:9pt">For internal use only<br><span style="font-weight:normal;font-size:8pt">(Grade point x weight)</span></th>
            </tr>
          </thead>
          <tbody>
            ${evalRows}
            <tr>
              <td colspan="2" style="padding:7px 8px;border:1px solid #999;font-weight:bold;font-size:9.5pt;text-align:right">Total (For internal use only)</td>
              <td style="padding:7px 8px;text-align:center;border:1px solid #999;font-weight:bold;font-size:11pt">${total}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </body>
    </html>`;
}


// ── Confirm Delete Dialog ─────────────────────────────────
function DeleteConfirmModal({ student, onConfirm, onCancel, saving }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box">
        <div className="modal-header">
          <p className="modal-title">Delete Evaluation</p>
          <button className="ut-modal-close-btn" onClick={onCancel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-form">
          <p style={{ margin: 0, fontSize: "14px", color: "#1a2744", lineHeight: "1.7" }}>
            Are you sure you want to delete the evaluation for <strong>{student.student_name}</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button className="ut-btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={saving}
            style={{
              padding: "9px 20px", background: saving ? "#e2e8f0" : "#b91c1c",
              color: saving ? "#94a3b8" : "white", border: "none", borderRadius: "2px",
              fontSize: "13px", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Deleting…" : "Delete Evaluation"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Evaluation Form Modal ─────────────────────────────────
function EvaluationModal({ student, supervisorName, onClose, onSaved }) {
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  // Set of grade field keys that failed validation (highlighted red)
  const [missingKeys, setMissingKeys] = useState(new Set());

  useEffect(() => {
    fetch(`${API}/supervisor/evaluations/${student.application_id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.evaluation) {
          const ev = data.evaluation;
          setForm({
            comments:             ev.comments             ?? "",
            recommend_pass:       !!ev.recommend_pass,
            recommend_excellence: !!ev.recommend_excellence,
            award_best_intern:    !!ev.award_best_intern,
            submission_confirmed: !!ev.submission_confirmed,
            ...Object.fromEntries(Object.keys(CRITERIA_MAX).map((k) => [k, ev[k] ?? ""])),
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [student.application_id]);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    // Clear the missing highlight for this key as soon as it gets a value
    if (missingKeys.has(key) && val) {
      setMissingKeys((prev) => { const next = new Set(prev); next.delete(key); return next; });
    }
  };

  // ── POST helper ───────────────────────────────────────────
  const postEvaluation = async (payload) => {
    const res  = await fetch(`${API}/supervisor/evaluations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ ...payload, internship_application_id: student.application_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to save.");
    return data;
  };

  // ── Save as Draft — no validation, submission_confirmed stays false ──
  const handleSaveDraft = async () => {
    setError("");
    setMissingKeys(new Set());
    setSaving(true);
    try {
      const data = await postEvaluation({ ...form, submission_confirmed: false });
      onSaved(student.application_id, data.total_score, false);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Submit — all grade fields required ───────────────────
  const handleSubmit = async () => {
    setError("");

    // Find every grade field that is still empty
    const missing = new Set(ALL_GRADE_KEYS.filter((k) => !form[k]));
    if (missing.size > 0) {
      setMissingKeys(missing);
      setError(`Please grade all ${missing.size} remaining criteria before submitting.`);
      return;
    }

    setMissingKeys(new Set());
    setSubmitting(true);
    try {
      const data = await postEvaluation({ ...form, submission_confirmed: true });
      onSaved(student.application_id, data.total_score, true);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const total = computeTotal(form);
  const filledCount   = ALL_GRADE_KEYS.filter((k) => !!form[k]).length;
  const totalCriteria = ALL_GRADE_KEYS.length;
  const allFilled     = filledCount === totalCriteria;

  const GradeSelect = ({ fieldKey }) => {
    const isMissing = missingKeys.has(fieldKey);
    return (
      <select
        value={form[fieldKey]}
        onChange={(e) => set(fieldKey, e.target.value)}
        style={{
          width: "100%", padding: "5px 6px",
          border: `1.5px solid ${isMissing ? "#fca5a5" : "#e2e8f0"}`,
          borderRadius: "2px", fontSize: "13px", color: "#1e293b", fontWeight: "700",
          background: isMissing ? "#fef2f2" : form[fieldKey] ? "#f0fdf4" : "white",
          outline: isMissing ? "none" : undefined,
        }}
      >
        <option value="">—</option>
        {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
    );
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ overflow: "hidden" }}>
      <div className="modal-box" style={{ maxWidth: "900px", maxHeight: "100%" }}>

        {/* Header */}
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <p className="modal-title">Edit Evaluation Form</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", overflowX: "hidden", flex: 1, minHeight: 0 }}>
          {loading ? (
            <div className="loading-container"><div className="loading-spinner" /></div>
          ) : (
            <div className="modal-form">

              {/* Internship info */}
              <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0" }}>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Internship</span>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "2px", padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  ["Assigned Internship", student.position_name],
                  ["Company Name",        student.company_name],
                  ["Student Name",        student.student_name],
                  ["External Supervisor", supervisorName],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ margin: "0 0 2px", fontSize: "10.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "600", color: "#0f172a" }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Comments */}
              <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0", marginTop: "4px" }}>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Supervisor's General Comments
                  <span style={{ fontSize: "10px", fontWeight: "500", color: "#94a3b8", marginLeft: "6px", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                </span>
              </div>
              <div className="form-field">
                <textarea
                  className="form-input"
                  rows={4}
                  value={form.comments}
                  onChange={(e) => set("comments", e.target.value)}
                  placeholder="Write your general comments about this student's performance…"
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Recommendations */}
              <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0", marginTop: "4px" }}>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Recommendations
                  <span style={{ fontSize: "10px", fontWeight: "500", color: "#94a3b8", marginLeft: "6px", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  ["recommend_pass",       "Do you recommend the student a Pass?"],
                  ["recommend_excellence", "Do you recommend the student for the Industrial Training Certificate of Excellence?"],
                  ["award_best_intern",    "Do you recommend the student for the Best Intern Awards?"],
                ].map(([key, label]) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13.5px", color: "#1e293b" }}>
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) => set(key, e.target.checked)}
                      style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#1b3a6b" }}
                    />
                    {label}
                  </label>
                ))}
              </div>

              {/* Evaluation table */}
              <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0", marginTop: "8px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Intern's Evaluation
                  </span>
                  <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "8px" }}>
                    Please state the grade based on the rubrics in the appendix
                  </span>
                </div>
                {/* Progress indicator */}
                <span style={{
                  fontSize: "11.5px", fontWeight: "700",
                  color: allFilled ? "#15803d" : "#b45309",
                  background: allFilled ? "#f0fdf4" : "#fffbeb",
                  border: `1px solid ${allFilled ? "#bbf7d0" : "#fde68a"}`,
                  padding: "2px 10px", borderRadius: "2px", flexShrink: 0,
                }}>
                  {filledCount} / {totalCriteria} graded
                </span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "auto" }} />
                  <col style={{ width: "150px" }} />
                  <col style={{ width: "160px" }} />
                </colgroup>
                <thead>
                  <tr style={{ background: "#1b3a6b", color: "white" }}>
                    <th style={{ padding: "9px 12px", textAlign: "left", fontWeight: "700", fontSize: "12px" }}>Evaluation Criteria</th>
                    <th style={{ padding: "9px 12px", textAlign: "center", fontWeight: "700", fontSize: "12px" }}>
                      Grade by Industrial S/visor <span style={{ color: "#fca5a5", fontWeight: "400" }}>*</span>
                    </th>
                    <th style={{ padding: "9px 12px", textAlign: "center", fontWeight: "700", fontSize: "12px" }}>
                      For internal use only<br /><span style={{ fontWeight: "400", fontSize: "11px" }}>(Grade point × weight)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PO_GROUPS.map((group) => (
                    <React.Fragment key={group.id}>
                      <tr>
                        <td colSpan={3} style={{
                          padding: "7px 10px", background: "#e8eef5",
                          fontWeight: "800", fontSize: "11.5px", color: "#1b3a6b",
                          borderTop: "2px solid #dce6f0", borderBottom: "1px solid #dce6f0",
                        }}>
                          {group.label} <span style={{ fontWeight: "600", color: "#64748b" }}>({group.pct})</span>
                        </td>
                      </tr>
                      {group.criteria.map((c, ci) => {
                        const grade    = form[c.key];
                        const sc       = grade ? scoreOf(grade, c.key) : null;
                        const wt       = parseFloat((CRITERIA_MAX[c.key] / 4).toFixed(2));
                        const cell     = grade ? `${grade} × ${wt} = ${sc}` : "—";
                        const isMissing = missingKeys.has(c.key);
                        return (
                          <tr key={c.key} style={{ background: isMissing ? "#fff8f8" : ci % 2 === 0 ? "white" : "#f8fafc" }}>
                            <td style={{
                              padding: "8px 12px", borderBottom: "1px solid #f1f5f9",
                              color: isMissing ? "#b91c1c" : "#374151",
                              wordBreak: "break-word", fontWeight: isMissing ? "600" : "400",
                            }}>
                              {c.label}
                              {isMissing && (
                                <span style={{ marginLeft: "6px", fontSize: "11px", color: "#ef4444" }}>Required</span>
                              )}
                            </td>
                            <td style={{ padding: "6px 10px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                              <GradeSelect fieldKey={c.key} />
                            </td>
                            <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center", fontWeight: "700", color: grade ? "#15803d" : "#cbd5e1", fontSize: "12.5px" }}>
                              {cell}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                  <tr style={{ background: "#1b3a6b", color: "white" }}>
                    <td colSpan={2} style={{ padding: "10px 12px", fontWeight: "800", fontSize: "13px" }}>
                      Total (For internal use only)
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: "800", fontSize: "15px" }}>
                      {total}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Error banner */}
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", padding: "10px 14px", fontSize: "13px", color: "#b91c1c", marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4 M12 16h.01" />
                  </svg>
                  {error}
                </div>
              )}

            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer" style={{ flexShrink: 0, borderTop: "1.5px solid #e2e8f0", gap: "8px" }}>

          {/* Save as Draft — always available, no validation */}
          <button
            className="ut-btn-secondary"
            onClick={handleSaveDraft}
            disabled={saving || submitting}
            style={{ opacity: saving || submitting ? 0.65 : 1 }}
          >
            {saving ? "Saving…" : "Save as Draft"}
          </button>

          {/* Submit — requires all grades filled */}
          <button
            className="ut-btn-primary"
            onClick={handleSubmit}
            disabled={saving || submitting}
            style={{ opacity: saving || submitting ? 0.65 : 1 }}
            title={!allFilled ? `${totalCriteria - filledCount} criteria still need a grade` : "Submit evaluation"}
          >
            {submitting ? "Submitting…" : "Submit Evaluation"}
          </button>

        </div>

      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════
export default function InternshipEvaluationPage() {
  const storedUser     = JSON.parse(localStorage.getItem("user") || "{}");
  const supervisorName = storedUser?.name ?? "Supervisor";

  const [students,     setStudents]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [editStudent,  setEditStudent]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [delSaving,    setDelSaving]    = useState(false);
  const [downloading,  setDownloading]  = useState(null);
  const { toast, show }                 = useToast();

  useEffect(() => {
    fetch(`${API}/supervisor/students`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setStudents(data.students ?? []))
      .catch(() => show("Failed to load students.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleEvalSaved = (applicationId, totalScore, submissionConfirmed) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.application_id === applicationId
          ? { ...s, total_score: totalScore, submission_confirmed: submissionConfirmed ? 1 : 0, evaluation_id: s.evaluation_id ?? 1 }
          : s
      )
    );
    show(submissionConfirmed ? "Evaluation submitted successfully." : "Draft saved.");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDelSaving(true);
    try {
      const res = await fetch(
        `${API}/supervisor/evaluations/${deleteTarget.application_id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete.");
      setStudents((prev) =>
        prev.map((s) =>
          s.application_id === deleteTarget.application_id
            ? { ...s, evaluation_id: null, total_score: null, submission_confirmed: 0 }
            : s
        )
      );
      show("Evaluation deleted.");
      setDeleteTarget(null);
    } catch (err) {
      show(err.message || "Failed to delete.", "error");
    } finally {
      setDelSaving(false);
    }
  };

  const handleDirectDownload = async (student) => {
    setDownloading(student.application_id);
    try {
      const res  = await fetch(`${API}/supervisor/evaluations/${student.application_id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch evaluation.");

      const ev   = data.evaluation ?? {};
      const form = {
        comments:             ev.comments             ?? "",
        recommend_pass:       !!ev.recommend_pass,
        recommend_excellence: !!ev.recommend_excellence,
        award_best_intern:    !!ev.award_best_intern,
        submission_confirmed: !!ev.submission_confirmed,
        ...Object.fromEntries(Object.keys(CRITERIA_MAX).map((k) => [k, ev[k] ?? ""])),
      };

      const html = buildPrintHTML(student, form, supervisorName);
      const win  = window.open("", "_blank");
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    } catch (err) {
      show(err.message || "Failed to download evaluation.", "error");
    } finally {
      setDownloading(null);
    }
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return [s.student_name, s.student_email, s.company_name, s.position_name]
      .some((v) => String(v ?? "").toLowerCase().includes(q));
  });

  const evalStatus = (s) => {
    if (!s.evaluation_id)       return "not_evaluated";
    if (s.submission_confirmed) return "submitted";
    return "in_progress";
  };

  const EvalBadge = ({ s }) => {
    const st  = evalStatus(s);
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
  };

  return (
    <div>
      {toast && (
        <div className={`ut-toast ${toast.kind}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={toast.kind === "error" ? "M18 6L6 18M6 6l12 12" : "M20 6L9 17l-5-5"} />
          </svg>
          {toast.msg}
        </div>
      )}

      {editStudent && (
        <EvaluationModal
          student={editStudent}
          supervisorName={supervisorName}
          onClose={() => setEditStudent(null)}
          onSaved={handleEvalSaved}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          student={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          saving={delSaving}
        />
      )}

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="ut-table-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="ut-table-search-input"
              placeholder="Search student, company, position…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <p className="table-count">
          {loading ? "Loading…" : `${filtered.length} student${filtered.length !== 1 ? "s" : ""} assigned`}
        </p>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Loading students…</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "40px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>#</th>
                  <th>Student</th>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Period</th>
                  <th>Evaluation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <p className="empty-state-text">No students assigned to you yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((s, idx) => {
                  const isDownloading = downloading === s.application_id;
                  return (
                    <tr key={s.application_id}>
                      <td style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>{idx + 1}</td>

                      <td>
                        <span className="cell-name">{s.student_name}</span>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{s.student_email}</p>
                        {s.matric_number && (
                          <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>{s.matric_number}</p>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{s.company_name}</span>
                        {s.location && (
                          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{s.location}</p>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: "13px", color: "#374151" }}>{s.position_name}</span>
                      </td>

                      <td>
                        <span className="cell-muted" style={{ fontSize: "12.5px" }}>
                          {fmtDate(s.start_date)} – {fmtDate(s.end_date)}
                        </span>
                      </td>

                      <td><EvalBadge s={s} /></td>

                      <td>
                        <div className="ut-action-btn-wrap">
                          <button
                            title={s.evaluation_id ? "Edit Evaluation" : "Create Evaluation"}
                            className="ut-action-btn ut-action-btn-edit"
                            onClick={() => setEditStudent(s)}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              style={{ flexShrink: 0, display: "block" }}>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            {s.evaluation_id ? "Edit" : "Evaluate"}
                          </button>

                          {s.evaluation_id && (
                            <button
                              title="Download / Print"
                              className="ut-action-btn ut-action-btn-detail"
                              disabled={isDownloading}
                              style={{ opacity: isDownloading ? 0.65 : 1, cursor: isDownloading ? "not-allowed" : "pointer" }}
                              onClick={() => handleDirectDownload(s)}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                style={{ flexShrink: 0, display: "block" }}>
                                <path d="M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                <rect x="6" y="14" width="12" height="8" />
                              </svg>
                              {isDownloading ? "…" : "Download"}
                            </button>
                          )}

                          {s.evaluation_id && (
                            <button
                              title="Delete Evaluation"
                              className="ut-action-btn ut-action-btn-delete"
                              onClick={() => setDeleteTarget(s)}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                style={{ flexShrink: 0, display: "block" }}>
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6 M14 11v6 M9 6V4h6v2" />
                              </svg>
                            </button>
                          )}
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
    </div>
  );
}