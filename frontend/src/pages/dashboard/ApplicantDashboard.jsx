import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApplicantLayout from "../../components/dashboard/Layout";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

// ── Status badge ───────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:             { label: "Pending",               bg: "#fef9c3", color: "#854d0e" },
    under_review:        { label: "In Review",             bg: "#dbeafe", color: "#1e40af" },
    interview:           { label: "Interview",             bg: "#f3e8ff", color: "#6b21a8" },
    approved:            { label: "Approved",              bg: "#dcfce7", color: "#166534" },
    accepted:            { label: "Accepted",              bg: "#dcfce7", color: "#166534" },
    rejected_review:     { label: "Rejected (Review)",     bg: "#fee2e2", color: "#991b1b" },
    rejected_interview:  { label: "Rejected (Interview)",  bg: "#fee2e2", color: "#991b1b" },
    withdraw:            { label: "Withdrawn",             bg: "#f1f5f9", color: "#475569" },
  };
  const s = map[status?.toLowerCase()] || map.pending;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: "11px", fontWeight: "700", padding: "3px 10px",
      borderRadius: "20px", letterSpacing: "0.3px",
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
        <p style={{ fontSize: "13px", fontWeight: "600", margin: 0, color: state === "pending" ? "#94a3b8" : "#1e293b" }}>
          {label}
        </p>
        <p style={{ fontSize: "11px", color: c.text, margin: "2px 0 0" }}>{sub}</p>
      </div>
    </div>
  );
}

