import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApplicantLayout from "../../components/dashboard/Layout";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

// ── Status badge ───────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    draft:     { label: "Draft",      bg: "#f8fafc", color: "#475569" },
    submitted: { label: "Submitted",  bg: "#eff6ff", color: "#1e40af" },
    attended:  { label: "Attended",   bg: "#f0f9ff", color: "#0369a1" },
    absent:    { label: "Absent",     bg: "#fff7ed", color: "#c2410c" },
    passed:    { label: "Passed",     bg: "#f0fdf4", color: "#15803d" },
    failed:    { label: "Failed",     bg: "#fee2e2", color: "#991b1b" },
    accepted:  { label: "Accepted",   bg: "#dcfce7", color: "#166534" },
    declined:  { label: "Declined",   bg: "#fef2f2", color: "#991b1b" },
  };
  const s = map[status?.toLowerCase()] || map.submitted;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: "14px", fontWeight: "700", padding: "6px 14px",
      borderRadius: "10px",
    }}>
      {s.label}
    </span>
  );
}

// ── Progress step ──────────────────────────────────────────
function ProgressStep({ label, sub, state, isLast }) {
  const colors = {
    done:     { ring: "#22c55e", fill: "#22c55e", text: "#16a34a" },
    active:   { ring: "#1a56db", fill: "#1a56db", text: "#1a56db" },
    pending:  { ring: "#cbd5e1", fill: "white",   text: "#94a3b8" },
    rejected: { ring: "#ef4444", fill: "#ef4444", text: "#dc2626" },
  };
  const c = colors[state] || colors.pending;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: isLast ? 0 : "4px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: 22, height: 22, borderRadius: "50%", marginTop: 1,
          border: `2px solid ${c.ring}`, background: c.fill,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: state !== "pending" ? `0 0 0 3px ${c.ring}22` : "none",
        }}>
          {state === "done" && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
          {state === "active" && (
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white" }} />
          )}
          {state === "rejected" && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          )}
        </div>
        {!isLast && (
          <div style={{
            width: "2px", minHeight: "28px",
            background: state === "done" ? "#22c55e" : "#e2e8f0",
            marginTop: "3px", marginBottom: "3px",
          }} />
        )}
      </div>
      <div style={{ paddingTop: "2px" }}>
        <p style={{ fontSize: "15px", fontWeight: "600", margin: 0, color: state === "pending" ? "#94a3b8" : "#1e293b" }}>
          {label}
        </p>
        <p style={{ fontSize: "13px", color: c.text, margin: "2px 0 0" }}>{sub}</p>
      </div>
    </div>
  );
}

// ── Preferred slot card (applicant-selected, shown when submitted) ──
function PreferredSlotCard({ datetime, capacity }) {
  if (!datetime) return null;
  const fmt = (d) => new Date(d).toLocaleString("en-MY", { dateStyle: "full", timeStyle: "short" });
  return (
    <div style={{
      marginTop: "20px", padding: "16px",
      background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "2px",
    }}>
      <p style={{ fontSize: "14px", fontWeight: "700", color: "#1e40af", textTransform: "uppercase", margin: "0 0 10px" }}>
        📅 Your Interview Slot
      </p>
      <p style={{ fontSize: "15px", color: "#1e293b", fontWeight: "600", margin: "0 0 4px" }}>
        {fmt(datetime)}
      </p>
      {capacity && (
        <p style={{ fontSize: "13px", color: "#1d4ed8", margin: 0 }}>
          Slot capacity: {capacity} applicants
        </p>
      )}
      <p style={{ fontSize: "12px", color: "#64748b", margin: "8px 0 0", fontStyle: "italic" }}>
        This is your preferred slot. We will confirm your interview schedule shortly.
      </p>
    </div>
  );
}

