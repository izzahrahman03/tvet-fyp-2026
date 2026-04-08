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

// Validation helpers
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

export default function EditModal({ row, type, onClose, onSave }) {
  const [form, setForm] = useState({
    ...row,
    name:               row.name ?? row.contact_person_name ?? "",
    status:             "",
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
    application:         ["status"],
    manager:              ["name", "email", "phone", "status"],
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

  const statusOptions = type === "application"
    ? [
        { value: "attended", label: "Attended — showed up for interview" },
        { value: "absent",   label: "Absent — did not attend"           },
        { value: "passed",   label: "Passed — evaluation successful"    },
        { value: "failed",   label: "Failed — evaluation unsuccessful"  },
      ]
    : [
        { value: "active",   label: "Active"   },
        { value: "inactive", label: "Inactive" },
      ];

  const REQUIRED = ["company_name", "industry_sector", "location", "name", "email", "phone", "position"];

  const renderField = (col) => (
    <div key={col} className="form-field">
      <label>
        {fieldLabel(col)}
        {REQUIRED.includes(col) && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {col === "status" ? (
        <select className="form-input" value={form[col] || ""} onChange={set(col)}>
          <option value="" disabled>Select status...</option>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
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

      // Company fields only exist on industry_partner
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
        await updateApplicationStatus(row.id, {
          status:  form.status,
          remarks: form.remarks || null,
        });
        onSave({ ...row, status: form.status, remarks: form.remarks || null });
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

        // Resend activation email if the address changed
        const emailChanged =
          form.email?.trim().toLowerCase() !== originalEmail.trim().toLowerCase();
        if (emailChanged && form.email?.trim()) {
          try {
            await resendActivation(row.id, form.email.trim());
            setEmailResent(true);
          } catch {
            // Non-fatal - user record already saved. Silently skip.
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

          {type === "application" && (
            <div className="form-field">
              <label>Remarks (optional)</label>
              <textarea
                className="form-input"
                value={form.remarks || ""}
                onChange={set("remarks")}
                placeholder="Any notes for this applicant..."
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>
          )}

          {type === "application" && row.preferred_slot_label && (
            <div style={{
              marginTop: "8px", padding: "12px 14px",
              background: "#f0f9ff", border: "1px solid #bae6fd",
              borderRadius: "2px", fontSize: "13px", color: "#0c4a6e",
            }}>
              <strong>Applicant's preferred slot:</strong> {row.preferred_slot_label}
            </div>
          )}

        </div>

        <div className="modal-footer">
          <button className="ut-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="ut-btn-primary" onClick={handleSave} disabled={saving || success} style={{ opacity: (saving || success) ? 0.7 : 1 }}>
            {saving ? "Saving..." : success ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}