// components/internship/ApplyModal.jsx
import { useState, useRef } from "react";
import { applyToVacancy } from "../../pages/api/internshipApi";

const ALLOWED_EXTS = [".pdf", ".doc", ".docx"];
const MAX_MB       = 5;

function FileDropZone({ label, required, file, onFile, accept }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();

  const validate = (f) => {
    if (!f) return null;
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) return `Only PDF or Word files allowed.`;
    if (f.size > MAX_MB * 1024 * 1024) return `File must be under ${MAX_MB} MB.`;
    return null;
  };

  const handleFile = (f) => {
    const err = validate(f);
    if (err) { alert(err); return; }
    onFile(f);
  };

  return (
    <div className="form-field">
      <label>
        {label}{" "}
        {required
          ? <span style={{ color: "#ef4444" }}>*</span>
          : <span style={{ color: "#94a3b8", fontWeight: 400, textTransform: "none", fontSize: "11px" }}>(optional)</span>
        }
      </label>

      <div
        onClick={() => ref.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border:       `2px dashed ${file ? "#16a34a" : drag ? "#1b3a6b" : "#b8c8df"}`,
          borderRadius: "2px",
          padding:      "18px 16px",
          textAlign:    "center",
          cursor:       "pointer",
          background:   file ? "#f0fdf4" : drag ? "#f0f4ff" : "#f8fafd",
          transition:   "all 0.15s",
        }}
      >
        {file ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>📄</span>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontWeight: "600", fontSize: "13.5px", color: "#15803d" }}>
                {file.name}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#86efac" }}>
                {(file.size / 1024).toFixed(0)} KB — click to replace
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        ) : (
          <>
            <div style={{ fontSize: "24px", marginBottom: "6px" }}>📎</div>
            <p style={{ margin: "0 0 4px", fontWeight: "600", fontSize: "13px", color: "#1a2744" }}>
              Click to upload or drag & drop
            </p>
            <p style={{ margin: 0, fontSize: "11.5px", color: "#94a3b8" }}>
              PDF, DOC, DOCX — max {MAX_MB} MB
            </p>
          </>
        )}
        <input
          ref={ref}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}

export default function ApplyModal({ vacancy, onClose, onSuccess }) {
  const [resume,      setResume]      = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  const accept = ".pdf,.doc,.docx";

  const handleSubmit = async () => {
    setError("");
    if (!resume) return setError("Resume is required.");

    setSubmitting(true);
    try {
      await applyToVacancy(vacancy.vacancy_id, resume, coverLetter || null);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "500px" }}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <p className="modal-title">Apply for Position</p>
            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#64748b", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
              {vacancy.position_name} · {vacancy.company_name}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-form">

          {/* Info banner */}
          <div style={{
            background: "#f0f4ff", border: "1px solid #c7d2fe",
            borderRadius: "4px", padding: "10px 14px",
            fontSize: "13px", color: "#3730a3",
            display: "flex", gap: "8px", alignItems: "flex-start",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4 M12 8h.01" />
            </svg>
            <span>You can apply to <strong>multiple vacancies</strong>. Each application requires its own documents.</span>
          </div>

          <div style={{ paddingBottom: "8px", borderBottom: "1.5px solid #dce6f0" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#1b3a6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Upload Documents
            </span>
          </div>

          <FileDropZone
            label="Resume"
            required
            file={resume}
            onFile={setResume}
            accept={accept}
          />

          <FileDropZone
            label="Cover Letter"
            required={false}
            file={coverLetter}
            onFile={setCoverLetter}
            accept={accept}
          />

          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "4px", padding: "10px 14px",
              fontSize: "13px", color: "#b91c1c",
            }}>
              {error}
            </div>
          )}

        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !resume}
            style={{ opacity: submitting || !resume ? 0.65 : 1 }}
          >
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </div>

      </div>
    </div>
  );
}