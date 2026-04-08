import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/Layout";
import useToast                from "../userManagement/userTable/useToast";
import "../../css/userManagement/userTable.css";

const API = process.env.REACT_APP_API_URL;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── Password strength ──────────────────────────────────────
const getStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

// ── Input Field ────────────────────────────────────────────
function Field({ label, hint, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "14.5px", fontWeight: "700", color: "#374151", letterSpacing: "0.02em" }}>
        {label}
      </label>
      {children}
      {hint  && !error && <span style={{ fontSize: "13.5px", color: "#94a3b8" }}>{hint}</span>}
      {error && <span style={{ fontSize: "13.5px", color: "#ef4444", fontWeight: "600" }}>{error}</span>}
    </div>
  );
}

function Input({ icon, rightEl, error, ...props }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "9px",
      border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
      borderRadius: "2px", padding: "0 13px",
      background: error ? "#fff5f5" : "#f8fafc",
      transition: "border-color 0.15s, box-shadow 0.15s",
      boxShadow: error ? "0 0 0 3px rgba(239,68,68,0.08)" : "none",
    }}
      onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "#1a56db"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(26,86,219,0.1)"; }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = error ? "#ef4444" : "#e2e8f0"; e.currentTarget.style.boxShadow = error ? "0 0 0 3px rgba(239,68,68,0.08)" : "none"; }}
    >
      {icon && <span style={{ color: "#94a3b8", flexShrink: 0, display: "flex" }}>{icon}</span>}
      <input style={{
        flex: 1, border: "none", outline: "none", background: "none",
        padding: "11px 0", fontSize: "16px", color: "#1e293b", fontFamily: "inherit",
      }} {...props} />
      {rightEl}
    </div>
  );
}

