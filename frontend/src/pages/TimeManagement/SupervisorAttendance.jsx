// pages/supervisor/SupervisorAttendanceVerification.jsx
import { useState, useEffect, useCallback } from "react";
import { fetchSupervisorAttendance, verifyAttendance } from "../api/timeApi";
import useToast from "../userManagement/userTable/useToast";
import "../../css/userManagement/userTable.css";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_STYLE = {
  pending: { bg: "#fffbeb", color: "#92400e" },
  present: { bg: "#dcfce7", color: "#15803d" },
  absent:  { bg: "#fee2e2", color: "#b91c1c" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "2px", fontSize: 11, fontWeight: 700, textTransform: "capitalize", background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

// ── Detail + Verify Modal ─────────────────────────────────
function VerifyModal({ row, onClose, onDone }) {
  const [saving, setSaving] = useState(null);
  const [error,  setError]  = useState("");

  const handle = async (status) => {
    setSaving(status); setError("");
    try {
      await verifyAttendance(row.attendance_id, status);
      onDone(row.attendance_id, status);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status.");
      setSaving(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <p className="modal-title">Verify Attendance</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="modal-form">
          {/* Student info */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2, padding: "12px 14px" }}>
            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{row.student_name}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{row.student_email}</p>
          </div>

          {/* Attendance details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Date",      value: fmtDate(row.attendance_date) },
              { label: "Status",    value: <StatusBadge status={row.status} /> },
              { label: "Clock In",  value: row.clock_in?.slice(0, 5) || "—" },
              { label: "Clock Out", value: row.clock_out?.slice(0, 5) || "Not recorded" },
            ].map(({ label, value }) => (
              <div key={label} className="form-field" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
                <div style={{ padding: "8px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2, fontSize: 13, color: "#1e293b", marginTop: 4 }}>{value}</div>
              </div>
            ))}
          </div>

          {row.remarks && (
            <div className="form-field" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Remarks</label>
              <div style={{ padding: "8px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2, fontSize: 13, color: "#1e293b", marginTop: 4, lineHeight: 1.6 }}>
                {row.remarks}
              </div>
            </div>
          )}

          {/* Pending guidance */}
          {row.status === "pending" && (
            <div style={{ padding: "10px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 2, fontSize: 13, color: "#92400e" }}>
              Mark this student as <strong>Present</strong> if they attended, or <strong>Absent</strong> if they did not.
            </div>
          )}

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 2, padding: "10px 12px", fontSize: 13, color: "#b91c1c" }}>{error}</div>
          )}
        </div>

        <div className="modal-footer">
          {row.status === "pending" && (
            <>
              <button
                onClick={() => handle("absent")} disabled={!!saving}
                style={{ padding: "9px 18px", background: saving === "absent" ? "#e2e8f0" : "#dc2626", color: saving === "absent" ? "#94a3b8" : "#fff", border: "none", borderRadius: 2, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
              >
                {saving === "absent" ? "Marking…" : "Mark Absent"}
              </button>
              <button
                onClick={() => handle("present")} disabled={!!saving}
                style={{ padding: "9px 18px", background: saving === "present" ? "#e2e8f0" : "#16a34a", color: saving === "present" ? "#94a3b8" : "#fff", border: "none", borderRadius: 2, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
              >
                {saving === "present" ? "Marking…" : "Mark Present"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function SupervisorAttendanceVerification() {
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [student,  setStudent]  = useState("all"); // filter by student name
  const [viewRow,  setViewRow]  = useState(null);

  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setRecords(await fetchSupervisorAttendance()); }
    catch { show("Failed to load attendance records.", "error"); }
    finally { setLoading(false); }
  }, [show]);

  useEffect(() => { load(); }, [load]);

  const handleDone = (id, status) => {
    setRecords((prev) => prev.map((r) => r.attendance_id === id ? { ...r, status } : r));
    show(`Attendance marked as ${status}.`);
  };

  // Unique student list for filter dropdown
  const studentNames = [...new Set(records.map((r) => r.student_name).filter(Boolean))].sort();

  const filtered = records.filter((r) => {
    const statusMatch  = filter === "all" || r.status === filter;
    const studentMatch = student === "all" || r.student_name === student;
    const q = search.toLowerCase();
    const searchMatch  = !q || [r.student_name, r.student_email, fmtDate(r.attendance_date), r.status].some((v) => String(v ?? "").toLowerCase().includes(q));
    return statusMatch && studentMatch && searchMatch;
  });

  const pending = records.filter((r) => r.status === "pending").length;
  const present = records.filter((r) => r.status === "present").length;
  const absent  = records.filter((r) => r.status === "absent").length;

  return (
    <div style={{ padding: "28px 32px" }}>
      {toast && <div className={`ut-toast ${toast.kind}`}>{toast.msg}</div>}
      {viewRow && <VerifyModal row={viewRow} onClose={() => setViewRow(null)} onDone={handleDone} />}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Attendance Verification</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 0 }}>
          Review and verify attendance records submitted by your students.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total",   value: records.length, color: "#1b3a6b" },
          { label: "Pending", value: pending,         color: "#f59e0b" },
          { label: "Present", value: present,         color: "#16a34a" },
          { label: "Absent",  value: absent,          color: "#dc2626" },
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
          {/* Student filter */}
          <select className="ut-table-filter-select" value={student} onChange={(e) => setStudent(e.target.value)}>
            <option value="all">All Students</option>
            {studentNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          {/* Status filter */}
          <select className="ut-table-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>
        <p className="table-count">Showing <strong>{filtered.length}</strong> of {records.length} record{records.length !== 1 ? "s" : ""}</p>

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
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Remarks</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <p className="empty-state-text">{records.length === 0 ? "No attendance records submitted yet." : "No records match your filters."}</p>
                    </div>
                  </td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.attendance_id} style={{ background: r.status === "pending" ? "#fffef5" : undefined }}>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>{i + 1}</td>
                    <td>
                      <span className="cell-name">{r.student_name}</span>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{r.student_email}</p>
                    </td>
                    <td>{fmtDate(r.attendance_date)}</td>
                    <td>{r.clock_in?.slice(0, 5) || "—"}</td>
                    <td>{r.clock_out?.slice(0, 5) || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                    <td style={{ maxWidth: 160 }}><span style={{ fontSize: 13, color: "#475569" }}>{r.remarks || "—"}</span></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <div className="ut-action-btn-wrap">
                        <button
                          className={`ut-action-btn ${r.status === "pending" ? "ut-action-btn-edit" : "ut-action-btn-detail"}`}
                          onClick={() => setViewRow(r)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
                            {r.status === "pending"
                              ? <><path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></>
                              : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                          </svg>
                          {r.status === "pending" ? "Verify" : "View"}
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