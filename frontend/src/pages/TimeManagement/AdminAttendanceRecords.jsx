// pages/admin/AdminAttendanceRecords.jsx
import { useState, useEffect, useCallback } from "react";
import { adminFetchAllAttendance } from "../api/timeApi";
import useToast from "../userManagement/userTable/useToast";
import ExportModal from "../userManagement/userTable/ExportModal";
import "../../css/userManagement/userTable.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : "—";

const toLocalDateStr = (d) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

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

export default function AdminAttendanceRecords() {
  const [records,   setRecords]  = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [intakes,      setIntakes]      = useState([]);
  const [intakeFilter, setIntakeFilter] = useState("all");
  const [search,    setSearch]   = useState("");
  const [filter,    setFilter]   = useState("all");
  const [sortKey,   setSortKey]  = useState("attendance_date");
  const [sortDir,   setSortDir]  = useState("desc");
  const [showExport, setShowExport] = useState(false);
  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setRecords(await adminFetchAllAttendance()); }
    catch { show("Failed to load attendance records.", "error"); }
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

  const filtered = records
    .filter((r) => {
      const statusMatch = filter === "all" || r.status === filter;
            const intakeMatch = intakeFilter === "all" || String(r.intake_id) === String(intakeFilter);
      const q = search.toLowerCase();
      const searchMatch = !q || [
        r.student_name, r.supervisor_name, r.status, r.remarks,
        r.attendance_date ? toLocalDateStr(r.attendance_date) : "",
      ].some((v) => String(v ?? "").toLowerCase().includes(q));
      return statusMatch && searchMatch && intakeMatch;
    })
    .sort((a, b) => {
      const va = String(a[sortKey] ?? "").toLowerCase();
      const vb = String(b[sortKey] ?? "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  // Stats
  const total   = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const absent  = records.filter((r) => r.status === "absent").length;
  const pending = records.filter((r) => r.status === "pending").length;
  const uniqueStudents = new Set(records.map((r) => r.student_id)).size;

  const COLS = [
    { key: "student_name",    label: "Student" },
    { key: "attendance_date", label: "Date" },
    { key: "clock_in",        label: "Clock In" },
    { key: "clock_out",       label: "Clock Out" },
    { key: "remarks",         label: "Remarks" },
    { key: "supervisor_name", label: "Supervisor" },
    { key: "status",          label: "Status" },
  ];

  const EXPORT_COLUMNS = [
    "student_name", "student_email", "matric_number",
    "attendance_date", "clock_in", "clock_out",
    "remarks", "supervisor_name", "status",
  ];

  return (
    <div style={{ padding: "28px 32px" }}>
      {toast && <div className={`ut-toast ${toast.kind}`}>{toast.msg}</div>}
      {showExport && (
        <ExportModal
          rows={filtered}
          selected={new Set()}
          columns={EXPORT_COLUMNS}
          type="attendance_records"
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Attendance Records</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 0 }}>
          Monitor all student daily attendance across all supervisors.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Records",    value: total,          color: "#1b3a6b" },
          { label: "Students",         value: uniqueStudents, color: "#7c3aed" },
          { label: "Present",          value: present,        color: "#be123c" },
          { label: "Absent",           value: absent,         color: "#64748b" },
          { label: "Pending Verify",   value: pending,        color: "#d97706" },
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
                <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                className="ut-table-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, supervisor, status…"
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>×</button>
              )}
            </div>
            <select className="ut-table-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
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
          Showing <strong>{filtered.length}</strong> of {records.length} record{records.length !== 1 ? "s" : ""}
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
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={COLS.length + 1}>
                    <div className="empty-state">
                      <p className="empty-state-text">{records.length === 0 ? "No attendance records found." : "No results match your search."}</p>
                    </div>
                  </td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.attendance_id}>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>{i + 1}</td>
                    <td><span className="cell-name">{r.student_name || "—"}</span></td>
                    <td><span style={{ fontSize: 13 }}>{fmtDate(r.attendance_date)}</span></td>
                    <td>
                      {r.clock_in
                        ? <span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{r.clock_in.slice(0, 5)}</span>
                        : <span style={{ color: "#cbd5e1" }}>—</span>}
                    </td>
                    <td>
                      {r.clock_out
                        ? <span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{r.clock_out.slice(0, 5)}</span>
                        : <span style={{ color: "#cbd5e1" }}>—</span>}
                    </td>
                    <td style={{ maxWidth: 200 }}><span style={{ fontSize: 13, color: "#475569" }}>{r.remarks || "—"}</span></td>
                    <td><span style={{ fontSize: 13, color: "#475569" }}>{r.supervisor_name || "—"}</span></td>
                    <td><StatusBadge status={r.status} /></td>
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