// pages/internshipManagement/MyInternshipApplications.jsx
import { useState, useEffect } from "react";
import { fetchMyApplications, acceptInternshipOffer, declineInternshipOffer, requestInternshipWithdraw } from "../api/internshipApi";
import StatusBadge from "../../pages/userManagement/userTable/StatusBadge";
import useToast    from "../../pages/userManagement/userTable/useToast";
import "../../css/userManagement/userTable.css";
import "../../css/internshipManagement/internship.css";
import { Tag, Icons } from "./InternshipVacanciesList";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-MY", { dateStyle: "full", timeStyle: "short" }) : "—";

const STATUS_LABEL_DISPLAY = {
  pending:             "Pending",
  interview:           "Interview",
  passed:              "Passed — Respond",
  failed:              "Failed",
  accepted:            "Accepted",
  declined:            "Declined",
  withdrawn_requested: "Withdraw Requested",
  withdrawn:           "Withdrawn",
};

// ── Confirm dialog ─────────────────────────────────────────
function ConfirmDialog({ title, message, warning, confirmLabel, confirmColor = "#1b3a6b", onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <p className="modal-title">{title}</p>
          <button className="modal-close-btn" onClick={onCancel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-form">
          <p style={{ margin: 0, fontSize: "14px", color: "#1a2744", lineHeight: "1.7" }}>{message}</p>
          {warning && (
            <div style={{
              background: "#fff7ed", border: "1px solid #fed7aa",
              borderRadius: "4px", padding: "10px 14px",
              fontSize: "13px", color: "#c2410c",
              display: "flex", gap: "8px", alignItems: "flex-start",
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />
              </svg>
              <span>{warning}</span>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              padding: "9px 20px", background: confirmColor, color: "white",
              border: "none", borderRadius: "2px", fontSize: "13px",
              fontWeight: "700", cursor: "pointer", letterSpacing: "0.04em",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ app, onStatusChange, hasAccepted, onError }) {
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  const status      = app.status?.toLowerCase();
  const isPassed    = status === "passed";
  const isAccepted  = status === "accepted";
  const isInterview = status === "interview";

  const durationWeeks = () => {
    if (!app.start_date || !app.end_date) return null;
    const ms    = new Date(app.end_date) - new Date(app.start_date);
    const weeks = Math.round(ms / (1000 * 60 * 60 * 24 * 7));
    return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  };

  const handleAction = async (action) => {
    setLoading(true);
    setConfirm(null);
    try {
      if (action === "accept")    await acceptInternshipOffer(app.internship_application_id);
      if (action === "decline")   await declineInternshipOffer(app.internship_application_id);
      if (action === "withdrawn") await requestInternshipWithdraw(app.internship_application_id);

      const newStatus = action === "accept"    ? "accepted"
                      : action === "decline"   ? "declined"
                      :                          "withdrawn_requested";

      onStatusChange(app.internship_application_id, newStatus);
    } catch (err) {
      onError(err.message || "Action failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {confirm === "accept" && (
        <ConfirmDialog
          title="Accept Internship Offer"
          message={`Are you sure you want to accept the offer for "${app.position_name}" at ${app.company_name}?`}
          warning="You can only accept one internship offer. All other passed offers will remain unchanged but you will not be able to accept them after this."
          confirmLabel="Yes, Accept Offer"
          confirmColor="#16a34a"
          onConfirm={() => handleAction("accept")}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === "decline" && (
        <ConfirmDialog
          title="Decline Internship Offer"
          message={`Are you sure you want to decline the offer for "${app.position_name}" at ${app.company_name}? This action cannot be undone.`}
          confirmLabel="Yes, Decline"
          confirmColor="#b91c1c"
          onConfirm={() => handleAction("decline")}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === "withdrawn" && (
        <ConfirmDialog
          title="Request Withdrawal"
          message={`Are you sure you want to withdraw your accepted internship at ${app.company_name}?`}
          warning="Your withdrawal request will be sent to the company for approval. Your status will show as 'Withdraw Requested' until they approve it."
          confirmLabel="Yes, Request Withdrawal"
          confirmColor="#c2410c"
          onConfirm={() => handleAction("withdrawn")}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div style={{
        background: "white",
        border: `1.5px solid ${isPassed ? "#bbf7d0" : isInterview ? "#ddd6fe" : "#c8d5e8"}`,
        borderRadius: "2px",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "box-shadow 0.15s, border-color 0.15s",
      }}>

        {/* ── Top row ───────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: "0 0 3px", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
              {app.position_name}
            </h3>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#1b3a6b" }}>
              {app.company_name}
            </p>
          </div>
          <StatusBadge status={app.status} />
        </div>

        {/* ── Tags ─────────────────────────────────────── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <Tag icon={Icons.industry} text={app.industry_sector} />
          <Tag icon={Icons.location} text={app.location} />
          {app.start_date && app.end_date && (
            <Tag icon={Icons.calendar} text={`${fmtDate(app.start_date)} – ${fmtDate(app.end_date)}`} />
          )}
          {durationWeeks() && <Tag icon={Icons.clock} text={durationWeeks()} />}
        </div>

        {/* ── Contact person ────────────────────────────── */}
        {(app.contact_person_name || app.contact_person_email || app.contact_person_phone) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {app.contact_person_name  && <Tag icon={Icons.people} text={app.contact_person_name} />}
            {app.contact_person_email && <Tag icon={Icons.email}  text={app.contact_person_email} />}
            {app.contact_person_phone && <Tag icon={Icons.phone}  text={app.contact_person_phone} />}
          </div>
        )}

        {/* ── Interview block ───────────────────────────── */}
        {isInterview && app.interview_datetime && (
          <div style={{
            background: "#f5f3ff", border: "1px solid #ddd6fe",
            borderRadius: "2px", padding: "12px 16px",
            display: "flex", flexDirection: "column", gap: "8px",
          }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: "800", color: "#6d28d9", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Interview Scheduled
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "11px", color: "#7c3aed", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date &amp; Time</p>
                <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "700", color: "#4c1d95" }}>{fmtDateTime(app.interview_datetime)}</p>
              </div>
              {app.interview_location && (
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: "11px", color: "#7c3aed", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Location / Venue</p>
                  <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "700", color: "#4c1d95" }}>{app.interview_location}</p>
                </div>
              )}
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#7c3aed" }}>
              Please arrive on time. If you are unable to attend, contact the company directly.
            </p>
          </div>
        )}

        {/* ── Passed — accept / decline buttons ────────── */}
        {isPassed && (
          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: "2px", padding: "12px 16px",
            display: "flex", flexDirection: "column", gap: "10px",
          }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: "800", color: "#15803d", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              You Passed — Please Respond
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#166534" }}>
              Congratulations! You have been offered this internship position. Please accept or decline the offer.
            </p>
            {hasAccepted && (
              <div style={{
                background: "#fff7ed", border: "1px solid #fed7aa",
                borderRadius: "4px", padding: "8px 12px",
                fontSize: "12.5px", color: "#c2410c",
              }}>
                You have already accepted (or requested withdrawal for) another internship. You cannot accept more than one offer.
              </div>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setConfirm("accept")}
                disabled={loading || hasAccepted}
                style={{
                  flex: 1, padding: "9px 0", background: hasAccepted ? "#e2e8f0" : "#16a34a",
                  color: hasAccepted ? "#94a3b8" : "white", border: "none", borderRadius: "2px",
                  fontSize: "13px", fontWeight: "700", cursor: hasAccepted ? "not-allowed" : "pointer",
                  letterSpacing: "0.04em", transition: "background 0.15s",
                }}
              >
                ✓ Accept Offer
              </button>
              <button
                onClick={() => setConfirm("decline")}
                disabled={loading}
                style={{
                  flex: 1, padding: "9px 0", background: "white", color: "#b91c1c",
                  border: "1.5px solid #fecaca", borderRadius: "2px",
                  fontSize: "13px", fontWeight: "700", cursor: "pointer",
                  letterSpacing: "0.04em", transition: "all 0.15s",
                }}
              >
                ✕ Decline
              </button>
            </div>
          </div>
        )}

        {/* ── Accepted — withdraw button ─────────────────── */}
        {isAccepted && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "12px", flexWrap: "wrap",
            background: "#f8fafc", border: "1px solid #e2e8f0",
            borderRadius: "2px", padding: "10px 14px",
          }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>
              Changed your mind? You can request a withdrawal — the company must approve it.
            </p>
            <button
              onClick={() => setConfirm("withdrawn")}
              disabled={loading}
              style={{
                padding: "7px 16px", background: "white", color: "#c2410c",
                border: "1.5px solid #fed7aa", borderRadius: "2px",
                fontSize: "12.5px", fontWeight: "700", cursor: "pointer",
                whiteSpace: "nowrap", transition: "all 0.15s",
              }}
            >
              Request Withdrawal
            </button>
          </div>
        )}

        {/* ── Footer ────────────────────────────────────── */}
        <div style={{ paddingTop: "10px", borderTop: "1px solid #f1f5f9", fontSize: "12px", color: "#94a3b8" }}>
          Applied on {fmtDate(app.applied_date)}
        </div>

      </div>
    </>
  );
}

export default function MyInternshipApplications() {
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState("All");
  const { toast, show }                 = useToast();

  useEffect(() => {
    fetchMyApplications()
      .then(setApplications)
      .catch((err) => {
        console.error(err);
        show("Failed to load applications.", "error");
      })
      .finally(() => setLoading(false));
  }, []);

  const hasAccepted = applications.some((a) =>
    ["accepted", "withdrawn_requested"].includes(a.status?.toLowerCase())
  );

  const handleStatusChange = (id, newStatus) => {
    setApplications((prev) =>
      prev.map((a) => a.internship_application_id === id ? { ...a, status: newStatus } : a)
    );
  };

  const allStatuses = ["All", ...new Set(applications.map((a) => a.status).filter(Boolean))];

  const filtered = filter === "All"
    ? applications
    : applications.filter((a) => a.status?.toLowerCase() === filter.toLowerCase());

  return (
    <div>
      {/* ── Toast ────────────────────────────────────────── */}
      {toast && (
        <div className={`ut-toast ${toast.kind}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={toast.kind === "error" ? "M18 6L6 18M6 6l12 12" : "M20 6L9 17l-5-5"} />
          </svg>
          {toast.msg}
        </div>
      )}

      {/* ── White card wrapper ────────────────────────────── */}
      <div className="table-wrapper" style={{ padding: "24px 28px" }}>

        {/* ── Header ───────────────────────────────────────── */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.3px" }}>
            My Applications
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            {loading ? "Loading…" : `${applications.length} application${applications.length !== 1 ? "s" : ""} submitted`}
          </p>
        </div>

        {/* ── Filter pills ──────────────────────────────────── */}
        {!loading && applications.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px", justifyContent: "flex-end" }}>
            {allStatuses.map((s) => {
              const active = filter === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  style={{
                    padding: "6px 16px", borderRadius: "2px",
                    border: `1.5px solid ${active ? "#1b3a6b" : "#e2e8f0"}`,
                    background: active ? "#1b3a6b" : "white",
                    color: active ? "white" : "#475569",
                    fontSize: "12.5px", fontWeight: "600",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {s === "All" ? `All (${applications.length})` : (STATUS_LABEL_DISPLAY[s.toLowerCase()] || s)}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Content ───────────────────────────────────────── */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Loading applications…</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state" style={{ marginTop: "48px" }}>
            <p className="empty-state-text">You haven't applied to any internships yet.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ marginTop: "48px" }}>
            <p className="empty-state-text">No applications with this status.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map((app) => (
              <ApplicationCard
                key={app.internship_application_id}
                app={app}
                onStatusChange={handleStatusChange}
                hasAccepted={hasAccepted && app.status?.toLowerCase() !== "accepted"}
                onError={(msg) => show(msg, "error")}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}