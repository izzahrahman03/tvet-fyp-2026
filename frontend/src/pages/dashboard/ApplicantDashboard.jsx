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
      fontSize: "15px", fontWeight: "700", padding: "3px 10px",
      borderRadius: 99, textTransform: "capitalize",
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
          {state === "active" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white" }} />}
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
        <p style={{ fontSize: "14px", fontWeight: "600", margin: 0, color: state === "pending" ? "#94a3b8" : "#1e293b" }}>
          {label}
        </p>
        <p style={{ fontSize: "12px", color: c.text, margin: "2px 0 0" }}>{sub}</p>
      </div>
    </div>
  );
}

// ── Preferred slot card ────────────────────────────────────
function PreferredSlotCard({ datetime, capacity }) {
  if (!datetime) return null;
  const fmt = (d) => new Date(d).toLocaleString("en-MY", { dateStyle: "full", timeStyle: "short" });
  return (
    <div style={{ marginTop: "16px", padding: "14px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "2px" }}>
      <p style={{ fontSize: "11px", fontWeight: "700", color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>
         Your Interview Slot
      </p>
      <p style={{ fontSize: "14px", color: "#1e293b", fontWeight: "600", margin: "0 0 4px" }}>{fmt(datetime)}</p>
      {capacity && <p style={{ fontSize: "12px", color: "#1d4ed8", margin: 0 }}>Slot capacity: {capacity} applicants</p>}
      <p style={{ fontSize: "11px", color: "#64748b", margin: "6px 0 0", fontStyle: "italic" }}>
        This is your preferred slot. We will confirm your interview schedule shortly.
      </p>
    </div>
  );
}

// ── Admin-assigned interview details card ──────────────────
function InterviewCard({ application }) {
  if (!application?.interview_datetime) return null;
  const fmt = (d) => d ? new Date(d).toLocaleString("en-MY", { dateStyle: "full", timeStyle: "short" }) : "—";
  return (
    <div style={{ marginTop: "16px", padding: "14px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "2px" }}>
      <p style={{ fontSize: "11px", fontWeight: "700", color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>
        📅 Interview Details
      </p>
      {[
        { label: "Date & Time", value: fmt(application.interview_datetime) },
        { label: "Venue",       value: application.venue },
        { label: "Interviewer", value: application.interviewer_name },
        ...(application.remarks ? [{ label: "Remarks", value: application.remarks }] : []),
      ].map(({ label, value }) => (
        <div key={label} style={{ marginBottom: "8px" }}>
          <p style={{ fontSize: "11px", color: "#1d4ed8", fontWeight: "700", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
          <p style={{ fontSize: "14px", color: "#1e293b", fontWeight: "500", margin: 0 }}>{value || "—"}</p>
        </div>
      ))}
    </div>
  );
}

// ── Accept / Decline offer card ────────────────────────────
function OfferCard({ onAccept, onDecline, loading }) {
  return (
    <div style={{ marginTop: "16px", padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "2px" }}>
      <p style={{ fontSize: "14px", fontWeight: "600", color: "#166534", margin: "0 0 4px" }}>
        🎉 Congratulations! You have been approved.
      </p>
      <p style={{ fontSize: "13px", color: "#15803d", margin: "0 0 14px" }}>
        Please confirm your decision below. Accepting will upgrade your account to Student.
      </p>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onAccept} disabled={!!loading}
          style={{ flex: 1, padding: "9px", borderRadius: "2px", border: "none", background: "#16a34a", color: "white", fontSize: "13px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading === "accept" ? "Processing…" : "Accept Offer"}
        </button>
        <button onClick={onDecline} disabled={!!loading}
          style={{ flex: 1, padding: "9px", borderRadius: "2px", border: "none", background: "#dc2626", color: "white", fontSize: "13px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading === "decline" ? "Processing…" : "Decline Offer"}
        </button>
      </div>
    </div>
  );
}

// ── Derive progress step states ────────────────────────────
function getSteps(status, submittedAt, hasInterviewData, applicantResponse) {
  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "";
  const submitted = fmt(submittedAt);
  const s = status?.toLowerCase();

  const step1 = { label: "Application Submitted", sub: submitted ? `Submitted on ${submitted}` : "Submitted", state: "done" };

  const interviewDone = ["attended", "absent", "passed", "failed", "accepted", "declined"].includes(s);
  const step2 = {
    label: "Interview",
    sub:   s === "attended" ? "Attended" : s === "absent" ? "Absent" : (s === "declined" && !hasInterviewData) ? "Attended" : interviewDone ? "Completed" : "Awaiting interview",
    state: s === "absent" ? "rejected" : (s === "declined" && !hasInterviewData) ? "done" : interviewDone ? "done" : "pending",
  };

  const r = applicantResponse?.toLowerCase();
  const step3 = {
    label: "Evaluation",
    sub:   (s === "passed" || r === "accepted" || r === "rejected") ? "Passed" : s === "failed" ? "Unsuccessful" : "Awaiting evaluation",
    state: (s === "passed" || r === "accepted" || r === "rejected") ? "done" : s === "failed" ? "rejected" : "pending",
  };

  const step4 = {
    label: "Enrolment",
    sub:   r === "accepted" ? "Enrolled" : r === "rejected" ? "Offer declined" : r === "withdrawn" ? "Application withdrawn" : s === "failed" ? "Not eligible" : s === "passed" ? "Awaiting your decision" : "Awaiting decision",
    state: r === "accepted" ? "done" : (r === "rejected" || r === "withdrawn" || s === "failed") ? "rejected" : s === "passed" ? "active" : "pending",
  };

  return [step1, step2, step3, step4];
}

// ── Stat card (Supervisor style) ───────────────────────────
function StatCard({ label, value, accent, sublabel }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #dce6f0",
      borderTop: `3px solid ${accent}`, borderRadius: 2,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 5,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
      </div>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: accent, lineHeight: 1 }}>{value}</p>
      {sublabel && <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{sublabel}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function ApplicantDashboard() {
  const navigate   = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName   = storedUser?.name || "Guest";

  const [application,   setApplication]  = useState(null);
  const [windowOpen,    setWindowOpen]   = useState(null);
  const [loading,       setLoading]      = useState(true);
  const [offerLoading,  setOfferLoading] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [appRes, windowRes] = await Promise.all([
          fetch(`${API}/my-application`, { headers: { Authorization: `Bearer ${getToken()}` } }),
          fetch(`${API}/intake/window`,  { headers: { Authorization: `Bearer ${getToken()}` } }),
        ]);
        const appData    = await appRes.json();
        const windowData = await windowRes.json();
        if (appRes.ok && appData.application) setApplication(appData.application);
        setWindowOpen(windowRes.ok ? (windowData.open ?? false) : false);
      } catch {
        setWindowOpen(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAccept  = () => setConfirmDialog({ action: "accept" });
  const handleDecline = () => setConfirmDialog({ action: "decline" });

  const executeOffer = async (action) => {
    setConfirmDialog(null);
    setOfferLoading(action);
    try {
      const res  = await fetch(`${API}/my-application/${action}`, {
        method: "POST", headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      if (action === "accept") {
        if (data.token) localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        else {
          const current = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...current, role: "student" }));
        }
        setOfferLoading("redirecting");
        await new Promise((resolve) => setTimeout(resolve, 2500));
        navigate("/student-dashboard");
      } else {
        setApplication((prev) => ({ ...prev, applicant_response: "rejected" }));
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
    ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const s                = application?.application_status?.toLowerCase();
  const hasInterviewData = !!application?.interview_datetime;
  const isDraft          = s === "draft";
  const isSubmitted      = s && s !== "draft";

  const steps = isSubmitted
    ? getSteps(application.application_status, application.created_at, hasInterviewData, application.applicant_response)
    : [];

  const stepsCompleted = steps.filter((st) => st.state === "done").length;

  const showPreferredSlot = s === "submitted" && !!application?.selected_slot_datetime;
  const showInterviewCard = hasInterviewData && ["attended", "absent", "passed", "failed", "accepted", "declined"].includes(s);
  const showOfferCard     = s === "passed" && (!application.applicant_response || application.applicant_response === "none");

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const bannerMessage = () => {
    if (loading) return "Loading your application…";
    if (!application && windowOpen === false) return "Applications are not currently open.";
    if (!application) return "You have not submitted an application yet.";
    if (isDraft) return "You have a draft application. Complete and submit it when you are ready.";
    if (showOfferCard) return "🎉 You passed! Please respond to your internship offer.";
    if (s === "accepted") return "Your internship offer has been accepted. Welcome aboard!";
    if (s === "interview") return "Your interview has been scheduled. Check the details below.";
    return `Application is ${s}. Track your progress below.`;
  };

  return (
    <ApplicantLayout title="Dashboard">

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-card { animation: fadeUp 0.35s ease both; }
        .dash-card:nth-child(1) { animation-delay: 0.05s; }
        .dash-card:nth-child(2) { animation-delay: 0.10s; }
        .dash-card:nth-child(3) { animation-delay: 0.15s; }
        .dash-card:nth-child(4) { animation-delay: 0.20s; }
      `}</style>

      {/* ── Redirecting overlay ── */}
      {offerLoading === "redirecting" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#1b3a6b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <p style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0 }}>Welcome aboard!</p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, margin: 0 }}>Setting up your student account…</p>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.2)", borderTop: "3px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Offer Confirmation Dialog ── */}
      {confirmDialog && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "36px 32px", maxWidth: "420px", width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", background: confirmDialog.action === "accept" ? "#f0fdf4" : "#fef2f2" }}>
              {confirmDialog.action === "accept" ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
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
              <button onClick={() => setConfirmDialog(null)}
                style={{ flex: 1, padding: "11px 0", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#475569", cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                Cancel
              </button>
              <button onClick={() => executeOffer(confirmDialog.action)}
                style={{ flex: 1, padding: "11px 0", borderRadius: "10px", border: "none", background: confirmDialog.action === "accept" ? "#16a34a" : "#ef4444", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.background = confirmDialog.action === "accept" ? "#15803d" : "#dc2626"}
                onMouseLeave={(e) => e.currentTarget.style.background = confirmDialog.action === "accept" ? "#16a34a" : "#ef4444"}>
                {confirmDialog.action === "accept" ? "Yes, Accept" : "Yes, Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Welcome banner ───────────────────────────────── */}
      <div style={{
        background: "linear-gradient(120deg, #1b3a6b 60%, #2563eb)",
        borderRadius: 2, padding: "28px 32px", marginBottom: 28,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
        boxShadow: "0 4px 20px rgba(27,58,107,0.2)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", right: 60, bottom: -60, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "relative" }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {greeting()}
          </p>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            {userName}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            {bannerMessage()}
          </p>
        </div>
      </div>

      {/* ── Stat cards (when application exists) ─────────── */}
      {!loading && isSubmitted && (
        <div className="dash-card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 28 }}>
          <StatCard
            label="Application ID"
            value={formatAppId(application.application_id)}
            accent="#1b3a6b"
            sublabel="Your unique reference"
          />
          <StatCard
            label="Status"
            value={<StatusBadge status={application.application_status} />}
            accent={s === "passed" || s === "accepted" ? "#16a34a" : s === "failed" ? "#dc2626" : s === "interview" ? "#7c3aed" : "#2563eb"}
            sublabel="Current application state"
          />
          <StatCard
            label="Progress"
            value={`${stepsCompleted} / 4`}
            accent="#f59e0b"
            sublabel="Steps completed"
          />
          <StatCard
            label="Submitted"
            value={fmt(application.created_at)}
            accent="#64748b"
            sublabel="Application date"
          />
        </div>
      )}

      {/* ── No application states ─────────────────────────── */}
      {!loading && !application && (
        <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "40px 32px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 28 }}>
          {windowOpen === false ? (
            <>
              <div style={{ width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <p style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>Applications Not Currently Open</p>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: 0, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                There are no applications open at this time. Please check back later for the next available intake period.
              </p>
            </>
          ) : (
            <>
              <div style={{ width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <p style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>No Application Yet</p>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: "0 0 20px", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                Applications are currently open. Start your application now to begin the process.
              </p>
              <button
                onClick={() => navigate("/application-form")}
                style={{ padding: "10px 28px", background: "#1b3a6b", color: "white", border: "none", borderRadius: "2px", fontSize: "14px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.04em" }}>
                Create Application
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Draft state ───────────────────────────────────── */}
      {!loading && application && isDraft && (
        <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "32px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px", background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <p style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>Draft Application Saved</p>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" }}>
            Complete and submit your application when you are ready.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/application-form")}
              style={{ padding: "9px 22px", background: "#1b3a6b", color: "white", border: "none", borderRadius: "2px", fontSize: "13px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.04em" }}>
              Continue Editing
            </button>
            <button onClick={() => navigate("/my-application")}
              style={{ padding: "9px 22px", background: "white", color: "#1b3a6b", border: "1.5px solid #b8c8df", borderRadius: "2px", fontSize: "13px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.04em" }}>
              View Draft
            </button>
          </div>
        </div>
      )}

      {/* ── Application progress card ─────────────────────── */}
      {!loading && application && isSubmitted && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Progress tracker */}
          <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <p style={{ margin: "0 0 20px", fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Application Progress
            </p>
            {steps.map((step, i) => (
              <ProgressStep key={i} {...step} isLast={i === steps.length - 1} />
            ))}
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
              <button
                onClick={() => navigate("/my-application")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#1a56db", fontWeight: "600", textDecoration: "underline", fontFamily: "inherit" }}>
                View Full Application →
              </button>
            </div>
          </div>

          {/* Right panel: slot / interview / offer */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Interview slot / details */}
            {showPreferredSlot && (
              <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Your Interview Slot</p>
                <PreferredSlotCard datetime={application.selected_slot_datetime} capacity={application.selected_slot_capacity} />
              </div>
            )}

            {showInterviewCard && (
              <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <InterviewCard application={application} />
              </div>
            )}

            {/* Offer card */}
            {showOfferCard && (
              <div className="dash-card" style={{ background: "#fff", border: "1px solid #bbf7d0", borderTop: "3px solid #16a34a", borderRadius: 2, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.07em" }}>Action Required</p>
                <OfferCard onAccept={handleAccept} onDecline={handleDecline} loading={offerLoading} />
              </div>
            )}

            {/* Status summary when no special card */}
            {!showPreferredSlot && !showInterviewCard && !showOfferCard && (
              <div className="dash-card" style={{ background: "#fff", border: "1px solid #dce6f0", borderRadius: 2, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Application Details</p>
                {[
                  { label: "Application ID", value: formatAppId(application.application_id) },
                  { label: "Status",         value: <StatusBadge status={application.application_status} /> },
                  { label: "Submitted",      value: fmt(application.created_at) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </ApplicantLayout>
  );
}