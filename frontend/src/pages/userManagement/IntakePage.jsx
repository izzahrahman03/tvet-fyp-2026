// pages/IntakePage.jsx
import { useState, useEffect } from "react";
import {
  fetchIntakes,
  createIntake,
  updateIntake,
  deleteIntake,
} from "../api/adminApi";

// ── Helpers ───────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// ── Status badge ──────────────────────────────────────────
function IntakeBadge({ status }) {
  const map = {
    active:   { label: "Active",   bg: "#dcfce7", color: "#16a34a" },
    upcoming: { label: "Upcoming", bg: "#eff6ff", color: "#2563eb" },
    ended:    { label: "Ended",    bg: "#f1f5f9", color: "#64748b" },
  };
  const s = map[status] || map.ended;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: "999px",
      fontSize: "12px", fontWeight: 600, background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ── Capacity bar ──────────────────────────────────────────
function CapacityBar({ current, max }) {
  const pct  = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const full  = pct >= 100;
  const high  = pct >= 80;
  const color = full ? "#ef4444" : high ? "#f59e0b" : "#6366f1";
  return (
    <div style={{ minWidth: 120 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: 4 }}>
        <span>{current} / {max}</span>
        <span style={{ color, fontWeight: 600 }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "#e2e8f0", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────
const EMPTY_FORM = { intake_name: "", start_date: "", end_date: "", max_capacity: "" };

// ── Intake Form Modal (Create / Edit) ─────────────────────
function IntakeModal({ initial, onClose, onSave }) {
  const isEdit = !!initial;
  const [form, setForm]     = useState(initial || EMPTY_FORM);
  const [error, setError]   = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.intake_name.trim() || !form.start_date || !form.end_date || !form.max_capacity) {
      return setError("All fields are required.");
    }
    if (new Date(form.start_date) >= new Date(form.end_date)) {
      return setError("Start date must be before end date.");
    }
    if (parseInt(form.max_capacity) < 1) {
      return setError("Capacity must be at least 1.");
    }
    setSaving(true);
    try {
      const saved = isEdit
        ? await updateIntake(initial.intake_id, form)
        : await createIntake(form);
      onSave(saved);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: "8px",
    border: "1px solid #e2e8f0", fontSize: "14px", color: "#1e293b",
    background: "#f8fafc", boxSizing: "border-box", outline: "none",
  };
  const labelStyle = {
    display: "block", fontSize: "12px", fontWeight: 600,
    color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4,
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 520, width: "95%" }}>
        <div className="modal-header">
          <p className="modal-title">{isEdit ? "Edit Intake" : "Create Intake"}</p>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#b91c1c", fontSize: 13 }}>
              {error}
            </div>
          )}

          <div>
            <label style={labelStyle}>Intake Name</label>
            <input
              style={inputStyle}
              placeholder="e.g. Intake 2026 Semester 1"
              value={form.intake_name}
              onChange={(e) => set("intake_name", e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" style={inputStyle} value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" style={inputStyle} value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Max Capacity</label>
            <input
              type="number" min="1" style={inputStyle}
              placeholder="e.g. 50"
              value={form.max_capacity}
              onChange={(e) => set("max_capacity", e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #e2e8f0",
                background: "#fff", fontSize: 14, fontWeight: 600, color: "#475569", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
                background: saving ? "#a5b4fc" : "#6366f1", fontSize: 14, fontWeight: 600,
                color: "#fff", cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Intake"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function IntakePage() {
  const [intakes, setIntakes]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate]   = useState(false);
  const [editRow, setEditRow]         = useState(null);
  const [confirmId, setConfirmId]     = useState(null); // { id, name }
  const [toast, setToast]             = useState(null);

  const showToast = (msg, kind = "success") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchIntakes()
      .then(setIntakes)
      .catch(() => showToast("Failed to load intakes.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = intakes.filter((i) => {
    const matchSearch = i.intake_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.intake_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSaved = (intake) => {
    setIntakes((prev) => {
      const exists = prev.find((i) => i.intake_id === intake.intake_id);
      return exists
        ? prev.map((i) => (i.intake_id === intake.intake_id ? intake : i))
        : [...prev, intake];
    });
    setShowCreate(false);
    setEditRow(null);
    showToast(`Intake "${intake.intake_name}" ${editRow ? "updated" : "created"}!`);
  };

  const handleDelete = async () => {
    const { id, name } = confirmId;
    setConfirmId(null);
    try {
      await deleteIntake(id);
      setIntakes((prev) => prev.filter((i) => i.intake_id !== id));
      showToast(`"${name}" deleted.`, "error");
    } catch (err) {
      showToast(err.message || "Failed to delete intake.", "error");
    }
  };

  return (
    <div>
      {/* ── Modals ──────────────────────────────────────────── */}
      {showCreate && (
        <IntakeModal
          onClose={() => setShowCreate(false)}
          onSave={handleSaved}
        />
      )}
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
          <div style={{ background: "#fff", borderRadius: 16, padding: "36px 32px", maxWidth: 420, width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", textAlign: "center", animation: "toastSlideUp 0.25s ease" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Delete Intake</h3>
            <p style={{ margin: "0 0 28px", fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>
              Are you sure you want to delete <strong style={{ color: "#0f172a" }}>"{confirmId.name}"</strong>?<br />
              This action <strong style={{ color: "#ef4444" }}>cannot be undone</strong>.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setConfirmId(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 14, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleDelete} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "#ef4444", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <div className={`toast ${toast.kind}`} style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "14px 24px", borderRadius: 10, fontSize: 15, fontWeight: 500, minWidth: 280, maxWidth: 480, textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", animation: "toastSlideUp 0.3s ease" }}>
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
              placeholder="Search intakes…"
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>

          <select
            className="table-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="ended">Ended</option>
          </select>

          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 5v14 M5 12h14" />
            </svg>
            New Intake
          </button>
        </div>

        <p className="table-count">
          Showing <strong>{filtered.length}</strong> of {intakes.length} intakes
          {search && ` for "${search}"`}
        </p>

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
                  <th>Intake Name</th>
                  <th>Date Range</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <p className="empty-state-text">No intakes found.</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((row) => (
                  <tr key={row.intake_id}>
                    <td><span className="cell-name">{row.intake_name}</span></td>
                    <td>
                      <span className="cell-muted">
                        {fmt(row.start_date)} — {fmt(row.end_date)}
                      </span>
                    </td>
                    <td><CapacityBar current={row.current_count} max={row.max_capacity} /></td>
                    <td><IntakeBadge status={row.intake_status} /></td>
                    <td>
                      <div className="action-btn-wrap">
                        {[
                          {
                            icon: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
                            bg: "#fffbeb", stroke: "#f59e0b", label: "Edit",
                            action: () => setEditRow(row),
                          },
                          {
                            icon: "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
                            bg: "#fef2f2", stroke: "#ef4444", label: "Delete",
                            action: () => setConfirmId({ id: row.intake_id, name: row.intake_name }),
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