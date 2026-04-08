// components/UserTable.jsx
import { useState, useEffect } from "react";
import {
  fetchUsers,
  deleteUser,
  importUsers,
  updateUser,
} from "../api/adminApi";
import {
  fetchApplications,
  updateApplicationStatus,
  deleteApplication,
} from "../api/applicationApi";
import ImportModal  from "./userTable/ImportModal";
import ExportModal  from "./userTable/ExportModal";
import StatusBadge, { STATUS_LABEL } from "./userTable/StatusBadge";
import AddUserModal from "./userTable/AddUserModal";
import ViewModal    from "./userTable/ViewModal";
import EditModal    from "./userTable/EditModal";
import useToast     from "./userTable/useToast";
import { COLUMNS, COL_LABEL } from "./userTable/tableConfig";
import "../../css/userManagement/userTable.css";

export default function UserTable({ type }) {
  const [rows, setRows]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [sortKey, setSortKey]         = useState("name");
  const [sortDir, setSortDir]         = useState("asc");
  const [statusFilter, setStatus]     = useState("All");
  const [showAdd, setShowAdd]         = useState(false);
  const [showImport, setImport]       = useState(false);
  const [showExport, setExport]       = useState(false);
  const [flagged, setFlagged]         = useState(new Set());
  const [viewRow, setViewRow]         = useState(null);
  const [editRow, setEditRow]         = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { ids: [], names: [] } | null
  const [selected, setSelected]           = useState(new Set());
  const [bulkStatus, setBulkStatus]       = useState("");
  const { toast, show }               = useToast();

  // ── Reset selection when type changes ────────────────────
  useEffect(() => { setSelected(new Set()); setBulkStatus(""); }, [type]);

  const columns = COLUMNS[type] || ["name", "email", "status"];
  const nameKey = type === "industry_partner" ? "company_name" : "name";
  useEffect(() => {
    setLoading(true);
    setRows([]);

    const load = type === "application"
      ? fetchApplications()
      : fetchUsers(type);
      

    load
      .then(setRows)
      .catch((err) => {
        console.error("fetch error:", err);
        show("Failed to load records.", "error");
      })
      .finally(() => setLoading(false));
  }, [type]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const allStatuses = ["All", ...new Set(rows.filter(Boolean).map((r) => r.status).filter(Boolean))];

  const filtered = rows
    .filter((r) => {
      const q    = search.toLowerCase();
      const flat = { ...r };
      delete flat.education;
      delete flat.skills;
      return (
        (statusFilter === "All" || r.status === statusFilter) &&
        Object.values(flat).some((v) => String(v ?? "").toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const va = String(a[sortKey] ?? "").toLowerCase();
      const vb = String(b[sortKey] ?? "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const handleAdd = (user) => {
    setRows((p) => [...p, user]);
    show(`User "${user.company_name || user.name || user.company}" added!`);
  };

  const handleImported = async (data) => {
    const imported = await importUsers(type, data);
    setRows((p) => [...p, ...imported]);
    show(`${imported.length} records imported successfully!`, "info");
  };

  // ── Selection helpers ─────────────────────────────────────
  const toggleOne  = (id) => setSelected((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll  = ()   => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.id)));
  const allChecked = filtered.length > 0 && selected.size === filtered.length;
  const someChecked = selected.size > 0 && selected.size < filtered.length;
  const toggleFlag = (id) => setFlagged((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleDelete = (id, name) => {
    setConfirmDialog({ ids: [id], names: [name] });
  };

  const handleBulkDelete = () => {
    const ids   = [...selected];
    const names = filtered.filter((r) => selected.has(r.id)).map((r) => r[nameKey] || r.name || "—");
    setConfirmDialog({ ids, names });
  };

  // ── Bulk status options (mirrors EditModal) ───────────────
  const bulkStatusOptions = type === "application"
    ? [
        { value: "attended", label: "Attended" },
        { value: "absent",   label: "Absent"   },
        { value: "passed",   label: "Passed"   },
        { value: "failed",   label: "Failed"   },
      ]
    : [
        { value: "active",   label: "Active"   },
        { value: "inactive", label: "Inactive" },
      ];

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus) return;
    const ids = [...selected];
    try {
      await Promise.all(ids.map((id) =>
        type === "application"
          ? updateApplicationStatus(id, { status: bulkStatus })
          : updateUser(type, id, { status: bulkStatus })
      ));
      setRows((p) => p.map((r) => selected.has(r.id) ? { ...r, status: bulkStatus } : r));
      setSelected(new Set());
      setBulkStatus("");
      show(`${ids.length} record${ids.length > 1 ? "s" : ""} updated to "${bulkStatus}".`);
    } catch (err) {
      console.error("bulk status error:", err);
      show("Failed to update status.", "error");
    }
  };

  const confirmDelete = async () => {
    const { ids, names } = confirmDialog;
    setConfirmDialog(null);
    try {
      await Promise.all(ids.map((id) =>
        type === "application" ? deleteApplication(id) : deleteUser(type, id)
      ));
      setRows((p) => p.filter((r) => !ids.includes(r.id)));
      setSelected(new Set());
      show(ids.length === 1 ? `"${names[0]}" deleted.` : `${ids.length} records deleted.`, "error");
    } catch (err) {
      console.error("delete error:", err);
      show("Failed to delete record(s).", "error");
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

  return (
    <div>
      {/* ── Modals ─────────────────────────────────────────── */}
      {showAdd    && <AddUserModal type={type} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {showImport && <ImportModal  type={type} onClose={() => setImport(false)}  onImport={handleImported} />}
      {showExport && (
        <ExportModal
          rows={filtered}
          selected={selected}
          columns={columns}
          type={type}
          onClose={() => setExport(false)}
        />
      )}
      {viewRow    && <ViewModal    row={viewRow} type={type} onClose={() => setViewRow(null)} />}
      {editRow    && (
        <EditModal
          row={editRow}
          type={type}
          onClose={() => setEditRow(null)}
          onSave={(updated) => {
            setRows((p) => p.map((r) => r.id === updated.id ? { ...r, ...updated } : r));
            setEditRow(null);
            show(`"${updated[nameKey]}" updated!`);
          }}
        />
      )}

      {/* ── Custom Delete Confirm Dialog ────────────────────── */}
      {confirmDialog && (
        <div style={{
          position:       "fixed",
          inset:          0,
          zIndex:         9999,
          background:     "rgba(15,23,42,0.45)",
          backdropFilter: "blur(3px)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
        }}>
          <div style={{
            background:   "#fff",
            borderRadius: "2px",
            padding:      "36px 32px",
            maxWidth:     "420px",
            width:        "90%",
            boxShadow:    "0 24px 64px rgba(0,0,0,0.18)",
            textAlign:    "center",
            animation:    "toastSlideUp 0.25s ease",
          }}>
            <div style={{
              width:          56,
              height:         56,
              borderRadius:   "50%",
              background:     "#fef2f2",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              margin:         "0 auto 20px",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6" />
              </svg>
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
              Delete Record
            </h3>
            <p style={{ margin: "0 0 28px", fontSize: "14px", color: "#64748b", lineHeight: 1.7 }}>
              {confirmDialog.ids.length === 1 ? (
                <>Are you sure you want to delete{" "}
                <strong style={{ color: "#0f172a" }}>"{confirmDialog.names[0]}"</strong>?</>
              ) : (
                <>Are you sure you want to delete{" "}
                <strong style={{ color: "#0f172a" }}>{confirmDialog.ids.length} records</strong>?</>
              )}
              <br />
              This action <strong style={{ color: "#ef4444" }}>cannot be undone</strong>.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{
                  flex:         1,
                  padding:      "11px 0",
                  borderRadius: "2px",
                  border:       "1.5px solid #e2e8f0",
                  background:   "#fff",
                  fontSize:     "14px",
                  fontWeight:   600,
                  color:        "#475569",
                  cursor:       "pointer",
                  transition:   "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex:         1,
                  padding:      "11px 0",
                  borderRadius: "2px",
                  border:       "none",
                  background:   "#ef4444",
                  fontSize:     "14px",
                  fontWeight:   600,
                  color:        "#fff",
                  cursor:       "pointer",
                  transition:   "background 0.15s",
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

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <div className={`ut-toast ${toast.kind}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="ut-table-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <path d="M21 21l-4.35-4.35 M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              className="ut-table-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records…"
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 0 }}>
                ×
              </button>
            )}
          </div>

          <select className="ut-table-filter-select" value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
            {allStatuses.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>
            ))}
          </select>

            <button className="ut-btn-secondary" onClick={() => setImport(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" />
              </svg>
              Import Excel
            </button>

          <button className="ut-btn-secondary" onClick={() => setExport(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12" />
            </svg>
            Export
          </button>

          {(type === "industry_partner" || type === "industry_supervisor" || type === "manager") && (
            <button className="ut-btn-primary" onClick={() => setShowAdd(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 5v14 M5 12h14" />
              </svg>
              Add New
            </button>
          )}
        </div>

        <p className="table-count">
          Showing <strong>{filtered.length}</strong> of {rows.length} records
          {search && ` for "${search}"`}
          {selected.size > 0 && <span style={{ marginLeft: "10px", color: "#1a56db", fontWeight: 600 }}>· {selected.size} selected</span>}
        </p>

        {/* ── Bulk action bar ────────────────────────────── */}
        {selected.size > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "#eff6ff", border: "1px solid #bfdbfe",
            borderRadius: "2px", padding: "10px 16px", margin: " 0px 10px 10px 20px",
            flexWrap: "wrap",
          }}>
            <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#1d4ed8" }}>
              {selected.size} record{selected.size > 1 ? "s" : ""} selected
            </span>
            <div style={{ flex: 1 }} />

            {/* Bulk status update */}
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
              {bulkStatusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
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
                fontSize: "13.5px", fontWeight: "600", color: "#fbf6f6", cursor: "pointer",
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

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Loading records…</p>
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
                  {columns.map((col) => (
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
                    <td colSpan={columns.length + 3}>
                      <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <p className="empty-state-text">No records found.</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((row, idx) => (
                  <tr key={row.id} style={{
                    background: selected.has(row.id) ? "#eff6ff" : undefined,
                    borderLeft: flagged.has(row.id) ? "3px solid #16a34a" : "3px solid transparent",
                    transition: "border-left 0.15s",
                  }}>
                    <td style={{ textAlign: "center", width: "40px" }}>
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleOne(row.id)}
                        style={{ cursor: "pointer", accentColor: "#1a56db" }}
                      />
                    </td>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", width: "48px" }}>
                      {idx + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={col}>
                        {col === "status" ? (
                          <StatusBadge status={row[col]} />
                        ) : col === "name" || col === "company" || col === "company_name" ? (
                          <span className="cell-name">{row[col] ?? "—"}</span>
                        ) : col === "date" || col === "updated_at" || col === "created_at" ? (
                          <span className="cell-muted">
                            {row[col] ? new Date(row[col]).toLocaleDateString("en-MY") : "—"}
                          </span>
                        ) : (
                          <span>{row[col] ?? "—"}</span>
                        )}
                      </td>
                    ))}
                    <td>
                      <div className="ut-action-btn-wrap">
                        {/* Flag button */}
                        <button
                          title={flagged.has(row.id) ? "Unflag" : "Flag"}
                          className="ut-action-btn ut-action-btn-flag"
                          onClick={() => toggleFlag(row.id)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24"
                            fill={flagged.has(row.id) ? "white" : "none"}
                            stroke="white" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round"
                            style={{ flexShrink: 0, display: 'block' }}>
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                            <line x1="4" y1="22" x2="4" y2="15" />
                          </svg>
                        </button>

                        {/* View — icon + text */}
                        <button
                          title="View"
                          className="ut-action-btn ut-action-btn-detail"
                          onClick={() => setViewRow(row)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ flexShrink: 0, display: 'block' }}>   {/* ← add this */}
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" fill="none" stroke="white" />  {/* ← explicit attrs */}
                          </svg>
                          View
                        </button>

                        {/* Edit — icon + text */}
                        <button
                          title="Edit"
                          className="ut-action-btn ut-action-btn-edit"
                          onClick={() => setEditRow(row)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ flexShrink: 0, display: 'block' }}>   {/* ← add this */}
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />  {/* ← split into 2 paths */}
                          </svg>
                          Edit
                        </button>

                        {/* Delete — icon only, red background */}
                        <button
                          title="Delete"
                          className="ut-action-btn ut-action-btn-delete"
                          onClick={() => handleDelete(row.id, row[nameKey])}
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