// ── Admin-assigned interview details card ──────────────────
function InterviewCard({ application }) {
  if (!application?.interview_datetime) return null;
  const fmt = (d) => d
    ? new Date(d).toLocaleString("en-MY", { dateStyle: "full", timeStyle: "short" })
    : "—";
  return (
    <div style={{
      marginTop: "20px", padding: "16px",
      background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "2px",
    }}>
      <p style={{ fontSize: "14px", fontWeight: "700", color: "#1e40af", textTransform: "uppercase", letterSpacing: "normal", margin: "0 0 12px" }}>
        📅 Interview Details
      </p>
      {[
        { label: "Date & Time", value: fmt(application.interview_datetime) },
        { label: "Venue",       value: application.venue },
        { label: "Interviewer", value: application.interviewer_name },
        ...(application.remarks ? [{ label: "Remarks", value: application.remarks }] : []),
      ].map(({ label, value }) => (
        <div key={label} style={{ marginBottom: "8px" }}>
          <p style={{ fontSize: "13px", color: "#1d4ed8", fontWeight: "600", margin: "0 0 2px", textTransform: "uppercase" }}>{label}</p>
          <p style={{ fontSize: "15px", color: "#1e293b", fontWeight: "500", margin: 0 }}>{value || "—"}</p>
        </div>
      ))}
    </div>
  );
}

