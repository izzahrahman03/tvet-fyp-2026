// pages/IntakePage.jsx
import { useState, useEffect } from "react";
import {
  fetchIntakes,
  createIntake,
  updateIntake,
  deleteIntake,
} from "../api/applicationApi";
import useToast from "./userTable/useToast";
import "../../css/userManagement/userTable.css";

// ── Shared banner icons ───────────────────────────────────
const ErrorIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8"  x2="12"   y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// ── Status badge ──────────────────────────────────────────
function IntakeBadge({ status }) {
  const label = { active: "Active", upcoming: "Upcoming", ended: "Ended" }[status] || "Ended";
  return <span className={`status-badge ${status || "ended"}`}>{label}</span>;
}

// ── Capacity bar ──────────────────────────────────────────
function CapacityBar({ current, max }) {
  const pct   = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const full  = pct >= 100;
  const high  = pct >= 80;
  const color = full ? "#ef4444" : high ? "#f59e0b" : "#6366f1";
  return (
    <div style={{ minWidth: 120 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: 4 }}>
        <span>{current} / {max}</span>
        <span style={{ color, fontWeight: 600 }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 2, background: "#e2e8f0", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

// ── Sort Icon ─────────────────────────────────────────────
function SortIcon({ active, dir }) {
  if (!active)
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
        <path d="M3 6h18 M7 12h10 M10 18h4" />
      </svg>
    );
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2.5">
      <path d={dir === "asc" ? "M12 5l-7 7h14z" : "M12 19l7-7H5z"} />
    </svg>
  );
}

// ── Field-level error ─────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p style={{ margin: "4px 0 0", fontSize: "11px", fontWeight: "600", color: "#c0392b", display: "flex", alignItems: "center", gap: 4 }}>
      {msg}
    </p>
  );
}

// ── Intake Form Modal ─────────────────────────────────────
const EMPTY_FORM   = { intake_name: "", start_date: "", end_date: "", max_capacity: "" };
const EMPTY_ERRORS = { intake_name: "", start_date: "", end_date: "", max_capacity: "" };

