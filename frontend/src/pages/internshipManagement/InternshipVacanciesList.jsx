// pages/internshipManagement/InternshipPage.jsx
import { useState, useEffect, useCallback } from "react";
import ApplyModal from "../../components/internship/ApplyModal";
import { fetchOpenVacancies } from "../api/internshipApi";
import useToast from "../../pages/userManagement/userTable/useToast";
import "../../css/userManagement/userTable.css";
import "../../css/internshipManagement/internship.css";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const APPLIED_STYLE = {
  pending:   { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6", label: "Pending"   },
  interview: { bg: "#f5f3ff", color: "#6d28d9", dot: "#8b5cf6", label: "Interview" },
  passed:    { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e", label: "Passed" },
  failed:    { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444", label: "Failed" },
  accepted:  { bg: "#dcfce7", color: "#16a34a", dot: "#22c55e", label: "Accepted" },
  declined:  { bg: "#fef2f2", color: "#991b1b", dot: "#ef4444", label: "Declined" },
  withdrawn:           { bg: "#f8fafc", color: "#64748b", dot: "#94a3b8", label: "Withdrawn" },
  withdrawn_requested: { bg: "#f8fafc", color: "#64748b", dot: "#94a3b8", label: "Withdraw Pending" },
};

export function Tag({ icon, text }) {
  if (!text) return null;
  return (
    <span style={{ fontSize: "12px", color: "#475569", display: "flex", alignItems: "center", gap: "4px" }}>
      {icon}
      {text}
    </span>
  );
}

export const Icons = {
  people: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  industry: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20V8l6-4v5l6-4v5l6-4v14H2z"/>
    </svg>
  ),
  location: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  calendar: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  clock: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  email: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 7l10 7 10-7"/>
    </svg>
  ),
  phone: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
};


function AppliedBadge({ status }) {
  const s = APPLIED_STYLE[status?.toLowerCase()] || APPLIED_STYLE.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "2px",
      background: s.bg, color: s.color,
      fontSize: "11.5px", fontWeight: "700", letterSpacing: "0.02em",
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot }} />
      {s.label}
    </span>
  );
}

function VacancyCard({ vacancy, onApply }) {
  const [expanded, setExpanded] = useState(false);
  const applied = vacancy.already_applied === 1;
  const hasContact = vacancy.contact_person_name || vacancy.contact_person_email || vacancy.contact_person_phone;
  const hasDesc = vacancy.description || vacancy.responsibilities || hasContact;

  const durationWeeks = () => {
    if (!vacancy.start_date || !vacancy.end_date) return null;
    const ms    = new Date(vacancy.end_date) - new Date(vacancy.start_date);
    const weeks = Math.round(ms / (1000 * 60 * 60 * 24 * 7));
    return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  };

  return (
    <div className="vacancy-card">

      {/* ── Card top row ─────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h3 className="vacancy-position">{vacancy.position_name}</h3>
            <p className="vacancy-company">{vacancy.company_name}</p>
          </div>

          {/* Capacity pill */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            padding: "3px 10px", borderRadius: "2px",
            background: "#f0f9ff", color: "#0369a1",
            border: "1px solid #bae6fd",
            fontSize: "12px", fontWeight: "700", flexShrink: 0,
          }}>
            {Icons.people} {vacancy.capacity} slot{vacancy.capacity !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Tags row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "8px" }}>
          <Tag icon={Icons.industry} text={vacancy.industry_sector} />
          <Tag icon={Icons.location} text={vacancy.location} />
          <Tag icon={Icons.calendar} text={`${fmtDate(vacancy.start_date)} – ${fmtDate(vacancy.end_date)}`} />
          {durationWeeks() && <Tag icon={Icons.clock} text={durationWeeks()} />}
        </div>

      </div>


      {/* ── Expandable description ────────────────────── */}
      {hasDesc && (
        <div style={{ marginTop: "14px" }}>
          {expanded && (
            <div className="vacancy-description">
              {vacancy.description && (
                <>
                  <p className="vacancy-desc-heading">About the Role</p>
                  <p className="vacancy-desc-text">{vacancy.description}</p>
                </>
              )}
              {vacancy.responsibilities && (
                <>
                  <p className="vacancy-desc-heading" style={{ marginTop: "10px" }}>Responsibilities</p>
                  <p className="vacancy-desc-text">{vacancy.responsibilities}</p>
                </>
              )}
              {hasContact && (
                <>
                  <p className="vacancy-desc-heading" style={{ marginTop: "10px" }}>Contact Person</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "4px" }}>
                    {vacancy.contact_person_name  && <Tag icon={Icons.people} text={vacancy.contact_person_name} />}
                    {vacancy.contact_person_email && <Tag icon={Icons.email}  text={vacancy.contact_person_email} />}
                    {vacancy.contact_person_phone && <Tag icon={Icons.phone}  text={vacancy.contact_person_phone} />}
                  </div>
                </>
              )}
            </div>
          )}
          <button
            className="vacancy-toggle"
            onClick={() => setExpanded((p) => !p)}
          >
            {expanded ? "Show less ▲" : "View details ▼"}
          </button>
        </div>
      )}

      {/* ── Card footer ──────────────────────────────── */}
      <div className="vacancy-footer">
        <div>
          {applied
            ? <AppliedBadge status={vacancy.my_application_status} />
            : <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Posted {fmtDate(vacancy.created_at)}
              </span>
          }
        </div>

        {applied ? (
          <button className="vacancy-btn-applied" disabled>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Applied
          </button>
        ) : (
          <button className="vacancy-btn-apply" onClick={() => onApply(vacancy)}>
            Apply Now →
          </button>
        )}
      </div>

    </div>
  );
}

