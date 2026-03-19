// components/UserTable.jsx
import { useState, useEffect } from "react";
import {
  fetchUsers,
  fetchApplications,
  deleteUser,
  deleteApplication,
  importUsers,
} from "../api/adminApi";
import ImportModal  from "./userTable/ImportModal";
import StatusBadge, { STATUS_LABEL } from "./userTable/StatusBadge";
import AddUserModal from "./userTable/AddUserModal";
import ViewModal    from "./userTable/ViewModal";
import EditModal    from "./userTable/EditModal";
import useToast     from "./userTable/useToast";
import { COLUMNS, COL_LABEL } from "./userTable/tableConfig";

export default function UserTable({ type }) {
  const [rows, setRows]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [sortKey, setSortKey]         = useState("name");
  const [sortDir, setSortDir]         = useState("asc");
  const [statusFilter, setStatus]     = useState("All");
  const [showAdd, setShowAdd]         = useState(false);
  const [showImport, setImport]       = useState(false);
  const [viewRow, setViewRow]         = useState(null);
  const [editRow, setEditRow]         = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { id, name } | null
  const { toast, show }               = useToast();

  const columns = COLUMNS[type] || ["name", "email", "status"];
  const nameKey = type === "industry_partner" ? "company_name" : "name";

  // ── Fetch on type change ──────────────────────────────────
  // FIX: applications have their own endpoint — calling fetchUsers with
  //      type="application" hit the /admin/users fallback which returned
  //      every user in the database instead of the applications table.
  useEffect(() => {
    setLoading(true);
    setRows([]);

    const load = type === "application"
      ? fetchApplications()          // GET /admin/applications  ← correct
      : fetchUsers(type);            // GET /admin/users?role=<type>

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

  const handleDelete = (id, name) => {
    setConfirmDialog({ id, name });
  };

  const confirmDelete = async () => {
    const { id, name } = confirmDialog;
    setConfirmDialog(null);
    try {
      // FIX: applications use a separate delete endpoint
      if (type === "application") {
        await deleteApplication(id);   // DELETE /admin/applications/:id
      } else {
        await deleteUser(type, id);    // DELETE /admin/users/:id?role=<type>
      }
      setRows((p) => p.filter((r) => r.id !== id));
      show(`"${name}" deleted.`, "error");
    } catch (err) {
      console.error("delete error:", err);
      show("Failed to delete record.", "error");
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
            borderRadius: "16px",
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
              Are you sure you want to delete{" "}
              <strong style={{ color: "#0f172a" }}>"{confirmDialog.name}"</strong>?
              <br />
              This action <strong style={{ color: "#ef4444" }}>cannot be undone</strong>.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{
                  flex:         1,
                  padding:      "11px 0",
                  borderRadius: "10px",
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
                  borderRadius: "10px",
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
        <div
          className={`toast ${toast.kind}`}
          style={{
            position:     "fixed",
            bottom:       "32px",
            left:         "50%",
            transform:    "translateX(-50%)",
            zIndex:       9999,
            padding:      "14px 24px",
            borderRadius: "10px",
            fontSize:     "15px",
            fontWeight:   500,
            minWidth:     "280px",
            maxWidth:     "480px",
            textAlign:    "center",
            boxShadow:    "0 8px 24px rgba(0,0,0,0.15)",
            animation:    "toastSlideUp 0.3s ease",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <path d="M21 21l-4.35-4.35 M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              className="table-search-input"
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

          <select className="table-filter-select" value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
            {allStatuses.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>
            ))}
          </select>

          {/* Hide Import button for applications — they come from the applicant portal */}
          {type !== "application" && (
            <button className="btn-secondary" onClick={() => setImport(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" />
              </svg>
              Import Excel
            </button>
          )}

          {(type === "industry_partner" || type === "industry_supervisor") && (
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
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
        </p>

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
                    <td colSpan={columns.length + 1}>
                      <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <p className="empty-state-text">No records found.</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((row) => (
                  <tr key={row.id}>
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
                      <div className="action-btn-wrap">
                        {[
                          {
                            icon:   "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
                            bg:     "#eff6ff", stroke: "#3b82f6", label: "View",
                            action: () => setViewRow(row),
                          },
                          {
                            icon:   "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
                            bg:     "#fffbeb", stroke: "#f59e0b", label: "Edit",
                            action: () => setEditRow(row),
                          },
                          {
                            icon:   "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
                            bg:     "#fef2f2", stroke: "#ef4444", label: "Delete",
                            action: () => handleDelete(row.id, row[nameKey]),
                          },
                        ].map(({ icon, bg, stroke, label, action }) => (
                          <button key={label} title={label} className="action-btn" style={{ background: bg }} onClick={action}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d={icon} />
                            </svg>
                          </button>
                        ))}
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