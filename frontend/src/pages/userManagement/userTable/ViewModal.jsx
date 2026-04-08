// components/userTable/ViewModal.jsx
import { useState, useEffect } from "react";
import StatusBadge from "./StatusBadge";
import { fetchApplicationById } from "../../api/adminApi";
import { HEAR_ABOUT_LABEL } from "./tableConfig";
import { FormSeparator } from "../../applicationManagement/ApplicationForm";

// ── Shared styles ─────────────────────────────────────────
const miniTableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "13px" };
const miniThStyle    = {
  textAlign: "left", padding: "7px 10px",
  background: "#f1f5f9", color: "#475569",
  fontWeight: "600", fontSize: "11px",
  textTransform: "uppercase", letterSpacing: "0.04em",
  borderBottom: "1px solid #e2e8f0",
};
const miniTdStyle = { padding: "7px 10px", color: "#1e293b", borderBottom: "1px solid #f1f5f9" };

// ── Reusable components ───────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {title && <FormSeparator title={title} />}
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
      <div style={{ padding: "9px 12px", background: "#f8fafc", borderRadius: "2px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#1e293b", marginTop: "4px" }}>
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

// ── Slot display card (matches MyApplication's SelectedSlotCard) ──
function SlotCard({ datetime, capacity }) {
  if (!datetime) return null;
  const fmt = (d) => new Date(d).toLocaleString("en-MY", { dateStyle: "full", timeStyle: "short" });
  return (
    <div style={{
      background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "2px",
      padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: "10px",
      gridColumn: "1 / -1",
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
      </svg>
      <div>
        <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#1e40af" }}>
          Preferred Interview Slot
        </p>
        <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#1e3a8a" }}>{fmt(datetime)}</p>
        {capacity && (
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#1d4ed8" }}>
            Capacity: {capacity} applicants
          </p>
        )}
      </div>
    </div>
  );
}

// ── Application view — mirrors MyApplication section layout ──
function ApplicationView({ row, fmt, fmtDateTime }) {
  const education = row.education || [];
  const hearAbout = HEAR_ABOUT_LABEL[row.hear_about_us] || row.hear_about_us || null;
  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";

  const showInterview = (
    ["interview", "rejected_interview", "rejected", "approved", "accepted", "declined", "withdraw", "attended", "absent", "passed", "failed"].includes(row.status?.toLowerCase())
    && row.interview_datetime
  );

  return (
    <>
      {/* ── 1. Personal Information ───────────────────────── */}
      <Section title="Personal Information">
        <Grid>
          {/* Basic Information */}
          <div style={{ gridColumn: "1 / -1", paddingBottom: "6px", marginBottom: "2px", borderBottom: "1.5px solid #e2e8f0" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Basic Information
            </span>
          </div>

          <Field label="Full Name"     value={row.name}               wide />
          {/* <Field label="IC Number"  value={row.ic_number}           wide /> */}
          <Field label="Date of Birth" value={fmt(row.date_of_birth)} />
          <Field label="Gender"        value={capitalize(row.gender)} />
          {/* <Field label="Race"          value={capitalize(row.race)} />
          <Field label="Marital Status" value={capitalize(row.marital_status)} /> */}

          {/* Contact & Address */}
          <div style={{ gridColumn: "1 / -1", paddingBottom: "6px", marginBottom: "2px", borderBottom: "1.5px solid #e2e8f0", marginTop: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Contact & Address
            </span>
          </div>

          <Field label="Email Address" value={row.email} />
          <Field label="Phone Number"  value={row.phone} />
          <Field label="Full Address"  value={row.full_address}  wide />
          <Field label="Postal Code"   value={row.postal_code} />
          <Field label="State"         value={row.state} />

          {/* Account */}
          <div style={{ gridColumn: "1 / -1", paddingBottom: "6px", marginBottom: "2px", borderBottom: "1.5px solid #e2e8f0", marginTop: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Account
            </span>
          </div>

          <StatusField status={row.status} />
          <Field label="Last Updated" value={fmt(row.updated_at)} />
        </Grid>
      </Section>

      {/* ── 2. Education ──────────────────────────────────── */}
      <Section title="Education">
        {education.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>No education records.</p>
        ) : (
          <table style={miniTableStyle}>
            <thead>
              <tr>
                <th style={miniThStyle}>Institute</th>
                <th style={miniThStyle}>Qualification</th>
                <th style={miniThStyle}>Start Date</th>
                <th style={miniThStyle}>End Date</th>
              </tr>
            </thead>
            <tbody>
              {education.map((e, i) => (
                <tr key={i}>
                  <td style={miniTdStyle}>{e.institute_name || "—"}</td>
                  <td style={miniTdStyle}>{e.qualification  || "—"}</td>
                  <td style={miniTdStyle}>{fmt(e.start_date)}</td>
                  <td style={miniTdStyle}>{fmt(e.end_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* ── 3. Interview Slot & Additional Info ───────────── */}
      {(row.selected_slot_datetime || hearAbout) && (
        <Section title="Interview & Additional Information">
          <Grid>
            {/* Interview Slot */}
            <div style={{ gridColumn: "1 / -1", paddingBottom: "6px", marginBottom: "2px", borderBottom: "1.5px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Interview Slot
              </span>
            </div>

            <SlotCard
              datetime={row.selected_slot_datetime}
              capacity={row.selected_slot_capacity}
            />

            {/* Additional Information */}
            {hearAbout && (
              <>
                <div style={{ gridColumn: "1 / -1", paddingBottom: "6px", marginBottom: "2px", borderBottom: "1.5px solid #e2e8f0", marginTop: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Additional Information
                  </span>
                </div>
                <Field label="How Did You Hear About Us" value={hearAbout} wide />
              </>
            )}
          </Grid>
        </Section>
      )}

      {/* ── 4. Interview Details (admin-assigned) ─────────── */}
      {showInterview && (
        <Section title="Interview Details">
          <Grid>
            <Field label="Date & Time"  value={fmtDateTime(row.interview_datetime)} wide />
            <Field label="Venue"        value={row.venue}            wide />
            <Field label="Interviewer"  value={row.interviewer_name} />
            <Field label="Remarks"      value={row.remarks} />
          </Grid>
        </Section>
      )}
    </>
  );
}

// ── Role-specific views ───────────────────────────────────
function ApplicantView({ row, fmt }) {
  return (
    <Section title="Applicant Information">
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
    <Section title="Student Information">
      <Grid>
        <Field label="Name"          value={row.name}          wide />
        <Field label="Email"         value={row.email}         wide />
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
    <>
      <Section title="Company Information">
        <Grid>
          <Field label="Company Name"    value={row.company_name}    wide />
          <Field label="Industry Sector" value={row.industry_sector} />
          <Field label="Location"        value={row.location} />
          <StatusField status={row.status} />
          <Field label="Joined"          value={fmt(row.date)} />
        </Grid>
      </Section>

      <Section title="Contact Person">
        <Grid>
          <Field label="Name"  value={row.contact_person_name ?? row.name} wide />
          <Field label="Email" value={row.email}                           wide />
          <Field label="Phone" value={row.phone} />
        </Grid>
      </Section>
    </>
  );
}

function IndustrySupervisorView({ row, fmt }) {
  return (
    <Section title="Industry Supervisor Information">
      <Grid>
        <Field label="Name"     value={row.name}     wide />
        <Field label="Email"    value={row.email}    wide />
        <Field label="Phone"    value={row.phone} />
        <Field label="Company"  value={row.company || "—"} />
        <Field label="Position" value={row.position} />
        <StatusField status={row.status} />
        <Field label="Joined"   value={fmt(row.date)} />
      </Grid>
    </Section>
  );
}

function ManagerView({ row, fmt }) {
  return (
    <Section title="Manager Information">
      <Grid>
        <Field label="Name"         value={row.name}  wide />
        <Field label="Email"        value={row.email} wide />
        <Field label="Phone Number" value={row.phone} />
        <StatusField status={row.status} />
        <Field label="Joined"       value={fmt(row.date)} />
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
    <div style={{ padding: "24px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "2px", color: "#b91c1c", fontSize: "14px", textAlign: "center" }}>
      {message || "Failed to load application details."}
    </div>
  );
}

// ── Main ViewModal ────────────────────────────────────────
export default function ViewModal({ row, type, onClose }) {
  const [fullRow,    setFullRow]    = useState(type !== "application" ? row : null);
  const [fetching,   setFetching]   = useState(type === "application");
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
    if (fetching)   return <LoadingState />;
    if (fetchError) return <ErrorState message={fetchError} />;

    const data = fullRow || row;

    switch (type) {
      case "application":         return <ApplicationView        row={data} fmt={fmt} fmtDateTime={fmtDateTime} />;
      case "student":             return <StudentView            row={data} fmt={fmt} />;
      case "industry_partner":    return <IndustryPartnerView    row={data} fmt={fmt} />;
      case "industry_supervisor": return <IndustrySupervisorView row={data} fmt={fmt} />;
      case "manager":             return <ManagerView            row={data} fmt={fmt} />;
      case "applicant":
      default:                    return <ApplicantView          row={data} fmt={fmt} />;
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