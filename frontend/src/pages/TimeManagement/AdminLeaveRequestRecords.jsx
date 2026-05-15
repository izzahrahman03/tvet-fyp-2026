// pages/admin/AdminLeaveRequestsRecords.jsx
import { useState, useEffect, useCallback } from "react";
import { adminFetchAllLeaveRequests } from "../api/timeApi";
import useToast from "../userManagement/userTable/useToast";
import ExportModal from "../userManagement/userTable/ExportModal";
import "../../css/userManagement/userTable.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Add this near the top with your other constants
const LEAVE_TYPE_STYLE = {
  annual:  { bg: "#eff6ff", color: "#1d4ed8" },
  medical: { bg: "#f0fdf4", color: "#15803d" },
  unpaid:  { bg: "#fef9c3", color: "#854d0e" },
};

const LEAVE_TYPES = [
  { value: "annual",  label: "Annual Leave" },
  { value: "medical", label: "Medical Leave" },
  { value: "unpaid",  label: "Unpaid Leave" },
];
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

const SortIcon = ({ active, dir }) =>
  active ? (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2.5">
      <path d={dir === "asc" ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
    </svg>
  ) : (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
      <path d="M3 6h18 M7 12h10 M10 18h4" />
    </svg>
  );


// ── View Leave Request Modal ──────────────────────────────
function ViewLeaveModal({ row, onClose }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(
        `${API}/admin/leave-requests/${row.leave_id}/document`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!res.ok) { alert("File not found."); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `leave_document_${row.student_name}_${row.leave_id}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Failed to download file."); }
    finally { setDownloading(false); }
  };

  const Field = ({ label, value }) => (
    <div className="form-field" style={{ margin: 0 }}>
      <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: "2px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#1e293b", marginTop: "4px" }}>
        {value ?? "—"}
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "540px" }}>
        <div className="modal-header">
          <p className="modal-title">Leave Request Details</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-form">

          {/* Student */}
          <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Student</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Name"         value={row.student_name} />
            <Field label="Email"        value={row.student_email} />
            <Field label="Matric No."   value={row.matric_number} />
            <Field label="Supervisor"   value={row.supervisor_name} />
          </div>

          {/* Leave Info */}
          <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0", marginTop: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Leave Details</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Leave Type"   value={LEAVE_LABEL[row.leave_type] || row.leave_type} />
            <Field label="Duration"     value={row.duration_type === "half_day" ? "Half Day" : "Full Day"} />
            <Field label="Date(s)"      value={row.duration_type === "half_day" ? fmtDate(row.start_date) : `${fmtDate(row.start_date)} – ${fmtDate(row.end_date)}`} />
            {row.session && <Field label="Session" value={row.session} />}
          </div>
          <Field label="Reason" value={row.reason} />

          {/* Status */}
          <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0", marginTop: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Status</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field" style={{ margin: 0 }}>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</label>
              <div style={{ marginTop: "6px" }}><StatusBadge status={row.status} /></div>
            </div>
            {row.supervisor_remarks && <Field label="Supervisor Remarks" value={row.supervisor_remarks} />}
          </div>

          {/* Document */}
          <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0", marginTop: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Document</span>
          </div>
          <div>
            {row.document_path ? (
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", background: downloading ? "#e2e8f0" : "#1b3a6b", color: downloading ? "#94a3b8" : "white", border: "none", borderRadius: "2px", fontSize: "13px", fontWeight: "700", cursor: downloading ? "not-allowed" : "pointer" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                {downloading ? "Downloading…" : "Download Document"}
              </button>
            ) : (
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>No document uploaded.</span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function AdminLeaveRequestsRecords() {
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [intakes,      setIntakes]      = useState([]);
  const [intakeFilter, setIntakeFilter] = useState("all");
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [durFilter,  setDurFilter]  = useState("all");
  const [sortKey,    setSortKey]    = useState("created_at");
  const [sortDir,    setSortDir]    = useState("desc");
  const [viewRow, setViewRow] = useState(null);
  const [showExport,   setShowExport]   = useState(false);
  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setRequests(await adminFetchAllLeaveRequests()); }
    catch { show("Failed to load leave requests.", "error"); }
    finally { setLoading(false); }
  }, [show]);

  useEffect(() => {
    fetch(`${API}/intakes`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then((d) => setIntakes(d.intakes ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = requests
    .filter((r) => {
      const statusMatch = filter === "all"    || r.status      === filter;
      const typeMatch   = typeFilter === "all" || r.leave_type  === typeFilter;
      const durMatch    = durFilter === "all"  || r.duration_type === durFilter;
            const intakeMatch = intakeFilter === "all" || String(r.intake_id) === String(intakeFilter);
      const q = search.toLowerCase();
      const searchMatch = !q || [
        r.student_name, r.matric_number, r.supervisor_name, r.leave_type, r.status, r.reason,
        fmtDate(r.start_date),
      ].some((v) => String(v ?? "").toLowerCase().includes(q));
      return statusMatch && typeMatch && durMatch && searchMatch && intakeMatch;
    })
    .sort((a, b) => {
      const va = String(a[sortKey] ?? "").toLowerCase();
      const vb = String(b[sortKey] ?? "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const total         = requests.length;
  const pending       = requests.filter((r) => r.status === "pending").length;
  const approved      = requests.filter((r) => r.status === "approved").length;
  const rejected      = requests.filter((r) => r.status === "rejected").length;
  const uniqueStudents = new Set(requests.map((r) => r.student_id)).size;
  const halfDays      = requests.filter((r) => r.duration_type === "half_day").length;

  const COLS = [
    { key: "student_name",    label: "Student" },
    { key: "matric_number",   label: "Matric No." },
    { key: "leave_type",      label: "Leave Type" },
    { key: "duration_type",   label: "Duration" },
    { key: "start_date",      label: "Date(s)" },
    { key: "session",         label: "Session" },
    { key: "reason",          label: "Reason" },
    { key: "document_path",   label: "Document" },
    { key: "supervisor_name", label: "Supervisor" },
    { key: "status",          label: "Status" },
    { key: "supervisor_remarks", label: "Remarks" },
  ];

  const EXPORT_COLUMNS = [
    "student_name", "student_email", "matric_number",
    "leave_type", "duration_type", "start_date", "end_date",
    "session", "reason", "supervisor_name", "status", "supervisor_remarks",
  ];


  return (
    <div style={{ padding: "28px 32px" }}>
      {toast && <div className={`ut-toast ${toast.kind}`}>{toast.msg}</div>}
      {showExport && (
        <ExportModal
          rows={filtered}
          selected={new Set()}
          columns={EXPORT_COLUMNS}
          type="leave_requests"
          onClose={() => setShowExport(false)}
        />
      )}
      {viewRow && <ViewLeaveModal row={viewRow} onClose={() => setViewRow(null)} />}

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Leave Requests Records</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 0 }}>
          Monitor all student leave requests submitted across all supervisors.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Requests", value: total,          color: "#1b3a6b" },
          { label: "Students",       value: uniqueStudents, color: "#7c3aed" },
          { label: "Half Day",       value: halfDays,       color: "#be123c" },
          { label: "Pending",        value: pending,        color: "#64748b" },
          { label: "Approved",       value: approved,       color: "#d97706" },
          { label: "Rejected",       value: rejected,       color: "#0ea5e9" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ 
            background: "white", border: "1px solid #c8d5e8", borderRadius: 2, padding: "16px 20px", borderTop: `3px solid ${color}`
          }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color: color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-toolbar" style={{ flexDirection: "column", alignItems: "stretch", gap: "8px" }}>
          {/* Row 1 */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "600", color: "#64748b", whiteSpace: "nowrap", width: "110px", flexShrink: 0 }}>Filter by Intake</label>
            <select className="ut-table-filter-select" style={{ flex: 1 }} value={intakeFilter} onChange={(e) => setIntakeFilter(e.target.value)}>
              <option value="all">All Intakes</option>
              {intakes.map((i) => <option key={i.intake_id} value={i.intake_id}>{i.intake_name}</option>)}
            </select>
          </div>
          {/* Row 2 */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "600", color: "#64748b", whiteSpace: "nowrap", width: "110px", flexShrink: 0 }}>Search</label>
            <div className="ut-table-search-wrap" style={{ flex: 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
              <input className="ut-table-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, matric, supervisor, reason…" />
              {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>×</button>}
            </div>
            <select className="ut-table-filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select className="ut-table-filter-select" value={durFilter} onChange={(e) => setDurFilter(e.target.value)}>
              <option value="all">All Durations</option>
              <option value="full_day">Full Day</option>
              <option value="half_day">Half Day</option>
            </select>
            <select className="ut-table-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="ut-btn-secondary" onClick={() => setShowExport(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12" /></svg>
              Export
            </button>
          </div>
        </div>

        <p className="table-count">
          Showing <strong>{filtered.length}</strong> of {requests.length} request{requests.length !== 1 ? "s" : ""}
        </p>

        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /><p className="loading-text">Loading…</p></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 48, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>#</th>
                  {COLS.map((col) => (
                    <th key={col.key} onClick={() => handleSort(col.key)} style={{ cursor: "pointer", userSelect: "none" }}>
                      <span className="th-inner">
                        {col.label}
                        <SortIcon active={sortKey === col.key} dir={sortDir} />
                      </span>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={COLS.length + 2}>
                    <div className="empty-state">
                      <p className="empty-state-text">{requests.length === 0 ? "No leave requests found." : "No results match your search."}</p>
                    </div>
                  </td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.leave_id}>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>{i + 1}</td>

                    {/* Student */}
                    <td>
                      <span className="cell-name">{r.student_name || "—"}</span>
                      <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{r.student_email || ""}</p>
                    </td>

                    {/* Matric No. */}
                    <td>
                      <span style={{ fontSize: 13, fontFamily: "monospace", color: "#374151" }}>{r.matric_number || "—"}</span>
                    </td>

                    {/* Leave Type */}
                    <td>
                      {(() => {
                        const s = LEAVE_TYPE_STYLE[r.leave_type] ?? { bg: "#f1f5f9", color: "#475569" };
                        return (
                          <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", background: s.bg, color: s.color, borderRadius: 2,  whiteSpace: "nowrap"}}>
                            {LEAVE_LABEL[r.leave_type] || r.leave_type}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Duration */}
                    <td>
                      <span style={{ fontSize: 12, padding: "2px 8px", background: r.duration_type === "half_day" ? "#fef9c3" : "#eff6ff", color: r.duration_type === "half_day" ? "#854d0e" : "#1d4ed8", borderRadius: 2, fontWeight: 600 }}>
                        {r.duration_type === "half_day" ? "Half Day" : "Full Day"}
                      </span>
                    </td>

                    {/* Date(s) */}
                    <td>
                      <span style={{ fontSize: 13 }}>
                        {r.duration_type === "half_day"
                          ? fmtDate(r.start_date)
                          : `${fmtDate(r.start_date)} – ${fmtDate(r.end_date)}`}
                      </span>
                    </td>

                    {/* Session */}
                    <td>
                      {r.session
                        ? <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", background: "#f0fdf4", color: "#15803d", borderRadius: 2 }}>{r.session}</span>
                        : <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>}
                    </td>

                    {/* Reason */}
                    <td style={{ maxWidth: 200 }}><span style={{ fontSize: 13, color: "#475569" }}>{r.reason || "—"}</span></td>

                    {/* Document */}
                    <td>
                      {r.document_path
                        ? <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", background: "#f0f9ff", color: "#0369a1", borderRadius: 2 }}>Uploaded</span>
                        : <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>}
                    </td>

                    {/* Supervisor */}
                    <td><span style={{ fontSize: 13, color: "#475569" }}>{r.supervisor_name || "—"}</span></td>

                    {/* Status */}
                    <td><StatusBadge status={r.status} /></td>

                    {/* Remarks */}
                    <td style={{ maxWidth: 180 }}><span style={{ fontSize: 13, color: "#475569" }}>{r.supervisor_remarks || "—"}</span></td>

                    {/* Actions */}
                    <td>
                      <div className="ut-action-btn-wrap">
                        <button
                          className="ut-action-btn ut-action-btn-detail"
                          onClick={() => setViewRow(r)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ flexShrink: 0, display: "block" }}>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" fill="none" stroke="white" />
                          </svg>
                          View
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