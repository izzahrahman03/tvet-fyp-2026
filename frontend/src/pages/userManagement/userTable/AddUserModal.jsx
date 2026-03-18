// components/userTable/AddUserModal.jsx
import { useState } from "react";
import { addUser } from "../../api/adminApi";
import CompanyDropdown from "./CompanyDropdown";

export default function AddUserModal({ type, onClose, onSave }) {
  const isPartner    = type === "industry_partner";
  const isSupervisor = type === "industry_supervisor";

  const [form, setForm] = useState({
    name: "",            // backend expects "name" for both partner (company name) and supervisor
    email: "",
    phone: "",
    industry_sector: "",
    location: "",
    company: "",
    position: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name?.trim())  return alert(isPartner ? "Company name is required." : "Name is required.");
    if (!form.email?.trim()) return alert("Email is required.");
    if (isSupervisor && !form.company?.trim()) return alert("Company is required.");

    setSaving(true);
    try {
      const saved = await addUser(type, form);
      onSave(saved);
      onClose();
    } catch (err) {
      alert(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const textFields = [
    { label: isPartner ? "Company Name" : "Name", key: "name",  placeholder: isPartner ? "e.g. Tech Solutions Sdn Bhd" : "e.g. Ahmad Faris" },
    { label: "Email Address", key: "email", placeholder: "email@example.com" },
    { label: "Phone Number",  key: "phone", placeholder: "e.g. 012-3456789" },
    ...(isPartner ? [
      { label: "Industry Sector", key: "industry_sector", placeholder: "e.g. IT & Software" },
      { label: "Location",        key: "location",        placeholder: "e.g. Kuala Lumpur" },
    ] : []),
    ...(isSupervisor ? [
      { label: "Position", key: "position", placeholder: "e.g. Senior Engineer" },
    ] : []),
  ];

  const typeLabel = {
    applicant:           "Applicant",
    student:             "Student",
    industry_partner:    "Industry Partner",
    industry_supervisor: "Industry Supervisor",
  }[type] || "User";

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <p className="modal-title">Add New {typeLabel}</p>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-form">
          {textFields.map(({ label, key, placeholder }) => (
            <div key={key} className="form-field">
              <label>{label}</label>
              <input
                className="form-input"
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
              />
            </div>
          ))}

          {/* Searchable company dropdown — only for supervisor */}
          {isSupervisor && (
            <div className="form-field">
              <label>Company <span style={{ color: "#ef4444" }}>*</span></label>
              <CompanyDropdown
                value={form.company}
                onChange={(val) => setForm((p) => ({ ...p, company: val }))}
              />
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0" }}>
                Select from existing industry partners or type a custom name.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
}