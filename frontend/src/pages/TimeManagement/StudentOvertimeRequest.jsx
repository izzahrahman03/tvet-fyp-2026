// pages/student/StudentOvertimeRequest.jsx
import { useState, useEffect, useCallback } from "react";
import { submitOvertimeRequest, fetchMyOvertimeRequests, fetchMyInternshipStatus } from "../api/timeApi";
import useToast from "../userManagement/userTable/useToast";
import "../../css/userManagement/userTable.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

// ── Internship status guard ────────────────────────────────
function InternshipInactiveNotice({ internship }) {
  const cfg = (() => {
    if (!internship) return { title: "No Active Internship", body: "You don't have an active internship placement yet. This page is only available once your internship offer has been accepted." };
    const { application_status: s, internship_applicant_response: r } = internship;
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

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_STYLE = {
  pending:  { bg: "#fffbeb", color: "#92400e" },
  approved: { bg: "#dcfce7", color: "#15803d" },
  rejected: { bg: "#fee2e2", color: "#b91c1c" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "2px", fontSize: 11, fontWeight: 700, textTransform: "capitalize", background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p style={{ margin: "4px 0 0", fontSize: 11, fontWeight: 600, color: "#b91c1c" }}>{msg}</p>;
}

const EMPTY        = { overtime_date: "", start_time: "", end_time: "", reason: "" };
const EMPTY_ERRORS = { overtime_date: "", start_time: "", end_time: "", reason: "" };

// Helper: calculate hours difference
const calcHours = (start, end) => {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return null;
  const h = Math.floor(diff / 60), m = diff % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export default function StudentOvertimeRequest() {
  const [form,       setForm]       = useState(EMPTY);
  const [errors,     setErrors]     = useState(EMPTY_ERRORS);
  const [saving,     setSaving]     = useState(false);
  const [apiErr,     setApiErr]     = useState("");
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("all");
  // undefined = loading, null = no internship, object = internship data
  const [internship, setInternship] = useState(undefined);

  const { toast, show } = useToast();

  // ── Fetch internship status ─────────────────────────────
  useEffect(() => {
    fetchMyInternshipStatus()
      .then(setInternship)
      .catch(() => setInternship(null));
  }, []);

  const isActive = internship?.internship_applicant_response === "accepted" &&
                   internship?.application_status === "passed";

  const load = useCallback(async () => {
    setLoading(true);
    try { setRequests(await fetchMyOvertimeRequests()); }
    catch { show("Failed to load overtime requests.", "error"); }
    finally { setLoading(false); }
  }, [show]);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: "" }));
    setApiErr("");
  };

  const validate = () => {
    const e = { ...EMPTY_ERRORS };
    let ok = true;
    if (!form.overtime_date)      { e.overtime_date = "Date is required."; ok = false; }
    if (!form.start_time)         { e.start_time    = "Start time is required."; ok = false; }
    if (!form.end_time)           { e.end_time      = "End time is required."; ok = false; }
    if (form.start_time && form.end_time && form.start_time >= form.end_time)
      { e.end_time = "End time must be after start time."; ok = false; }
    if (!form.reason.trim())      { e.reason        = "Please state the reason."; ok = false; }
    setErrors(e);
    return ok;
  };

  const handleSubmit = async () => {
    setApiErr("");
    if (!validate()) return;
    setSaving(true);
    try {
      await submitOvertimeRequest(form);
      show("Overtime request submitted successfully!");
      setForm(EMPTY);
      setErrors(EMPTY_ERRORS);
      load();
    } catch (err) {
      setApiErr(err?.response?.data?.message || "Failed to submit. Please try again.");
    } finally { setSaving(false); }
  };

  const filtered = requests.filter((r) => {
    const statusMatch = filter === "all" || r.status === filter;
    const q = search.toLowerCase();
    const searchMatch = !q || [r.status, fmtDate(r.overtime_date), r.reason].some((v) => String(v ?? "").toLowerCase().includes(q));
    return statusMatch && searchMatch;
  });

  const liveHours = calcHours(form.start_time, form.end_time);
  const today     = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ padding: "28px 32px" }}>
      {toast && <div className={`ut-toast ${toast.kind}`}>{toast.msg}</div>}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Overtime Request</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 0 }}>
          Submit an overtime request for approval by your industry supervisor.
        </p>
      </div>

      {/* ── Internship status guard ─────────────────────── */}
      {internship === undefined ? (
        <div className="loading-container"><div className="loading-spinner" /><p className="loading-text">Checking internship status…</p></div>
      ) : !isActive ? (
        <InternshipInactiveNotice internship={internship} />
      ) : (
        <>

      {/* Form */}
      <div style={{ background: "#fff", border: "1px solid #c8d5e8", borderTop: "3px solid #1b3a6b", borderRadius: 2, marginBottom: 28 }}>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #dce6f0", background: "#f4f7fb" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>New Overtime Request</p>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>
          {apiErr && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 2, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#b91c1c" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              {apiErr}
            </div>
          )}

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {/* Date */}
            <div className="form-field" style={{ flex: "1 1 160px" }}>
              <label>Overtime Date <span style={{ color: "#ef4444" }}>*</span></label>
              <input className={`form-input${errors.overtime_date ? " input-error" : ""}`} type="date" value={form.overtime_date} max={today} onChange={set("overtime_date")} />
              <FieldError msg={errors.overtime_date} />
            </div>

            {/* Start Time */}
            <div className="form-field" style={{ flex: "1 1 140px" }}>
              <label>Start Time <span style={{ color: "#ef4444" }}>*</span></label>
              <input className={`form-input${errors.start_time ? " input-error" : ""}`} type="time" value={form.start_time} onChange={set("start_time")} />
              <FieldError msg={errors.start_time} />
            </div>

            {/* End Time */}
            <div className="form-field" style={{ flex: "1 1 140px" }}>
              <label>End Time <span style={{ color: "#ef4444" }}>*</span></label>
              <input className={`form-input${errors.end_time ? " input-error" : ""}`} type="time" value={form.end_time} onChange={set("end_time")} />
              <FieldError msg={errors.end_time} />
            </div>

            {/* Live duration pill */}
            {liveHours && (
              <div className="form-field" style={{ flex: "0 0 auto", display: "flex", alignItems: "flex-end" }}>
                <div>
                  <label style={{ visibility: "hidden", display: "block" }}>​</label>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 14px", background: "#dbeafe", color: "#1d4ed8", borderRadius: 2, fontSize: 13, fontWeight: 700 }}>
                    ⏱ {liveHours}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="form-field" style={{ marginTop: 4 }}>
            <label>Reason <span style={{ color: "#ef4444" }}>*</span></label>
            <textarea
              className={`form-input${errors.reason ? " input-error" : ""}`}
              value={form.reason} onChange={set("reason")} rows={3}
              placeholder="Describe why overtime is needed…"
              style={{ resize: "vertical" }}
            />
            <FieldError msg={errors.reason} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button className="ut-btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </div>
      </div>

      {/* History */}
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
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <p className="table-count">Showing <strong>{filtered.length}</strong> of {requests.length} request{requests.length !== 1 ? "s" : ""}</p>

        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /><p className="loading-text">Loading…</p></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>#</th>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Supervisor Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><p className="empty-state-text">{requests.length === 0 ? "No overtime requests submitted yet." : "No results match your search."}</p></div></td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.overtime_id}>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>{i + 1}</td>
                    <td><span className="cell-name">{fmtDate(r.overtime_date)}</span></td>
                    <td>{r.start_time?.slice(0, 5)}</td>
                    <td>{r.end_time?.slice(0, 5)}</td>
                    <td>{calcHours(r.start_time, r.end_time) || "—"}</td>
                    <td style={{ maxWidth: 200 }}><span style={{ fontSize: 13, color: "#475569" }}>{r.reason}</span></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td style={{ maxWidth: 180 }}><span style={{ fontSize: 13, color: "#475569" }}>{r.supervisor_remarks || "—"}</span></td>
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