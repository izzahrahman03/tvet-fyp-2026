// pages/internshipManagement/AdminInternshipPlacementPage.jsx
// Admin: student-centric internship placement overview.

import React, { useState, useEffect, useCallback } from "react";
import StatusBadge from "../userManagement/userTable/StatusBadge";
import useToast    from "../userManagement/userTable/useToast";
import ExportModal from "../userManagement/userTable/ExportModal";
import "../../css/userManagement/userTable.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" }) : "—";

// Derive a single effective status from two columns
const effectiveStatus = (app) => {
  const r = app.internship_applicant_response?.toLowerCase();
  if (r && r !== "none") return r;
  return app.application_status?.toLowerCase() ?? "";
};

// ── Placement status badge ─────────────────────────────────
function PlacementBadge({ status }) {
  const map = {
    placed:     { label: "Placed",     bg: "#dcfce7", color: "#15803d" },
    pending:    { label: "Pending",    bg: "#fef9c3", color: "#854d0e" },
    not_placed: { label: "Not Placed", bg: "#f1f5f9", color: "#475569" },
  };
  const s = map[status] || map.not_placed;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: "12px", fontWeight: "700",
      padding: "3px 10px", borderRadius: "2px",
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}


// ── Student Applications Modal ─────────────────────────────
function StudentApplicationsModal({ student, onClose }) {
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch(`${API}/admin/internship/placements/${student.student_id}/applications`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => setApps(d.applications ?? []))
      .catch(() => setError("Failed to load applications."))
      .finally(() => setLoading(false));
  }, [student.student_id]);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "720px", width: "95%" }}>

        <div className="modal-header">
          <div>
            <p className="modal-title">{student.student_name}</p>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
              {student.matric_number} · {student.intake_name ?? "No intake"} · {student.student_email}
            </p>
          </div>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "20px 24px", overflowY: "auto", maxHeight: "65vh" }}>

          {/* Summary row */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <PlacementBadge status={student.placement_status} />
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              {student.total_applications} application{student.total_applications !== 1 ? "s" : ""} submitted
            </span>
            {student.placement_status === "placed" && (
              <span style={{ fontSize: "13px", color: "#15803d", fontWeight: "600" }}>
                · {student.placed_position} @ {student.placed_company}
              </span>
            )}
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p className="loading-text">Loading applications…</p>
            </div>
          ) : error ? (
            <div style={{ padding: "16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "2px", color: "#b91c1c", fontSize: "13px" }}>
              {error}
            </div>
          ) : apps.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
              This student has not applied for any internship yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {apps.map((app) => {
                const effS     = effectiveStatus(app);
                const isPlaced = app.internship_applicant_response === "accepted";
                return (
                  <div key={app.internship_application_id} style={{
                    border: `1.5px solid ${isPlaced ? "#bbf7d0" : "#e2e8f0"}`,
                    borderRadius: "2px",
                    padding: "14px 16px",
                    background: isPlaced ? "#f0fdf4" : "white",
                  }}>
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                          {app.position_name}
                        </p>
                        <p style={{ margin: 0, fontSize: "13px", color: "#1b3a6b", fontWeight: "600" }}>
                          {app.company_name}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <StatusBadge status={app.application_status} />
                        {app.internship_applicant_response && app.internship_applicant_response !== "none" && (
                          <StatusBadge status={app.internship_applicant_response} />
                        )}
                      </div>
                    </div>

                    {/* Details grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "6px 20px", fontSize: "12.5px", color: "#475569" }}>
                      <span>📍 {app.location ?? "—"}</span>
                      <span>🗓 Applied: {fmtDate(app.applied_date)}</span>
                      {app.start_date && <span>📅 {fmtDate(app.start_date)} – {fmtDate(app.end_date)}</span>}
                      {app.industry_sector && <span>🏭 {app.industry_sector}</span>}
                    </div>

                    {/* Interview details */}
                    {app.interview_datetime && (
                      <div style={{ marginTop: "8px", padding: "8px 12px", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "2px", fontSize: "12.5px", color: "#6d28d9" }}>
                        <strong>Interview:</strong> {fmtDateTime(app.interview_datetime)}
                        {app.interview_location && ` · ${app.interview_location}`}
                      </div>
                    )}

                    {/* Supervisor */}
                    {isPlaced && app.supervisor_name && (
                      <div style={{ marginTop: "8px", padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "2px", fontSize: "12.5px", color: "#15803d" }}>
                        <strong>Supervisor:</strong> {app.supervisor_name}
                        {app.supervisor_position && ` (${app.supervisor_position})`}
                        {app.supervisor_email && ` · ${app.supervisor_email}`}
                      </div>
                    )}
                  </div>
                );
              })}
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


// ══════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════
export default function AdminInternshipPlacementPage() {
  const [rows,            setRows]            = useState([]);
  const [intakes,         setIntakes]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState("");
  const [placementFilter, setPlacementFilter] = useState("all");
  const [intakeFilter,    setIntakeFilter]    = useState("all");
  const [sortKey,         setSortKey]         = useState("student_name");
  const [sortDir,         setSortDir]         = useState("asc");
  const [viewStudent,     setViewStudent]     = useState(null);
  const [showExport, setShowExport] = useState(false);
  const { toast, show }                       = useToast();

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (placementFilter !== "all") params.set("placement_status", placementFilter);
    if (intakeFilter    !== "all") params.set("intake_id",        intakeFilter);
    if (search)                    params.set("search",           search);

    fetch(`${API}/admin/internship/placements?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => setRows(d.placements ?? []))
      .catch(() => show("Failed to load placements.", "error"))
      .finally(() => setLoading(false));
  }, [placementFilter, intakeFilter, search]);

  // Load intakes for filter dropdown
  useEffect(() => {
    fetch(`${API}/intakes`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then((d) => setIntakes(d.intakes ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [placementFilter, intakeFilter]);

  const handleSearch = (e) => {
    if (e.key === "Enter") load();
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...rows].sort((a, b) => {
    const va = String(a[sortKey] ?? "").toLowerCase();
    const vb = String(b[sortKey] ?? "").toLowerCase();
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  // Stats
  const total    = rows.length;
  const placed   = rows.filter((r) => r.placement_status === "placed").length;
  const pending  = rows.filter((r) => r.placement_status === "pending").length;
  const notPlaced = rows.filter((r) => r.placement_status === "not_placed").length;

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
    "company_name", "position_name", "intern_status",
    "supervisor_name", "applied_date",
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

      {viewStudent && (
        <StudentApplicationsModal
          student={viewStudent}
          onClose={() => setViewStudent(null)}
        />
      )}

      {showExport && (
        <ExportModal
          rows={sorted}
          selected={new Set()}
          columns={EXPORT_COLUMNS}
          type="internship_placement"
          onClose={() => setShowExport(false)}
        />
      )}

      {/* ── Summary stat cards ─────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Students", value: total,     color: "#1b3a6b" },
          { label: "Placed",         value: placed,    color: "#7c3aed" },
          { label: "Pending",        value: pending,   color: "#be123c" },
          { label: "Not Placed",     value: notPlaced, color: "#64748b" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
           background: "white", border: "1px solid #c8d5e8", borderRadius: 2, padding: "16px 20px", borderTop: `3px solid ${color}`
          }}>
           <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
           <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
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

          {/* Row 2 — Search + Placement status filter + Export */}
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
                placeholder="Search name, matric, email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearch}
              />
              {search && (
                <button onClick={() => { setSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 0 }}>×</button>
              )}
            </div>
            <select
              className="ut-table-filter-select"
              value={placementFilter}
              onChange={(e) => setPlacementFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="placed">Placed</option>
              <option value="pending">Pending</option>
              <option value="not_placed">Not Placed</option>
            </select>

            {/* Export button — moved here */}
            <button className="ut-btn-secondary" onClick={() => setShowExport(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12" />
              </svg>
              Export
            </button>
          </div>
        </div>

        <p className="table-count">
          {loading ? "Loading…" : `${sorted.length} student${sorted.length !== 1 ? "s" : ""}`}
        </p>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Loading placements…</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "48px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>#</th>
                  {[
                    { key: "student_name",    label: "Student" },
                    { key: "matric_number",   label: "Matric No." },
                    { key: "intake_name",     label: "Intake" },
                    { key: "total_applications", label: "Applications" },
                    { key: "placement_status",   label: "Placement" },
                    { key: "placed_company",     label: "Placed At" },
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
                    <td colSpan={8}>
                      <div className="empty-state">
                        <p className="empty-state-text">No students found.</p>
                      </div>
                    </td>
                  </tr>
                ) : sorted.map((row, idx) => (
                  <tr key={row.student_id}>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>{idx + 1}</td>

                    {/* Student */}
                    <td>
                      <span className="cell-name">{row.student_name}</span>
                      <p style={{ margin: 0, fontSize: "11.5px", color: "#64748b" }}>{row.student_email}</p>
                    </td>

                    {/* Matric */}
                    <td>
                      <span style={{ fontSize: "13px", fontFamily: "monospace", color: "#374151" }}>
                        {row.matric_number ?? "—"}
                      </span>
                    </td>

                    {/* Intake */}
                    <td>
                      <span style={{ fontSize: "13px", color: "#374151" }}>{row.intake_name ?? "—"}</span>
                    </td>

                    {/* Total applications */}
                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        display: "inline-block",
                        minWidth: "28px", padding: "2px 8px",
                        background: row.total_applications > 0 ? "#eff6ff" : "#f8fafc",
                        color: row.total_applications > 0 ? "#1d4ed8" : "#94a3b8",
                        fontSize: "13px", fontWeight: "700", borderRadius: "2px",
                      }}>
                        {row.total_applications}
                      </span>
                    </td>

                    {/* Placement status */}
                    <td><PlacementBadge status={row.placement_status} /></td>

                    {/* Placed at */}
                    <td>
                      {row.placement_status === "placed" ? (
                        <div>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#15803d" }}>{row.placed_position}</span>
                          <p style={{ margin: 0, fontSize: "11.5px", color: "#166534" }}>{row.placed_company}</p>
                          {row.placed_supervisor && (
                            <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Supervisor: {row.placed_supervisor}</p>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#cbd5e1" }}>—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="ut-action-btn-wrap">
                        <button
                          title="View All Applications"
                          className="ut-action-btn ut-action-btn-detail"
                          onClick={() => setViewStudent(row)}
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