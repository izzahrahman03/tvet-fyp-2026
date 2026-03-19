// components/userTable/EditModal.jsx
import { useState } from "react";
import { updateUser, updateApplicationStatus } from "../../api/adminApi";
import { COL_LABEL } from "./tableConfig";

export default function EditModal({ row, type, onClose, onSave }) {
  const [form,   setForm]   = useState({
    ...row,
    interview_datetime: row.interview_datetime
      ? new Date(row.interview_datetime).toISOString().slice(0, 16)
      : "",
    venue:            row.venue            || "",
    interviewer_name: row.interviewer_name || "",
    remarks:          row.remarks          || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const editableFields = {
    applicant:           ["status"],
    student:             ["name", "email", "phone", "status"],
    industry_partner:    ["name", "email", "phone", "status"],
    industry_supervisor: ["name", "email", "phone", "status"],
    application:         ["status"],
  }[type] || ["name", "email", "status"];

  const statusOptions = type === "application"
    ? [
        { value: "pending",            label: "Pending" },
        { value: "under_review",       label: "Under Review" },
        { value: "interview",          label: "Interview" },
        { value: "rejected_review",    label: "Rejected (Review)" },
        { value: "rejected_interview", label: "Rejected (Interview)" },
        { value: "approved",           label: "Approved" },
        { value: "withdraw",           label: "Withdraw" },
      ]
    : [
        { value: "active",   label: "Active" },
        { value: "inactive", label: "Inactive" },
      ];

  const isInterview = form.status === "interview";

  const handleSave = async () => {
    // ── Validation ────────────────────────────────────────────
    if (type !== "applicant" && type !== "application" && !form.name?.trim())
      return setError("Name is required.");
    if (type !== "applicant" && type !== "application" && !form.email?.trim())
      return setError("Email is required.");

    if (isInterview) {
      if (!form.interview_datetime)       return setError("Interview date & time is required.");
      if (!form.venue?.trim())            return setError("Venue is required.");
      if (!form.interviewer_name?.trim()) return setError("Interviewer name is required.");
    }

    setSaving(true);
    setError("");

    try {
      if (type === "application") {
        // ── Call the correct applications endpoint ────────────
        await updateApplicationStatus(row.id, {
          status: form.status,
          ...(isInterview && {
            interview_datetime: form.interview_datetime,
            venue:              form.venue,
            interviewer_name:   form.interviewer_name,
            remarks:            form.remarks,
          }),
        });

        // ── FIX: controller only returns { message }, not a row.
        //         Always build the updated row from the original row
        //         merged with whatever changed in the form, so the
        //         table updates correctly without showing "undefined".
        onSave({
          ...row,
          status: form.status,
          ...(isInterview && {
            interview_datetime: form.interview_datetime,
            venue:              form.venue,
            interviewer_name:   form.interviewer_name,
            remarks:            form.remarks,
          }),
        });

      } else {
        // ── All other user roles ──────────────────────────────
        const payload = { ...form };
        if (!isInterview) {
          delete payload.interview_datetime;
          delete payload.venue;
          delete payload.interviewer_name;
          delete payload.remarks;
        }
        delete payload.education;
        delete payload.skills;

        // updateUser returns { user: { ... } } — the controller sends
        // back the updated row, so we can use it directly if present,
        // otherwise fall back to the merged form data.
        const result  = await updateUser(type, row.id, payload);
        onSave(result ?? { ...row, ...form });
      }

    } catch (err) {
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <p className="modal-title">Edit {type === "application" ? "Application" : "User"}</p>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-form">
          {editableFields.map((col) => (
            <div key={col} className="form-field">
              <label>{COL_LABEL[col] || col}</label>
              {col === "status" ? (
                <select className="form-input" value={form[col] || ""} onChange={set(col)}>
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="form-input"
                  value={form[col] || ""}
                  onChange={set(col)}
                  placeholder={COL_LABEL[col] || col}
                />
              )}
            </div>
          ))}

          {isInterview && (
            <div style={{
              marginTop: "8px", padding: "16px",
              background: "#faf5ff", border: "1px solid #e9d5ff",
              borderRadius: "10px", display: "flex", flexDirection: "column", gap: "12px",
            }}>
              <p style={{ fontSize: "12px", fontWeight: "700", color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                📅 Interview Details
              </p>
              <div className="form-field" style={{ margin: 0 }}>
                <label>Date &amp; Time <span style={{ color: "#ef4444" }}>*</span></label>
                <input className="form-input" type="datetime-local" value={form.interview_datetime || ""} onChange={set("interview_datetime")} />
              </div>
              <div className="form-field" style={{ margin: 0 }}>
                <label>Venue <span style={{ color: "#ef4444" }}>*</span></label>
                <input className="form-input" value={form.venue || ""} onChange={set("venue")} placeholder="e.g. Meeting Room A, Level 3" />
              </div>
              <div className="form-field" style={{ margin: 0 }}>
                <label>Interviewer Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input className="form-input" value={form.interviewer_name || ""} onChange={set("interviewer_name")} placeholder="e.g. Dr. Amirul Hassan" />
              </div>
              <div className="form-field" style={{ margin: 0 }}>
                <label>Remarks</label>
                <textarea className="form-input" value={form.remarks || ""} onChange={set("remarks")} placeholder="Any additional notes for the applicant…" rows={3} style={{ resize: "vertical" }} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#b91c1c" }}>
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}