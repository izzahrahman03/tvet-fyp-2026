// pages/student/StudentLeaveRequest.jsx
import { useState, useEffect, useCallback } from "react";
import { submitLeaveRequest, fetchMyLeaveRequests, fetchStudentProfileInfo, fetchMyInternshipStatus } from "../api/timeApi";
import useToast from "../userManagement/userTable/useToast";
import "../../css/userManagement/userTable.css";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const LEAVE_TYPES = [
  { value: "annual",  label: "Annual Leave" },
  { value: "medical", label: "Medical Leave" },
  { value: "unpaid",  label: "Unpaid Leave" },
];

const LEAVE_LABEL = { annual: "Annual Leave", medical: "Medical Leave", unpaid: "Unpaid Leave" };

const STATUS_STYLE = {
  pending:  { bg: "#fffbeb", color: "#92400e" },
  approved: { bg: "#dcfce7", color: "#15803d" },
  rejected: { bg: "#fee2e2", color: "#b91c1c" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "2px",
      fontSize: 11, fontWeight: 700, textTransform: "capitalize",
      background: s.bg, color: s.color,
    }}>{status}</span>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p style={{ margin: "4px 0 0", fontSize: 11, fontWeight: 600, color: "#b91c1c" }}>{msg}</p>;
}

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

