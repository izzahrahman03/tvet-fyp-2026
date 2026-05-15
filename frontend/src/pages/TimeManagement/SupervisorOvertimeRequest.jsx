// pages/supervisor/SupervisorOvertimeRequests.jsx
import { useState, useEffect, useCallback } from "react";
import { fetchSupervisorOvertimeRequests, processOvertimeRequest } from "../api/timeApi";
import useToast from "../userManagement/userTable/useToast";
import "../../css/userManagement/userTable.css";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const calcHours = (start, end) => {
  if (!start || !end) return "—";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return "—";
  const h = Math.floor(diff / 60), m = diff % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

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

function ReviewModal({ row, onClose, onDone }) {
  const [remarks, setRemarks] = useState("");
  const [saving,  setSaving]  = useState(null);
  const [error,   setError]   = useState("");

  const handle = async (status) => {
    if (status === "rejected" && !remarks.trim()) { setError("Please provide a reason when rejecting."); return; }
    setSaving(status); setError("");
    try {
      await processOvertimeRequest(row.overtime_id, status, remarks);
      onDone(row.overtime_id, status, remarks);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status.");
    } finally { setSaving(null); }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <p className="modal-title">Review Overtime Request</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="modal-form">
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2, padding: "12px 14px" }}>
            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{row.student_name}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{row.student_email}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Date",       value: fmtDate(row.overtime_date) },
              { label: "Duration",   value: calcHours(row.start_time, row.end_time) },
              { label: "Start Time", value: row.start_time?.slice(0, 5) || "—" },
              { label: "End Time",   value: row.end_time?.slice(0, 5) || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="form-field" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
                <div style={{ padding: "8px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2, fontSize: 13, color: "#1e293b", marginTop: 4 }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="form-field" style={{ margin: 0 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Reason</label>
            <div style={{ padding: "8px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2, fontSize: 13, color: "#1e293b", marginTop: 4, lineHeight: 1.6 }}>{row.reason}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>Current status:</span>
            <StatusBadge status={row.status} />
          </div>

          {row.status === "pending" && (
            <div className="form-field" style={{ margin: 0 }}>
              <label>Remarks <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>(required when rejecting)</span></label>
              <textarea className="form-input" value={remarks} onChange={(e) => { setRemarks(e.target.value); setError(""); }} rows={3} placeholder="Add a note for the student…" style={{ resize: "vertical" }} />
            </div>
          )}

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 2, padding: "10px 12px", fontSize: 13, color: "#b91c1c" }}>{error}</div>
          )}
        </div>
        <div className="modal-footer">
          {row.status === "pending" && (
            <>
              <button onClick={() => handle("rejected")} disabled={!!saving}
                style={{ padding: "9px 18px", background: saving === "rejected" ? "#e2e8f0" : "#dc2626", color: saving === "rejected" ? "#94a3b8" : "#fff", border: "none", borderRadius: 2, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving === "rejected" ? "Rejecting…" : "Reject"}
              </button>
              <button onClick={() => handle("approved")} disabled={!!saving}
                style={{ padding: "9px 18px", background: saving === "approved" ? "#e2e8f0" : "#16a34a", color: saving === "approved" ? "#94a3b8" : "#fff", border: "none", borderRadius: 2, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving === "approved" ? "Approving…" : "Approve"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SupervisorOvertimeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [viewRow,  setViewRow]  = useState(null);
  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setRequests(await fetchSupervisorOvertimeRequests()); }
    catch { show("Failed to load overtime requests.", "error"); }
    finally { setLoading(false); }
  }, [show]);

  useEffect(() => { load(); }, [load]);

  const handleDone = (id, status, remarks) => {
    setRequests((prev) => prev.map((r) => r.overtime_id === id ? { ...r, status, supervisor_remarks: remarks } : r));
    show(`Overtime request ${status}.`);
  };

  const filtered = requests.filter((r) => {
    const statusMatch = filter === "all" || r.status === filter;
    const q = search.toLowerCase();
    const searchMatch = !q || [r.student_name, r.student_email, r.status, fmtDate(r.overtime_date)].some((v) => String(v ?? "").toLowerCase().includes(q));
    return statusMatch && searchMatch;
  });

  return (
    <div style={{ padding: "28px 32px" }}>
      {toast && <div className={`ut-toast ${toast.kind}`}>{toast.msg}</div>}
      {viewRow && <ReviewModal row={viewRow} onClose={() => setViewRow(null)} onDone={handleDone} />}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Overtime Requests</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 0 }}>Review and process student overtime requests.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total",    value: requests.length,                                        color: "#1b3a6b" },
          { label: "Pending",  value: requests.filter((r) => r.status === "pending").length,  color: "#f59e0b" },
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
            <input className="ut-table-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, date…" />
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
                  <th>Date</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9}><div className="empty-state"><p className="empty-state-text">{requests.length === 0 ? "No overtime requests yet." : "No results match your search."}</p></div></td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.overtime_id}>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>{i + 1}</td>
                    <td>
                      <span className="cell-name">{r.student_name}</span>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{r.student_email}</p>
                    </td>
                    <td>{fmtDate(r.overtime_date)}</td>
                    <td>{r.start_time?.slice(0, 5)}</td>
                    <td>{r.end_time?.slice(0, 5)}</td>
                    <td>{calcHours(r.start_time, r.end_time)}</td>
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