export default function Internship() {
  const [vacancies,   setVacancies]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [applyTarget, setApplyTarget] = useState(null);
  const { toast, show }               = useToast();

  const load = useCallback((q = "") => {
    setLoading(true);
    fetchOpenVacancies(q)
      .then(setVacancies)
      .catch(() => show("Failed to load vacancies.", "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(""); }, [load]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
  }, [search, load]);

  const handleSuccess = (vacancy) => {
    setVacancies((prev) =>
      prev.map((v) =>
        v.vacancy_id === vacancy.vacancy_id
          ? { ...v, already_applied: 1, my_application_status: "pending" }
          : v
      )
    );
    show(`Application for "${vacancy.position_name}" submitted!`);
  };

  const appliedCount = vacancies.filter((v) => v.already_applied === 1).length;

  return (
    <div>
      {/* ── Toast ────────────────────────────────────────── */}
      {toast && (
        <div className={`ut-toast ${toast.kind}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={toast.kind === "error" ? "M18 6L6 18M6 6l12 12" : "M20 6L9 17l-5-5"} />
          </svg>
          {toast.msg}
        </div>
      )}

      {/* Apply modal */}
      {applyTarget && (
        <ApplyModal
          vacancy={applyTarget}
          onClose={() => setApplyTarget(null)}
          onSuccess={() => handleSuccess(applyTarget)}
        />
      )}

      {/* ── Page header ──────────────────────────────── */}
      <div className="internship-header">
        <h2 className="internship-title">Internship Vacancies</h2>
        <p className="internship-subtitle">
          {loading
            ? "Loading available positions…"
            : `${vacancies.length} open position${vacancies.length !== 1 ? "s" : ""}${appliedCount > 0 ? ` · ${appliedCount} applied` : ""}`
          }
        </p>

        {/* Search — now below the title */}
        <div className="ut-table-search-wrap" style={{ flex: "1", marginTop: "12px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="ut-table-search-input"
            placeholder="Search position, company, sector…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Vacancy list ─────────────────────────────── */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Loading vacancies…</p>
        </div>
      ) : vacancies.length === 0 ? (
        <div className="empty-state" style={{ marginTop: "48px" }}>
          <p className="empty-state-text">
            {search ? "No vacancies matched your search." : "No open vacancies at the moment."}
          </p>
        </div>
      ) : (
        <div className="vacancy-grid">
          {vacancies.map((v) => (
            <VacancyCard
              key={v.vacancy_id}
              vacancy={v}
              onApply={setApplyTarget}
            />
          ))}
        </div>
      )}

    </div>
  );
}