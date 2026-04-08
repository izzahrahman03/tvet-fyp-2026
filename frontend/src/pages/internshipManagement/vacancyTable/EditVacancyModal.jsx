// components/userTable/EditVacancyModal.jsx
import { useState } from "react";
import { updateVacancy } from "../../api/vacancyApi";

const ErrorIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function EditVacancyModal({ row, onClose, onSave }) {
  const [form, setForm] = useState({
    position_name:    row.position_name    || "",
    capacity:         String(row.capacity  ?? ""),
    description:      row.description      || "",
    responsibilities: row.responsibilities || "",
    start_date: row.start_date ? new Date(row.start_date).toISOString().slice(0, 10) : "",
    end_date:   row.end_date   ? new Date(row.end_date).toISOString().slice(0, 10)   : "",
    status: (row.status || "open").toLowerCase(),
  });
  const [saving,      setSaving]      = useState(false);
  const [apiError,    setApiError]    = useState("");
  const [success,     setSuccess]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setFieldErrors((p) => ({ ...p, [k]: "" }));
  };

  const handleSave = async () => {
    setApiError("");
    const errs = {};
    if (!form.position_name.trim())
      errs.position_name = "Position name is required.";
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) < 1)
      errs.capacity = "Capacity must be a positive number.";
    if (!form.start_date)
      errs.start_date = "Start date is required.";
    if (!form.end_date)
      errs.end_date = "End date is required.";
    else if (form.start_date && form.start_date >= form.end_date)
      errs.end_date = "End date must be after start date.";

    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setSaving(true);
    try {
      const result = await updateVacancy(row.vacancy_id ?? row.id, {
        position_name:    form.position_name.trim(),
        capacity:         Number(form.capacity),
        description:      form.description      || null,
        responsibilities: form.responsibilities || null,
        start_date:       form.start_date,
        end_date:         form.end_date,
        status:           form.status,
      });
      onSave(result ?? { ...row, ...form, capacity: Number(form.capacity) });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    } catch (err) {
      setApiError(err.message || "Failed to update vacancy.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "540px" }}>

        <div className="modal-header">
          <p className="modal-title">Edit Vacancy</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-form">

          {/* ── Banners — always at top ── */}
          {success && (
            <div className="form-success">
              <CheckIcon />
              Vacancy updated successfully!
            </div>
          )}
          {apiError && (
            <div className="form-error">
              <ErrorIcon />
              {apiError}
            </div>
          )}

          {/* ── Position Details ── */}
          <div style={{ paddingBottom: "10px", marginBottom: "4px", borderBottom: "1.5px solid #dce6f0" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Position Details
            </span>
          </div>

          <div className="form-field">
            <label>Position Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              className={`form-input${fieldErrors.position_name ? " input-error" : ""}`}
              value={form.position_name}
              onChange={set("position_name")}
              placeholder="e.g. Software Engineering Intern"
            />
            {fieldErrors.position_name && <p className="form-field-error">{fieldErrors.position_name}</p>}
          </div>

          <div className="form-field">
            <label>Capacity <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              className={`form-input${fieldErrors.capacity ? " input-error" : ""}`}
              type="number"
              min="1"
              value={form.capacity}
              onChange={set("capacity")}
            />
            {fieldErrors.capacity && <p className="form-field-error">{fieldErrors.capacity}</p>}
          </div>

          <div className="form-field">
            <label>Description</label>
            <textarea
              className="form-input"
              value={form.description}
              onChange={set("description")}
              placeholder="Brief overview of the internship role…"
              rows={3}
            />
          </div>

          <div className="form-field">
            <label>Responsibilities</label>
            <textarea
              className="form-input"
              value={form.responsibilities}
              onChange={set("responsibilities")}
              placeholder="Key tasks and responsibilities…"
              rows={3}
            />
          </div>

          {/* ── Duration & Status ── */}
          <div style={{ paddingBottom: "10px", marginBottom: "4px", borderBottom: "1.5px solid #dce6f0", marginTop: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Duration & Status
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Start Date <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                className={`form-input${fieldErrors.start_date ? " input-error" : ""}`}
                type="date"
                value={form.start_date}
                onChange={set("start_date")}
              />
              {fieldErrors.start_date && <p className="form-field-error">{fieldErrors.start_date}</p>}
            </div>
            <div className="form-field">
              <label>End Date <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                className={`form-input${fieldErrors.end_date ? " input-error" : ""}`}
                type="date"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={set("end_date")}
              />
              {fieldErrors.end_date && <p className="form-field-error">{fieldErrors.end_date}</p>}
            </div>
          </div>

          <div className="form-field">
            <label>Status</label>
            <select className="form-input" value={form.status} onChange={set("status")}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

        </div>

        <div className="modal-footer">
          <button className="ut-btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="ut-btn-primary"
            onClick={handleSave}
            disabled={saving || success}
            style={{ opacity: (saving || success) ? 0.7 : 1 }}
          >
            {saving ? "Saving…" : success ? "Saved!" : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}