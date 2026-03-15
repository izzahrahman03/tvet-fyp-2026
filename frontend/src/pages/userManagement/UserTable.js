// components/UserTable.jsx
import { useState, useEffect } from "react";
import { fetchUsers, addUser, deleteUser, importUsers } from "../api/adminApi";
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
  const isStudent    = type === "student";

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    industry: "", location: "",
    company: "", position: "",
    program: "", year: "",
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
    { label: "Full Name",     key: "name",  placeholder: isPartner ? "Tech Solutions Sdn Bhd" : "e.g. Ahmad Faris" },
    { label: "Email Address", key: "email", placeholder: "email@example.com" },
    { label: "Phone Number",  key: "phone", placeholder: "e.g. 012-3456789" },
    ...(isPartner    ? [
      { label: "Industry Sector", key: "industry", placeholder: "e.g. IT & Software" },
      { label: "Location",        key: "location",  placeholder: "e.g. Kuala Lumpur" },
    ] : []),
    ...(isSupervisor ? [
      { label: "Company",          key: "company",  placeholder: "e.g. Tech Solutions Sdn Bhd" },
      { label: "Role / Position",  key: "position", placeholder: "e.g. Senior Engineer" },
    ] : []),
    ...(isStudent ? [
      { label: "Program", key: "program", placeholder: "e.g. Software Engineering" },
      { label: "Year",    key: "year",    placeholder: "e.g. Year 3" },
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

// ─── Toast ────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, kind = "success") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

// ─── Column config — matched to actual DB columns ─────────
//
// applicant    → applications JOIN application_education JOIN application_skills
// student      → users (name, email, phone, active_status, created_at)
// partner      → users (name, email, phone, active_status, created_at)
// supervisor   → users (name, email, phone, active_status, created_at)
// ──────────────────────────────────────────────────────────
const COLUMNS = {
  applicant: [
    "full_name", "ic_number", "date_of_birth", "gender", "race",
    "marital_status", "email", "phone",
    "street_address", "city", "postal_code", "state", "country",
    "status", "updated_at",
    "institute_name", "qualification", "major", "start_date", "end_date",
    "skill_name", "proficiency",
  ],
  student:             ["name", "email", "phone", "status", "date"],
  industry_partner:    ["name", "email", "phone", "status", "date"],
  industry_supervisor: ["name", "email", "phone", "status", "date"],
};

const COL_LABEL = {
  full_name:      "Full Name",
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
  skill_name:     "Skill",
  proficiency:    "Proficiency",
  name:           "Name",
  date:           "Joined",
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
  const { toast, show }           = useToast();

  const columns = COLUMNS[type] || ["name", "email", "status"];

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
  const allStatuses = ["All", ...new Set(rows.map((r) => r.status).filter(Boolean))];

  const filtered = rows
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        (statusFilter === "All" || r.status === statusFilter) &&
        Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q))
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
    show(`User "${user.name || user.full_name}" added!`);
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

  // ── Name key differs per role ──────────────────────────────
  const nameKey = type === "applicant" ? "full_name" : "name";

  return (
    <div>
      {showAdd    && <AddUserModal type={type} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {showImport && <ImportModal  type={type} onClose={() => setImport(false)}  onImport={handleImported} />}

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

          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 5v14 M5 12h14" />
            </svg>
            Add New
          </button>
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
                        ) : col === "full_name" || col === "name" ? (
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
                            action: () => alert(`View: ${row[nameKey]}`),
                          },
                          {
                            icon:   "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
                            bg:     "#fffbeb", stroke: "#f59e0b",
                            label:  "Edit",
                            action: () => alert(`Edit: ${row[nameKey]}`),
                          },
                          {
                            icon:   "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
                            bg:     "#fef2f2", stroke: "#ef4444",
                            label:  "Delete",
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