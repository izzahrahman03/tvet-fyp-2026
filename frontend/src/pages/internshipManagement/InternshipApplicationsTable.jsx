// pages/internshipManagement/PartnerApplicationsTable.jsx
import { useState, useEffect } from "react";
import {
  fetchInternshipApplications,
  updateInternshipStatus,
  approveWithdrawRequest,
} from "../api/internshipApplicationApi";
import StatusBadge from "../../pages/userManagement/userTable/StatusBadge";
import useToast    from "../userManagement/userTable/useToast";
import "../../css/userManagement/userTable.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Update Status Modal ───────────────────────────────────
function UpdateStatusModal({ row, onClose, onSave }) {
  const [status,            setStatus]            = useState("");
  const [interviewDatetime, setInterviewDatetime] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [saving,            setSaving]            = useState(false);
  const [error,             setError]             = useState("");

  const isInterview = status === "interview";

  const handleSave = async () => {
    setError("");
    if (!status) return setError("Please select a status.");
    if (isInterview && !interviewDatetime) return setError("Interview date & time is required.");
    if (isInterview && !interviewLocation.trim()) return setError("Interview location is required.");

    setSaving(true);
    try {
      await updateInternshipStatus(row.id, status, {
        interview_datetime: isInterview ? interviewDatetime : undefined,
        interview_location: isInterview ? interviewLocation.trim() : undefined,
      });
      onSave({
        ...row,
        status,
        interview_datetime: isInterview ? interviewDatetime : row.interview_datetime,
        interview_location: isInterview ? interviewLocation.trim() : row.interview_location,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "480px" }}>
        <div className="modal-header">
          <p className="modal-title">Update Application Status</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-form">
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "2px", padding: "12px 14px" }}>
            <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>{row.student_name}</p>
            <p style={{ margin: "0 0 2px", fontSize: "13px", color: "#475569" }}>{row.student_email}</p>
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
              Applied for: <strong style={{ color: "#1b3a6b" }}>{row.position_name}</strong>
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12.5px", color: "#64748b" }}>Current status:</span>
            <StatusBadge status={row.status} />
          </div>

          <div className="form-field">
            <label>New Status</label>
            <select className="form-input" value={status} onChange={(e) => { setStatus(e.target.value); setError(""); }}>
              <option value="" disabled>Select new status…</option>
              <option value="interview">Interview — schedule an interview</option>
              <option value="passed">Passed — offer the position</option>
              <option value="failed">Failed — decline the application</option>
            </select>
          </div>

          {isInterview && (
            <>
              <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0", marginTop: "4px" }}>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#6d28d9", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Interview Details
                </span>
              </div>
              <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "4px", padding: "10px 14px", fontSize: "13px", color: "#6d28d9", display: "flex", gap: "8px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4 M12 8h.01" />
                </svg>
                <span>The student will receive an email notification with these details.</span>
              </div>
              <div className="form-field">
                <label>Date &amp; Time <span style={{ color: "#ef4444" }}>*</span></label>
                <input className="form-input" type="datetime-local" value={interviewDatetime}
                  onChange={(e) => setInterviewDatetime(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
              </div>
              <div className="form-field">
                <label>Location / Venue <span style={{ color: "#ef4444" }}>*</span></label>
                <input className="form-input" value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)} placeholder="e.g. Meeting Room 3, Level 5" />
              </div>
            </>
          )}

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", padding: "10px 14px", fontSize: "13px", color: "#b91c1c" }}>
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="ut-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="ut-btn-primary" onClick={handleSave} disabled={saving || !status} style={{ opacity: saving || !status ? 0.65 : 1 }}>
            {saving ? "Saving…" : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approve Withdraw Confirm Modal ────────────────────────
function ApproveWithdrawModal({ row, onClose, onApprove }) {
  const [saving, setSaving] = useState(false);

  const handleApprove = async () => {
    setSaving(true);
    try {
      await approveWithdrawRequest(row.id);
      onApprove(row.id);
      onClose();
    } catch (err) {
      alert(err.message || "Failed to approve withdrawal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "420px" }}>
        <div className="modal-header">
          <p className="modal-title">Approve Withdrawal Request</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-form">
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "2px", padding: "12px 14px" }}>
            <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>{row.student_name}</p>
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
              Requesting withdrawal from: <strong style={{ color: "#1b3a6b" }}>{row.position_name}</strong>
            </p>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#1a2744", lineHeight: "1.7" }}>
            This student has requested to withdraw their accepted internship. Approving will mark this application as withdrawn and notify the student.
          </p>
        </div>
        <div className="modal-footer">
          <button className="ut-btn-secondary" onClick={onClose}>Cancel</button>
          <button
            onClick={handleApprove}
            disabled={saving}
            style={{
              padding: "9px 20px", background: saving ? "#e2e8f0" : "#c2410c", color: saving ? "#94a3b8" : "white",
              border: "none", borderRadius: "2px", fontSize: "13px",
              fontWeight: "700", cursor: saving ? "not-allowed" : "pointer", letterSpacing: "0.04em",
            }}
          >
            {saving ? "Approving…" : "Approve Withdrawal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── View Modal ────────────────────────────────────────────
function ViewApplicationModal({ row, onClose }) {
  const handleDownload = async (type) => {
    try {
      const res = await fetch(
        `${API}/partner/internship-applications/${row.id}/download/${type}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!res.ok) { alert("File not found."); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${type}_${row.student_name}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Failed to download file."); }
  };

  const Field = ({ label, value }) => (
    <div className="form-field" style={{ margin: 0 }}>
      <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: "2px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#1e293b", marginTop: "4px" }}>
        {value ?? "—"}
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "520px" }}>
        <div className="modal-header">
          <p className="modal-title">Application Details</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-form">
          <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Applicant</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Name"  value={row.student_name} />
            <Field label="Email" value={row.student_email} />
          </div>

          <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0", marginTop: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Position Applied</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Position"     value={row.position_name} />
            <Field label="Applied Date" value={fmtDate(row.applied_date)} />
          </div>

          <div className="form-field" style={{ margin: 0 }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</label>
            <div style={{ marginTop: "6px" }}><StatusBadge status={row.status} /></div>
          </div>

          <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0", marginTop: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Documents</span>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {row.resume_path ? (
              <button onClick={() => handleDownload("resume")} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", background: "#1b3a6b", color: "white", border: "none", borderRadius: "2px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" /></svg>
                Download Resume
              </button>
            ) : <span style={{ fontSize: "13px", color: "#94a3b8" }}>No resume uploaded.</span>}
            {row.cover_letter_path && (
              <button onClick={() => handleDownload("cover_letter")} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", background: "white", color: "#1b3a6b", border: "1.5px solid #b8c8df", borderRadius: "2px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" /></svg>
                Download Cover Letter
              </button>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="ut-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Table ────────────────────────────────────────────
const COLUMNS   = ["student_name", "position_name", "status", "applied_date"];
const COL_LABEL = { student_name: "Applicant", position_name: "Position", status: "Status", applied_date: "Applied Date" };

export default function PartnerApplicationsTable() {
  const [rows,           setRows]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [sortKey,        setSortKey]        = useState("applied_date");
  const [sortDir,        setSortDir]        = useState("desc");
  const [statusFilter,   setStatusFilter]   = useState("All");
  const [viewRow,        setViewRow]        = useState(null);
  const [editRow,        setEditRow]        = useState(null);
  const [withdrawRow,    setWithdrawRow]    = useState(null);
  const { toast, show }                     = useToast();

  useEffect(() => {
    setLoading(true);
    fetchInternshipApplications()
      .then(setRows)
      .catch(() => show("Failed to load applications.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const allStatuses = ["All", ...new Set(rows.map((r) => r.status).filter(Boolean))];

  const filtered = rows
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        (statusFilter === "All" || r.status === statusFilter) &&
        [r.student_name, r.student_email, r.position_name].some((v) => String(v ?? "").toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const va = String(a[sortKey] ?? "").toLowerCase();
      const vb = String(b[sortKey] ?? "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const handleSaveStatus = (updated) => {
    setRows((p) => p.map((r) => r.id === updated.id ? updated : r));
    show(`Status updated to "${updated.status}".`);
  };

  const handleWithdrawApproved = (id) => {
    setRows((p) => p.map((r) => r.id === id ? { ...r, status: "withdrawn" } : r));
    show("Withdrawal approved.");
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><path d="M3 6h18 M7 12h10 M10 18h4" /></svg>;
    return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2.5"><path d={sortDir === "asc" ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} /></svg>;
  };

  // Statuses where the partner can still update
  const canEdit = (status) => !["accepted", "declined", "withdrawn_requested", "withdrawn"].includes(status?.toLowerCase());

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

      {viewRow     && <ViewApplicationModal row={viewRow}     onClose={() => setViewRow(null)} />}
      {editRow     && <UpdateStatusModal    row={editRow}     onClose={() => setEditRow(null)}     onSave={handleSaveStatus} />}
      {withdrawRow && <ApproveWithdrawModal row={withdrawRow} onClose={() => setWithdrawRow(null)} onApprove={handleWithdrawApproved} />}

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="ut-table-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input className="ut-table-search-input" placeholder="Search applicant, position…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="ut-table-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {allStatuses.map((s) => (
               <option key={s} value={s}>{s === "All" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        <p className="table-count">{filtered.length} application{filtered.length !== 1 ? "s" : ""}</p>

        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /><p className="loading-text">Loading applications…</p></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "48px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>#</th>
                  {COLUMNS.map((col) => (
                    <th key={col} onClick={() => handleSort(col)}>
                      <span className="th-inner">{COL_LABEL[col]}<SortIcon col={col} /></span>
                    </th>
                  ))}
                  <th>Documents</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={COLUMNS.length + 3}><div className="empty-state"><div className="empty-state-icon">📄</div><p className="empty-state-text">No applications found.</p></div></td></tr>
                ) : filtered.map((row, idx) => (
                  <tr key={row.id}>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>{idx + 1}</td>

                    {COLUMNS.map((col) => (
                      <td key={col}>
                        {col === "status" ? <StatusBadge status={row[col]} />
                          : col === "student_name" ? (
                            <div>
                              <span className="cell-name">{row.student_name}</span>
                              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{row.student_email}</p>
                            </div>
                          ) : col === "applied_date" ? <span className="cell-muted">{fmtDate(row[col])}</span>
                          : <span>{row[col] ?? "—"}</span>
                        }
                      </td>
                    ))}

                    {/* Documents */}
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {row.resume_path && <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", background: "#f0fdf4", color: "#15803d", borderRadius: "2px", fontSize: "11.5px", fontWeight: "600" }}>Resume</span>}
                        {row.cover_letter_path && <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", background: "#f0f9ff", color: "#0369a1", borderRadius: "2px", fontSize: "11.5px", fontWeight: "600" }}>Cover Letter</span>}
                        {!row.resume_path && !row.cover_letter_path && <span style={{ fontSize: "12px", color: "#94a3b8" }}>—</span>}
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="ut-action-btn-wrap">
                        {/* View */}
                        <button
                          title="View"
                          className="ut-action-btn ut-action-btn-detail"
                          onClick={() => setViewRow(row)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ flexShrink: 0, display: "block" }}>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" fill="none" stroke="white" />
                          </svg>
                          View
                        </button>

                        {/* Update status — only for partner-actionable statuses */}
                        {canEdit(row.status) && (
                          <button
                            title="Update Status"
                            className="ut-action-btn ut-action-btn-edit"
                            onClick={() => setEditRow(row)}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              style={{ flexShrink: 0, display: "block" }}>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                          </button>
                        )}

                        {/* Approve withdraw — only for withdraw_requested */}
                        {row.status?.toLowerCase() === "withdrawn_requested" && (
                          <button
                            title="Approve Withdrawal"
                            className="ut-action-btn ut-action-btn-approve"
                            onClick={() => setWithdrawRow(row)}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              style={{ flexShrink: 0, display: "block" }}>
                              <path d="M9 12l2 2 4-4 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                            </svg>
                            Approve
                          </button>
                        )}
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