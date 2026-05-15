// pages/supervisor/SupervisorLeaveRequests.jsx
import { useState, useEffect, useCallback } from "react";
import { fetchSupervisorLeaveRequests, processLeaveRequest } from "../api/timeApi";
import useToast from "../userManagement/userTable/useToast";
import "../../css/userManagement/userTable.css";

const API = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const LEAVE_LABEL = { annual: "Annual Leave", medical: "Medical Leave", unpaid: "Unpaid Leave" };

const STATUS_STYLE = {
  pending:  { bg: "#fffbeb", color: "#92400e" },
  approved: { bg: "#dcfce7", color: "#15803d" },
  rejected: { bg: "#fee2e2", color: "#b91c1c" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "2px", fontSize: 11, fontWeight: 700, textTransform: "capitalize", background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

// ── Duration display helper ────────────────────────────────
function durationLabel(r) {
  if (r.duration_type === "half_day") return `Half Day – ${r.session || ""}`;
  if (r.start_date && r.end_date) {
    const days = Math.round((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1;
    return `Full Day (${days} day${days > 1 ? "s" : ""})`;
  }
  return "Full Day";
}

// ── Detail + Action Modal ─────────────────────────────────
function ReviewModal({ row, onClose, onDone }) {
  const [remarks, setRemarks] = useState("");
  const [saving,  setSaving]  = useState(null);
  const [error,   setError]   = useState("");

  const handle = async (status) => {
    if (status === "rejected" && !remarks.trim()) {
      setError("Please provide a reason when rejecting."); return;
    }
    setSaving(status);
    setError("");
    try {
      await processLeaveRequest(row.leave_id, status, remarks);
      onDone(row.leave_id, status, remarks);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status.");
    } finally { setSaving(null); }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <p className="modal-title">Review Leave Request</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="modal-form">
          {/* Student info */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2, padding: "12px 14px" }}>
            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{row.student_name}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              {row.student_email}
              {row.matric_number && <span style={{ marginLeft: 8, fontWeight: 600, color: "#1b3a6b" }}>· {row.matric_number}</span>}
            </p>
          </div>

          {/* Leave details grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Leave Type",  value: LEAVE_LABEL[row.leave_type] || row.leave_type },
              { label: "Duration",    value: durationLabel(row) },
              ...(row.duration_type === "half_day"
                ? [{ label: "Leave Date", value: fmtDate(row.start_date) },
                   { label: "Session",    value: row.session || "—" }]
                : [{ label: "Start Date", value: fmtDate(row.start_date) },
                   { label: "End Date",   value: fmtDate(row.end_date) }]
              ),
            ].map(({ label, value }) => (
              <div key={label} className="form-field" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
                <div style={{ padding: "8px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2, fontSize: 13, color: "#1e293b", marginTop: 4 }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="form-field" style={{ margin: 0 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Reason</label>
            <div style={{ padding: "8px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2, fontSize: 13, color: "#1e293b", marginTop: 4, lineHeight: 1.6 }}>
              {row.reason}
            </div>
          </div>

          {row.document_path && (
            <div className="form-field" style={{ margin: 0 }}>
              
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Document
              </label>

              <button
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `${API}/supervisor/leave-requests/${row.leave_id}/document`,
                      {
                        headers: {
                          Authorization: `Bearer ${getToken()}`,
                        },
                      }
                    );

                    if (!res.ok) {
                      alert("File not found.");
                      return;
                    }

                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `leave_document_${row.student_name}_${row.leave_id}`;
                    a.click();

                    URL.revokeObjectURL(url);
                  } catch {
                    alert("Failed to download file.");
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 16px",
                  background: "#1b3a6b",
                  color: "white",
                  border: "none",
                  borderRadius: 2,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>

                Download Document
              </button>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>Current status:</span>
            <StatusBadge status={row.status} />
          </div>

          {row.status === "pending" && (
            <div className="form-field" style={{ margin: 0 }}>
              <label>Remarks <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>(required when rejecting)</span></label>
              <textarea
                className="form-input" value={remarks} onChange={(e) => { setRemarks(e.target.value); setError(""); }}
                rows={3} placeholder="Add a note for the student…" style={{ resize: "vertical" }}
              />
            </div>
          )}

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 2, padding: "10px 12px", fontSize: 13, color: "#b91c1c" }}>
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {row.status === "pending" && (
            <>
              <button
                onClick={() => handle("rejected")} disabled={!!saving}
                style={{ padding: "9px 18px", background: saving === "rejected" ? "#e2e8f0" : "#dc2626", color: saving === "rejected" ? "#94a3b8" : "#fff", border: "none", borderRadius: 2, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
              >
                {saving === "rejected" ? "Rejecting…" : "Reject"}
              </button>
              <button
                onClick={() => handle("approved")} disabled={!!saving}
                style={{ padding: "9px 18px", background: saving === "approved" ? "#e2e8f0" : "#16a34a", color: saving === "approved" ? "#94a3b8" : "#fff", border: "none", borderRadius: 2, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
              >
                {saving === "approved" ? "Approving…" : "Approve"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function SupervisorLeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [viewRow,  setViewRow]  = useState(null);

  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setRequests(await fetchSupervisorLeaveRequests()); }
    catch { show("Failed to load leave requests.", "error"); }
    finally { setLoading(false); }
  }, [show]);

  useEffect(() => { load(); }, [load]);

  const handleDone = (id, status, remarks) => {
    setRequests((prev) => prev.map((r) => r.leave_id === id ? { ...r, status, supervisor_remarks: remarks } : r));
    show(`Leave request ${status}.`);
  };

  const filtered = requests.filter((r) => {
    const statusMatch = filter === "all" || r.status === filter;
    const q = search.toLowerCase();
    const searchMatch = !q || [r.student_name, r.student_email, r.leave_type, r.status, r.matric_number].some((v) => String(v ?? "").toLowerCase().includes(q));
    return statusMatch && searchMatch;
  });

  const pending = requests.filter((r) => r.status === "pending").length;

  return (
    <div style={{ padding: "28px 32px" }}>
      {toast && <div className={`ut-toast ${toast.kind}`}>{toast.msg}</div>}
      {viewRow && <ReviewModal row={viewRow} onClose={() => setViewRow(null)} onDone={handleDone} />}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Leave Requests</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 0 }}>
          Review and approve or reject student leave requests.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total",    value: requests.length,                                        color: "#1b3a6b" },
          { label: "Pending",  value: pending,                                                color: "#f59e0b" },
          { label: "Approved", value: requests.filter((r) => r.status === "approved").length, color: "#16a34a" },
          { label: "Rejected", value: requests.filter((r) => r.status === "rejected").length, color: "#dc2626" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #c8d5e8", borderRadius: 2, padding: "14px 18px", borderTop: `3px solid ${color}` }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800, color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="ut-table-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
            <input className="ut-table-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, matric, type…" />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>×</button>}
          </div>
          <select className="ut-table-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <p className="table-count">Showing <strong>{filtered.length}</strong> of {requests.length} request{requests.length !== 1 ? "s" : ""}</p>

        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /><p className="loading-text">Loading…</p></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>#</th>
                  <th>Student</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Date(s)</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9}><div className="empty-state"><p className="empty-state-text">{requests.length === 0 ? "No leave requests from students yet." : "No results match your search."}</p></div></td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.leave_id}>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>{i + 1}</td>
                    <td>
                      <span className="cell-name">{r.student_name}</span>
                      <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                        {r.matric_number && <span style={{ fontWeight: 600, color: "#1b3a6b" }}>{r.matric_number} · </span>}
                        {r.student_email}
                      </p>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", background: "#f1f5f9", color: "#1b3a6b", borderRadius: 2 }}>
                        {LEAVE_LABEL[r.leave_type] || r.leave_type}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, padding: "2px 8px", background: r.duration_type === "half_day" ? "#fef9c3" : "#eff6ff", color: r.duration_type === "half_day" ? "#854d0e" : "#1d4ed8", borderRadius: 2, fontWeight: 600 }}>
                        {r.duration_type === "half_day" ? "Half Day" : "Full Day"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13 }}>
                        {r.duration_type === "half_day"
                          ? fmtDate(r.start_date)
                          : `${fmtDate(r.start_date)} – ${fmtDate(r.end_date)}`}
                      </span>
                    </td>
                    <td>
                      {r.session
                        ? <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", background: "#f0fdf4", color: "#15803d", borderRadius: 2 }}>{r.session}</span>
                        : <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>}
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td><span className="cell-muted">{fmtDate(r.created_at)}</span></td>
                    <td>
                      <div className="ut-action-btn-wrap">
                        <button
                          className={`ut-action-btn ${r.status === "pending" ? "ut-action-btn-edit" : "ut-action-btn-detail"}`}
                          onClick={() => setViewRow(r)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
                            {r.status === "pending"
                              ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>
                              : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                          </svg>
                          {r.status === "pending" ? "Review" : "View"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}