import { useState, useEffect, useCallback } from "react";
import useToast from "../userManagement/userTable/useToast";
import "../../css/userManagement/userTable.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

// ── Intern Status Badge ───────────────────────────────────
const INTERN_STATUS_STYLES = {
  active:     { background: "#f0fdf4", color: "#15803d" },
  inactive:   { background: "#fefce8", color: "#a16207" },
  terminated: { background: "#fff1f2", color: "#be123c" },
};

function InternStatusBadge({ status }) {
  if (!status) return <span style={{ fontSize: "12px", color: "#cbd5e1" }}>—</span>;
  const style = INTERN_STATUS_STYLES[status.toLowerCase()] ?? {
    background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0",
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "2px", fontSize: "12px", fontWeight: "700",
      letterSpacing: "0.03em", textTransform: "capitalize", ...style,
    }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}


// ── Update Intern Status Modal ────────────────────────────
const TRANSITIONS = {
  active:   ["inactive", "terminated"],
  inactive: ["active",   "terminated"],
};

const STATUS_DESCRIPTIONS = {
  active:     "Student is currently completing their internship.",
  inactive:   "Student is temporarily not attending (e.g. medical leave).",
  terminated: "Internship has been ended before the scheduled completion.",
};

function UpdateInternStatusModal({ row, onClose, onSave }) {
  const [status,  setStatus]  = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const current     = row.intern_status?.toLowerCase();
  const allowed     = TRANSITIONS[current] ?? [];
  const isTerminate = status === "terminated";

  const handleSave = async () => {
    setError("");
    if (!status) return setError("Please select a new status.");
    if (isTerminate && !remarks.trim()) return setError("Please provide a reason for termination.");

    setSaving(true);
    try {
      const res = await fetch(`${API}/partner/interns/${row.id}/status`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ intern_status: status, remarks: remarks.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status.");
      onSave({ ...row, intern_status: status });
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
          <p className="modal-title">Update Intern Status</p>
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
              Position: <strong style={{ color: "#1b3a6b" }}>{row.position_name}</strong>
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12.5px", color: "#64748b" }}>Current status:</span>
            <InternStatusBadge status={row.intern_status} />
          </div>

          {allowed.length === 0 ? (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", padding: "12px 14px", fontSize: "13px", color: "#b91c1c" }}>
              This intern's status is <strong>Terminated</strong> and cannot be changed.
            </div>
          ) : (
            <>
              <div className="form-field">
                <label>New Status</label>
                <select className="form-input" value={status}
                  onChange={(e) => { setStatus(e.target.value); setError(""); setRemarks(""); }}>
                  <option value="" disabled>Select new status…</option>
                  {allowed.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                      {s === "inactive"   ? " — Temporarily away"  : ""}
                      {s === "active"     ? " — Resume internship" : ""}
                      {s === "terminated" ? " — End internship"    : ""}
                    </option>
                  ))}
                </select>
              </div>

              {status && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "10px 14px", fontSize: "13px", color: "#475569" }}>
                  {STATUS_DESCRIPTIONS[status]}
                </div>
              )}

              {isTerminate && (
                <>
                  <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #fecaca", marginTop: "4px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "800", color: "#be123c", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Termination Details
                    </span>
                  </div>
                  <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "4px", padding: "10px 14px", fontSize: "13px", color: "#be123c", display: "flex", gap: "8px" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#be123c" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
                      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4 M12 8h.01" />
                    </svg>
                    <span>This action is <strong>irreversible</strong>. The student will be notified via email.</span>
                  </div>
                  <div className="form-field">
                    <label>Reason for Termination <span style={{ color: "#ef4444" }}>*</span></label>
                    <textarea className="form-input" rows={3}
                      placeholder="Briefly state the reason for termination…"
                      value={remarks} onChange={(e) => setRemarks(e.target.value)}
                      style={{ resize: "vertical", minHeight: "72px" }} />
                  </div>
                </>
              )}

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", padding: "10px 14px", fontSize: "13px", color: "#b91c1c" }}>
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="ut-btn-secondary" onClick={onClose}>Cancel</button>
          {allowed.length > 0 && (
            <button
              className={isTerminate ? undefined : "ut-btn-primary"}
              onClick={handleSave}
              disabled={saving || !status}
              style={isTerminate ? {
                padding: "9px 20px", background: saving || !status ? "#e2e8f0" : "#be123c",
                color: saving || !status ? "#94a3b8" : "white", border: "none", borderRadius: "2px",
                fontSize: "13px", fontWeight: "700", cursor: saving || !status ? "not-allowed" : "pointer",
                opacity: saving || !status ? 0.65 : 1,
              } : { opacity: saving || !status ? 0.65 : 1 }}
            >
              {saving ? "Saving…" : isTerminate ? "Terminate Internship" : "Update Status"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// ── View Intern Modal ─────────────────────────────────────
function ViewInternModal({ row, onClose }) {
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
          <p className="modal-title">Intern Details</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-form">
          <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Student</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Name"  value={row.student_name} />
            <Field label="Email" value={row.student_email} />
          </div>

          <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0", marginTop: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Internship</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Position"      value={row.position_name} />
            <Field label="Intake"        value={row.intake_name} />
            <Field label="Applied Date"  value={fmtDate(row.applied_date)} />
            <Field label="Accepted Date" value={fmtDate(row.accepted_date)} />
          </div>

          <div className="form-field" style={{ margin: 0 }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Intern Status</label>
            <div style={{ marginTop: "6px" }}><InternStatusBadge status={row.intern_status} /></div>
          </div>

          {row.intern_remarks && (
            <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "4px", padding: "10px 14px", fontSize: "13px", color: "#7f1d1d" }}>
              <span style={{ display: "block", fontSize: "10px", fontWeight: "800", color: "#be123c", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Termination Reason</span>
              {row.intern_remarks}
            </div>
          )}

          <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0", marginTop: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Assigned Supervisor</span>
          </div>
          {row.supervisor_name ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field label="Name"     value={row.supervisor_name} />
              <Field label="Position" value={row.supervisor_position} />
              <Field label="Email"    value={row.supervisor_email} />
              <Field label="Phone"    value={row.supervisor_phone} />
            </div>
          ) : (
            <div style={{ padding: "10px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "4px", fontSize: "13px", color: "#92400e" }}>
              No supervisor assigned yet.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="ut-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}


// ── Table config ──────────────────────────────────────────
const COLUMNS   = ["student_name", "position_name", "intake_name", "intern_status", "applied_date"];
const COL_LABEL = {
  student_name:  "Intern",
  position_name: "Position",
  intake_name:   "Intake",
  intern_status: "Status",
  applied_date:  "Applied Date",
};
const ALL_INTERN_STATUSES = ["All", "active", "inactive", "terminated"];

// ── Main Component ────────────────────────────────────────
export default function PartnerInternsTable() {
  const [rows,         setRows]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [sortKey,      setSortKey]      = useState("applied_date");
  const [sortDir,      setSortDir]      = useState("desc");
  const [statusFilter, setStatusFilter] = useState("All");
  const [intakeFilter, setIntakeFilter] = useState("all");
  const [intakes,      setIntakes]      = useState([]);
  const [viewRow,      setViewRow]      = useState(null);
  const [editRow,      setEditRow]      = useState(null);

  // ── Supervisor state ──────────────────────────────────────
  const [supervisors,      setSupervisors]      = useState([]);
  const [inlineSupMap,     setInlineSupMap]     = useState({});
  const [inlineSaving,     setInlineSaving]     = useState(new Set());

  // ── Bulk-select state (non-terminated rows only) ──────────
  const [selectedIds,      setSelectedIds]      = useState(new Set());
  const [bulkSupervisorId, setBulkSupervisorId] = useState("");
  const [bulkSaving,       setBulkSaving]       = useState(false);

  const { toast, show } = useToast();

  // Fetch interns
  useEffect(() => {
    setLoading(true);
    fetch(`${API}/partner/interns`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const interns = data.interns ?? [];
        setRows(interns);
        const seed = {};
        interns.forEach((r) => { if (r.supervisor_id) seed[r.id] = String(r.supervisor_id); });
        setInlineSupMap(seed);
      })
      .catch(() => show("Failed to load interns.", "error"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch supervisors
  useEffect(() => {
    fetch(`${API}/partner/supervisors`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then((data) => setSupervisors(data.supervisors ?? []))
      .catch(() => {});
  }, []);

  // Fetch intakes
  useEffect(() => {
    fetch(`${API}/intakes`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then((d) => setIntakes(d.intakes ?? []))
      .catch(() => {});
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = rows
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        (statusFilter === "All" || r.intern_status?.toLowerCase() === statusFilter) &&
        (intakeFilter === "all" || String(r.intake_id) === String(intakeFilter)) &&
        [r.student_name, r.student_email, r.position_name].some(
          (v) => String(v ?? "").toLowerCase().includes(q)
        )
      );
    })
    .sort((a, b) => {
      const va = String(a[sortKey] ?? "").toLowerCase();
      const vb = String(b[sortKey] ?? "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  // Non-terminated rows visible in current filtered view — eligible for bulk select
  const filteredAssignableIds = filtered
    .filter((r) => r.intern_status?.toLowerCase() === "active")
    .map((r) => r.id);
  const allAssignableSelected =
    filteredAssignableIds.length > 0 && filteredAssignableIds.every((id) => selectedIds.has(id));

  const handleSaveStatus = (updated) => {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    show(`Intern status updated to "${updated.intern_status}".`);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allAssignableSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredAssignableIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredAssignableIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  // ── Inline assign (single row) ────────────────────────────
  const handleInlineAssign = useCallback(async (internId) => {
    const supervisorId = inlineSupMap[internId];
    if (!supervisorId) return;

    setInlineSaving((prev) => new Set(prev).add(internId));
    try {
      const res = await fetch(
        `${API}/partner/internship-applications/${internId}/assign-supervisor`,
        {
          method:  "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body:    JSON.stringify({ supervisor_id: supervisorId }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign.");

      const chosen = supervisors.find((s) => String(s.supervisor_id) === String(supervisorId));
      setRows((prev) =>
        prev.map((r) =>
          r.id === internId
            ? {
                ...r,
                supervisor_id:       supervisorId,
                supervisor_name:     chosen?.supervisor_name ?? "",
                supervisor_position: chosen?.position ?? "",
                supervisor_email:    chosen?.supervisor_email ?? "",
                supervisor_phone:    chosen?.phone ?? "",
              }
            : r
        )
      );
      show(`Supervisor assigned to ${rows.find((r) => r.id === internId)?.student_name ?? "intern"}.`);
    } catch (err) {
      show(err.message || "Failed to assign supervisor.", "error");
    } finally {
      setInlineSaving((prev) => { const next = new Set(prev); next.delete(internId); return next; });
    }
  }, [inlineSupMap, supervisors, rows, show]);

  // ── Bulk assign ───────────────────────────────────────────
  const handleBulkAssign = async () => {
    if (!bulkSupervisorId || selectedIds.size === 0) return;
    setBulkSaving(true);
    try {
      const res = await fetch(
        `${API}/partner/internship-applications/bulk-assign-supervisor`,
        {
          method:  "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body:    JSON.stringify({
            application_ids: Array.from(selectedIds),
            supervisor_id:   bulkSupervisorId,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to bulk assign.");

      const chosen = supervisors.find((s) => String(s.supervisor_id) === String(bulkSupervisorId));
      setRows((prev) =>
        prev.map((r) =>
          selectedIds.has(r.id) && r.intern_status?.toLowerCase() !== "active"
            ? {
                ...r,
                supervisor_id:       bulkSupervisorId,
                supervisor_name:     chosen?.supervisor_name ?? "",
                supervisor_position: chosen?.position ?? "",
                supervisor_email:    chosen?.supervisor_email ?? "",
                supervisor_phone:    chosen?.phone ?? "",
              }
            : r
        )
      );
      setInlineSupMap((prev) => {
        const next = { ...prev };
        selectedIds.forEach((id) => { next[id] = String(bulkSupervisorId); });
        return next;
      });
      setSelectedIds(new Set());
      setBulkSupervisorId("");
      show(`${data.affected} intern(s) assigned to ${chosen?.supervisor_name ?? "supervisor"}.`);
    } catch (err) {
      show(err.message || "Failed to bulk assign.", "error");
    } finally {
      setBulkSaving(false);
    }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col)
      return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><path d="M3 6h18 M7 12h10 M10 18h4" /></svg>;
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2.5">
        <path d={sortDir === "asc" ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
      </svg>
    );
  };

  const counts = rows.reduce((acc, r) => {
    const s = r.intern_status?.toLowerCase() ?? "unknown";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

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

      {viewRow && <ViewInternModal        row={viewRow} onClose={() => setViewRow(null)} />}
      {editRow && <UpdateInternStatusModal row={editRow} onClose={() => setEditRow(null)} onSave={handleSaveStatus} />}


      {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
            { key: "active",     label: "Active",     color: "#1b3a6b" },
            { key: "inactive",   label: "Inactive",   color: "#7c3aed" },
            { key: "terminated", label: "Terminated", color: "#be123c" },
        ].map(({ key, label, color }) => (
            <div key={key} style={{ background: "white", border: "1px solid #c8d5e8", borderRadius: 2, padding: "16px 20px", borderTop: `3px solid ${color}` }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color }}>{counts[key] ?? 0}</p>
            </div>
        ))}
        </div>

      <div className="table-wrapper">
        {/* Toolbar */}
        <div className="table-toolbar" style={{ flexDirection: "column", alignItems: "stretch", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "600", color: "#64748b", whiteSpace: "nowrap", width: "110px", flexShrink: 0 }}>
              Filter by Intake
            </label>
            <select className="ut-table-filter-select" style={{ flex: 1 }} value={intakeFilter}
              onChange={(e) => setIntakeFilter(e.target.value)}>
              <option value="all">All Intakes</option>
              {intakes.map((i) => (
                <option key={i.intake_id} value={i.intake_id}>{i.intake_name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "600", color: "#64748b", whiteSpace: "nowrap", width: "110px", flexShrink: 0 }}>
              Search
            </label>
            <div className="ut-table-search-wrap" style={{ flex: 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input className="ut-table-search-input" placeholder="Search intern name, position…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 0 }}>×</button>
              )}
            </div>
            <select className="ut-table-filter-select" value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}>
              {ALL_INTERN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Assign Bar */}
        {selectedIds.size > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
            background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "4px",
            padding: "10px 14px", marginBottom: "8px",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#1d4ed8" }}>
              {selectedIds.size} intern{selectedIds.size > 1 ? "s" : ""} selected
            </span>
            <select
              style={{ flex: 1, minWidth: "200px", padding: "7px 10px", border: "1.5px solid #93c5fd", borderRadius: "2px", fontSize: "13px", color: "#1e293b", background: "white" }}
              value={bulkSupervisorId}
              onChange={(e) => setBulkSupervisorId(e.target.value)}
            >
              <option value="" disabled>Assign supervisor to all selected…</option>
              {supervisors.map((s) => (
                <option key={s.supervisor_id} value={s.supervisor_id}>
                  {s.supervisor_name} — {s.position}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkAssign}
              disabled={bulkSaving || !bulkSupervisorId}
              style={{
                padding: "7px 16px",
                background: bulkSaving || !bulkSupervisorId ? "#e2e8f0" : "#1b3a6b",
                color:      bulkSaving || !bulkSupervisorId ? "#94a3b8" : "white",
                border: "none", borderRadius: "2px", fontSize: "13px", fontWeight: "700",
                cursor: bulkSaving || !bulkSupervisorId ? "not-allowed" : "pointer", whiteSpace: "nowrap",
              }}
            >
              {bulkSaving ? "Assigning…" : "Assign to All"}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{ padding: "7px 12px", background: "white", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "2px", fontSize: "12px", cursor: "pointer" }}
            >
              Clear
            </button>
          </div>
        )}

        <p className="table-count">{filtered.length} intern{filtered.length !== 1 ? "s" : ""}</p>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Loading interns…</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "36px", textAlign: "center" }}>
                    {filteredAssignableIds.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allAssignableSelected}
                        onChange={toggleSelectAll}
                        title="Select all non-terminated"
                        style={{ cursor: "pointer" }}
                      />
                    )}
                  </th>
                  <th style={{ width: "40px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>#</th>
                  {COLUMNS.map((col) => (
                    <th key={col} onClick={() => handleSort(col)}>
                      <span className="th-inner">{COL_LABEL[col]}<SortIcon col={col} /></span>
                    </th>
                  ))}
                  <th>Supervisor</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length + 4}>
                      <div className="empty-state">
                        <p className="empty-state-text">No interns found.</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((row, idx) => {
                  const isActive     = row.intern_status?.toLowerCase() === "active";
                  const isTerminated = row.intern_status?.toLowerCase() === "terminated";
                  const isChecked    = selectedIds.has(row.id);
                  const isSaving     = inlineSaving.has(row.id);

                  return (
                    <tr key={row.id} style={{ opacity: isTerminated ? 0.7 : 1, background: isChecked ? "#eff6ff" : undefined }}>

                      {/* Checkbox — non-terminated only */}
                      <td style={{ textAlign: "center" }}>
                        {isActive ? (
                          <input type="checkbox" checked={isChecked}
                            onChange={() => toggleSelect(row.id)} style={{ cursor: "pointer" }} />
                        ) : null}
                      </td>

                      <td style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>{idx + 1}</td>

                      {COLUMNS.map((col) => (
                        <td key={col}>
                          {col === "intern_status" ? (
                            <InternStatusBadge status={row[col]} />
                          ) : col === "student_name" ? (
                            <div>
                              <span className="cell-name">{row.student_name}</span>
                              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{row.student_email}</p>
                            </div>
                          ) : col === "applied_date" ? (
                            <span className="cell-muted">{fmtDate(row[col])}</span>
                          ) : (
                            <span>{row[col] ?? "—"}</span>
                          )}
                        </td>
                      ))}

                      {/* Supervisor column */}
                      <td style={{ minWidth: "220px" }}>
                        {isActive ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <select
                              style={{
                                flex: 1, padding: "5px 8px", fontSize: "12.5px",
                                border: "1.5px solid #e2e8f0", borderRadius: "2px",
                                color: "#1e293b", background: "white",
                              }}
                              value={inlineSupMap[row.id] ?? ""}
                              onChange={(e) =>
                                setInlineSupMap((prev) => ({ ...prev, [row.id]: e.target.value }))
                              }
                              disabled={isSaving}
                            >
                              <option value="" disabled>
                                {row.supervisor_name ? row.supervisor_name : "Select supervisor…"}
                              </option>
                              {supervisors.map((s) => (
                                <option key={s.supervisor_id} value={s.supervisor_id}>
                                  {s.supervisor_name} — {s.position}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleInlineAssign(row.id)}
                              disabled={isSaving || !inlineSupMap[row.id]}
                              title="Assign supervisor"
                              style={{
                                flexShrink: 0, padding: "5px 10px",
                                background: isSaving || !inlineSupMap[row.id] ? "#e2e8f0" : "#1b3a6b",
                                color:      isSaving || !inlineSupMap[row.id] ? "#94a3b8" : "white",
                                border: "none", borderRadius: "2px", fontSize: "12px", fontWeight: "700",
                                cursor: isSaving || !inlineSupMap[row.id] ? "not-allowed" : "pointer",
                              }}
                            >
                              {isSaving ? "…" : row.supervisor_name ? "Re-assign" : "Assign"}
                            </button>
                          </div>
                        ) : (
                          // Terminated: show supervisor name as read-only
                          row.supervisor_name ? (
                            <div>
                              <span style={{ fontSize: "13px", color: "#94a3b8" }}>{row.supervisor_name}</span>
                              <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1" }}>{row.supervisor_position}</p>
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#cbd5e1" }}>—</span>
                          )
                        )}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="ut-action-btn-wrap">
                          <button title="View" className="ut-action-btn ut-action-btn-detail" onClick={() => setViewRow(row)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              style={{ flexShrink: 0, display: "block" }}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" fill="none" stroke="white" />
                            </svg>
                            View
                          </button>

                          <button
                            title={isTerminated ? "Cannot change status of a terminated intern" : "Update Status"}
                            className="ut-action-btn ut-action-btn-edit"
                            onClick={() => !isTerminated && setEditRow(row)}
                            disabled={isTerminated}
                            style={{ opacity: isTerminated ? 0.35 : 1, cursor: isTerminated ? "not-allowed" : "pointer" }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              style={{ flexShrink: 0, display: "block" }}>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}