// ── Read-only display field ────────────────────────────────
function ReadField({ label, value }) {
  return (
    <div className="form-field" style={{ flex: "1 1 180px" }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <div style={{
        marginTop: 4, padding: "8px 12px",
        background: "#f4f7fb", border: "1px solid #dce6f0",
        borderRadius: 2, fontSize: 13, color: "#475569", fontWeight: 600,
      }}>
        {value || "—"}
      </div>
    </div>
  );
}

// ── Duration toggle button ─────────────────────────────────
function DurationBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, padding: "9px 0",
        border: `1.5px solid ${active ? "#1b3a6b" : "#dce6f0"}`,
        borderRadius: 2,
        background: active ? "#1b3a6b" : "#fff",
        color: active ? "#fff" : "#64748b",
        fontSize: 13, fontWeight: 700,
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

const EMPTY = {
  leave_type: "", duration_type: "full_day",
  start_date: "", end_date: "",    // full day
  leave_date: "", session: "",     // half day
  reason: "", document: null,
};
const EMPTY_ERR = {
  leave_type: "", duration_type: "",
  start_date: "", end_date: "",
  leave_date: "", session: "",
  reason: "", document: "",
};

export default function StudentLeaveRequest() {
  const [profile, setProfile] = useState({ name: "", matric_number: "", ic_number: "" });
  const [form,       setForm]       = useState(EMPTY);
  const [errors,     setErrors]     = useState(EMPTY_ERR);
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

  // Fetch student profile for matric + IC
   useEffect(() => {
  fetchStudentProfileInfo()
    .then(d => { console.log("profile:", d); setProfile(d); })
    .catch(err => console.error("profile error:", err));
}, []);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRequests(await fetchMyLeaveRequests()); }
    catch { show("Failed to load leave requests.", "error"); }
    finally { setLoading(false); }
  }, [show]);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: "" }));
    setApiErr("");
  };

  const setDuration = (val) => {
    setForm((p) => ({ ...p, duration_type: val, start_date: "", end_date: "", leave_date: "", session: "" }));
    setErrors(EMPTY_ERR);
  };

  const validate = () => {
    const e = { ...EMPTY_ERR };
    let ok = true;
    if (!form.leave_type)  { e.leave_type = "Please select a leave type."; ok = false; }
    if (form.duration_type === "full_day") {
      if (!form.start_date) { e.start_date = "Start date is required."; ok = false; }
      if (!form.end_date)   { e.end_date   = "End date is required."; ok = false; }
      if (form.start_date && form.end_date && form.start_date > form.end_date)
        { e.end_date = "End date must be after start date."; ok = false; }
    } else {
      if (!form.leave_date) { e.leave_date = "Leave date is required."; ok = false; }
      if (!form.session)    { e.session    = "Please select a session."; ok = false; }
    }
    if (!form.reason.trim()) { e.reason = "Please state the reason."; ok = false; }
    if (form.document) {
      const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!allowed.includes(form.document.type)) { e.document = "Only PDF or image files are allowed."; ok = false; }
      if (form.document.size > 5 * 1024 * 1024)  { e.document = "File must be under 5 MB."; ok = false; }
    }
    setErrors(e);
    return ok;
  };

  const handleSubmit = async () => {
    setApiErr("");
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("leave_type",    form.leave_type);
      fd.append("duration_type", form.duration_type);
      fd.append("reason",        form.reason);
      if (form.duration_type === "full_day") {
        fd.append("start_date", form.start_date);
        fd.append("end_date",   form.end_date);
      } else {
        fd.append("start_date", form.leave_date); // backend uses start_date as leave_date for half day
        fd.append("session",    form.session);
      }
      if (form.document) fd.append("document", form.document);
      await submitLeaveRequest(fd);
      show("Leave request submitted successfully!");
      setForm(EMPTY);
      setErrors(EMPTY_ERR);
      load();
    } catch (err) {
      setApiErr(err?.response?.data?.message || "Failed to submit. Please try again.");
    } finally { setSaving(false); }
  };

  const filtered = requests.filter((r) => {
    const statusMatch = filter === "all" || r.status === filter;
    const q = search.toLowerCase();
    const searchMatch = !q || [r.leave_type, r.status, fmtDate(r.start_date)].some((v) => String(v ?? "").toLowerCase().includes(q));
    return statusMatch && searchMatch;
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ padding: "28px 32px" }}>
      {toast && <div className={`ut-toast ${toast.kind}`}>{toast.msg}</div>}

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Leave Request</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 0 }}>
          Submit a leave request to your assigned industry supervisor.
        </p>
      </div>

      {/* ── Internship status guard ─────────────────────── */}
      {internship === undefined ? (
        <div className="loading-container"><div className="loading-spinner" /><p className="loading-text">Checking internship status…</p></div>
      ) : !isActive ? (
        <InternshipInactiveNotice internship={internship} />
      ) : (
        <>

      {/* ── Submit form ───────────────────────────────────── */}
      <div style={{ background: "#fff", border: "1px solid #c8d5e8", borderTop: "3px solid #1b3a6b", borderRadius: 2, marginBottom: 28 }}>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #dce6f0", background: "#f4f7fb" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            New Leave Request
          </p>
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

          {/* ── Row 1: Student Info (read-only) ───────────
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2, padding: "16px 20px", marginBottom: 24 }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Student Information
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <ReadField label="Name"          value={profile.name} />
              <ReadField label="Matric Number" value={profile.matric_number} />
              <ReadField label="IC Number"     value={profile.ic_number} />
            </div>
          </div> */}

          {/* ── Row 2: Leave Duration toggle ─────────────── */}
          <div className="form-field" style={{ marginBottom: 20 }}>
            <label>Leave Duration <span style={{ color: "#ef4444" }}>*</span></label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <DurationBtn active={form.duration_type === "full_day"} onClick={() => setDuration("full_day")}>
                Full Day
              </DurationBtn>
              <DurationBtn active={form.duration_type === "half_day"} onClick={() => setDuration("half_day")}>
                Half Day
              </DurationBtn>
            </div>
          </div>

          {/* ── Conditional date fields ───────────────────── */}
          {form.duration_type === "full_day" ? (
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
              <div className="form-field" style={{ flex: "1 1 150px", margin: 0 }}>
                <label>Start Date <span style={{ color: "#ef4444" }}>*</span></label>
                <input className={`form-input${errors.start_date ? " input-error" : ""}`} type="date" value={form.start_date} min={today} onChange={set("start_date")} />
                <FieldError msg={errors.start_date} />
              </div>
              <div className="form-field" style={{ flex: "1 1 150px", margin: 0 }}>
                <label>End Date <span style={{ color: "#ef4444" }}>*</span></label>
                <input className={`form-input${errors.end_date ? " input-error" : ""}`} type="date" value={form.end_date} min={form.start_date || today} onChange={set("end_date")} />
                <FieldError msg={errors.end_date} />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
              <div className="form-field" style={{ flex: "1 1 150px", margin: 0 }}>
                <label>Leave Date <span style={{ color: "#ef4444" }}>*</span></label>
                <input className={`form-input${errors.leave_date ? " input-error" : ""}`} type="date" value={form.leave_date} min={today} onChange={set("leave_date")} />
                <FieldError msg={errors.leave_date} />
              </div>
              <div className="form-field" style={{ flex: "1 1 150px", margin: 0 }}>
                <label>Session <span style={{ color: "#ef4444" }}>*</span></label>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  {["AM", "PM"].map((s) => (
                    <button
                      key={s} type="button"
                      onClick={() => { setForm((p) => ({ ...p, session: s })); setErrors((p) => ({ ...p, session: "" })); }}
                      style={{
                        flex: 1, padding: "8px 0",
                        border: `1.5px solid ${form.session === s ? "#1b3a6b" : errors.session ? "#ef4444" : "#dce6f0"}`,
                        borderRadius: 2,
                        background: form.session === s ? "#1b3a6b" : "#fff",
                        color: form.session === s ? "#fff" : "#64748b",
                        fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <FieldError msg={errors.session} />
              </div>
            </div>
          )}

          {/* ── Row 3: Leave Type ─────────────────────────── */}
          <div className="form-field" style={{ maxWidth: 280, marginBottom: 20 }}>
            <label>Leave Type <span style={{ color: "#ef4444" }}>*</span></label>
            <select className={`form-input${errors.leave_type ? " input-error" : ""}`} value={form.leave_type} onChange={set("leave_type")}>
              <option value="" disabled>Select type…</option>
              {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <FieldError msg={errors.leave_type} />
          </div>

          {/* ── Row 4: Reason ─────────────────────────────── */}
          <div className="form-field" style={{ marginBottom: 20 }}>
            <label>Reason <span style={{ color: "#ef4444" }}>*</span></label>
            <textarea
              className={`form-input${errors.reason ? " input-error" : ""}`}
              value={form.reason} onChange={set("reason")} rows={3}
              placeholder="Briefly describe the reason for your leave…"
              style={{ resize: "vertical" }}
            />
            <FieldError msg={errors.reason} />
          </div>

          {/* ── Row 5: Document ───────────────────────────── */}
          <div className="form-field" style={{ marginBottom: 24 }}>
            <label>
              Supporting Document{" "}
              <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>(optional — PDF or image, max 5 MB)</span>
            </label>
            <input
              type="file" accept=".pdf,.jpg,.jpeg,.png"
              className={`form-input${errors.document ? " input-error" : ""}`}
              style={{ padding: "7px 10px", cursor: "pointer" }}
              onChange={(e) => {
                setForm((p) => ({ ...p, document: e.target.files[0] || null }));
                setErrors((p) => ({ ...p, document: "" }));
              }}
            />
            {form.document && (
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#64748b" }}>
                Selected: <strong>{form.document.name}</strong>
              </p>
            )}
            <FieldError msg={errors.document} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
            <button className="ut-btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </div>
      </div>

      {/* ── History table ──────────────────────────────────── */}
      <div className="table-wrapper">
        <div style={{ padding: "16px 20px 0", marginBottom: 4 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>My Leave History</p>
        </div>
        <div className="table-toolbar">
          <div className="ut-table-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input className="ut-table-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search type, status…" />
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
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Date(s)</th>
                  <th>Session</th>
                  <th>Reason</th>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Supervisor Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9}>
                    <div className="empty-state">
                      <p className="empty-state-text">{requests.length === 0 ? "No leave requests submitted yet." : "No results match your search."}</p>
                    </div>
                  </td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.leave_id}>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>{i + 1}</td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", background: "#f1f5f9", color: "#1b3a6b", borderRadius: 2,  whiteSpace: "nowrap"}}>
                        {LEAVE_LABEL[r.leave_type] || r.leave_type}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, padding: "2px 8px", background: r.duration_type === "half_day" ? "#fef9c3" : "#eff6ff", color: r.duration_type === "half_day" ? "#854d0e" : "#1d4ed8", borderRadius: 2, fontWeight: 600,  whiteSpace: "nowrap" }}>
                        {r.duration_type === "half_day" ? "Half Day" : "Full Day"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13 }}>
                        {r.duration_type === "half_day"
                          ? fmtDate(r.start_date)
                          : `${fmtDate(r.start_date)} – ${fmtDate(r.end_date)}`}
                      </span>
                    </td>
                    <td>
                      {r.session
                        ? <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", background: "#f0fdf4", color: "#15803d", borderRadius: 2 }}>{r.session}</span>
                        : <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ maxWidth: 200 }}><span style={{ fontSize: 13, color: "#475569" }}>{r.reason}</span></td>
                    <td>
                      {r.document_path
                        ? <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", background: "#f0f9ff", color: "#0369a1", borderRadius: 2 }}>Uploaded</span>
                        : <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>}
                    </td>
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