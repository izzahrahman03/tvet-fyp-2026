// pages/student/StudentAttendance.jsx
import { useState, useEffect, useCallback } from "react";
import { recordAttendance, fetchMyAttendance, clockOutAttendance, fetchMyInternshipStatus } from "../api/timeApi";
import useToast from "../userManagement/userTable/useToast";
import "../../css/userManagement/userTable.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtTime = (date) =>
  date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

const fmtTimeShort = (date) =>
  date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: true });

const STATUS_STYLE = {
  pending: { bg: "#fffbeb", color: "#92400e" },
  present: { bg: "#dcfce7", color: "#15803d" },
  absent:  { bg: "#fee2e2", color: "#b91c1c" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "2px", fontSize: 11, fontWeight: 700, textTransform: "capitalize", background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

// Converts any date value (Date object OR string) to "YYYY-MM-DD" in local time.
// mysql2 returns DATE columns as JS Date objects, so .slice(0,10) on them returns
// undefined — this helper handles both cases safely.
const toLocalDateStr = (d) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const today = toLocalDateStr(new Date());

// Returns HH:MM:SS string from a Date object
const toTimeString = (date) =>
  date.toTimeString().slice(0, 8);

// ── Internship status guard ────────────────────────────────
function InternshipInactiveNotice({ internship }) {
  const cfg = (() => {
    if (!internship) return { title: "No Active Internship", body: "You don't have an active internship placement yet. This page is only available once your internship offer has been accepted." };
    const {application_status: s, internship_applicant_response: r } = internship;
    if (s === "passed" && (!r || r === "none")) return { title: "Pending Your Response", body: "You have a pending internship offer. Please accept it in the Internship portal to unlock this page." };
    if (r === "declined") return { title: "Offer Declined", body: "You declined the internship offer. This page is not available." };
    if (r === "withdrawn_requested") return { title: "Withdrawal Pending", body: "A withdrawal request is being processed. This page is temporarily unavailable." };
    if (r === "withdrawn") return { title: "Internship Withdrawn", body: "Your internship placement has been withdrawn. This page is no longer available." };
    if (s === "pending" || s === "interview") return { title: "Application In Progress", body: "Your internship application is still being reviewed. This page will be available once you become an active intern." };
    return { title: "Not Available", body: "This page is only available for active interns." };
  })();
  return (
    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 2, padding: "20px 24px", display: "flex", gap: 14, alignItems: "flex-start" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
      </svg>
      <div>
        <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: "#92400e" }}>{cfg.title}</p>
        <p style={{ margin: 0, fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>{cfg.body}</p>
      </div>
    </div>
  );
}

export default function StudentAttendance() {
  const [now,         setNow]         = useState(new Date());
  const [remarks,     setRemarks]     = useState("");
  const [saving,      setSaving]      = useState(false);
  const [apiErr,      setApiErr]      = useState("");
  const [records,     setRecords]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("all");
  // undefined = loading, null = no internship, object = internship data
  const [internship,  setInternship]  = useState(undefined);

  const { toast, show } = useToast();

  // ── Fetch internship status ─────────────────────────────
  useEffect(() => {
    fetchMyInternshipStatus()
      .then(setInternship)
      .catch(() => setInternship(null));
  }, []);
  

  const isActive = internship?.internship_applicant_response === "accepted" &&
                   internship?.application_status === "passed";

  // Live clock — updates every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRecords(await fetchMyAttendance()); }
    catch { show("Failed to load attendance records.", "error"); }
    finally { setLoading(false); }
  }, [show]);

  useEffect(() => { load(); }, [load]);

  // Derive today's state from loaded records
  // toLocalDateStr handles both JS Date objects and strings returned by mysql2
  const todayRecord         = records.find((r) => r.attendance_date && toLocalDateStr(r.attendance_date) === today);
  const canClockIn          = !todayRecord;
  // Allow clock-out even if the record has been verified — backend will reset status to pending.
  const canClockOut         = !!(todayRecord && !todayRecord.clock_out);
  const isCompleted         = !!(todayRecord?.clock_out);
  const clockOutAfterVerify = canClockOut && todayRecord?.status !== "pending";

  // ── Clock In ────────────────────────────────────────────
  const handleClockIn = async () => {
    setApiErr("");
    setSaving(true);
    try {
      await recordAttendance({
        attendance_date: today,
        clock_in: toTimeString(now),
        clock_out: "",
        remarks: remarks.trim(),
      });
      show(`Clocked in at ${fmtTimeShort(now)}!`);
      setRemarks("");
      load();
    } catch (err) {
      setApiErr(err?.response?.data?.message || "Failed to clock in.");
    } finally { setSaving(false); }
  };

  // ── Clock Out ───────────────────────────────────────────
  const handleClockOut = async () => {
    setApiErr("");
    setSaving(true);
    try {
      const res = await clockOutAttendance(todayRecord.attendance_id, {
        clock_out: toTimeString(now),
        remarks: remarks.trim() || undefined,
      });
      const msg = res?.message || `Clocked out at ${fmtTimeShort(now)}!`;
      show(msg);
      setRemarks("");
      load();
    } catch (err) {
      setApiErr(err?.response?.data?.message || "Failed to clock out.");
    } finally { setSaving(false); }
  };

  // ── Filter / search ─────────────────────────────────────
  const filtered = records.filter((r) => {
    const statusMatch = filter === "all" || r.status === filter;
    const q = search.toLowerCase();
    const searchMatch = !q || [fmtDate(r.attendance_date), r.status, r.remarks].some((v) => String(v ?? "").toLowerCase().includes(q));
    return statusMatch && searchMatch;
  });

  // Stats
  const thisMonth = records.filter((r) => r.attendance_date && toLocalDateStr(r.attendance_date).slice(0, 7) === today.slice(0, 7));
  const present   = records.filter((r) => r.status === "present").length;
  const absent    = records.filter((r) => r.status === "absent").length;

  // ── Today status label / colour ─────────────────────────
  const todayStatusLabel = canClockIn
    ? "Not clocked in"
    : isCompleted
    ? "Completed"
    : "In progress";
  const todayStatusColor = canClockIn ? "#64748b" : isCompleted ? "#15803d" : "#2563eb";

  return (
    <div style={{ padding: "28px 32px" }}>
      {toast && <div className={`ut-toast ${toast.kind}`}>{toast.msg}</div>}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Daily Attendance</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 0 }}>
          Clock in and out each day. Your attendance will be verified by your supervisor.
        </p>
      </div>

      {/* ── Internship status guard ─────────────────────── */}
      {internship === undefined ? (
        <div className="loading-container"><div className="loading-spinner" /><p className="loading-text">Checking internship status…</p></div>
      ) : !isActive ? (
        <InternshipInactiveNotice internship={internship} />
      ) : (
        <>

      {/* ── Summary cards ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Records", value: records.length,   color: "#1b3a6b" },
          { label: "This Month",    value: thisMonth.length, color: "#2563eb" },
          { label: "Present",       value: present,          color: "#16a34a" },
          { label: "Absent",        value: absent,           color: "#dc2626" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #c8d5e8", borderRadius: 2, padding: "14px 18px", borderTop: `3px solid ${color}` }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Clock In / Out card ────────────────────────────── */}
      <div style={{ background: "#fff", border: "1px solid #c8d5e8", borderTop: "3px solid #1b3a6b", borderRadius: 2, marginBottom: 28 }}>
        {/* Card header */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #dce6f0", background: "#f4f7fb" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Clock In / Out</p>
        </div>

        <div style={{ padding: "24px" }}>
          {apiErr && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 2, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#b91c1c" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              {apiErr}
            </div>
          )}

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>

            {/* Live clock panel */}
            <div style={{ flex: "1 1 260px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2, padding: "20px 24px", textAlign: "center" }}>
              {/* Date */}
              <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {new Date().toLocaleDateString("en-MY", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
              </p>
              {/* Live time */}
              <p style={{ margin: "4px 0 12px", fontSize: 40, fontWeight: 800, color: "#0f172a", letterSpacing: "0.03em", fontVariantNumeric: "tabular-nums" }}>
                {fmtTime(now)}
              </p>

              {/* Today's status row */}
              <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Clocked In</p>
                  <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: todayRecord ? "#0f172a" : "#cbd5e1" }}>
                    {todayRecord ? (todayRecord.clock_in?.slice(0, 5) || "—") : "—"}
                  </p>
                </div>
                <div style={{ width: 1, background: "#e2e8f0", alignSelf: "stretch" }} />
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Clocked Out</p>
                  <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: todayRecord?.clock_out ? "#0f172a" : "#cbd5e1" }}>
                    {todayRecord?.clock_out?.slice(0, 5) || "—"}
                  </p>
                </div>
                <div style={{ width: 1, background: "#e2e8f0", alignSelf: "stretch" }} />
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Today</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: todayStatusColor }}>
                    {todayStatusLabel}
                  </p>
                </div>
              </div>

              {/* Clock In / Out button */}
              {isCompleted ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 20px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 2, fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Attendance recorded for today
                </div>
              ) : canClockIn ? (
                <button
                  onClick={handleClockIn}
                  disabled={saving}
                  style={{ width: "100%", padding: "12px 0", background: saving ? "#93c5fd" : "#1b3a6b", color: "#fff", border: "none", borderRadius: 2, fontSize: 14, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "0.03em", transition: "background 0.15s" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {saving ? "Recording…" : "Clock In"}
                </button>
              ) : canClockOut ? (
                <>
                  {clockOutAfterVerify && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 2, fontSize: 12, color: "#92400e", marginBottom: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
                      <span>Your attendance was already verified. Clocking out will reset it to <strong>Pending</strong> for your supervisor to re-verify.</span>
                    </div>
                  )}
                  <button
                    onClick={handleClockOut}
                    disabled={saving}
                    style={{ width: "100%", padding: "12px 0", background: saving ? "#fca5a5" : "#dc2626", color: "#fff", border: "none", borderRadius: 2, fontSize: 14, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "0.03em", transition: "background 0.15s" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {saving ? "Recording…" : "Clock Out"}
                  </button>
                </>
              ) : null }
            </div>

            {/* Remarks + info */}
            <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Remarks */}
              {!isCompleted && (
                <div className="form-field" style={{ marginTop: 0 }}>
                  <label>
                    Remarks <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
                  </label>
                  <textarea
                    className="form-input"
                    value={remarks}
                    onChange={(e) => { setRemarks(e.target.value); setApiErr(""); }}
                    rows={4}
                    placeholder="Any notes for today (e.g. working from home, site visit)…"
                    style={{ resize: "vertical" }}
                  />
                </div>
              )}

              {/* Info note */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 2, fontSize: 12, color: "#1d4ed8" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                <span>
                  Your attendance will be marked <strong>Pending</strong> until verified by your supervisor. The date and time are captured automatically when you click the button.
                </span>
              </div>

              {/* Today's remarks (if already submitted) */}
              {todayRecord?.remarks && (
                <div style={{ padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2, fontSize: 13, color: "#475569" }}>
                  <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Today's Remarks</p>
                  {todayRecord.remarks}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── History table ───────────────────────────────────── */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="ut-table-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
            <input className="ut-table-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search date, status…" />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>×</button>}
          </div>
          <select className="ut-table-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>
        <p className="table-count">Showing <strong>{filtered.length}</strong> of {records.length} record{records.length !== 1 ? "s" : ""}</p>

        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /><p className="loading-text">Loading…</p></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>#</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Remarks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><p className="empty-state-text">{records.length === 0 ? "No attendance records yet." : "No results match your search."}</p></div></td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.attendance_id}>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>{i + 1}</td>
                    <td><span className="cell-name">{fmtDate(r.attendance_date)}</span></td>
                    <td>{r.clock_in?.slice(0, 5) || "—"}</td>
                    <td>{r.clock_out?.slice(0, 5) || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                    <td style={{ maxWidth: 200 }}><span style={{ fontSize: 13, color: "#475569" }}>{r.remarks || "—"}</span></td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}