// ── Section Card ───────────────────────────────────────────
function Card({ title, subtitle, children }) {
  return (
    <div style={{
      background: "white", borderRadius: "5px", overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      border: "1px solid #f1f5f9",
    }}>
      <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid #f8fafc" }}>
        <h2 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.3px" }}>{title}</h2>
        {subtitle && <p style={{ fontSize: "14.5px", color: "#94a3b8", marginTop: "3px", marginBottom: 0 }}>{subtitle}</p>}
      </div>
      <div style={{ padding: "24px 28px" }}>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Main Profile Page
// ══════════════════════════════════════════════════════════
export default function UpdateProfile() {
  const navigate = useNavigate();

  // ── Load user from localStorage ───────────────────────────
  const stored   = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = stored?.role || "applicant";
  const userMatric = stored?.matricNumber || "";

  // ── Profile form ──────────────────────────────────────────
  const [name,      setName]      = useState(stored?.name  || "");
  const [email,     setEmail]     = useState(stored?.email || "");
  const [nameErr,   setNameErr]   = useState("");
  const [emailErr,  setEmailErr]  = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Password form ─────────────────────────────────────────
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [pwErr,      setPwErr]      = useState("");
  const [savingPw,   setSavingPw]   = useState(false);

  // ── Toast ─────────────────────────────────────────────────
  const { toast, show } = useToast();

  const strength    = getStrength(newPw);
  const strengthPct = (strength / 4) * 100;
  const pwMatch     = newPw && confirmPw && newPw === confirmPw;
  const pwMismatch  = confirmPw.length > 0 && newPw !== confirmPw;

  const requirements = [
    { label: "At least 8 characters",      met: newPw.length >= 8 },
    { label: "One uppercase letter (A–Z)",  met: /[A-Z]/.test(newPw) },
    { label: "One number (0–9)",            met: /[0-9]/.test(newPw) },
    { label: "One special character (!@#$%^&*()-+)", met: /[^A-Za-z0-9]/.test(newPw) },
  ];

  // ── Save profile ──────────────────────────────────────────
  const handleSaveProfile = async () => {
    let valid = true;
    if (!name.trim())  { setNameErr("Name is required.");                    valid = false; }
    if (!email.trim()) { setEmailErr("Email is required.");                   valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailErr("Enter a valid email."); valid = false; }
    if (!valid) return;

    setNameErr(""); setEmailErr("");
    setSavingProfile(true);

    try {
      const res  = await fetch(`${API}/profile`, {
        method:  "PUT",
        headers: authHeaders(),
        body:    JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) { show(data.message || "Failed to update profile.", "error"); return; }

      // Update localStorage
      const updated = { ...stored, name, email };
      localStorage.setItem("user", JSON.stringify(updated));
      show("Profile updated successfully!");
    } catch {
      show("Network error. Please try again.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Save password ─────────────────────────────────────────
  const handleSavePassword = async () => {
    if (!currentPw)  { setPwErr("Current password is required."); return; }
    if (!newPw)      { setPwErr("New password is required.");      return; }
    if (!requirements.every((r) => r.met)) { setPwErr("Password does not meet all requirements."); return; }
    if (!pwMatch)    { setPwErr("Passwords do not match.");         return; }
    setPwErr("");
    setSavingPw(true);

    try {
      const res  = await fetch(`${API}/profile/password`, {
        method:  "PUT",
        headers: authHeaders(),
        body:    JSON.stringify({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw }),
      });
      const data = await res.json();
      if (!res.ok) { setPwErr(data.message || "Failed to update password."); return; }

      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      show("Password changed successfully!");
    } catch {
      show("Network error. Please try again.", "error");
    } finally {
      setSavingPw(false);
    }
  };

  // ── Eye button ─────────────────────────────────────────────
  const EyeBtn = ({ show: showPw, onToggle }) => (
    <button type="button" onClick={onToggle}
      style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex", alignItems: "center", flexShrink: 0 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {showPw
          ? <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
          : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
        }
      </svg>
    </button>
  );

  const roleLabels = {
    admin:               "Administrator",
    applicant:           "Applicant",
    student:             "Student",
    industry_partner:    "Industry Partner",
    industry_supervisor: "Industry Supervisor",
    manager:             "Manager", 
  };

  return (
    <>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .profile-section { animation: fadeUp 0.4s ease both; }
        .profile-section:nth-child(2) { animation-delay: 0.08s; }
        .profile-section:nth-child(3) { animation-delay: 0.16s; }
        .save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: none; }
        .save-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      {toast && (
        <div className={`ut-toast ${toast.kind}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={toast.kind === 'error' ? 'M18 6L6 18M6 6l12 12' : 'M20 6L9 17l-5-5'} />
          </svg>
          {toast.msg}
        </div>
      )}

      <DashboardLayout title="My Profile">
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* ── Profile info ─────────────────────────────── */}
          <div className="profile-section">
            <Card title="Profile Information" subtitle="Update your name and email address">
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <Field label="Full Name" error={nameErr}>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setNameErr(""); }}
                    placeholder="Your full name"
                    error={nameErr}
                    icon={
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    }
                  />
                </Field>

                <Field label="Email Address" error={emailErr}>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailErr(""); }}
                    placeholder="your@email.com"
                    error={emailErr}
                    icon={
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"/>
                      </svg>
                    }
                  />
                </Field>

                <Field label="Role">
                  <div style={{
                    display: "flex", alignItems: "center", gap: "9px",
                    border: "1.5px solid #e2e8f0", borderRadius: "2px",
                    padding: "11px 13px", background: "#f1f5f9",
                    fontSize: "16px", color: "#64748b",
                    cursor: "not-allowed",
                  }}>
                    {roleLabels[userRole] || userRole}
                  </div>
                </Field>

                {userRole === "student" && (
                  <Field label="Matric Number">
                    <div style={{
                      display: "flex", alignItems: "center", gap: "9px",
                      border: "1.5px solid #e2e8f0", borderRadius: "2px",
                      padding: "11px 13px", background: "#f1f5f9",
                      fontSize: "16px", color: "#64748b",
                      cursor: "not-allowed",
                    }}>
                      {userMatric || "Not provided"}
                    </div>
                  </Field>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "4px" }}>
                  <button className="save-btn" onClick={handleSaveProfile} disabled={savingProfile}
                    style={{
                      background: "#1b3a6b",
                      color: "white", border: "none", borderRadius: "2px",
                      padding: "11px 24px", fontSize: "16px", fontWeight: "700",
                      cursor: savingProfile ? "not-allowed" : "pointer",
                      opacity: savingProfile ? 0.7 : 1,
                      display: "flex", alignItems: "center", gap: "7px",
                      transition: "transform 0.1s",
                      fontFamily: "inherit",
                    }}>
                    {savingProfile ? (
                      <>
                        <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />
                        Saving…
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Change password ───────────────────────────── */}
          <div className="profile-section">
            <Card title="Change Password" subtitle="Use a strong password with at least 8 characters">
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Current password */}
                <Field label="Current Password">
                  <Input
                    type={showCur ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => { setCurrentPw(e.target.value); setPwErr(""); }}
                    placeholder="Enter your current password"
                    autoComplete="new-password"
                    icon={
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    }
                    rightEl={<EyeBtn showPw={showCur} onToggle={() => setShowCur(v => !v)} />}
                  />
                </Field>

                {/* New password */}
                <Field label="New Password" hint="Min 8 characters, one uppercase, one number">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => { setNewPw(e.target.value); setPwErr(""); }}
                    placeholder="Create a strong password"
                    icon={
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    }
                    rightEl={<EyeBtn showPw={showNew} onToggle={() => setShowNew(v => !v)} />}
                  />

                  {/* Strength bar */}
                  {newPw && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontSize: "13.5px", color: "#94a3b8" }}>Password strength</span>
                        <span style={{ fontSize: "13.5px", fontWeight: "700", color: STRENGTH_COLORS[strength] }}>
                          {STRENGTH_LABELS[strength]}
                        </span>
                      </div>
                      <div style={{ background: "#f1f5f9", borderRadius: "2px", height: "5px", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "2px", width: `${strengthPct}%`, background: STRENGTH_COLORS[strength], transition: "width 0.35s ease, background 0.35s ease" }} />
                      </div>
                    </div>
                  )}

                  {/* Requirements */}
                  {newPw && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                      {requirements.map((r) => (
                        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "14.5px", color: r.met ? "#10b981" : "#94a3b8", fontWeight: r.met ? "600" : "400", transition: "color 0.2s" }}>
                          <span style={{ width: "14px", textAlign: "center" }}>{r.met ? "✓" : "·"}</span>
                          {r.label}
                        </div>
                      ))}
                    </div>
                  )}
                </Field>

                {/* Confirm password */}
                <Field label="Confirm New Password">
                  <Input
                    type={showConf ? "text" : "password"}
                    value={confirmPw}
                    onChange={(e) => { setConfirmPw(e.target.value); setPwErr(""); }}
                    placeholder="Re-enter your new password"
                    error={pwMismatch ? "Passwords do not match" : ""}
                    icon={
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    }
                    rightEl={<EyeBtn showPw={showConf} onToggle={() => setShowConf(v => !v)} />}
                  />
                  {pwMismatch && <span style={{ fontSize: "13.5px", color: "#ef4444", fontWeight: "600" }}>✕ Passwords do not match</span>}
                  {pwMatch    && <span style={{ fontSize: "13.5px", color: "#10b981", fontWeight: "600" }}>✓ Passwords match</span>}
                </Field>

                {/* Error */}
                {pwErr && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "2px", padding: "10px 14px", fontSize: "15px", color: "#b91c1c", fontWeight: "500" }}>
                    {pwErr}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "4px" }}>
                  <button className="save-btn" onClick={handleSavePassword}
                    disabled={savingPw || pwMismatch || !currentPw || !newPw || !confirmPw || !requirements.every(r => r.met)}
                    style={{
                      background: "#1b3a6b",
                      color: "white", border: "none", borderRadius: "2px",
                      padding: "11px 24px", fontSize: "16px", fontWeight: "700",
                      cursor: (savingPw || pwMismatch || !currentPw || !newPw || !confirmPw) ? "not-allowed" : "pointer",
                      opacity: (savingPw || pwMismatch || !currentPw || !newPw || !confirmPw || !requirements.every(r => r.met)) ? 0.55 : 1,
                      display: "flex", alignItems: "center", gap: "7px",
                      transition: "transform 0.1s",
                      fontFamily: "inherit",
                    }}>
                    {savingPw ? (
                      <>
                        <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />
                        Updating…
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </DashboardLayout>
    </>
  );
}