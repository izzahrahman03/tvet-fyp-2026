// components/UserTable.jsx
import { useState, useEffect } from "react";
import { fetchUsers, addUser, updateUser, deleteUser, importUsers } from "../api/adminApi";
import ImportModal from "./ImportModal";

// ─── Status Badge ─────────────────────────────────────────
const STATUS_STYLES = {
  active:       { bg: "#dcfce7", color: "#16a34a", dot: "#22c55e" },
  inactive:     { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  approved:     { bg: "#dcfce7", color: "#16a34a", dot: "#22c55e" },
  pending:      { bg: "#fef9c3", color: "#ca8a04", dot: "#eab308" },
  under_review: { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  rejected:     { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
};

function StatusBadge({ status }) {
  const key = (status || "").toLowerCase();
  const s   = STATUS_STYLES[key] || { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" };
  return (
    <span className="status-badge" style={{ background: s.bg, color: s.color }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status ?? "—"}
    </span>
  );
}

// ─── Add User Modal ───────────────────────────────────────
function AddUserModal({ type, onClose, onSave }) {
  const isPartner    = type === "industry_partner";
  const isSupervisor = type === "industry_supervisor";

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    industry_sector: "", location: "",
    company: "", position: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim())
      return alert("Name and email are required.");
    setSaving(true);
    try {
      const saved = await addUser(type, form);
      onSave(saved);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { label: "Name",     key: "name",  placeholder: isPartner ? "Tech Solutions Sdn Bhd" : "e.g. Ahmad Faris" },
    { label: "Email Address", key: "email", placeholder: "email@example.com" },
    { label: "Phone Number",  key: "phone", placeholder: "e.g. 012-3456789" },
    ...(isPartner    ? [
      { label: "Industry Sector", key: "industry_sector", placeholder: "e.g. IT & Software" },
      { label: "Location",        key: "location",  placeholder: "e.g. Kuala Lumpur" },
    ] : []),
    ...(isSupervisor ? [
      { label: "Company",          key: "company",  placeholder: "e.g. Tech Solutions Sdn Bhd" },
      { label: "Role / Position",  key: "position", placeholder: "e.g. Senior Engineer" },
    ] : []),
  ];

  const typeLabel = {
    applicant:           "Applicant",
    student:             "Student",
    industry_partner:    "Industry Partner",
    industry_supervisor: "Industry Supervisor",
  }[type] || "User";

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <p className="modal-title">Add New {typeLabel}</p>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-form">
          {fields.map(({ label, key, placeholder }) => (
            <div key={key} className="form-field">
              <label>{label}</label>
              <input className="form-input" value={form[key]} onChange={set(key)} placeholder={placeholder} />
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────
// Define your column groupings
const SECTIONS = [
  {
    title: "Personal Information",
    icon: "👤",
    cols: ["name", "ic_number", "date_of_birth", "gender", "race",
    "marital_status", "email", "phone",
    "street_address", "city", "postal_code", "state", "country",],
  },
  {
    title: "Education",
    icon: "🎓",
    cols: ["institute_name", "qualification", "major", "start_date", "end_date",],
  },
  {
    title: "Skills",
    icon: "💼",
    cols: ["skill_name", "proficiency"],
  },
];

function ViewModal({ row, columns, onClose }) {
  // Only show sections that have at least one matching column in this row
  const activeSections = SECTIONS.map((section) => ({
    ...section,
    activeCols: section.cols.filter((col) => columns.includes(col)),
  })).filter((s) => s.activeCols.length > 0);

  // Catch-all: any columns not assigned to a section
  const assignedCols = SECTIONS.flatMap((s) => s.cols);
  const otherCols = columns.filter((col) => !assignedCols.includes(col));

  const renderValue = (col) => {
    if (col === "status") return <StatusBadge status={row[col]} />;
    if (["date", "updated_at", "created_at", "dob"].includes(col))
      return row[col] ? new Date(row[col]).toLocaleDateString("en-MY") : "—";
    return row[col] ?? "—";
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "960px", width: "95%" }}>

        {/* Header */}
        <div className="modal-header">
          <p className="modal-title">View Details</p>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: "24px", overflowY: "auto", maxHeight: "70vh", display: "flex", flexDirection: "column", gap: "28px" }}>

          {activeSections.map((section) => (
            <div key={section.title}>
              {/* Section Header */}
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                marginBottom: "14px", paddingBottom: "8px",
                borderBottom: "2px solid #e2e8f0",
              }}>
                <span style={{ fontSize: "16px" }}>{section.icon}</span>
                <span style={{ fontWeight: "600", fontSize: "14px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {section.title}
                </span>
              </div>

              {/* 2-column grid inside each section */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                {section.activeCols.map((col) => (
                  <div key={col} className="form-field" style={{ margin: 0 }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {COL_LABEL[col] || col}
                    </label>
                    <div style={{
                      padding: "9px 12px", background: "#f8fafc",
                      borderRadius: "8px", border: "1px solid #e2e8f0",
                      fontSize: "14px", color: "#1e293b", marginTop: "4px",
                    }}>
                      {renderValue(col)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Other / uncategorized columns */}
          {otherCols.length > 0 && (
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                marginBottom: "14px", paddingBottom: "8px",
                borderBottom: "2px solid #e2e8f0",
              }}>
                <span style={{ fontSize: "16px" }}>📋</span>
                <span style={{ fontWeight: "600", fontSize: "14px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Other Details
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                {otherCols.map((col) => (
                  <div key={col} className="form-field" style={{ margin: 0 }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {COL_LABEL[col] || col}
                    </label>
                    <div style={{
                      padding: "9px 12px", background: "#f8fafc",
                      borderRadius: "8px", border: "1px solid #e2e8f0",
                      fontSize: "14px", color: "#1e293b", marginTop: "4px",
                    }}>
                      {renderValue(col)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────
function EditModal({ row, type, onClose, onSave }) {
  const [form,   setForm]   = useState({ ...row });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const editableFields = {
    applicant:           ["status"],
    student:             ["name", "email", "phone", "status"],
    industry_partner:    ["name", "email", "phone", "status"],
    industry_supervisor: ["name", "email", "phone", "status"],
  }[type] || ["name", "email", "status"];

  const statusOptions = type === "applicant"
    ? ["pending", "under_review", "approved", "rejected"]
    : ["active", "inactive"];

  const handleSave = async () => {
    const nameField = type === "applicant" ? "name" : "name";
    if (!form[nameField]?.trim()) return setError("Name is required.");
    if (!form.email?.trim())      return setError("Email is required.");

    setSaving(true);
    setError("");
    try {
      const updated = await updateUser(type, row.id, form);
      onSave(updated ?? { ...row, ...form });
    } catch (err) {
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <p className="modal-title">Edit User</p>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-form">
          {editableFields.map((col) => (
            <div key={col} className="form-field">
              <label>{COL_LABEL[col] || col}</label>
              {col === "status" ? (
                <select className="form-input" value={form[col] || ""} onChange={set(col)}>
                  {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input
                  className="form-input"
                  value={form[col] || ""}
                  onChange={set(col)}
                  placeholder={COL_LABEL[col] || col}
                />
              )}
            </div>
          ))}
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#b91c1c" }}>
              {error}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, kind = "success") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

// ─── Column config ────────────────────────────────────────
const COLUMNS = {
  applicant: [
    "name", "ic_number", "date_of_birth", "gender", "race",
    "marital_status", "email", "phone",
    "street_address", "city", "postal_code", "state", "country",
    "institute_name", "qualification", "major", "start_date", "end_date",
    "skill_name", "proficiency",
    "status", "updated_at",
  ],
  student:             ["name", "email", "phone", "date"],
  industry_partner:    ["name", "email", "phone", "industry_sector", "location", "status", "date"],
  industry_supervisor: ["name", "email", "phone", "company", "position", "status", "date"],
};

const COL_LABEL = {
  name:           "Name",
  ic_number:      "IC Number",
  date_of_birth:  "Date of Birth",
  gender:         "Gender",
  race:           "Race",
  marital_status: "Marital Status",
  email:          "Email",
  phone:          "Phone",
  street_address: "Address",
  city:           "City",
  postal_code:    "Postal Code",
  state:          "State",
  country:        "Country",
  status:         "Status",
  updated_at:     "Last Updated",
  institute_name: "Institute",
  qualification:  "Qualification",
  major:          "Major",
  start_date:     "Start Date",
  end_date:       "End Date",
  skill_name:      "Skill",
  proficiency:     "Proficiency",
  industry_sector: "Industry Sector",
  location:        "Location",
  company:         "Company",
  position:        "Role / Position",
  date:            "Joined",
  interview_datetime: "Interview Date & Time",
  venue:           "Venue",
  interviewer_name: "Interviewer",
  remarks:         "Remarks",
};

// ─── Main UserTable ───────────────────────────────────────
export default function UserTable({ type }) {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [sortKey, setSortKey]     = useState("name");
  const [sortDir, setSortDir]     = useState("asc");
  const [statusFilter, setStatus] = useState("All");
  const [showAdd, setShowAdd]     = useState(false);
  const [showImport, setImport]   = useState(false);
  const [viewRow, setViewRow]     = useState(null); // ✅ here, not in AddUserModal
  const [editRow, setEditRow]     = useState(null); // ✅ here, not in AddUserModal
  const { toast, show }           = useToast();

  const columns = COLUMNS[type] || ["name", "email", "status"];
  const nameKey = type === "applicant" ? "full_name" : "name";

  // ── Fetch ─────────────────────────────────────────────────
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

  // ── Sort ──────────────────────────────────────────────────
  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  // ── Filter + sort ─────────────────────────────────────────
  const allStatuses = ["All", ...new Set(rows.filter(Boolean).map((r) => r.status).filter(Boolean))];

  const filtered = rows
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        (statusFilter === "All" || r.status === statusFilter) &&
        Object.values(r || {}).some((v) => String(v ?? "").toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const va = String(a[sortKey] ?? "").toLowerCase();
      const vb = String(b[sortKey] ?? "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  // ── CRUD ──────────────────────────────────────────────────
  const handleAdd = (user) => {
    setRows((p) => [...p, user]);
    show(`User "${user.name || user.name}" added!`);
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

  // ── Sort icon ─────────────────────────────────────────────
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
      {/* ✅ All modals live here in UserTable, not inside AddUserModal */}
      {showAdd    && <AddUserModal type={type} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {showImport && <ImportModal  type={type} onClose={() => setImport(false)}  onImport={handleImported} />}
      {viewRow    && <ViewModal    row={viewRow} columns={columns} onClose={() => setViewRow(null)} />}
      {editRow    && (
        <EditModal
          row={editRow}
          type={type}
          onClose={() => setEditRow(null)}
          onSave={(updated) => {
            setRows((p) => p.map((r) => r.id === updated.id ? updated : r));
            setEditRow(null);
            show(`"${updated[nameKey]}" updated!`);
          }}
        />
      )}

      {toast && <div className={`toast ${toast.kind}`}>{toast.msg}</div>}

      <div className="table-wrapper">

        {/* Toolbar */}
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
            {allStatuses.map((s) => <option key={s}>{s}</option>)}
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

        {/* Record count */}
        <p className="table-count">
          Showing <strong>{filtered.length}</strong> of {rows.length} records
          {search && ` for "${search}"`}
        </p>

        {/* Table */}
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
                        ) : col === "name" || col === "name" ? (
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
                            bg:     "#eff6ff", stroke: "#3b82f6",
                            label:  "View",
                            action: () => setViewRow(row),   // ✅ correct
                          },
                          {
                            icon:   "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
                            bg:     "#fffbeb", stroke: "#f59e0b",
                            label:  "Edit",
                            action: () => setEditRow(row),   // ✅ correct
                          },
                          {
                            icon:   "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
                            bg:     "#fef2f2", stroke: "#ef4444",
                            label:  "Delete",
                            action: () => handleDelete(row.id, row[nameKey]), // ✅ correct
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