// ── Accept / Decline offer card ────────────────────────────
function OfferCard({ onAccept, onDecline, loading }) {
  return (
    <div style={{
      marginTop: "20px", padding: "18px",
      background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "2px",
    }}>
      <p style={{ fontSize: "15px", fontWeight: "600", color: "#166534", margin: "0 0 6px" }}>
        Congratulations! You have been approved.
      </p>
      <p style={{ fontSize: "14px", color: "#15803d", margin: "0 0 16px" }}>
        Please confirm your decision below. Accepting will upgrade your account to Student.
      </p>
      <div style={{ display: "flex", gap: "10px" }}>
        {/* Accept button */}
        <button
          onClick={onAccept}
          disabled={!!loading}
          style={{
            flex: 1, padding: "10px", borderRadius: "2px", border: "none",
            background: "#16a34a", color: "white",
            fontSize: "15px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading === "accept" ? "Processing…" : "✓ Accept Offer"}
        </button>

        {/* Decline button */}
        <button
          onClick={onDecline}
          disabled={!!loading}
          style={{
            flex: 1, padding: "10px", borderRadius: "2px", border: "none",
            background: "#dc2626", color: "white",
            fontSize: "15px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading === "decline" ? "Processing…" : "✕ Decline Offer"}
        </button>
      </div>
    </div>
  );
}

// ── Derive progress step states ────────────────────────────
// Flow: submitted → attended/absent → passed/failed → accepted/declined
function getSteps(status, submittedAt, hasInterviewData) {
  const fmt = (d) => d
    ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const submitted = fmt(submittedAt);
  const s         = status?.toLowerCase();

  // ── Step 1: Application Submitted — always done at this point ──
  const step1 = {
    label: "Application Submitted",
    sub:   submitted ? `Submitted on ${submitted}` : "Submitted",
    state: "done",
  };

  // ── Step 2: Interview Day ──────────────────────────────
  const interviewDone = ["attended", "absent", "passed", "failed", "accepted",
                         "declined"].includes(s);
  const step2 = {
    label: "Interview",
    sub:   s === "attended"          ? "Attended ✓"
         : s === "absent"            ? "Absent"
         : s === "declined" && !hasInterviewData ? "Attended ✓"
         : interviewDone             ? "Completed"
         :                            "Awaiting interview",
    state: s === "absent"           ? "rejected"
         : s === "declined" && !hasInterviewData ? "done"
         : interviewDone             ? "done"
         :                            "pending",
  };

  // ── Step 3: Evaluation ────────────────────────────────
  const evalDone = ["passed", "failed", "accepted", "declined"].includes(s);
  const step3 = {
    label: "Evaluation",
    sub:   s === "passed"                        ? "Passed ✓"
         : s === "failed"                        ? "Unsuccessful"
         : s === "accepted"                      ? "Passed ✓"
         : s === "declined"                      ? "Passed ✓"
         :                                        "Awaiting evaluation",
    state: s === "passed"                        ? "done"
         : s === "failed"                        ? "rejected"
         : s === "accepted"                      ? "done"
         : s === "declined"                      ? "done"
         :                                        "pending",
  };

  // ── Step 4: Enrolment ─────────────────────────────────
  const step4 = {
    label: "Enrolment",
    sub:   s === "accepted"          ? "Enrolled"
         : s === "declined"          ? "Offer declined"
         : s === "failed"            ? "Not eligible"
         : s === "absent"            ? "Pending"
         :                            "Awaiting decision",
    state: s === "accepted"          ? "done"
         : s === "declined"
           || s === "failed"          ? "rejected"
         : s === "passed"            ? "active"
         :                            "pending",
  };

  return [step1, step2, step3, step4];
}


// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function ApplicantDashboard() {
  const navigate   = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName   = storedUser?.name || "Guest";

  const [application,  setApplication]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [offerLoading, setOfferLoading] = useState(null); // "accept" | "decline" | null
  const [confirmDialog, setConfirmDialog] = useState(null); // { action: "accept" | "decline" } | null

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res  = await fetch(`${API}/my-application`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        if (res.ok && data.application) setApplication(data.application);
      } catch (err) {
        console.error("Failed to fetch application:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, []);

  const handleAccept  = () => setConfirmDialog({ action: "accept" });
  const handleDecline = () => setConfirmDialog({ action: "decline" });

  const executeOffer = async (action) => {
    setConfirmDialog(null);
    setOfferLoading(action);
    try {
      const res  = await fetch(`${API}/my-application/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      if (action === "accept") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        setApplication((prev) => ({ ...prev, status: "declined" }));
      }
    } catch (err) {
      alert(err.message || `Failed to ${action} offer.`);
    } finally {
      setOfferLoading(null);
    }
  };

  const formatAppId = (id) => id
    ? `APP-${new Date().getFullYear()}-${String(id).padStart(6, "0")}`
    : "—";

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

  const s                = application?.status?.toLowerCase();
  const hasInterviewData = !!application?.interview_datetime;
  const isDraft          = s === "draft";
  const isSubmitted      = s && s !== "draft"; // anything past draft shows progress

  const steps = isSubmitted
    ? getSteps(application.status, application.created_at, hasInterviewData)
    : [];

  // Show preferred slot the applicant selected — only while submitted (before admin assigns)
  const showPreferredSlot =
    s === "submitted" && !!application?.selected_slot_datetime;

  // Show admin-assigned interview details once admin has scheduled
  const showInterviewCard =
    hasInterviewData &&
    ["attended", "absent", "passed", "failed", "accepted", "declined"].includes(s);

  const showOfferCard = s === "passed";

  return (
    <ApplicantLayout title="Dashboard">

      {/* ── Offer Confirmation Dialog ── */}
      {confirmDialog && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: "16px", padding: "36px 32px",
            maxWidth: "420px", width: "90%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            textAlign: "center", animation: "toastSlideUp 0.25s ease",
          }}>
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: "50%", margin: "0 auto 20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: confirmDialog.action === "accept" ? "#f0fdf4" : "#fef2f2",
            }}>
              {confirmDialog.action === "accept" ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              )}
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
              {confirmDialog.action === "accept" ? "Accept Offer?" : "Decline Offer?"}
            </h3>
            <p style={{ margin: "0 0 28px", fontSize: "14px", color: "#64748b", lineHeight: 1.7 }}>
              {confirmDialog.action === "accept" ? (
                <>Your account will be <strong style={{ color: "#0f172a" }}>upgraded to Student</strong> and you will be logged out to sign in again.</>
              ) : (
                <>Are you sure you want to <strong style={{ color: "#ef4444" }}>decline this offer</strong>? This action cannot be undone.</>
              )}
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: "10px",
                  border: "1.5px solid #e2e8f0", background: "#fff",
                  fontSize: "14px", fontWeight: 600, color: "#475569", cursor: "pointer",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
              >
                Cancel
              </button>
              <button
                onClick={() => executeOffer(confirmDialog.action)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: "10px", border: "none",
                  background: confirmDialog.action === "accept" ? "#16a34a" : "#ef4444",
                  fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = confirmDialog.action === "accept" ? "#15803d" : "#dc2626"}
                onMouseLeave={(e) => e.currentTarget.style.background = confirmDialog.action === "accept" ? "#16a34a" : "#ef4444"}
              >
                {confirmDialog.action === "accept" ? "Yes, Accept" : "Yes, Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Welcome banner ── */}
      <div style={{
        background: "#1b3a6b",
        borderRadius: "5px", padding: "28px 32px", marginBottom: "28px",
      }}>
        <h1 style={{ color: "white", fontSize: "22px", fontWeight: "700", margin: 0 }}>
          Welcome back, {userName}
        </h1>
      </div>

      {/* ── Application status card ── */}
      <div style={{
        background: "white", borderRadius: "5px", padding: "24px 28px",
        maxWidth: "440px", border: "1px solid #e2e8f0",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", margin: 0 }}>
            My Application
          </h3>
          {!loading && application && <StatusBadge status={application.status} />}
        </div>

        {/* Loading */}
        {loading && (
          <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>
            Loading…
          </p>
        )}

        {/* No application yet */}
        {!loading && !application && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <p style={{ fontSize: "15px", color: "#64748b", marginBottom: "16px" }}>
              You have not submitted any applications yet.
            </p>
            <button
              onClick={() => navigate("/application-form")}
              style={{
                padding: "9px 26px", background: "#1b3a6b", color: "white",
                border: "none", borderRadius: "2px",
                fontSize: "15px", fontWeight: "700", cursor: "pointer",
                fontFamily: "inherit", textTransform: "uppercase",
                letterSpacing: "0.05em", transition: "background 0.15s",
                display: "inline-flex", alignItems: "center", gap: "7px",
              }}
            >
              Create Application
            </button>
          </div>
        )}

        {/* Draft — not submitted yet */}
        {!loading && application && isDraft && (
          <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
            <p style={{ fontSize: "15px", color: "#64748b", marginBottom: "6px" }}>
              You have a draft application saved.
            </p>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "20px" }}>
              Complete and submit it when you are ready.
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/application-form")}
                style={{
                  padding: "9px 22px", background: "#1b3a6b", color: "white",
                  border: "none", borderRadius: "2px",
                  fontSize: "14px", fontWeight: "700", cursor: "pointer",
                  fontFamily: "inherit", textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Continue Editing
              </button>
              <button
                onClick={() => navigate("/my-application")}
                style={{
                  padding: "9px 22px", background: "white", color: "#1b3a6b",
                  border: "1.5px solid #b8c8df", borderRadius: "2px",
                  fontSize: "14px", fontWeight: "700", cursor: "pointer",
                  fontFamily: "inherit", textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                View Draft
              </button>
            </div>
          </div>
        )}

        {/* Submitted — show ID, date, progress */}
        {!loading && application && isSubmitted && (
          <>
            <div style={{ display: "flex", gap: "24px", marginBottom: "20px" }}>
              <div>
                <p style={{ fontSize: "13px", color: "#94a3b8", fontWeight: "600", margin: "0 0 2px" }}>APPLICATION ID</p>
                <p style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                  {formatAppId(application.application_id)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "13px", color: "#94a3b8", fontWeight: "600", margin: "0 0 2px" }}>SUBMITTED</p>
                <p style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                  {fmt(application.created_at)}
                </p>
              </div>
            </div>

            <p style={{ fontSize: "14px", fontWeight: "700", color: "#1a56db", marginBottom: "16px" }}>
              Application Progress
            </p>

            <div>
              {steps.map((step, i) => (
                <ProgressStep key={i} {...step} isLast={i === steps.length - 1} />
              ))}
            </div>

            {/* Preferred slot — shown when submitted, before admin assigns interview */}
            {showPreferredSlot && (
              <PreferredSlotCard
                datetime={application.selected_slot_datetime}
                capacity={application.selected_slot_capacity}
              />
            )}

            {/* Admin-assigned interview details */}
            {showInterviewCard && <InterviewCard application={application} />}

            {/* Accept / Decline — only when approved */}
            {showOfferCard && (
              <OfferCard
                onAccept={handleAccept}
                onDecline={handleDecline}
                loading={offerLoading}
              />
            )}

            {/* Link to full application */}
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button
                onClick={() => navigate("/my-application")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "14px", color: "#1a56db", fontWeight: "600",
                  textDecoration: "underline", fontFamily: "inherit",
                }}
              >
                View Full Application →
              </button>
            </div>
          </>
        )}
      </div>

    </ApplicantLayout>
  );
}