function IntakeModal({ initial, onClose, onSave }) {
  const isEdit = !!initial;
  const [form,    setForm]    = useState(initial || EMPTY_FORM);
  const [errors,  setErrors]  = useState(EMPTY_ERRORS);
  const [saving,  setSaving]  = useState(false);
  const [apiErr,  setApiErr]  = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e = { ...EMPTY_ERRORS };
    let ok = true;
    if (!form.intake_name.trim()) { e.intake_name = "Intake name is required."; ok = false; }
    if (!form.start_date)         { e.start_date  = "Start date is required.";  ok = false; }
    if (!form.end_date)           { e.end_date    = "End date is required.";     ok = false; }
    if (form.start_date && form.end_date && new Date(form.start_date) >= new Date(form.end_date)) {
      e.end_date = "End date must be after start date."; ok = false;
    }
    if (!form.max_capacity)               { e.max_capacity = "Capacity is required.";          ok = false; }
    else if (parseInt(form.max_capacity) < 1) { e.max_capacity = "Capacity must be at least 1."; ok = false; }
    setErrors(e);
    return ok;
  };

  const handleSubmit = async () => {
    setApiErr("");
    if (!validate()) { setApiErr("Please fix the errors below and try again."); return; }
    setSaving(true);
    try {
      const saved = isEdit
        ? await updateIntake(initial.intake_id, form)
        : await createIntake(form);
      setSuccess(true);
      setTimeout(() => { onSave(saved); onClose(); }, 1500);
    } catch (err) {
      setApiErr(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 520, width: "95%" }}>
        <div className="modal-header">
          <p className="modal-title">{isEdit ? "Edit Intake" : "Create Intake"}</p>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {success && <div className="form-success"><CheckIcon />Intake {isEdit ? "updated" : "created"} successfully!</div>}
          {apiErr  && <div className="form-error"><ErrorIcon />{apiErr}</div>}

          <div className="form-field">
            <label>Intake Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input className={`form-input${errors.intake_name ? " input-error" : ""}`}
              placeholder="e.g. Intake 2026 Semester 1" value={form.intake_name}
              onChange={(e) => set("intake_name", e.target.value)} />
            <FieldError msg={errors.intake_name} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-field">
              <label>Start Date <span style={{ color: "#ef4444" }}>*</span></label>
              <input type="date" className={`form-input${errors.start_date ? " input-error" : ""}`}
                value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
              <FieldError msg={errors.start_date} />
            </div>
            <div className="form-field">
              <label>End Date <span style={{ color: "#ef4444" }}>*</span></label>
              <input type="date" className={`form-input${errors.end_date ? " input-error" : ""}`}
                value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
              <FieldError msg={errors.end_date} />
            </div>
          </div>

          <div className="form-field">
            <label>Max Capacity <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="number" min="1" className={`form-input${errors.max_capacity ? " input-error" : ""}`}
              placeholder="e.g. 50" value={form.max_capacity}
              onChange={(e) => set("max_capacity", e.target.value)} />
            <FieldError msg={errors.max_capacity} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="ut-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="ut-btn-primary" onClick={handleSubmit} disabled={saving || success}
            style={{ opacity: saving || success ? 0.7 : 1 }}>
            {saving ? "Saving…" : success ? "Saved!" : isEdit ? "Save Changes" : "Create Intake"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function IntakePage() {
  const [intakes,      setIntakes]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey,      setSortKey]      = useState("intake_name");
  const [sortDir,      setSortDir]      = useState("asc");
  const [showCreate,   setShowCreate]   = useState(false);
  const [editRow,      setEditRow]      = useState(null);
  const [confirmId,    setConfirmId]    = useState(null); // { id, name } | { ids[], names[] }
  const [selected,     setSelected]     = useState(new Set());

  const { toast, show } = useToast();

  useEffect(() => {
    fetchIntakes()
      .then(setIntakes)
      .catch(() => show("Failed to load intakes.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = intakes
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        (statusFilter === "all" || r.intake_status === statusFilter) &&
        Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const va = String(a[sortKey] ?? "").toLowerCase();
      const vb = String(b[sortKey] ?? "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  // ── Selection helpers ─────────────────────────────────────
  const toggleOne   = (id) => setSelected((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll   = ()   => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.intake_id)));
  const allChecked  = filtered.length > 0 && selected.size === filtered.length;
  const someChecked = selected.size > 0 && selected.size < filtered.length;

  const handleSaved = (intake) => {
    setIntakes((prev) => {
      const exists = prev.find((i) => i.intake_id === intake.intake_id);
      return exists ? prev.map((i) => (i.intake_id === intake.intake_id ? intake : i)) : [...prev, intake];
    });
    const wasEdit = !!editRow;
    setShowCreate(false);
    setEditRow(null);
    show(`Intake "${intake.intake_name}" ${wasEdit ? "updated" : "created"} successfully!`);
  };

  // Single delete
  const handleDeleteOne = (id, name) => setConfirmId({ ids: [id], names: [name] });

  // Bulk delete
  const handleBulkDelete = () => {
    const ids   = [...selected];
    const names = filtered.filter((r) => selected.has(r.intake_id)).map((r) => r.intake_name);
    setConfirmId({ ids, names });
  };

  const confirmDelete = async () => {
    const { ids, names } = confirmId;
    setConfirmId(null);
    try {
      await Promise.all(ids.map((id) => deleteIntake(id)));
      setIntakes((prev) => prev.filter((i) => !ids.includes(i.intake_id)));
      setSelected(new Set());
      show(ids.length === 1 ? `"${names[0]}" deleted.` : `${ids.length} intakes deleted.`, "error");
    } catch (err) {
      show(err.message || "Failed to delete intake.", "error");
    }
  };

  const COLUMNS = [
    { key: "intake_name",   label: "Intake Name" },
    { key: "start_date",    label: "Date Range"  },
    { key: "max_capacity",  label: "Capacity"    },
    { key: "intake_status", label: "Status"      },
  ];

  return (
    <div>
      {/* ── Modals ──────────────────────────────────────────── */}
      {showCreate && <IntakeModal onClose={() => setShowCreate(false)} onSave={handleSaved} />}
      {editRow && (
        <IntakeModal
          initial={{ ...editRow, start_date: toInputDate(editRow.start_date), end_date: toInputDate(editRow.end_date) }}
          onClose={() => setEditRow(null)}
          onSave={handleSaved}
        />
      )}

      {/* ── Delete Confirm ───────────────────────────────────── */}
      {confirmId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "2px", padding: "36px 32px", maxWidth: "420px", width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Delete Intake</h3>
            <p style={{ margin: "0 0 28px", fontSize: "14px", color: "#64748b", lineHeight: 1.7 }}>
              {confirmId.ids.length === 1
                ? <>Are you sure you want to delete <strong style={{ color: "#0f172a" }}>"{confirmId.names[0]}"</strong>?</>
                : <>Are you sure you want to delete <strong style={{ color: "#0f172a" }}>{confirmId.ids.length} intakes</strong>?</>
              }
              <br />This action <strong style={{ color: "#ef4444" }}>cannot be undone</strong>.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setConfirmId(null)}
                style={{ flex: 1, padding: "11px 0", borderRadius: "2px", border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#475569", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                Cancel
              </button>
              <button onClick={confirmDelete}
                style={{ flex: 1, padding: "11px 0", borderRadius: "2px", border: "none", background: "#ef4444", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && <div className={`ut-toast ${toast.kind}`}>{toast.msg}</div>}

      {/* ── Table wrapper ────────────────────────────────────── */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="ut-table-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input className="ut-table-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search intakes…" />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 0 }}>×</button>}
          </div>

          <select className="ut-table-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="ended">Ended</option>
          </select>

          <button className="ut-btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Intake
          </button>
        </div>

        <p className="table-count">
          Showing <strong>{filtered.length}</strong> of {intakes.length} intakes
          {search && ` for "${search}"`}
          {selected.size > 0 && <span style={{ marginLeft: "10px", color: "#1a56db", fontWeight: 600 }}>· {selected.size} selected</span>}
        </p>

        {/* ── Bulk action bar ───────────────────────────────── */}
        {selected.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "2px", padding: "10px 16px", margin: "0px 10px 10px 20px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#1d4ed8" }}>
              {selected.size} intake{selected.size > 1 ? "s" : ""} selected
            </span>
            <div style={{ flex: 1 }} />
            <button onClick={handleBulkDelete}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "#b91c1c", border: "1px solid #b91c1c", borderRadius: "2px", padding: "7px 14px", fontSize: "13.5px", fontWeight: "600", color: "#fff", cursor: "pointer" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6" />
              </svg>
              Delete Selected
            </button>
            <button onClick={() => setSelected(new Set())}
              style={{ background: "none", border: "1px solid #cbd5e1", borderRadius: "2px", padding: "7px 12px", fontSize: "13px", color: "#64748b", cursor: "pointer" }}>
              Clear
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Loading intakes…</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "40px", textAlign: "center" }}>
                    <input type="checkbox" checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked; }}
                      onChange={toggleAll}
                      style={{ cursor: "pointer", accentColor: "#1a56db" }} />
                  </th>
                  <th style={{ width: "48px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>#</th>
                  {COLUMNS.map(({ key, label }) => (
                    <th key={key} onClick={() => handleSort(key)} style={{ cursor: "pointer" }}>
                      <span className="th-inner">{label}<SortIcon active={sortKey === key} dir={sortDir} /></span>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length + 3}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <p className="empty-state-text">No intakes found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, idx) => (
                    <tr key={row.intake_id} style={{ background: selected.has(row.intake_id) ? "#eff6ff" : undefined }}>
                      <td style={{ textAlign: "center", width: "40px" }}>
                        <input type="checkbox" checked={selected.has(row.intake_id)}
                          onChange={() => toggleOne(row.intake_id)}
                          style={{ cursor: "pointer", accentColor: "#1a56db" }} />
                      </td>
                      <td style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", width: "48px" }}>{idx + 1}</td>
                      <td><span className="cell-name">{row.intake_name}</span></td>
                      <td><span className="cell-muted">{fmt(row.start_date)} — {fmt(row.end_date)}</span></td>
                      <td><CapacityBar current={row.current_count} max={row.max_capacity} /></td>
                      <td><IntakeBadge status={row.intake_status} /></td>
                      <td>
                        <div className="ut-action-btn-wrap">
                          <button title="Edit" className="ut-action-btn ut-action-btn-edit" onClick={() => setEditRow(row)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                          </button>
                          <button title="Delete" className="ut-action-btn ut-action-btn-delete" onClick={() => handleDeleteOne(row.intake_id, row.intake_name)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
                              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}