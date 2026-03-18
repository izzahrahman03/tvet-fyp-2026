// components/UserTable.jsx
import { useState, useEffect } from "react";
import { fetchUsers, deleteUser, importUsers } from "../api/adminApi";
import ImportModal    from "./userTable/ImportModal";
import StatusBadge, { STATUS_LABEL } from "./userTable/StatusBadge";
import AddUserModal   from "./userTable/AddUserModal";
import ViewModal      from "./userTable/ViewModal";
import EditModal      from "./userTable/EditModal";
import useToast       from "./userTable/useToast";
import { COLUMNS, COL_LABEL } from "./userTable/tableConfig";

export default function UserTable({ type }) {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [sortKey, setSortKey]     = useState("name");
  const [sortDir, setSortDir]     = useState("asc");
  const [statusFilter, setStatus] = useState("All");
  const [showAdd, setShowAdd]     = useState(false);
  const [showImport, setImport]   = useState(false);
  const [viewRow, setViewRow]     = useState(null);
  const [editRow, setEditRow]     = useState(null);
  const { toast, show }           = useToast();

  const columns = COLUMNS[type] || ["name", "email", "status"];
  const nameKey = "name";

  useEffect(() => {
    setLoading(true);
    setRows([]);
    fetchUsers(type)
      .then(setRows)
      .catch((err) => {
        console.error("fetchUsers error:", err);
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

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteUser(type, id);
    setRows((p) => p.filter((r) => r.id !== id));
    show(`"${name}" deleted.`, "error");
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

      {toast && <div className={`toast ${toast.kind}`}>{toast.msg}</div>}

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

          <button className="btn-secondary" onClick={() => setImport(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" />
            </svg>
            Import Excel
          </button>

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