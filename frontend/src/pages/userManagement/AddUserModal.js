// components/AddUserModal.updated.jsx
// Drop-in replacement for the AddUserModal in your existing UserTable.jsx
// This version calls the backend POST /api/auth/create-user
// which generates a temp password and sends the activation email automatically.

import { useState } from "react";

const API = process.env.REACT_APP_API_URL;

export default function AddUserModal({ type, onClose, onSave, authToken }) {
  // authToken = your admin JWT, pass it from wherever you store it (context/localStorage)

  const isPartner    = type === "industry_partner";
  const isSupervisor = type === "industry_supervisor";
  const isStudent    = type === "student";

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    industry: "", location: "",
    company: "", role: "",
    program: "", year: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setError("");
    setSaving(true);

    try {
      const res  = await fetch(`${API}/auth/create-user`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({ ...form, user_type: type }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create user.");
        return;
      }

      // Notify parent and close — the activation email has already been sent
      onSave({ ...form, user_type: type, status: "Pending" });
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = {
    applicant:            "Applicant",
    student:              "Student",
    industry_partner:     "Industry Partner",
    industry_supervisor:  "Industry Supervisor",
  }[type] || "User";

  const fields = [
    { label: "Full Name",     key: "name",  placeholder: isPartner ? "e.g. Tech Solutions Sdn Bhd" : "e.g. Ahmad Faris" },
    { label: "Email Address", key: "email", placeholder: "email@example.com", type: "email" },
    { label: "Phone Number",  key: "phone", placeholder: "e.g. 012-3456789" },
    ...(isPartner    ? [{ label: "Industry Sector", key: "industry", placeholder: "e.g. IT & Software" }, { label: "Location", key: "location", placeholder: "e.g. Kuala Lumpur" }] : []),
    ...(isSupervisor ? [{ label: "Company",         key: "company",  placeholder: "e.g. Tech Solutions" }, { label: "Role / Position", key: "role", placeholder: "e.g. Senior Engineer" }] : []),
    ...(isStudent    ? [{ label: "Program",          key: "program",  placeholder: "e.g. Software Engineering" }, { label: "Year", key: "year", placeholder: "e.g. Year 3" }] : []),
  ];

  // ── Styles (reuse your existing modal styles) ─────────────
  const inputStyle = {
    width: "100%", padding: "9px 13px", borderRadius: "9px",
    border: "1px solid #e2e8f0", fontSize: "13.5px",
    outline: "none", color: "#1e293b", background: "#f8fafc",
    fontFamily: "inherit",
  };
  const labelStyle = { fontSize: "12.5px", fontWeight: "600", color: "#475569", marginBottom: "5px", display: "block" };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
      zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", backdropFilter: "blur(2px)",
    }}>
      <div style={{
        background: "white", borderRadius: "18px", padding: "28px",
        width: "100%", maxWidth: "500px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>Add New {typeLabel}</h2>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
              An activation email with a temporary password will be sent automatically.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", cursor: "pointer", borderRadius: "8px", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><path d="M18 6L6 18 M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Email send notice */}
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "11px 14px", marginBottom: "20px", display: "flex", gap: "8px", fontSize: "12.5px", color: "#1e40af" }}>
          <span>📧</span>
          <span>A <strong>temporary password</strong> and activation link will be emailed to the user upon creation.</span>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "9px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#b91c1c" }}>
            {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {fields.map(({ label, key, placeholder, type: fType }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input style={inputStyle} type={fType || "text"} value={form[key]} onChange={set(key)} placeholder={placeholder} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "9px", border: "1px solid #e2e8f0", background: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer", color: "#64748b", fontFamily: "inherit" }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 1, padding: "10px", borderRadius: "9px", border: "none", background: saving ? "#93c5fd" : "#1a56db", fontSize: "14px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer", color: "white", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            {saving ? (
              <>
                <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />
                Sending…
              </>
            ) : "Create & Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}