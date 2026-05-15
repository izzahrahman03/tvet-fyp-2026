// pages/InterviewSlot.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchAdminInterviewSlots,
  createInterviewSlot,
  updateInterviewSlot,
  // deleteInterviewSlot,
} from "../api/applicationApi";
import { fetchInterviewers } from "../api/adminApi";
import useToast from "./userTable/useToast";
import "../../css/userManagement/userTable.css";

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

// ── Capacity bar ──────────────────────────────────────────
function CapacityBar({ booked, capacity }) {
  const pct    = capacity > 0 ? Math.min((booked / capacity) * 100, 100) : 0;
  const isFull = booked >= capacity;
  const color  = isFull ? "#dc2626" : pct > 75 ? "#f59e0b" : "#16a34a";
  return (
    <div style={{ minWidth: 120 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#475569", marginBottom: 4 }}>
        <span>{booked} / {capacity}</span>
        <span style={{ color, fontWeight: 700 }}>{isFull ? "Full" : `${capacity - booked} left`}</span>
      </div>
      <div style={{ height: 6, background: "#e2e8f0", borderRadius: 2 }}>
        <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: color, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ── Slot status badge ─────────────────────────────────────
function SlotBadge({ booked, capacity, datetime }) {
  const isPast = new Date(datetime) < new Date();
  const isFull = booked >= capacity;
  if (isPast) return <span className="status-badge past">Past</span>;
  if (isFull) return <span className="status-badge full">Full</span>;
  return <span className="status-badge open">Open</span>;
}

// ── Formatters ────────────────────────────────────────────
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: true });

const getSlotStatus = (slot) => {
  if (new Date(slot.datetime) < new Date()) return "past";
  if (Number(slot.booked) >= slot.capacity)  return "full";
  return "open";
};

// ── Interviewer multi-select with name search ─────────────
// Defined at module level (outside InterviewSlot) so React never
// treats it as a new component type on re-render — if it were
// defined inside InterviewSlot, every state change would unmount
// and remount this component, resetting `open` to false.
function InterviewerSelect({ interviewers, selectedIds, onChange, error }) {
  const [open,   setOpen]   = useState(false);
  const [ivSearch, setIvSearch] = useState("");
  const ref = useRef(null);

  // Close on genuine outside clicks only
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setIvSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const visible = interviewers.filter((iv) =>
    iv.name.toLowerCase().includes(ivSearch.toLowerCase())
  );

  return (
    <div
      className="form-field"
      style={{ flex: "1 1 240px", minWidth: 200, position: "relative" }}
      ref={ref}
    >
      <label>Interviewers <span style={{ color: "#ef4444" }}>*</span></label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setIvSearch(""); }}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 12px", border: `1.5px solid ${error ? "#ef4444" : open ? "#1a56db" : "#c8d5e8"}`,
          borderRadius: 2, background: "#fff", cursor: "pointer", fontSize: 13,
          color: selectedIds.length ? "#0f172a" : "#94a3b8", textAlign: "left",
        }}
      >
        <span>
          {selectedIds.length === 0
            ? "Select interviewers…"
            : `${selectedIds.length} interviewer${selectedIds.length > 1 ? "s" : ""} selected`}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown — stopPropagation on mousedown keeps the panel open
          while the user ticks multiple checkboxes in a row. */}
      {open && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "absolute", zIndex: 200, marginTop: 4, width: "100%",
            background: "#fff", border: "1.5px solid #c8d5e8", borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
          }}
        >
          {/* Search box */}
          <div style={{
            padding: "8px 10px", borderBottom: "1px solid #e2e8f0",
            display: "flex", alignItems: "center", gap: 6, background: "#f8fafc",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              autoFocus
              type="text"
              value={ivSearch}
              onChange={(e) => setIvSearch(e.target.value)}
              placeholder="Search name…"
              style={{
                flex: 1, border: "none", outline: "none", fontSize: 12,
                background: "transparent", color: "#0f172a",
              }}
            />
            {ivSearch && (
              <button
                onClick={() => setIvSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, lineHeight: 1, fontSize: 14 }}
              >×</button>
            )}
          </div>

          {/* Interviewer list */}
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {visible.length === 0 ? (
              <p style={{ margin: 0, padding: "10px 12px", fontSize: 13, color: "#94a3b8" }}>
                {interviewers.length === 0 ? "No interviewers available." : "No match found."}
              </p>
            ) : visible.map((iv) => {
              const checked = selectedIds.includes(iv.id);
              return (
                <label
                  key={iv.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 12px", cursor: "pointer", fontSize: 13,
                    background: checked ? "#eff6ff" : "transparent",
                    borderBottom: "1px solid #f1f5f9",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    style={{ accentColor: "#1a56db", cursor: "pointer", flexShrink: 0 }}
                    onChange={() => onChange(iv.id)}
                  />
                  <span style={{ color: checked ? "#1d4ed8" : "#0f172a" }}>{iv.name}</span>
                  {checked && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="3" style={{ marginLeft: "auto", flexShrink: 0 }}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </label>
              );
            })}
          </div>

          {/* Footer: count + Done */}
          <div style={{
            padding: "8px 12px", borderTop: "1px solid #e2e8f0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#f8fafc",
          }}>
            <span style={{ fontSize: 11, color: "#64748b" }}>
              {selectedIds.length} selected
            </span>
            <button
              onClick={() => { setOpen(false); setIvSearch(""); }}
              style={{
                fontSize: 12, fontWeight: 600, color: "#1d4ed8",
                background: "none", border: "none", cursor: "pointer", padding: "2px 6px",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Selected tags */}
      {selectedIds.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
          {selectedIds.map((id) => {
            const iv = interviewers.find((x) => x.id === id);
            return iv ? (
              <span key={id} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "#dbeafe", color: "#1d4ed8",
                fontSize: 11, fontWeight: 600, borderRadius: 2, padding: "2px 8px",
              }}>
                {iv.name}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => onChange(iv.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#1d4ed8", padding: 0, lineHeight: 1, fontSize: 14 }}
                >×</button>
              </span>
            ) : null;
          })}
        </div>
      )}

      <FieldError msg={error} />
    </div>
  );
}

