// components/userTable/AddUserModal.jsx
import { useState } from "react";
import { addUser } from "../../api/adminApi";
import CompanyDropdown from "./CompanyDropdown";
import { FormSeparator } from "../../applicationManagement/ApplicationForm";

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

export default function AddUserModal({ type, onClose, onSave }) {
  const isPartner    = type === "industry_partner";
  const isSupervisor = type === "industry_supervisor";
  const isManager    = type === "manager";

  const [form, setForm] = useState({
    name:            "",
    email:           "",
    phone:           "",
    company_name:    "",
    industry_sector: "",
    location:        "",
    position:        "",
    partner_id:      "",
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
    if (!form.name?.trim())                         errs.name         = "Name is required.";
    if (!form.email?.trim())                        errs.email        = "Email address is required.";
    if (isPartner && !form.company_name?.trim())    errs.company_name = "Company name is required.";
    if (isSupervisor && !form.partner_id)           errs.partner_id   = "Please select a company.";

    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setSaving(true);
    try {
      const saved = await addUser(type, form);
      setSuccess(true);
      setTimeout(() => { onSave(saved); onClose(); }, 1500);
    } catch (err) {
      setApiError(err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const textFields = [
    ...(isPartner ? [
      { label: "Company Name",    key: "company_name",    placeholder: "e.g. Tech Solutions Sdn Bhd", required: true },
      { label: "Industry Sector", key: "industry_sector", placeholder: "e.g. IT & Software" },
      { label: "Location",        key: "location",        placeholder: "e.g. Kuala Lumpur" },
    ] : []),
    { label: "Name",          key: "name",  placeholder: "e.g. Ahmad Faris",   required: true },
    { label: "Email Address", key: "email", placeholder: "email@example.com",  required: true },
    { label: "Phone Number",  key: "phone", placeholder: "e.g. 012-3456789" },
    ...(isSupervisor ? [
      { label: "Position", key: "position", placeholder: "e.g. Senior Engineer" },
    ] : []),
  ];

  const typeLabel = {
    applicant:           "Applicant",
    student:             "Student",
    industry_partner:    "Industry Partner",
    industry_supervisor: "Industry Supervisor",
    manager:              "Manager",
  }[type] || "User";

  const partnerFields = textFields.filter(f => ["company_name", "industry_sector", "location"].includes(f.key));
  const contactFields = textFields.filter(f => !["company_name", "industry_sector", "location"].includes(f.key));

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <p className="modal-title">Add New {typeLabel}</p>
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
              User added successfully!
            </div>
          )}
          {apiError && (
            <div className="form-error">
              <ErrorIcon />
              {apiError}
            </div>
          )}

          {/* ── Company section — partner only ── */}
          {isPartner && <FormSeparator title="Company Information" />}
          {partnerFields.map(({ label, key, placeholder, required }) => (
            <div key={key} className="form-field">
              <label>{label}{required && <span style={{ color: "#ef4444" }}> *</span>}</label>
              <input
                className={`form-input${fieldErrors[key] ? " input-error" : ""}`}
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
              />
              {fieldErrors[key] && <p className="form-field-error">{fieldErrors[key]}</p>}
            </div>
          ))}

          {/* ── Contact / personal section ── */}
          <FormSeparator title={isPartner ? "Contact Person" : "Personal Information"} />
          {contactFields.map(({ label, key, placeholder, required }) => (
            <div key={key} className="form-field">
              <label>{label}{required && <span style={{ color: "#ef4444" }}> *</span>}</label>
              <input
                className={`form-input${fieldErrors[key] ? " input-error" : ""}`}
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
              />
              {fieldErrors[key] && <p className="form-field-error">{fieldErrors[key]}</p>}
            </div>
          ))}

          {/* ── Supervisor company dropdown ── */}
          {isSupervisor && (
            <>
              <FormSeparator title="Company" />
              <div className="form-field">
                <label>Company <span style={{ color: "#ef4444" }}>*</span></label>
                <CompanyDropdown
                  value={form.partner_id}
                  onChange={(val) => {
                    setForm((p) => ({ ...p, partner_id: val }));
                    setFieldErrors((p) => ({ ...p, partner_id: "" }));
                  }}
                  className={fieldErrors.partner_id ? "input-error" : ""}
                />
                {fieldErrors.partner_id
                  ? <p className="form-field-error">{fieldErrors.partner_id}</p>
                  : <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0" }}>Select the industry partner this supervisor belongs to.</p>
                }
              </div>
            </>
          )}

        </div>

        <div className="modal-footer">
          <button className="ut-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="ut-btn-primary" onClick={handleSave} disabled={saving || success} style={{ opacity: (saving || success) ? 0.7 : 1 }}>
            {saving ? "Saving…" : success ? "Saved!" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
}