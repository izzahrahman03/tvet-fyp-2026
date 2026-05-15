// pages/internshipManagement/AdminTerminationPage.jsx
import { useState, useEffect } from "react";
import StatusBadge from "../userManagement/userTable/StatusBadge";
import useToast    from "../userManagement/userTable/useToast";
import ExportModal from "../userManagement/userTable/ExportModal";
import "../../css/userManagement/userTable.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Status badge for termination status ───────────────────
function TermBadge({ status }) {
  const cfg = {
    pending:  { bg: "#fffbeb", color: "#b45309",  label: "Pending" },
    approved: { bg: "#f0fdf4", color: "#15803d",  label: "Approved" },
    rejected: { bg: "#fef2f2", color: "#b91c1c",  label: "Rejected" },
  }[status] ?? { bg: "#f8fafc", color: "#94a3b8", label: status };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 9px",
      borderRadius: "2px", fontSize: "12px", fontWeight: "700",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}


// ── Detail + Process Modal ─────────────────────────────────
function ReviewModal({ row, onClose, onProcessed }) {
  const [decision,      setDecision]      = useState("");
  const [adminRemarks,  setAdminRemarks]  = useState("");
  const [processing,    setProcessing]    = useState(false);
  const [error,         setError]         = useState("");

  const isPending = row.status === "pending";

  const handleProcess = async () => {
    setError("");
    if (!decision) return setError("Please select a decision.");

    setProcessing(true);
    try {
      const res = await fetch(`${API}/admin/internship/termination-requests/${row.termination_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ decision, admin_remarks: adminRemarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to process.");
      onProcessed(row.termination_id, decision, adminRemarks);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const Field = ({ label, value }) => (
    <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "8px 0" }}>
      <span style={{ fontSize: "13px", color: "#64748b", minWidth: "170px", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{value ?? "—"}</span>
    </div>
  );

  const SectionLabel = ({ title, top }) => (
    <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0", marginTop: top ?? "14px" }}>
      <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {title}
      </span>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "600px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

        <div className="modal-header" style={{ flexShrink: 0 }}>
          <p className="modal-title">Termination Request Details</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-form" style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>

          {/* Student */}
          <SectionLabel title="Student" top="0" />
          <Field label="Name"          value={row.student_name} />
          <Field label="Email"         value={row.student_email} />
          <Field label="Matric Number" value={row.matric_number} />

          {/* Internship */}
          <SectionLabel title="Internship" />
          <Field label="Company"  value={row.company_name} />
          <Field label="Position" value={row.position_name} />
          <Field label="Period"   value={`${fmtDate(row.start_date)} – ${fmtDate(row.end_date)}`} />

          {/* Supervisor */}
          <SectionLabel title="Submitted by (Supervisor)" />
          <Field label="Name"     value={row.supervisor_name} />
          <Field label="Email"    value={row.supervisor_email} />
          <Field label="Position" value={row.supervisor_position} />
          <Field label="Phone"    value={row.supervisor_phone} />

          {/* Termination request */}
          <SectionLabel title="Termination Request" />
          <Field label="Status"           value={<TermBadge status={row.status} />} />
          <Field label="Reason"           value={row.reason} />
          <Field label="Last Working Date"value={fmtDate(row.last_working_date)} />
          <Field label="Date Submitted"   value={fmtDate(row.created_at)} />

          <div style={{ marginTop: "8px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Details</p>
            <div style={{ padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "2px", fontSize: "13px", color: "#374151", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
              {row.details}
            </div>
          </div>

          {/* Existing admin remarks for non-pending */}
          {!isPending && row.admin_remarks && (
            <>
              <SectionLabel title="Admin Remarks" />
              <div style={{ padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "2px", fontSize: "13px", color: "#374151", lineHeight: "1.7" }}>
                {row.admin_remarks}
              </div>
            </>
          )}

          {/* Process section — pending only */}
          {isPending && (
            <>
              <SectionLabel title="Process Request" />

              <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                {[
                  { value: "approved", label: "Approve", bg: "#16a34a", hbg: "#15803d" },
                  { value: "rejected", label: "Reject",  bg: "#b91c1c", hbg: "#991b1b" },
                ].map(({ value, label, bg }) => (
                  <button
                    key={value}
                    onClick={() => { setDecision(value); setError(""); }}
                    style={{
                      flex: 1, padding: "10px 0", border: "none", borderRadius: "2px",
                      fontSize: "13px", fontWeight: "700", cursor: "pointer",
                      background: decision === value ? bg : "#f1f5f9",
                      color: decision === value ? "white" : "#64748b",
                      outline: decision === value ? `2px solid ${bg}` : "none",
                      outlineOffset: "2px",
                      transition: "all 0.15s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {decision === "approved" && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "4px", padding: "10px 14px", fontSize: "12.5px", color: "#15803d", marginBottom: "10px" }}>
                  Approving will mark this student's internship placement as <strong>Terminated</strong>.
                </div>
              )}
              {decision === "rejected" && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", padding: "10px 14px", fontSize: "12.5px", color: "#b91c1c", marginBottom: "10px" }}>
                  Rejecting will keep the student's placement as <strong>Active (Accepted)</strong>.
                </div>
              )}

              <div className="form-field">
                <label>Admin Remarks <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "400" }}>(optional)</span></label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Enter any remarks or comments for the supervisor…"
                  style={{ resize: "vertical" }}
                />
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", padding: "10px 14px", fontSize: "13px", color: "#b91c1c" }}>
                  {error}
                </div>
              )}
            </>
          )}

        </div>

        <div className="modal-footer" style={{ flexShrink: 0, borderTop: "1.5px solid #e2e8f0" }}>
          <button className="ut-btn-secondary" onClick={onClose}>
            {isPending ? "Cancel" : "Close"}
          </button>
          {isPending && (
            <button
              className="ut-btn-primary"
              onClick={handleProcess}
              disabled={processing || !decision}
              style={{
                opacity: processing || !decision ? 0.65 : 1,
                background: decision === "rejected" ? "#b91c1c" : undefined,
              }}
            >
              {processing ? "Processing…" : decision === "approved" ? "Confirm Approval" : decision === "rejected" ? "Confirm Rejection" : "Confirm Decision"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════
const STATUS_FILTERS = [
  { value: "all",      label: "All Requests" },
  { value: "pending",  label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminTerminationPage() {
  const [rows,        setRows]        = useState([]);
  const [intakes,      setIntakes]      = useState([]);
  const [intakeFilter, setIntakeFilter] = useState("all");
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [statusFilter,setStatusFilter]= useState("all");
  const [sortKey,     setSortKey]     = useState("created_at");
  const [sortDir,     setSortDir]     = useState("desc");
  const [viewRow,     setViewRow]     = useState(null);
  const [showExport, setShowExport] = useState(false);
  const { toast, show }               = useToast();

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (intakeFilter !== "all") params.set("intake_id", intakeFilter);
    if (search) params.set("search", search);

    fetch(`${API}/admin/internship/termination-requests?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => setRows(d.terminations ?? []))
      .catch(() => show("Failed to load termination requests.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch(`${API}/intakes`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then((d) => setIntakes(d.intakes ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [statusFilter, intakeFilter]);

  const handleSearch = (e) => { if (e.key === "Enter") load(); };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleProcessed = (id, decision, adminRemarks) => {
    setRows((prev) => prev.map((r) =>
      r.termination_id === id
        ? { ...r, status: decision, admin_remarks: adminRemarks }
        : r
    ));
    show(`Termination request ${decision}.`);
  };

  const sorted = [...rows].sort((a, b) => {
    const va = String(a[sortKey] ?? "").toLowerCase();
    const vb = String(b[sortKey] ?? "").toLowerCase();
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  // Stats
  const pending  = rows.filter((r) => r.status === "pending").length;
  const approved = rows.filter((r) => r.status === "approved").length;
  const rejected = rows.filter((r) => r.status === "rejected").length;

  const SortIcon = ({ col }) =>
    sortKey !== col ? (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
        <path d="M3 6h18 M7 12h10 M10 18h4" />
      </svg>
    ) : (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2.5">
        <path d={sortDir === "asc" ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
      </svg>
    );
  const EXPORT_COLUMNS = [
    "student_name", "student_email", "matric_number",
    "company_name", "position_name",
    "intern_remarks", "intern_status_updated_at",
  ];

  return (
    <div>
      {toast && (
        <div className={`ut-toast ${toast.kind}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={toast.kind === "error" ? "M18 6L6 18M6 6l12 12" : "M20 6L9 17l-5-5"} />
          </svg>
          {toast.msg}
        </div>
      )}

      {viewRow && (
        <ReviewModal
          row={viewRow}
          onClose={() => setViewRow(null)}
          onProcessed={handleProcessed}
        />
      )}

      {showExport && (
        <ExportModal
          rows={sorted}          
          selected={new Set()} 
          columns={EXPORT_COLUMNS}
          type="internship_evaluation"
          onClose={() => setShowExport(false)}
        />
      )}

      {/* ── Summary cards ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Requests", value: rows.length, color: "#1b3a6b" },
          { label: "Pending",        value: pending,     color: "#7c3aed" },
          { label: "Approved",       value: approved,    color: "#be123c" },
          { label: "Rejected",       value: rejected,    color: "#64748b" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
             background: "white", border: "1px solid #c8d5e8", borderRadius: 2, padding: "16px 20px", borderTop: `3px solid ${color}`
          }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="table-wrapper">
        <div className="table-toolbar" style={{ flexDirection: "column", alignItems: "stretch", gap: "8px" }}>

          {/* Row 1 — Intake filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "600", color: "#64748b", whiteSpace: "nowrap", width: "110px", flexShrink: 0 }}>
              Filter by Intake
            </label>
            <select
              className="ut-table-filter-select"
              style={{ flex: 1 }}
              value={intakeFilter}
              onChange={(e) => setIntakeFilter(e.target.value)}
            >
              <option value="all">All Intakes</option>
              {intakes.map((i) => (
                <option key={i.intake_id} value={i.intake_id}>{i.intake_name}</option>
              ))}
            </select>
          </div>

          {/* Row 2 — Search + Status filter + Export */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "600", color: "#64748b", whiteSpace: "nowrap", width: "110px", flexShrink: 0 }}>
              Search
            </label>
            <div className="ut-table-search-wrap" style={{ flex: 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="ut-table-search-input"
                placeholder="Search student, company… (Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearch}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 0 }}>×</button>
              )}
            </div>
            <select
              className="ut-table-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <button className="ut-btn-secondary" onClick={() => setShowExport(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12" />
              </svg>
              Export
            </button>
          </div>

        </div>

        <p className="table-count">
          {loading ? "Loading…" : `${sorted.length} request${sorted.length !== 1 ? "s" : ""}`}
        </p>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Loading termination requests…</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "48px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>#</th>
                  {[
                    { key: "student_name",     label: "Student" },
                    { key: "company_name",     label: "Company / Position" },
                    { key: "supervisor_name",  label: "Supervisor" },
                    { key: "reason",           label: "Reason" },
                    { key: "last_working_date",label: "Last Working Date" },
                    { key: "status",           label: "Status" },
                    { key: "created_at",       label: "Submitted" },
                  ].map(({ key, label }) => (
                    <th key={key} onClick={() => handleSort(key)} style={{ cursor: "pointer" }}>
                      <span className="th-inner">{label}<SortIcon col={key} /></span>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state">
                        <p className="empty-state-text">No termination requests found.</p>
                      </div>
                    </td>
                  </tr>
                ) : sorted.map((row, idx) => (
                  <tr key={row.termination_id}>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>{idx + 1}</td>

                    <td>
                      <span className="cell-name">{row.student_name}</span>
                      <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b" }}>{row.student_email}</p>
                      {row.matric_number && <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>{row.matric_number}</p>}
                    </td>

                    <td>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{row.company_name}</span>
                      <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b" }}>{row.position_name}</p>
                    </td>

                    <td>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1b3a6b" }}>{row.supervisor_name}</span>
                      <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b" }}>{row.supervisor_position}</p>
                    </td>

                    <td>
                      <span style={{ fontSize: "13px", color: "#374151" }}>{row.reason}</span>
                    </td>

                    <td>
                      <span className="cell-muted">{fmtDate(row.last_working_date)}</span>
                    </td>

                    <td><TermBadge status={row.status} /></td>

                    <td>
                      <span className="cell-muted">{fmtDate(row.created_at)}</span>
                    </td>

                    <td>
                      <div className="ut-action-btn-wrap">
                        <button
                          title={row.status === "pending" ? "Review & Process" : "View Details"}
                          className={`ut-action-btn ${row.status === "pending" ? "ut-action-btn-edit" : "ut-action-btn-detail"}`}
                          onClick={() => setViewRow(row)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ flexShrink: 0, display: "block" }}>
                            {row.status === "pending" ? (
                              <>
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </>
                            ) : (
                              <>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" fill="none" stroke="white" />
                              </>
                            )}
                          </svg>
                          {row.status === "pending" ? "Review" : "View"}
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