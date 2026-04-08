// components/VacancyTable.jsx
import { useState, useEffect } from "react";
import { fetchVacancies, deleteVacancy, updateVacancy } from "../api/vacancyApi";
import StatusBadge             from "../userManagement/userTable/StatusBadge";
import ExportModal             from "../userManagement/userTable/ExportModal";
import useToast                from "../userManagement/userTable/useToast";
import { COL_LABEL }           from "../userManagement/userTable/tableConfig";
import AddVacancyModal         from "./vacancyTable/AddVacancyModal";
import EditVacancyModal        from "./vacancyTable/EditVacancyModal";
import ViewVacancyModal        from "./vacancyTable/ViewVacancyModal";
import "../../css/userManagement/userTable.css";

// ── Columns shown in the vacancy table ───────────────────
const VACANCY_COLUMNS = ["position_name", "company_name", "capacity", "start_date", "end_date", "status"];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function VacancyTable() {
  const [rows, setRows]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [sortKey, setSortKey]           = useState("position_name");
  const [sortDir, setSortDir]           = useState("asc");
  const [statusFilter, setStatus]       = useState("All");
  const [showAdd, setShowAdd]           = useState(false);
  const [showExport, setExport]         = useState(false);
  const [viewRow, setViewRow]           = useState(null);
  const [editRow, setEditRow]           = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [selected, setSelected]         = useState(new Set());
  const [bulkStatus, setBulkStatus]     = useState("");
  const { toast, show }                 = useToast();

  // ── Fetch vacancies ───────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetchVacancies()
      .then(setRows)
      .catch(() => show("Failed to load vacancies.", "error"))
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
        (statusFilter === "All" || r.status?.toLowerCase() === statusFilter.toLowerCase()) &&
        VACANCY_COLUMNS.some((col) => String(r[col] ?? "").toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const va = String(a[sortKey] ?? "").toLowerCase();
      const vb = String(b[sortKey] ?? "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  // ── Selection helpers ─────────────────────────────────
  const toggleOne   = (id) => setSelected((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll   = ()   => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.id)));
  const allChecked  = filtered.length > 0 && selected.size === filtered.length;
  const someChecked = selected.size > 0 && selected.size < filtered.length;

  // ── CRUD helpers ──────────────────────────────────────
  const handleAdd = (vacancy) => {
    setRows((p) => [...p, vacancy]);
    show(`Vacancy "${vacancy.position_name}" added!`);
  };

  const handleSaveEdit = (updated) => {
    setRows((p) => p.map((r) => r.id === (updated.id ?? updated.vacancy_id) ? updated : r));
    show("Vacancy updated.");
  };

  const handleDelete = (id, name) => setConfirmDialog({ ids: [id], names: [name] });

  const handleBulkDelete = () => {
    const ids   = [...selected];
    const names = filtered.filter((r) => selected.has(r.id)).map((r) => r.position_name || "—");
    setConfirmDialog({ ids, names });
  };

  const confirmDelete = async () => {
    const { ids, names } = confirmDialog;
    setConfirmDialog(null);
    try {
      await Promise.all(ids.map((id) => deleteVacancy(id)));
      setRows((p) => p.filter((r) => !ids.includes(r.id)));
      setSelected(new Set());
      show(ids.length === 1 ? `"${names[0]}" deleted.` : `${ids.length} vacancies deleted.`, "error");
    } catch {
      show("Failed to delete.", "error");
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus) return;
    const ids = [...selected];
    try {
      await Promise.all(ids.map((id) => updateVacancy(id, { status: bulkStatus })));
      setRows((p) => p.map((r) => selected.has(r.id) ? { ...r, status: bulkStatus } : r));
      setSelected(new Set());
      setBulkStatus("");
      show(`${ids.length} vacancy${ids.length > 1 ? "s" : ""} set to "${bulkStatus}".`);
    } catch {
      show("Failed to update status.", "error");
    }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
        <path d="M3 6h18 M7 12h10 M10 18h4" />
      </svg>
    );
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2.5">
        <path d={sortDir === "asc" ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
      </svg>
    );
  };

  // ── Export rows — flatten dates for display ───────────
  const exportRows = filtered.map((r) => ({
    ...r,
    start_date: r.start_date ? fmtDate(r.start_date) : "",
    end_date:   r.end_date   ? fmtDate(r.end_date)   : "",
  }));

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

      {/* ── Delete confirm dialog ─────────────────────────── */}
      {confirmDialog && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: "16px", padding: "36px 32px",
            maxWidth: "420px", width: "90%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            textAlign: "center", animation: "toastSlideUp 0.25s ease",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: "#fef2f2",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
              Delete Vacancy
            </h3>
            <p style={{ margin: "0 0 28px", fontSize: "14px", color: "#64748b", lineHeight: 1.7 }}>
              {confirmDialog.ids.length === 1 ? (
                <>Are you sure you want to delete{" "}
                <strong style={{ color: "#0f172a" }}>"{confirmDialog.names[0]}"</strong>?</>
              ) : (
                <>Are you sure you want to delete{" "}
                <strong style={{ color: "#0f172a" }}>{confirmDialog.ids.length} vacancies</strong>?</>
              )}
              <br />
              This action <strong style={{ color: "#ef4444" }}>cannot be undone</strong>.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: "10px",
                  border: "1.5px solid #e2e8f0", background: "#fff",
                  fontSize: "14px", fontWeight: 600, color: "#475569", cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: "10px",
                  border: "none", background: "#ef4444",
                  fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────── */}
      {showAdd  && <AddVacancyModal  onClose={() => setShowAdd(false)}  onSave={handleAdd} />}
      {showExport && (
        <ExportModal
          rows={exportRows}
          selected={selected}
          columns={VACANCY_COLUMNS}
          type="vacancy"
          onClose={() => setExport(false)}
        />
      )}
      {viewRow && <ViewVacancyModal row={viewRow} onClose={() => setViewRow(null)} />}
      {editRow && (
        <EditVacancyModal
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* ── Main table card ───────────────────────────────── */}
      <div className="table-wrapper">

        {/* Toolbar */}
        <div className="table-toolbar">
          {/* Search */}
          <div className="ut-table-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="ut-table-search-input"
              placeholder="Search vacancies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <select
            className="table-filter-select"
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
          >
            {allStatuses.map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          {/* Action buttons */}
          <button className="ut-btn-secondary" onClick={() => setExport(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" />
            </svg>
            Export
          </button>

          <button className="ut-btn-primary" onClick={() => setShowAdd(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14 M5 12h14" />
            </svg>
            Add Vacancy
          </button>
        </div>

        {/* Row count */}
        <p className="table-count">
          Showing <strong>{filtered.length}</strong> of {rows.length} vacancy{rows.length !== 1 ? "s" : ""}
          {selected.size > 0 && <span style={{ marginLeft: "10px", color: "#1a56db", fontWeight: 600 }}>· {selected.size} selected</span>}
        </p>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
            background: "#eff6ff", border: "1px solid #bfdbfe",
            borderRadius: "10px", padding: "10px 16px", margin: "0px 10px 10px 20px",
          }}>
            <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#1d4ed8" }}>
              {selected.size} selected
            </span>
            <div style={{ flex: 1 }} />
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              style={{
                border: "1px solid #cbd5e1", borderRadius: "2px",
                padding: "7px 10px", fontSize: "13.5px", color: "#374151",
                background: "white", cursor: "pointer", outline: "none",
              }}
            >
              <option value="">Set status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              disabled={!bulkStatus}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: bulkStatus ? "#1a56db" : "#e2e8f0",
                border: "none", borderRadius: "2px", padding: "7px 14px",
                fontSize: "13.5px", fontWeight: "600",
                color: bulkStatus ? "white" : "#94a3b8",
                cursor: bulkStatus ? "pointer" : "not-allowed",
                transition: "background 0.15s",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Apply
            </button>

            <div style={{ width: "1px", height: "24px", background: "#bfdbfe" }} />
            <button
              onClick={handleBulkDelete}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "#b91c1c", border: "1px solid #b91c1c",
                borderRadius: "2px", padding: "7px 14px",
                fontSize: "13px", fontWeight: "600", color: "#fff", cursor: "pointer",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6" />
              </svg>
              Delete Selected
            </button>
            <button
              onClick={() => setSelected(new Set())}
              style={{
                background: "none", border: "1px solid #cbd5e1",
                borderRadius: "2px", padding: "7px 12px",
                fontSize: "13px", color: "#64748b", cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Loading vacancies…</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "40px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked; }}
                      onChange={toggleAll}
                      style={{ cursor: "pointer", accentColor: "#1a56db" }}
                    />
                  </th>
                  <th style={{ width: "48px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>#</th>
                  {VACANCY_COLUMNS.map((col) => (
                    <th key={col} onClick={() => handleSort(col)}>
                      <span className="th-inner">
                        {COL_LABEL[col] || col}
                        <SortIcon col={col} />
                      </span>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={VACANCY_COLUMNS.length + 3}>
                      <div className="empty-state">
                        <div className="empty-state-icon">💼</div>
                        <p className="empty-state-text">No vacancies found.</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((row, idx) => (
                  <tr
                    key={row.id}
                    style={{
                      background:  selected.has(row.id) ? "#eff6ff" : undefined,
                      borderLeft:  "3px solid transparent",
                      transition:  "border-left 0.15s",
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ textAlign: "center", width: "40px" }}>
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleOne(row.id)}
                        style={{ cursor: "pointer", accentColor: "#1a56db" }}
                      />
                    </td>

                    {/* Row number */}
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", width: "48px" }}>
                      {idx + 1}
                    </td>

                    {/* Data cells */}
                    {VACANCY_COLUMNS.map((col) => (
                      <td key={col}>
                        {col === "status" ? (
                          <StatusBadge status={row[col]} />
                        ) : col === "position_name" ? (
                          <span className="cell-name">{row[col] ?? "—"}</span>
                        ) : col === "company_name" ? (
                          <span style={{ color: "#475569", fontSize: "13px" }}>{row[col] ?? "—"}</span>
                        ) : col === "capacity" ? (
                          <td style={{ textAlign: "center" }}>
                              <span style={{
                                display: "inline-flex", alignItems: "center",
                                background: "#f0f9ff", color: "#0369a1",
                                borderRadius: "2px",
                                padding: "2px 10px", fontSize: "12.5px", fontWeight: "600",
                              }}>
                              {row[col] ?? "—"}
                            </span>
                          </td>
                        ) : col === "start_date" || col === "end_date" ? (
                          <span className="cell-muted">{fmtDate(row[col])}</span>
                        ) : (
                          <span>{row[col] ?? "—"}</span>
                        )}
                      </td>
                    ))}

                    {/* Action buttons */}
                    <td>
                      <div className="ut-action-btn-wrap">
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

                        <button
                          title="Edit"
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

                        <button
                          title="Delete"
                          className="ut-action-btn ut-action-btn-delete"
                          onClick={() => handleDelete(row.id, row.position_name)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                          </svg>
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