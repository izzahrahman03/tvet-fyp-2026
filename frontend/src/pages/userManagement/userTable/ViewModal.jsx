// components/userTable/ViewModal.jsx
import { useState, useEffect } from "react";
import StatusBadge from "./StatusBadge";
import { fetchApplicationById } from "../../api/adminApi";

// ── Shared styles ─────────────────────────────────────────
const miniTableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "13px" };
const miniThStyle    = {
  textAlign: "left", padding: "7px 10px",
  background: "#f1f5f9", color: "#475569",
  fontWeight: "600", fontSize: "11px",
  textTransform: "uppercase", letterSpacing: "0.04em",
  borderBottom: "1px solid #e2e8f0",
};
const miniTdStyle = {
  padding: "7px 10px", color: "#1e293b",
  borderBottom: "1px solid #f1f5f9",
};

// ── Reusable components ───────────────────────────────────
function Section({ icon, title, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", paddingBottom: "8px", borderBottom: "2px solid #e2e8f0" }}>
        <span style={{ fontSize: "16px" }}>{icon}</span>
        <span style={{ fontWeight: "600", fontSize: "14px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, wide = false }) {
  return (
    <div className="form-field" style={{ margin: 0, gridColumn: wide ? "1 / -1" : undefined }}>
      <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </label>
      <div style={{ padding: "9px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#1e293b", marginTop: "4px" }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

function Grid({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
      {children}
    </div>
  );
}

function StatusField({ status }) {
  return (
    <div className="form-field" style={{ margin: 0 }}>
      <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Status
      </label>
      <div style={{ marginTop: "4px" }}>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

// ── Application view sections ─────────────────────────────
function ApplicationView({ row, fmt, fmtDateTime }) {
  const education = row.education || [];
  const skills    = row.skills    || [];

  // Show interview section for statuses where it is relevant and data exists
  const showInterview = (
    ["interview", "rejected_interview", "approved", "accepted"].includes(row.status?.toLowerCase())
    && row.interview_datetime
  );

  return (
    <>
      {/* Personal Information */}
      <Section icon="👤" title="Personal Information">
        <Grid>
          <Field label="Name"           value={row.name}            wide />
          <Field label="IC Number"      value={row.ic_number}       wide />
          <Field label="Date of Birth"  value={fmt(row.date_of_birth)} />
          <Field label="Gender"         value={row.gender} />
          <Field label="Race"           value={row.race} />
          <Field label="Marital Status" value={row.marital_status} />
          <Field label="Email"          value={row.email} />
          <Field label="Phone"          value={row.phone} />
          <Field label="Address"        value={row.street_address}  wide />
          <Field label="City"           value={row.city} />
          <Field label="Postal Code"    value={row.postal_code} />
          <Field label="State"          value={row.state} />
          <Field label="Country"        value={row.country} />
          <StatusField status={row.status} />
          <Field label="Last Updated"   value={fmt(row.updated_at)} />
        </Grid>
      </Section>

      {/* Education */}
      <Section icon="🎓" title="Education">
        {education.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>No education records.</p>
        ) : (
          <table style={miniTableStyle}>
            <thead>
              <tr>
                <th style={miniThStyle}>Institute</th>
                <th style={miniThStyle}>Qualification</th>
                <th style={miniThStyle}>Major</th>
                <th style={miniThStyle}>Start Date</th>
                <th style={miniThStyle}>End Date</th>
              </tr>
            </thead>
            <tbody>
              {education.map((e, i) => (
                <tr key={i}>
                  <td style={miniTdStyle}>{e.institute_name || "—"}</td>
                  <td style={miniTdStyle}>{e.qualification  || "—"}</td>
                  <td style={miniTdStyle}>{e.major          || "—"}</td>
                  <td style={miniTdStyle}>{fmt(e.start_date)}</td>
                  <td style={miniTdStyle}>{fmt(e.end_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Skills */}
      <Section icon="💼" title="Skills">
        {skills.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>No skills listed.</p>
        ) : (
          <table style={miniTableStyle}>
            <thead>
              <tr>
                <th style={miniThStyle}>Skill</th>
                <th style={miniThStyle}>Proficiency</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((s, i) => (
                <tr key={i}>
                  <td style={miniTdStyle}>{s.skill_name  || "—"}</td>
                  <td style={miniTdStyle}>{s.proficiency || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Interview Details */}
      {showInterview && (
        <Section icon="📅" title="Interview Details">
          <Grid>
            {/* FIX: fmtDateTime was not being passed down — interview datetime was always "—" */}
            <Field label="Date & Time" value={fmtDateTime(row.interview_datetime)} wide />
            <Field label="Venue"       value={row.venue}            wide />
            <Field label="Interviewer" value={row.interviewer_name} />
            <Field label="Remarks"     value={row.remarks} />
          </Grid>
        </Section>
      )}
    </>
  );
}

// ── Role-specific view sections ───────────────────────────
function ApplicantView({ row, fmt }) {
  return (
    <Section icon="👤" title="Applicant Information">
      <Grid>
        <Field label="Name"   value={row.name}  wide />
        <Field label="Email"  value={row.email} wide />
        <StatusField status={row.status} />
        <Field label="Joined" value={fmt(row.date)} />
      </Grid>
    </Section>
  );
}

function StudentView({ row, fmt }) {
  return (
    <Section icon="🎓" title="Student Information">
      <Grid>
        <Field label="Name"          value={row.name}         wide />
        <Field label="Email"         value={row.email}        wide />
        <Field label="Phone"         value={row.phone} />
        <Field label="Matric Number" value={row.matric_number} />
        <Field label="Intake"        value={row.intake_name} />
        <StatusField status={row.status} />
        <Field label="Joined"        value={fmt(row.date)} />
      </Grid>
    </Section>
  );
}

function IndustryPartnerView({ row, fmt }) {
  return (
    <Section icon="🏢" title="Industry Partner Information">
      <Grid>
        <Field label="Company Name"    value={row.company_name}    wide />
        <Field label="Email"           value={row.email}           wide />
        <Field label="Phone"           value={row.phone} />
        <Field label="Industry Sector" value={row.industry_sector} />
        <Field label="Location"        value={row.location} />
        <StatusField status={row.status} />
        <Field label="Joined"          value={fmt(row.date)} />
      </Grid>
    </Section>
  );
}

function IndustrySupervisorView({ row, fmt }) {
  return (
    <Section icon="👔" title="Industry Supervisor Information">
      <Grid>
        <Field label="Name"            value={row.name}     wide />
        <Field label="Email"           value={row.email}    wide />
        <Field label="Phone"           value={row.phone} />
        <Field label="Company"         value={row.company} />
        <Field label="Role / Position" value={row.position} />
        <StatusField status={row.status} />
        <Field label="Joined"          value={fmt(row.date)} />
      </Grid>
    </Section>
  );
}

// ── Loading / Error states ────────────────────────────────
function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px", gap: "16px" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>Loading details…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div style={{ padding: "24px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", color: "#b91c1c", fontSize: "14px", textAlign: "center" }}>
      {message || "Failed to load application details."}
    </div>
  );
}

// ── Main ViewModal ────────────────────────────────────────
export default function ViewModal({ row, type, onClose }) {
  // FIX: applications need full data (education, skills, interview details)
  //      that the list endpoint does not return. We fetch it here on open.
  const [fullRow,   setFullRow]   = useState(type !== "application" ? row : null);
  const [fetching,  setFetching]  = useState(type === "application");
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (type !== "application") return;

    setFetching(true);
    setFetchError("");

    fetchApplicationById(row.id)
      .then(setFullRow)
      .catch((err) => setFetchError(err.message || "Failed to load application details."))
      .finally(() => setFetching(false));
  }, [type, row.id]);

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const fmtDateTime = (d) => d
    ? new Date(d).toLocaleString("en-MY", { dateStyle: "full", timeStyle: "short" })
    : "—";

  const renderContent = () => {
    if (fetching)    return <LoadingState />;
    if (fetchError)  return <ErrorState message={fetchError} />;

    const data = fullRow || row;

    switch (type) {
      case "application":
        // FIX: was missing fmtDateTime — interview date/time was always "—"
        return <ApplicationView row={data} fmt={fmt} fmtDateTime={fmtDateTime} />;
      case "student":
        return <StudentView row={data} fmt={fmt} />;
      case "industry_partner":
        return <IndustryPartnerView row={data} fmt={fmt} />;
      case "industry_supervisor":
        return <IndustrySupervisorView row={data} fmt={fmt} />;
      case "applicant":
      default:
        return <ApplicantView row={data} fmt={fmt} />;
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "960px", width: "95%" }}>
        <div className="modal-header">
          <p className="modal-title">View Details</p>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "24px", overflowY: "auto", maxHeight: "70vh", display: "flex", flexDirection: "column", gap: "28px" }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}