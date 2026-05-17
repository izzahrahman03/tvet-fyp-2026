// components/userTable/EditModal.jsx
import { useState } from "react";
import { updateUser, resendActivation } from "../../api/adminApi";
import { updateApplicationStatus } from "../../api/applicationApi";
import { COL_LABEL } from "./tableConfig";
import { FormSeparator } from "../../applicationManagement/ApplicationForm";
import CompanyDropdown from "./CompanyDropdown";

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

// Score colour helper
const scoreColor = (score) => {
  if (score == null) return "#94a3b8";
  if (score >= 75) return "#16a34a";
  if (score >= 50) return "#f59e0b";
  return "#dc2626";
};

// Validation helpers
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

export default function EditModal({ row, type, onClose, onSave }) {
  const [form, setForm] = useState({
    ...row,
    name:               row.name ?? row.contact_person_name ?? "",
    status:             "",
    application_status: "",
    interview_datetime: row.interview_datetime
      ? new Date(row.interview_datetime).toISOString().slice(0, 16)
      : "",
    venue:              row.venue            || "",
    interviewer_name:   row.interviewer_name || "",
    remarks:            row.remarks          || "",
    partner_id:         row.partner_id != null ? String(row.partner_id) : "",
  });
  const originalEmail = row.email ?? "";
  const [saving,      setSaving]      = useState(false);
  const [apiError,    setApiError]    = useState("");
  const [success,     setSuccess]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [emailResent, setEmailResent] = useState(false);

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setFieldErrors((p) => ({ ...p, [k]: "" }));
  };

  const editableFields = {
    applicant:           ["status"],
    student:             ["name", "email", "phone", "status"],
    industry_partner:    ["company_name", "industry_sector", "location", "name", "email", "phone", "status"],
    industry_supervisor: ["name", "email", "phone", "position", "status"],
    application:         ["application_status"],
    manager:             ["name", "email", "phone", "status"],
  }[type] || ["name", "email", "status"];

  const COMPANY_FIELDS = ["company_name", "industry_sector", "location"];
  const companyFields  = editableFields.filter(f =>  COMPANY_FIELDS.includes(f));
  const contactFields  = editableFields.filter(f => !COMPANY_FIELDS.includes(f));

  const fieldLabel = (col) => {
    if (type === "industry_partner") {
      if (col === "name")  return "Name";
      if (col === "email") return "Email";
      if (col === "phone") return "Phone Number";
    }
    return COL_LABEL[col] || col;
  };

  // ── Application state machine ─────────────────────────────
  const APP_TRANSITIONS = {
    submitted: [
      { value: 'attended', label: 'Attended — showed up for interview' },
      { value: 'absent',   label: 'Absent — did not attend'            },
    ],
    attended: [
      { value: 'passed', label: 'Passed — evaluation successful'   },
      { value: 'failed', label: 'Failed — evaluation unsuccessful' },
    ],
  };

  const LOCKED_STATUSES  = ['passed', 'failed', 'absent'];
  // FIX: use application_status, not status
  const currentAppStatus = row.application_status?.toLowerCase();
  const isLocked         = type === 'application' && LOCKED_STATUSES.includes(currentAppStatus);

  const statusOptions = type === 'application'
    ? (APP_TRANSITIONS[currentAppStatus] || [])
    : [
        { value: 'active',   label: 'Active'   },
        { value: 'inactive', label: 'Inactive' },
      ];

  const REQUIRED = ["company_name", "industry_sector", "location", "name", "email", "phone", "position"];

  const renderField = (col) => (
    <div key={col} className="form-field">
      <label>
        {fieldLabel(col)}
        {REQUIRED.includes(col) && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {/* FIX: handle both "status" (user roles) and "application_status" (applications) */}
      {col === "status" || col === "application_status" ? (
        isLocked ? (
          <input className="form-input" value={row.application_status || row.status || ""} readOnly
            style={{ background: '#f4f6f9', cursor: 'not-allowed', color: '#94a3b8' }} />
        ) : (
          <select className="form-input" value={form[col] || ""} onChange={set(col)}>
            <option value="" disabled>Select status...</option>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        )
      ) : (
        <input
          className={`form-input${fieldErrors[col] ? " input-error" : ""}`}
          value={form[col] || ""}
          onChange={set(col)}
          placeholder={fieldLabel(col)}
          type={col === "email" ? "email" : col === "phone" ? "tel" : "text"}
        />
      )}
      {fieldErrors[col] && <p className="form-field-error">{fieldErrors[col]}</p>}
    </div>
  );

  const handleSave = async () => {
    setApiError("");
    const errs = {};

    if (type !== "applicant" && type !== "application") {
      if (type === "industry_partner") {
        if (!form.company_name?.trim())    errs.company_name    = "Company name is required.";
        if (!form.industry_sector?.trim()) errs.industry_sector = "Industry sector is required.";
        if (!form.location?.trim())        errs.location        = "Location is required.";
      }
      if (!form.name?.trim()) errs.name = "Name is required.";
      if (!form.email?.trim()) {
        errs.email = "Email address is required.";
      } else if (!EMAIL_RE.test(form.email.trim())) {
        errs.email = "Please enter a valid email address (e.g. user@example.com).";
      }
      if (!form.phone?.trim()) {
        errs.phone = "Phone number is required.";
      } else if (!PHONE_RE.test(form.phone.trim())) {
        errs.phone = "Please enter a valid phone number (e.g. 0123456789).";
      }
      if (type === "industry_supervisor" && !form.position?.trim()) {
        errs.position = "Position is required.";
      }
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setApiError("Please fix the errors above before saving.");
      return;
    }

    setSaving(true);
    try {
      if (type === "application") {
        // FIX: send application_status, not status
        await updateApplicationStatus(row.id, {
          status:  form.application_status,
          remarks: form.remarks || null,
        });
        onSave({ ...row, application_status: form.application_status, remarks: form.remarks || null });
      } else {
        const payload = { ...form };
        delete payload.interview_datetime;
        delete payload.venue;
        delete payload.interviewer_name;
        delete payload.remarks;
        delete payload.education;
        delete payload.skills;
        delete payload.contact_person_name;

        const result = await updateUser(type, row.id, payload);
        onSave(result ?? { ...row, ...form });

        const emailChanged =
          form.email?.trim().toLowerCase() !== originalEmail.trim().toLowerCase();
        if (emailChanged && form.email?.trim()) {
          try {
            await resendActivation(row.id, form.email.trim());
            setEmailResent(true);
          } catch {
            // Non-fatal
          }
        }
      }

      setSuccess(true);
      setTimeout(() => { setSuccess(false); setEmailResent(false); onClose(); }, 2500);
    } catch (err) {
      setApiError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <p className="modal-title">Edit {type === "application" ? "Application" : "User"}</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-form">

          {success && (
            <div className="form-success">
              <CheckIcon />
              Changes saved successfully!
            </div>
          )}
          {emailResent && (
            <div className="form-success" style={{ background: "#f0fdf4", borderColor: "#86efac", color: "#166534" }}>
              <CheckIcon />
              Activation email sent to <strong>{form.email}</strong>.
            </div>
          )}
          {apiError && (
            <div className="form-error">
              <ErrorIcon />
              {apiError}
            </div>
          )}

          {type === "industry_partner" && (
            <>
              <FormSeparator title="Company Information" />
              {companyFields.map(renderField)}
              <FormSeparator title="Contact Person" />
              {contactFields.map(renderField)}
            </>
          )}

          {type === "industry_supervisor" && (
            <>
              <FormSeparator title="Personal Information" />
              {["name", "email", "phone", "position", "status"].map(renderField)}
              <FormSeparator title="Company" />
              <div className="form-field">
                <label>Company</label>
                <CompanyDropdown
                  value={form.partner_id}
                  onChange={(val) => setForm((p) => ({ ...p, partner_id: String(val) }))}
                />
                <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0" }}>
                  Changing this will reassign the supervisor to a different partner.
                </p>
              </div>
            </>
          )}

          {type !== "industry_partner" && type !== "industry_supervisor" && (
            editableFields.map(renderField)
          )}

          {/* ── Locked notice ── */}
          {type === 'application' && isLocked && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: '#fafafa', border: '1px solid #e2e8f0',
              borderRadius: '2px', padding: '12px 14px',
              fontSize: '13px', color: '#64748b',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              {/* FIX: use application_status */}
              This application is <strong style={{ color: '#1e293b', marginLeft: 4 }}>{row.application_status}</strong> and can no longer be edited.
            </div>
          )}

          {/* ── Interviewer evaluation score ── */}
          {type === 'application' && currentAppStatus === 'attended' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <div style={{ paddingBottom: 8, borderBottom: '2px solid #e2e8f0' }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#1b3a6b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Interviewer Evaluation Score
                </p>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Submitted by the assigned interviewer. Use this to decide Pass or Fail.
                </p>
              </div>

              {row.total_score != null ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '2px' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                    border: `4px solid ${scoreColor(row.total_score)}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor(row.total_score), lineHeight: 1 }}>
                      {row.total_score}
                    </span>
                    <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>/ 100</span>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      Score: {row.total_score}%
                      <span style={{
                        marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: row.total_score >= 75 ? '#dcfce7' : row.total_score >= 50 ? '#fef9c3' : '#fee2e2',
                        color:      row.total_score >= 75 ? '#15803d' : row.total_score >= 50 ? '#854d0e' : '#b91c1c',
                      }}>
                        {row.total_score >= 75 ? 'Strong' : row.total_score >= 50 ? 'Average' : 'Weak'}
                      </span>
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                      Based on 12 criteria scored 1–5 by the interviewer.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '2px', fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                  </svg>
                  No evaluation score submitted yet. The interviewer has not completed their evaluation.
                </div>
              )}

              <div className="form-field" style={{ margin: 0 }}>
                <label>
                  Remarks
                  <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>(optional)</span>
                </label>
                <textarea
                  className="form-input"
                  value={form.remarks || ''}
                  onChange={set('remarks')}
                  placeholder="Any notes for this applicant..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {/* ── Remarks for non-attended, non-locked application states ── */}
          {type === 'application' && currentAppStatus !== 'attended' && !isLocked && (
            <div className="form-field">
              <label>Remarks <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 12 }}>(optional)</span></label>
              <textarea
                className="form-input"
                value={form.remarks || ''}
                onChange={set('remarks')}
                placeholder="Any notes for this applicant..."
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
          )}

          {type === "application" && row.preferred_slot_label && (
            <div style={{
              marginTop: '8px', padding: '12px 14px',
              background: '#f0f9ff', border: '1px solid #bae6fd',
              borderRadius: '2px', fontSize: '13px', color: '#0c4a6e',
            }}>
              <strong>Applicant's preferred slot:</strong> {row.preferred_slot_label}
            </div>
          )}

        </div>

        <div className="modal-footer">
          <button className="ut-btn-primary" onClick={handleSave} disabled={saving || success || isLocked} style={{ opacity: (saving || success || isLocked) ? 0.7 : 1 }}>
            {saving ? "Saving..." : success ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}