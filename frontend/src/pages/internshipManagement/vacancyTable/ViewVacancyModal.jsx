// components/userTable/ViewVacancyModal.jsx
import { useState, useEffect } from "react";
import StatusBadge from "../../userManagement/userTable/StatusBadge";
import { fetchVacancyById } from "../../api/vacancyApi";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function Field({ label, value, wide = false }) {
  return (
    <div className="form-field" style={{ margin: 0, gridColumn: wide ? "1 / -1" : undefined }}>
      <label style={{
        fontSize: "11px", fontWeight: "700", color: "#64748b",
        textTransform: "uppercase", letterSpacing: "0.05em",
      }}>
        {label}
      </label>
      <div style={{
        padding: "9px 12px", background: "#f8fafc", borderRadius: "2px",
        border: "1px solid #e2e8f0", fontSize: "14px", color: "#1e293b",
        marginTop: "4px", whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        marginBottom: "14px", paddingBottom: "8px", borderBottom: "2px solid #e2e8f0",
      }}>
        <span style={{ fontSize: "16px" }}>{icon}</span>
        <span style={{
          fontWeight: "700", fontSize: "13px", color: "#475569",
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function Grid({ children, cols = "1fr 1fr" }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap: "12px 24px" }}>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px", gap: "16px" }}>
      <div className="loading-spinner" />
      <p className="loading-text">Loading vacancy details…</p>
    </div>
  );
}

export default function ViewVacancyModal({ row, onClose }) {
  const [vacancy,  setVacancy]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState("");

  useEffect(() => {
    const id = row.vacancy_id ?? row.id;
    fetchVacancyById(id)
      .then(setVacancy)
      .catch((e) => setFetchErr(e.message || "Failed to load vacancy."))
      .finally(() => setLoading(false));
  }, [row]);

  const v = vacancy || row;

  const durationLabel = () => {
    if (!v.start_date || !v.end_date) return "—";
    const ms    = new Date(v.end_date) - new Date(v.start_date);
    const weeks = Math.round(ms / (1000 * 60 * 60 * 24 * 7));
    return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "700px", width: "95%" }}>

        <div className="modal-header">
          <p className="modal-title">Vacancy Details</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "24px", overflowY: "auto", maxHeight: "70vh", display: "flex", flexDirection: "column", gap: "28px" }}>

          {loading ? (
            <LoadingState />
          ) : fetchErr ? (
            <div style={{
              padding: "20px", background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "4px", color: "#b91c1c", fontSize: "13.5px",
            }}>
              {fetchErr}
            </div>
          ) : (
            <>
              {/* ── Company ─────────────────────────────────── */}
              <Section icon="🏢" title="Company">
                <Grid cols="1fr">
                  <Field label="Company Name" value={v.company_name} wide />
                </Grid>
              </Section>

              {/* ── Position ────────────────────────────────── */}
              <Section icon="💼" title="Position">
                <Grid>
                  <Field label="Position Name" value={v.position_name} wide />

                  <div className="form-field" style={{ margin: 0 }}>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Status
                    </label>
                    <div style={{ marginTop: "6px" }}>
                      <StatusBadge status={v.status} />
                    </div>
                  </div>

                  <Field label="Capacity" value={v.capacity != null ? `${v.capacity} intern${v.capacity !== 1 ? "s" : ""}` : "—"} />
                </Grid>
              </Section>

              {/* ── Duration ────────────────────────────────── */}
              <Section icon="📅" title="Duration">
                <Grid cols="1fr 1fr 1fr">
                  <Field label="Start Date"  value={fmt(v.start_date)} />
                  <Field label="End Date"    value={fmt(v.end_date)} />
                  <Field label="Duration"    value={durationLabel()} />
                </Grid>
              </Section>

              {/* ── Description ─────────────────────────────── */}
              {v.description && (
                <Section icon="📋" title="Description">
                  <div style={{
                    background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "2px",
                    padding: "12px 14px", fontSize: "14px", color: "#1e293b",
                    lineHeight: "1.65", whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {v.description}
                  </div>
                </Section>
              )}

              {/* ── Responsibilities ────────────────────────── */}
              {v.responsibilities && (
                <Section icon="✅" title="Responsibilities">
                  <div style={{
                    background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "2px",
                    padding: "12px 14px", fontSize: "14px", color: "#1e293b",
                    lineHeight: "1.65", whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {v.responsibilities}
                  </div>
                </Section>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}