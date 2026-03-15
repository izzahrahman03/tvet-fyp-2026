import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApplicantLayout from "../../components/dashboard/Layout";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

// ── Status badge ───────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:      { label: "Pending",      bg: "#fef9c3", color: "#854d0e" },
    under_review: { label: "In Progress",  bg: "#dbeafe", color: "#1e40af" },
    approved:     { label: "Approved",     bg: "#dcfce7", color: "#166534" },
    rejected:     { label: "Rejected",     bg: "#fee2e2", color: "#991b1b" },
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
function ProgressStep({ label, sub, state }) {
  // state: "done" | "active" | "pending"
  const colors = {
    done:    { ring: "#22c55e", fill: "#22c55e", text: "#16a34a" },
    active:  { ring: "#1a56db", fill: "#1a56db", text: "#1a56db" },
    pending: { ring: "#cbd5e1", fill: "white",   text: "#94a3b8" },
  };
  const c = colors[state] || colors.pending;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "16px" }}>
      {/* Circle */}
      <div style={{
        width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 2,
        border: `2px solid ${c.ring}`, background: c.fill,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {state === "done" && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
        {state === "active" && (
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white" }} />
        )}
      </div>
      {/* Text */}
      <div>
        <p style={{ fontSize: "13px", fontWeight: "600", color: state === "pending" ? "#94a3b8" : "#1e293b", margin: 0 }}>
          {label}
        </p>
        <p style={{ fontSize: "11px", color: c.text, margin: "2px 0 0" }}>{sub}</p>
      </div>
    </div>
  );
}

// ── Derive step states from application status ─────────────
function getSteps(status, submittedAt) {
  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "";

  const submitted  = fmt(submittedAt);
  const s          = status?.toLowerCase();

  return [
    {
      label: "Application Submitted",
      sub:   s === "pending" || s === "under_review" || s === "approved" || s === "rejected"
               ? `Completed on ${submitted}` : "Pending",
      state: "done",
    },
    {
      label: "Under Review",
      sub:   s === "under_review" ? "In Progress"
           : s === "approved" || s === "rejected" ? "Completed"
           : "Pending",
      state: s === "under_review" ? "active"
           : s === "approved" || s === "rejected" ? "done"
           : "pending",
    },
    {
      label: "Interview",
      sub:   s === "approved" ? "Completed" : "Pending",
      state: s === "approved" ? "done" : "pending",
    },
    {
      label: "Final Result",
      sub:   s === "approved" ? "Approved 🎉" : s === "rejected" ? "Rejected" : "Pending",
      state: s === "approved" ? "done" : s === "rejected" ? "active" : "pending",
    },
  ];
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

  // Format application ID like APP-2024-001234
  const formatAppId = (id) => {
    if (!id) return "—";
    const year = new Date().getFullYear();
    return `APP-${year}-${String(id).padStart(6, "0")}`;
  };

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

  return (
    <ApplicantLayout title="Dashboard">

      {/* ── Welcome banner ──────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #1a56db 60%, #2563eb 100%)",
        borderRadius: "16px", padding: "28px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "28px",
      }}>
        <h1 style={{ color: "white", fontSize: "22px", fontWeight: "700", margin: 0 }}>
          Welcome back, {userName}
        </h1>
      </div>

      {/* ── Application status card ──────────────────────── */}
      <div style={{
        background: "white", borderRadius: "14px", padding: "24px 28px",
        maxWidth: "380px", border: "1px solid #e2e8f0",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      }}>
        {/* Card title + badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", margin: 0 }}>
            My Application Status
          </h3>
          {!loading && application && <StatusBadge status={application.status} />}
        </div>

        {/* Loading */}
        {loading && (
          <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>
            Loading…
          </p>
        )}

        {/* No application yet */}
        {!loading && !application && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
              You have not submitted any applications yet.
            </p>
            <button
              onClick={() => navigate("/application-form")}
              style={{
                background: "#1a56db", color: "white", border: "none",
                borderRadius: "8px", padding: "10px 24px",
                fontSize: "14px", fontWeight: "600", cursor: "pointer",
              }}
            >
              Create Application
            </button>
          </div>
        )}

        {/* Application exists */}
        {!loading && application && (
          <>
            {/* App ID + Submitted date */}
            <div style={{ display: "flex", gap: "24px", marginBottom: "20px" }}>
              <div>
                <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", margin: "0 0 2px" }}>APPLICATION ID</p>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                  {formatAppId(application.application_id)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", margin: "0 0 2px" }}>SUBMITTED DATE</p>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                  {fmt(application.created_at)}
                </p>
              </div>
            </div>

            {/* Progress steps */}
            <p style={{ fontSize: "12px", fontWeight: "700", color: "#1a56db", marginBottom: "14px" }}>
              Application Progress
            </p>
            <div style={{ position: "relative", paddingLeft: "4px" }}>
              {/* Vertical line */}
              <div style={{
                position: "absolute", left: "13px", top: "22px",
                width: "2px", height: "calc(100% - 36px)",
                background: "#e2e8f0", zIndex: 0,
              }} />
              {getSteps(application.status, application.created_at).map((step, i) => (
                <ProgressStep key={i} {...step} />
              ))}
            </div>
          </>
        )}
      </div>

    </ApplicantLayout>
  );
}