// ── Form body (fields only — no submit buttons in edit mode) ──
// Also defined at module level for the same reason as InterviewerSelect.
function FormBody({
  f, errs, onFieldChange, saving: isSaving, onSubmit, isEdit,
  interviewers, onInterviewerChange, apiErr, editApiErr,
}) {
  return (
    <>
      {(isEdit ? editApiErr : apiErr) && (
        <div className="form-error" style={{ margin: "16px 24px 0", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          {isEdit ? editApiErr : apiErr}
        </div>
      )}
      <div style={{ padding: "20px 24px 24px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* Date & Time */}
        <div className="form-field" style={{ flex: "1 1 200px", minWidth: 200 }}>
          <label>Date & Time <span style={{ color: "#ef4444" }}>*</span></label>
          <input
            className={`form-input${errs.datetime ? " input-error" : ""}`}
            type="datetime-local"
            value={f.datetime}
            min={new Date().toISOString().slice(0, 16)}
            onChange={(e) => onFieldChange("datetime", e.target.value)}
          />
          <FieldError msg={errs.datetime} />
        </div>

        {/* Capacity */}
        <div className="form-field" style={{ flex: "0 0 140px" }}>
          <label>Capacity <span style={{ color: "#ef4444" }}>*</span></label>
          <input
            className={`form-input${errs.capacity ? " input-error" : ""}`}
            type="number" min="1" max="500"
            value={f.capacity}
            onChange={(e) => onFieldChange("capacity", e.target.value)}
          />
          <FieldError msg={errs.capacity} />
        </div>

        {/* Interviewers */}
        <InterviewerSelect
          interviewers={interviewers}
          selectedIds={f.interviewer_ids}
          error={errs.interviewer_ids}
          onChange={onInterviewerChange}
        />

        {/* Create button — only shown inline for the create panel */}
        {!isEdit && (
          <div className="form-field" style={{ flex: "0 0 auto", display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div>
              <label style={{ visibility: "hidden", display: "block" }}>​</label>
              <button className="ut-btn-primary" onClick={onSubmit} disabled={isSaving}>
                {isSaving ? "Creating…" : "Create Slot"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function InterviewSlot() {
  const [slots,        setSlots]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [deleting,     setDeleting]     = useState(null);
  const [confirmId,    setConfirmId]    = useState(null);
  const [sortKey,      setSortKey]      = useState("datetime");
  const [sortDir,      setSortDir]      = useState("asc");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected,     setSelected]     = useState(new Set());
  const [interviewers, setInterviewers] = useState([]);

  // ── Create form state ─────────────────────────────────
  const [form,   setForm]   = useState({ datetime: "", capacity: 10, interviewer_ids: [] });
  const [errors, setErrors] = useState({ datetime: "", capacity: "", interviewer_ids: "" });
  const [apiErr, setApiErr] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Edit modal state ──────────────────────────────────
  const [editSlot,   setEditSlot]   = useState(null);
  const [editForm,   setEditForm]   = useState({ datetime: "", capacity: 10, interviewer_ids: [] });
  const [editErrors, setEditErrors] = useState({ datetime: "", capacity: "", interviewer_ids: "" });
  const [editApiErr, setEditApiErr] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const { toast, show } = useToast();

  // ── Fetch ─────────────────────────────────────────────
  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminInterviewSlots();
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      show(err.message || "Failed to load slots.", "error");
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  useEffect(() => {
    fetchInterviewers()
      .then((data) => setInterviewers(Array.isArray(data) ? data : []))
      .catch(() => show("Failed to load interviewers.", "error"));
  }, []);

  // ── Sort + Filter + Search ────────────────────────────
  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = [...slots]
    .filter((slot) => {
      const statusMatch = statusFilter === "all" || getSlotStatus(slot) === statusFilter;
      const q = search.toLowerCase();
      const searchMatch = !q || [fmtDate(slot.datetime), fmtTime(slot.datetime), String(slot.capacity), String(slot.booked), getSlotStatus(slot)].some((v) => v.toLowerCase().includes(q));
      return statusMatch && searchMatch;
    })
    .sort((a, b) => {
      if (sortKey === "datetime")
        return sortDir === "asc" ? new Date(a.datetime) - new Date(b.datetime) : new Date(b.datetime) - new Date(a.datetime);
      const va = String(a[sortKey] ?? "");
      const vb = String(b[sortKey] ?? "");
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  // ── Selection helpers ─────────────────────────────────
  const toggleOne   = (id) => setSelected((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll   = ()   => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.id)));
  const allChecked  = filtered.length > 0 && selected.size === filtered.length;
  const someChecked = selected.size > 0 && selected.size < filtered.length;

  // ── Stable interviewer toggle callbacks ───────────────
  const toggleCreateInterviewer = useCallback((ivId) => {
    setForm((p) => ({
      ...p,
      interviewer_ids: p.interviewer_ids.includes(ivId)
        ? p.interviewer_ids.filter((x) => x !== ivId)
        : [...p.interviewer_ids, ivId],
    }));
    setErrors((p) => ({ ...p, interviewer_ids: "" }));
  }, []);

  const toggleEditInterviewer = useCallback((ivId) => {
    setEditForm((p) => ({
      ...p,
      interviewer_ids: p.interviewer_ids.includes(ivId)
        ? p.interviewer_ids.filter((x) => x !== ivId)
        : [...p.interviewer_ids, ivId],
    }));
    setEditErrors((p) => ({ ...p, interviewer_ids: "" }));
  }, []);

  // ── Validate ──────────────────────────────────────────
  const validateForm = (f, setErr) => {
    const e = { datetime: "", capacity: "", interviewer_ids: "" };
    let ok = true;
    if (!f.datetime) { e.datetime = "Date & time is required."; ok = false; }
    else if (new Date(f.datetime) <= new Date()) { e.datetime = "Slot must be set in the future."; ok = false; }
    const cap = parseInt(f.capacity, 10);
    if (isNaN(cap) || cap < 1) { e.capacity = "Capacity must be at least 1."; ok = false; }
    if (!f.interviewer_ids.length) { e.interviewer_ids = "Select at least one interviewer."; ok = false; }
    setErr(e);
    return ok;
  };

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
    if (apiErr) setApiErr("");
  };

  const setEditField = (k, v) => {
    setEditForm((p) => ({ ...p, [k]: v }));
    if (editErrors[k]) setEditErrors((p) => ({ ...p, [k]: "" }));
    if (editApiErr) setEditApiErr("");
  };

  // ── Create ────────────────────────────────────────────
  const handleCreate = async () => {
    setApiErr("");
    if (!validateForm(form, setErrors)) { setApiErr("Please fix the errors below and try again."); return; }
    setSaving(true);
    try {
      const slot = await createInterviewSlot({
        datetime:        form.datetime,
        capacity:        parseInt(form.capacity, 10),
        interviewer_ids: form.interviewer_ids,
      });
      setSlots((prev) => [...prev, slot].sort((a, b) => new Date(a.datetime) - new Date(b.datetime)));
      setForm({ datetime: "", capacity: 10, interviewer_ids: [] });
      setErrors({ datetime: "", capacity: "", interviewer_ids: "" });
      setShowForm(false);
      show("Interview slot created successfully!");
    } catch (err) {
      setApiErr(err.message || "Failed to create slot.");
    } finally {
      setSaving(false);
    }
  };

  // ── Open edit ─────────────────────────────────────────
  const openEdit = (slot) => {
    setEditSlot(slot);
    const localDt = new Date(slot.datetime);
    const pad = (n) => String(n).padStart(2, "0");
    const dtLocal = `${localDt.getFullYear()}-${pad(localDt.getMonth() + 1)}-${pad(localDt.getDate())}T${pad(localDt.getHours())}:${pad(localDt.getMinutes())}`;
    setEditForm({
      datetime:        dtLocal,
      capacity:        slot.capacity,
      interviewer_ids: Array.isArray(slot.interviewer_ids) ? slot.interviewer_ids : [],
    });
    setEditErrors({ datetime: "", capacity: "", interviewer_ids: "" });
    setEditApiErr("");
  };

  // ── Save edit ─────────────────────────────────────────
  const handleEdit = async () => {
    setEditApiErr("");
    if (!validateForm(editForm, setEditErrors)) { setEditApiErr("Please fix the errors below and try again."); return; }
    setEditSaving(true);
    try {
      const updated = await updateInterviewSlot(editSlot.id, {
        datetime:        editForm.datetime,
        capacity:        parseInt(editForm.capacity, 10),
        interviewer_ids: editForm.interviewer_ids,
      });
      setSlots((prev) =>
        prev
          .map((s) => s.id === editSlot.id ? { ...s, ...updated } : s)
          .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
      );
      setEditSlot(null);
      show("Interview slot updated successfully!");
    } catch (err) {
      setEditApiErr(err.message || "Failed to update slot.");
    } finally {
      setEditSaving(false);
    }
  };

  // // ── Delete ────────────────────────────────────────────
  // const handleDeleteOne  = (id) => setConfirmId({ ids: [id] });
  // const handleBulkDelete = ()   => setConfirmId({ ids: [...selected] });

  // const confirmDelete = async () => {
  //   const { ids } = confirmId;
  //   setConfirmId(null);
  //   setDeleting(ids[0]);
  //   try {
  //     await Promise.all(ids.map((id) => deleteInterviewSlot(id)));
  //     setSlots((prev) => prev.filter((s) => !ids.includes(s.id)));
  //     setSelected(new Set());
  //     show(ids.length === 1 ? "Slot deleted successfully." : `${ids.length} slots deleted.`, "error");
  //   } catch (err) {
  //     show(err.message || "Failed to delete slot.", "error");
  //   } finally {
  //     setDeleting(null);
  //   }
  // };

  // ── Summary stats ─────────────────────────────────────
  const now           = new Date();
  const totalSlots    = slots.length;
  const upcomingSlots = slots.filter((s) => new Date(s.datetime) > now).length;
  const totalCapacity = slots.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const totalBooked   = slots.reduce((acc, s) => acc + (Number(s.booked) || 0), 0);

  return (
    <div>
      {toast && <div className={`ut-toast ${toast.kind}`}>{toast.msg}</div>}

      {/* ── Delete Confirm ──────────────────────────────────
      {confirmId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "2px", padding: "36px 32px", maxWidth: "420px", width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
              Delete Slot{confirmId.ids.length > 1 ? "s" : ""}?
            </h3>
            <p style={{ margin: "0 0 28px", fontSize: "14px", color: "#64748b", lineHeight: 1.7 }}>
              {confirmId.ids.length > 1
                ? <><strong style={{ color: "#0f172a" }}>{confirmId.ids.length} slots</strong> will be deleted.</>
                : <>This slot will be deleted.</>}
              {" "}Applicants who selected {confirmId.ids.length > 1 ? "these slots" : "this slot"} will have their preference cleared.
              <br />This action <strong style={{ color: "#ef4444" }}>cannot be undone</strong>.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setConfirmId(null)}
                style={{ flex: 1, padding: "11px 0", borderRadius: "2px", border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#475569", cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                Cancel
              </button>
              <button onClick={confirmDelete}
                style={{ flex: 1, padding: "11px 0", borderRadius: "2px", border: "none", background: "#ef4444", fontSize: "14px", fontWeight: 600, color: "#fff", cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )} */}

      {/* ── Edit Modal ────────────────────────────────────── */}
      {editSlot && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{
            background: "#fff", borderRadius: "2px", width: "100%", maxWidth: "760px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            border: "1px solid #c8d5e8", borderTop: "3px solid #7c3aed",
            display: "flex", flexDirection: "column",
          }}>
            {/* Header */}
            <div style={{ padding: "14px 24px", borderBottom: "1px solid #dce6f0", background: "#f9f7ff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#4c1d95", textTransform: "uppercase", letterSpacing: "0.07em" }}>Edit Interview Slot</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#7c3aed" }}>{fmtDate(editSlot.datetime)} · {fmtTime(editSlot.datetime)}</p>
                </div>
              </div>
              <button onClick={() => setEditSlot(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 20, lineHeight: 1, padding: "4px 8px", borderRadius: 2 }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#475569"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}>×</button>
            </div>

            {/* Form */}
            <FormBody
              f={editForm}
              errs={editErrors}
              onFieldChange={setEditField}
              saving={editSaving}
              onSubmit={handleEdit}
              isEdit={true}
              interviewers={interviewers}
              onInterviewerChange={toggleEditInterviewer}
              apiErr={apiErr}
              editApiErr={editApiErr}
            />

            {/* Footer */}
            <div style={{
              padding: "14px 24px", borderTop: "1px solid #dce6f0", background: "#f9f7ff",
              display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10,
            }}>
              <button className="ut-btn-secondary" onClick={() => setEditSlot(null)} disabled={editSaving}>
                Cancel
              </button>
              <button className="ut-btn-primary" onClick={handleEdit} disabled={editSaving}>
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "28px 32px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>Interview Slots</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 0 }}>Manage available interview slots for applicants</p>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Slots",    value: totalSlots,    color: "#1b3a6b" },
            { label: "Upcoming",       value: upcomingSlots, color: "#7c3aed" },
            { label: "Total Capacity", value: totalCapacity, color: "#0369a1" },
            { label: "Total Booked",   value: totalBooked,   color: "#15803d" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "white", border: "1px solid #c8d5e8", borderRadius: 2, padding: "16px 20px", borderTop: `3px solid ${color}` }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Create form panel */}
        {showForm && (
          <div style={{ background: "white", border: "1px solid #c8d5e8", borderRadius: 2, borderTop: "3px solid #1b3a6b", marginBottom: 20 }}>
            <div style={{ padding: "14px 24px", borderBottom: "1px solid #dce6f0", background: "#f4f7fb" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>New Interview Slot</p>
            </div>
            <FormBody
              f={form}
              errs={errors}
              onFieldChange={setField}
              saving={saving}
              onSubmit={handleCreate}
              isEdit={false}
              interviewers={interviewers}
              onInterviewerChange={toggleCreateInterviewer}
              apiErr={apiErr}
              editApiErr={editApiErr}
            />
          </div>
        )}

        {/* Table */}
        <div className="table-wrapper">
          <div className="table-toolbar">
            <div className="ut-table-search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input className="ut-table-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search slots…" />
              {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 0 }}>×</button>}
            </div>

            <select className="ut-table-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="full">Full</option>
              <option value="past">Past</option>
            </select>

            <button
              className="ut-btn-primary"
              onClick={() => {
                setShowForm((v) => !v);
                setErrors({ datetime: "", capacity: "", interviewer_ids: "" });
                setApiErr("");
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={showForm ? "M18 6L6 18M6 6l12 12" : "M12 5v14M5 12h14"} />
              </svg>
              {showForm ? "Cancel" : "Create Slot"}
            </button>
          </div>

          <p className="table-count">
            Showing <strong>{filtered.length}</strong> of {slots.length} slot{slots.length !== 1 ? "s" : ""}
            {search && ` for "${search}"`}
            {selected.size > 0 && <span style={{ marginLeft: "10px", color: "#1a56db", fontWeight: 600 }}>· {selected.size} selected</span>}
          </p>

          {selected.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "2px", padding: "10px 16px", margin: "0px 10px 10px 20px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#1d4ed8" }}>
                {selected.size} slot{selected.size > 1 ? "s" : ""} selected
              </span>
              <div style={{ flex: 1 }} />
              {/* <button onClick={handleBulkDelete}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "#b91c1c", border: "1px solid #b91c1c", borderRadius: "2px", padding: "7px 14px", fontSize: "13.5px", fontWeight: "600", color: "#fff", cursor: "pointer" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6" />
                </svg>
                Delete Selected
              </button>
              <button onClick={() => setSelected(new Set())}
                style={{ background: "none", border: "1px solid #cbd5e1", borderRadius: "2px", padding: "7px 12px", fontSize: "13px", color: "#64748b", cursor: "pointer" }}>
                Clear
              </button> */}
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p className="loading-text">Loading slots…</p>
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
                    <th onClick={() => handleSort("datetime")} style={{ cursor: "pointer" }}>
                      <span className="th-inner">Date <SortIcon active={sortKey === "datetime"} dir={sortDir} /></span>
                    </th>
                    <th><span className="th-inner">Time</span></th>
                    <th onClick={() => handleSort("capacity")} style={{ cursor: "pointer" }}>
                      <span className="th-inner">Capacity <SortIcon active={sortKey === "capacity"} dir={sortDir} /></span>
                    </th>
                    <th onClick={() => handleSort("booked")} style={{ cursor: "pointer" }}>
                      <span className="th-inner">Availability <SortIcon active={sortKey === "booked"} dir={sortDir} /></span>
                    </th>
                    <th><span className="th-inner">Interviewers</span></th>
                    <th><span className="th-inner">Status</span></th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="empty-state">
                          <div className="empty-state-icon">🔍</div>
                          <p className="empty-state-text">{slots.length === 0 ? "No interview slots yet. Create one above." : "No slots match your search."}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((slot, idx) => {
                      const isPast = new Date(slot.datetime) < now;
                      const slotInterviewers = Array.isArray(slot.interviewer_ids)
                          ? slot.interviewer_ids
                              .map((id) => interviewers.find((iv) => iv.id === id))
                              .filter(Boolean)
                          : Array.isArray(slot.interviewers)
                          ? slot.interviewers
                          : [];
                      return (
                        <tr key={slot.id} style={{ opacity: isPast ? 0.55 : 1, background: selected.has(slot.id) ? "#eff6ff" : undefined }}>
                          <td style={{ textAlign: "center", width: "40px" }}>
                            <input type="checkbox" checked={selected.has(slot.id)} onChange={() => toggleOne(slot.id)} style={{ cursor: "pointer", accentColor: "#1a56db" }} />
                          </td>
                          <td style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", width: "48px" }}>{idx + 1}</td>
                          <td><span className="cell-name">{fmtDate(slot.datetime)}</span></td>
                          <td>{fmtTime(slot.datetime)}</td>
                          <td>{slot.capacity}</td>
                          <td><CapacityBar booked={Number(slot.booked)} capacity={slot.capacity} /></td>
                          <td>
                            {slotInterviewers.length === 0 ? (
                              <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                            ) : (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {slotInterviewers.map((iv) => (
                                  <span key={iv.id ?? iv} style={{ background: "#ede9fe", color: "#5b21b6", fontSize: 11, fontWeight: 600, borderRadius: 2, padding: "2px 8px", whiteSpace: "nowrap" }}>
                                    {iv.name ?? iv}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td><SlotBadge booked={Number(slot.booked)} capacity={slot.capacity} datetime={slot.datetime} /></td>
                          <td>
                            <div className="ut-action-btn-wrap">
                              <button title="Edit" className="ut-action-btn ut-action-btn-edit" onClick={() => openEdit(slot)}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit
                              </button>
                              {/* <button title="Delete" className="ut-action-btn ut-action-btn-delete" onClick={() => handleDeleteOne(slot.id)} disabled={deleting === slot.id}>
                                {deleting === slot.id ? (
                                  <span style={{ fontSize: 10 }}>…</span>
                                ) : (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
                                    <path d="M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6" />
                                  </svg>
                                )}
                              </button> */}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
          Deleting a slot clears applicants' slot preference but does not delete their application.
        </p>
      </div>
    </div>
  );
}