// pages/supervisorDashboard/TerminationFormPage.jsx
import { useState, useEffect } from "react";
import useToast from "../userManagement/userTable/useToast";
import "../../css/userManagement/userTable.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const REASONS = [
  "Performance issues",
  "Misconduct or disciplinary issue",
  "Attendance and punctuality problems",
  "Incompatibility with company culture",
  "Medical or health reasons",
  "Student requested termination",
  "Project / role no longer available",
  "Other",
];

const EMPTY_FORM = {
  internship_application_id: "",
  reason: "",
  details: "",
  last_working_date: "",
};

 const Field = ({ label, required, error, children }) => (
    <div className="form-field" style={{ marginBottom: "20px" }}>
      <label style={{ display: "block", marginBottom: "6px" }}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#b91c1c" }}>{error}</p>
      )}
    </div>
  );


// ── Submitted termination history table ───────────────────
function TerminationHistory({ items, loading }) {
  const statusCfg = {
    pending:  { bg: "#fffbeb", color: "#b45309", border: "#fde68a", label: "Pending" },
    approved: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", label: "Approved" },
    rejected: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", label: "Rejected" },
  };

  return (
    <div className="table-wrapper" style={{ marginTop: "28px" }}>
      <div style={{ padding: "16px 20px 0" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
          My Termination Requests
        </h2>
        <p style={{ margin: "0 0 16px", fontSize: "12.5px", color: "#64748b" }}>
          Track the status of your submitted requests.
        </p>
      </div>

      {loading ? (
        <div className="loading-container"><div className="loading-spinner" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state" style={{ padding: "32px" }}>
          <p className="empty-state-text">No termination requests submitted yet.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "40px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>#</th>
                <th>Student</th>
                <th>Position</th>
                <th>Reason</th>
                <th>Last Working Date</th>
                <th>Status</th>
                <th>Admin Remarks</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t, idx) => {
                const cfg = statusCfg[t.status] ?? statusCfg.pending;
                return (
                  <tr key={t.termination_id}>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>{idx + 1}</td>
                    <td>
                      <span className="cell-name">{t.student_name}</span>
                      <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b" }}>{t.student_email}</p>
                      {t.matric_number && <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>{t.matric_number}</p>}
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", color: "#374151" }}>{t.position_name}</span>
                      <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b" }}>{t.company_name}</p>
                    </td>
                    <td><span style={{ fontSize: "13px", color: "#374151" }}>{t.reason}</span></td>
                    <td><span className="cell-muted">{fmtDate(t.last_working_date)}</span></td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", padding: "2px 9px",
                        borderRadius: "2px", fontSize: "12px", fontWeight: "700",
                        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                      }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", color: t.admin_remarks ? "#374151" : "#cbd5e1" }}>
                        {t.admin_remarks ?? "—"}
                      </span>
                    </td>
                    <td><span className="cell-muted">{fmtDate(t.created_at)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════
export default function TerminationFormPage() {
  const [interns,  setInterns]  = useState([]);
  const [history,  setHistory]  = useState([]);
  const [loadingInterns,  setLoadingInterns]  = useState(true);
  const [loadingHistory,  setLoadingHistory]  = useState(true);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState("");
  const { toast, show }         = useToast();

  const loadInterns = () => {
    setLoadingInterns(true);
    fetch(`${API}/supervisor/active-interns`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => setInterns(d.interns ?? []))
      .catch(() => show("Failed to load active interns.", "error"))
      .finally(() => setLoadingInterns(false));
  };

  const loadHistory = () => {
    setLoadingHistory(true);
    fetch(`${API}/supervisor/termination-form`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => setHistory(d.terminations ?? []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => { loadInterns(); loadHistory(); }, []);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
    if (success) setSuccess("");
  };

  const validate = () => {
    const e = {};
    if (!form.internship_application_id) e.internship_application_id = "Please select a student.";
    if (!form.reason)                    e.reason = "Please select a termination reason.";
    if (!form.details?.trim())           e.details = "Please provide termination details.";
    if (!form.last_working_date)         e.last_working_date = "Please enter the last working date.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setSaving(true);
    setSuccess("");
    try {
      const res  = await fetch(`${API}/supervisor/termination-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit.");

      setSuccess(data.message);
      setForm(EMPTY_FORM);
      setErrors({});
      loadInterns();
      loadHistory();
    } catch (err) {
      show(err.message || "Failed to submit termination request.", "error");
    } finally {
      setSaving(false);
    }
  };

  const selectedIntern = interns.find(
    (i) => String(i.application_id) === String(form.internship_application_id)
  );

  return (
    // ── Widened from 700px → 960px ──────────────────────────
    <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "24px" }}>

      {toast && (
        <div className={`ut-toast ${toast.kind}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={toast.kind === "error" ? "M18 6L6 18M6 6l12 12" : "M20 6L9 17l-5-5"} />
          </svg>
          {toast.msg}
        </div>
      )}

      {/* ── Page heading ──────────────────────────────────── */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.3px" }}>
          Termination Request Form
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
          Submit a request to terminate an intern's placement. The administrator will review and process your request.
        </p>
      </div>

      {/* ── Success banner ────────────────────────────────── */}
      {success && (
        <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "2px", padding: "14px 18px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: "1px" }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
          </svg>
          <div>
            <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "13.5px", color: "#15803d" }}>Request Submitted</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#166534" }}>{success}</p>
          </div>
        </div>
      )}

      {/* ── Form card — increased padding: 24px 28px → 32px 40px ── */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "2px", padding: "32px 40px" }}>

        <div style={{ paddingBottom: "14px", borderBottom: "1.5px solid #dce6f0", marginBottom: "28px" }}>
          <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Termination Details
          </span>
        </div>

        {/* Student selection */}
        <Field label="Student" required error={errors.internship_application_id}>
          {loadingInterns ? (
            <div style={{ padding: "10px 0", fontSize: "13px", color: "#94a3b8" }}>Loading active interns…</div>
          ) : interns.length === 0 ? (
            <div style={{ padding: "10px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "4px", fontSize: "13px", color: "#92400e" }}>
              No active interns available. Students already terminated or with pending requests are excluded.
            </div>
          ) : (
            <select
              className={`form-input${errors.internship_application_id ? " form-input-error" : ""}`}
              value={form.internship_application_id}
              onChange={(e) => set("internship_application_id", e.target.value)}
            >
              <option value="" disabled>Select a student…</option>
              {interns.map((i) => (
                <option key={i.application_id} value={i.application_id}>
                  {i.student_name} — {i.position_name} ({i.company_name})
                </option>
              ))}
            </select>
          )}
        </Field>

        {/* Selected intern preview */}
        {selectedIntern && (
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "2px", padding: "14px 16px", marginTop: "-12px", marginBottom: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                ["Student",  selectedIntern.student_name],
                ["Matric",   selectedIntern.matric_number ?? "—"],
                ["Position", selectedIntern.position_name],
                ["Company",  selectedIntern.company_name],
                ["Period",   `${fmtDate(selectedIntern.start_date)} – ${fmtDate(selectedIntern.end_date)}`],
              ].map(([label, value]) => (
                <div key={label}>
                  <p style={{ margin: "0 0 1px", fontSize: "10.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reason */}
        <Field label="Reason for Termination" required error={errors.reason}>
          <select
            className={`form-input${errors.reason ? " form-input-error" : ""}`}
            value={form.reason}
            onChange={(e) => set("reason", e.target.value)}
          >
            <option value="" disabled>Select a reason…</option>
            {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>

        {/* Details */}
        <Field label="Termination Details" required error={errors.details}>
          <textarea
            className={`form-input${errors.details ? " form-input-error" : ""}`}
            rows={5}
            value={form.details}
            onChange={(e) => set("details", e.target.value)}
            placeholder="Describe the circumstances leading to this termination request. Include relevant dates, incidents, and any prior actions taken…"
            style={{ resize: "vertical" }}
          />
        </Field>

        {/* Last working date */}
        <Field label="Last Working Date" required error={errors.last_working_date}>
          <input
            type="date"
            className={`form-input${errors.last_working_date ? " form-input-error" : ""}`}
            value={form.last_working_date}
            onChange={(e) => set("last_working_date", e.target.value)}
          />
        </Field>

        {/* Warning notice */}
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "4px", padding: "14px 16px", marginTop: "4px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
          </svg>
          <p style={{ margin: 0, fontSize: "12.5px", color: "#c2410c", lineHeight: "1.6" }}>
            Submitting this form will send a termination request to the administrator for review. The student's placement status will only change once the administrator approves the request.
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
          <button
            onClick={handleSubmit}
            disabled={saving || interns.length === 0}
            className="ut-btn-primary"
            style={{ opacity: saving || interns.length === 0 ? 0.65 : 1, minWidth: "160px", justifyContent: "center" }}
          >
            {saving ? "Submitting…" : "Submit Request"}
          </button>
        </div>

      </div>

      {/* ── History table ──────────────────────────────────── */}
      <TerminationHistory items={history} loading={loadingHistory} />

    </div>
  );
}