// ── Interview details card ─────────────────────────────────
function InterviewCard({ application }) {
  if (!application?.interview_datetime) return null;
  const fmt = (d) => d
    ? new Date(d).toLocaleString("en-MY", { dateStyle: "full", timeStyle: "short" })
    : "—";
  return (
    <div style={{ marginTop: "20px", padding: "16px", background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "12px" }}>
      <p style={{ fontSize: "12px", fontWeight: "700", color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
        📅 Interview Details
      </p>
      {[
        { label: "Date & Time", value: fmt(application.interview_datetime) },
        { label: "Venue",       value: application.venue },
        { label: "Interviewer", value: application.interviewer_name },
        ...(application.remarks ? [{ label: "Remarks", value: application.remarks }] : []),
      ].map(({ label, value }) => (
        <div key={label} style={{ marginBottom: "8px" }}>
          <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
          <p style={{ fontSize: "13px", color: "#1e293b", fontWeight: "500", margin: 0 }}>{value || "—"}</p>
        </div>
      ))}
    </div>
  );
}

// ── Accept / Withdraw offer card ───────────────────────────
function OfferCard({ onAccept, onWithdraw, loading }) {
  return (
    <div style={{
      marginTop: "20px", padding: "18px",
      background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px",
    }}>
      <p style={{ fontSize: "13px", fontWeight: "600", color: "#166534", margin: "0 0 6px" }}>
        🎉 Congratulations! You have been approved.
      </p>
      <p style={{ fontSize: "12px", color: "#15803d", margin: "0 0 16px" }}>
        Please confirm your decision below. Accepting will upgrade your account to Student.
      </p>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={onAccept}
          disabled={loading}
          style={{
            flex: 1, padding: "10px", borderRadius: "8px", border: "none",
            background: "#16a34a", color: "white",
            fontSize: "13px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading === "accept" ? "Processing…" : "✓ Accept Offer"}
        </button>
        <button
          onClick={onWithdraw}
          disabled={loading}
          style={{
            flex: 1, padding: "10px", borderRadius: "8px",
            border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626",
            fontSize: "13px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading === "withdraw" ? "Processing…" : "✕ Decline Offer"}
        </button>
      </div>
    </div>
  );
}

// ── Derive step states ─────────────────────────────────────
function getSteps(status, submittedAt, hasInterviewData) {
  const fmt = (d) => d
    ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const submitted = fmt(submittedAt);
  const s         = status?.toLowerCase();

  const withdrawAfterInterview  = s === "withdraw" && hasInterviewData;
  const withdrawBeforeInterview = s === "withdraw" && !hasInterviewData;

  const step1 = {
    label: "Application Submitted",
    sub:   `Submitted on ${submitted}`,
    state: "done",
  };

  const step2 = {
    label: "Under Review",
    sub:   s === "pending"         ? "Waiting to be reviewed"
         : s === "under_review"    ? "Currently being reviewed"
         : s === "rejected_review" ? "Application unsuccessful"
         : "Completed",
    state: s === "pending"         ? "pending"
         : s === "under_review"    ? "active"
         : s === "rejected_review" ? "rejected"
         : "done",
  };

  const step3 = {
    label: "Interview",
    sub:   s === "interview"           ? "Interview scheduled – check details below"
         : s === "approved"            ? "Completed"
         : s === "accepted"            ? "Completed"
         : s === "rejected_interview"  ? "Application unsuccessful"
         : s === "rejected_review"     ? "Not reached"
         : withdrawAfterInterview      ? "Withdrawn after interview was scheduled"
         : withdrawBeforeInterview     ? "Not reached"
         : "Pending",
    state: s === "interview"           ? "active"
         : s === "approved"            ? "done"
         : s === "accepted"            ? "done"
         : s === "rejected_interview"  ? "rejected"
         : withdrawAfterInterview      ? "done"
         : "pending",
  };

  const step4 = {
    label: "Final Result",
    sub:   s === "approved" ? "Approved – awaiting your response"
         : s === "accepted" ? "Offer accepted 🎉"
         : s === "withdraw" ? "Application withdrawn"
         : "Awaiting decision",
    state: s === "approved" ? "active"
         : s === "accepted" ? "done"
         : s === "withdraw" ? "active"
         : "pending",
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

  const [application, setApplication] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [offerLoading, setOfferLoading] = useState(null); // "accept" | "withdraw" | null

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

  const handleAccept = async () => {
    if (!window.confirm("Accept this offer? Your account will be upgraded to Student and you will need to log in again.")) return;
    setOfferLoading("accept");
    try {
      const res  = await fetch(`${API}/my-application/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Update local application state and force re-login for new role
      alert(`${data.message}`);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");

    } catch (err) {
      alert(err.message || "Failed to accept offer.");
    } finally {
      setOfferLoading(null);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm("Are you sure you want to decline this offer? This cannot be undone.")) return;
    setOfferLoading("withdraw");
    try {
      const res  = await fetch(`${API}/my-application/withdraw`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setApplication((prev) => ({ ...prev, status: "withdraw" }));
    } catch (err) {
      alert(err.message || "Failed to withdraw.");
    } finally {
      setOfferLoading(null);
    }
  };

  const formatAppId = (id) => {
    if (!id) return "—";
    return `APP-${new Date().getFullYear()}-${String(id).padStart(6, "0")}`;
  };

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

  const hasInterviewData = !!application?.interview_datetime;
  const steps = application ? getSteps(application.status, application.created_at, hasInterviewData) : [];

  const showInterviewCard = ["interview", "rejected_interview", "approved", "accepted"].includes(
    application?.status?.toLowerCase()
  ) || (application?.status?.toLowerCase() === "withdraw" && hasInterviewData);

  const showOfferCard = application?.status?.toLowerCase() === "approved";

  return (
    <ApplicantLayout title="Dashboard">

      {/* ── Welcome banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #1a56db 60%, #2563eb 100%)",
        borderRadius: "16px", padding: "28px 32px", marginBottom: "28px",
      }}>
        <h1 style={{ color: "white", fontSize: "22px", fontWeight: "700", margin: 0 }}>
          Welcome back, {userName}
        </h1>
      </div>

      {/* ── Application status card ── */}
      <div style={{
        background: "white", borderRadius: "14px", padding: "24px 28px",
        maxWidth: "400px", border: "1px solid #e2e8f0",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", margin: 0 }}>My Application Status</h3>
          {!loading && application && <StatusBadge status={application.status} />}
        </div>

        {loading && (
          <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>Loading…</p>
        )}

        {!loading && !application && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
              You have not submitted any applications yet.
            </p>
            <button
              onClick={() => navigate("/application-form")}
              style={{ background: "#1a56db", color: "white", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
            >
              Create Application
            </button>
          </div>
        )}

        {!loading && application && (
          <>
            <div style={{ display: "flex", gap: "24px", marginBottom: "20px" }}>
              <div>
                <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", margin: "0 0 2px" }}>APPLICATION ID</p>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{formatAppId(application.application_id)}</p>
              </div>
              <div>
                <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", margin: "0 0 2px" }}>SUBMITTED DATE</p>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{fmt(application.created_at)}</p>
              </div>
            </div>

            <p style={{ fontSize: "12px", fontWeight: "700", color: "#1a56db", marginBottom: "16px" }}>
              Application Progress
            </p>

            <div>
              {steps.map((step, i) => (
                <ProgressStep key={i} {...step} isLast={i === steps.length - 1} />
              ))}
            </div>

            {/* Interview details card */}
            {showInterviewCard && <InterviewCard application={application} />}

            {/* Accept / Decline buttons — only shown when approved */}
            {showOfferCard && (
              <OfferCard
                onAccept={handleAccept}
                onWithdraw={handleWithdraw}
                loading={offerLoading}
              />
            )}
          </>
        )}
      </div>

    </ApplicantLayout>
  );
}