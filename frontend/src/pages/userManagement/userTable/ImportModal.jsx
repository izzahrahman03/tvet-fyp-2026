import { useState, useRef } from "react";
import * as XLSX from "xlsx";

const COLUMN_MAPS = {
  applicant: {
    required: ["name", "email"],
    optional: ["status"],
    example:  [{ name: "Siti Nur Izzah", email: "siti@email.com", status: "Active" }],
  },
  student: {
    required: ["name", "email"],
    optional: ["phone", "status"],
    example:  [{ name: "Muhammad Haziq", email: "haziq@student.edu", phone: "014-1234567", status: "Active" }],
  },
  industry_partner: {
    // name/email = contact person (stored in users table)
    // company_name = company (stored in industry_partners.company_name)
    required: ["name", "email", "company_name"],
    optional: ["phone", "industry_sector", "location", "status"],
    example:  [{
      name:            "Ahmad Faris",
      email:           "faris@techsolutions.com",
      company_name:    "Tech Solutions Sdn Bhd",
      phone:           "03-12345678",
      industry_sector: "IT & Software",
      location:        "Kuala Lumpur",
      status:          "Active",
    }],
  },
  industry_supervisor: {
    // company is inherited from industry_partners via partner_id — not a free-text field
    required: ["name", "email"],
    optional: ["phone", "partner_id", "position", "status"],
    example:  [{
      name:       "Mr. David Loh",
      email:      "david@techsolutions.com",
      phone:      "012-8765432",
      partner_id: "34",          // must match an existing industry_partners.partner_id
      position:   "Senior Engineer",
      status:     "Active",
    }],
  },
  manager: {
    required: ["name", "email"],
    optional: ["phone", "status"],
    example:  [{ name: "Emily Tan", email: "emilytan@vitrox.com", phone: "019-2345678", status: "Active" }],
  },
  application: {
    required: ["name", "email"],
    optional: ["phone", "status"],
    example:  [{ name: "Ali Hassan", email: "ali@example.com", phone: "012-3456789", status: "Active" }],
  }
};

export default function ImportModal({ type, onClose, onImport }) {
  const [rows, setRows]         = useState([]);
  const [fileName, setFileName] = useState("");
  const [error, setError]       = useState("");
  const [dragOver, setDrag]     = useState(false);
  const inputRef = useRef();

  const config = COLUMN_MAPS[type] || COLUMN_MAPS.applicant;
  const allCols = [...config.required, ...config.optional];

  // ── Parse file ────────────────────────────────────────────
  const parseFile = (file) => {
    setError("");
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setError("Please upload a .xlsx, .xls, or .csv file.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb    = XLSX.read(e.target.result, { type: "binary" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json  = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        // Normalise keys to lowercase + trim
        const normalised = json.map((row) => {
          const out = {};
          Object.keys(row).forEach((k) => {
            out[k.toLowerCase().trim().replace(/\s+/g, "_")] = String(row[k]).trim();
          });
          return out;
        });

        if (normalised.length === 0) { setError("The file is empty."); return; }

        const missingCols = config.required.filter((c) => !(c in normalised[0]));
        if (missingCols.length > 0) {
          setError(`Missing required columns: ${missingCols.join(", ")}`);
          return;
        }

        setRows(normalised.slice(0, 200));
      } catch {
        setError("Failed to parse file. Please check the format.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e) => parseFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    parseFile(e.dataTransfer.files[0]);
  };

  // ── Download template ─────────────────────────────────────
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(config.example);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `template_${type}.xlsx`);
  };

  const handleImport = () => {
    if (rows.length === 0) { setError("No data to import."); return; }
    onImport(rows);
    onClose();
  };

  const presentCols = allCols.filter((c) => c in (rows[0] || {}));

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "580px" }}>

        {/* Header */}
        <div className="modal-header">
          <p className="modal-title">Import from Excel / CSV</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Column hints */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <p style={{ fontSize: "12.5px", color: "#64748b" }}>
            Required: <strong style={{ color: "#1b3a6b" }}>{config.required.join(", ")}</strong>
            {config.optional.length > 0 && (
              <span style={{ color: "#94a3b8" }}> · Optional: {config.optional.join(", ")}</span>
            )}
          </p>
          <button className="import-template-link" onClick={downloadTemplate}>
            ⬇ Download Template
          </button>
        </div>

        {/* Hint for industry_partner: explain name vs company_name */}
        {type === "industry_partner" && (
          <div style={{ fontSize: "12px", color: "#6366f1", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "2px", padding: "8px 12px", marginBottom: "12px" }}>
            <strong>Note:</strong> <em>name</em> = contact person's name · <em>company_name</em> = company / organisation name
          </div>
        )}
        {type === "industry_supervisor" && (
          <div style={{ fontSize: "12px", color: "#6366f1", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "2px", padding: "8px 12px", marginBottom: "12px" }}>
            <strong>Note:</strong> <em>partner_id</em> must match an existing Industry Partner's ID. Company will be inherited automatically.
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`import-drop-zone ${dragOver ? "drag-over" : ""}`}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
        >
          <p className="import-drop-text">
            {fileName ? `✅ ${fileName}` : "Click to upload or drag & drop"}
          </p>
          <p className="import-drop-hint">Supports .xlsx, .xls, .csv — max 200 rows</p>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} style={{ display: "none" }} />
        </div>

        {error && (
          <p style={{ fontSize: "13px", color: "#ef4444", marginTop: "10px", fontWeight: "500" }}>
            ⚠ {error}
          </p>
        )}

        {/* Preview table */}
        {rows.length > 0 && (
          <>
            <p style={{ fontSize: "12.5px", color: "#94a3b8", marginTop: "14px", marginBottom: "6px" }}>
              Preview — {rows.length} row{rows.length !== 1 ? "s" : ""} detected
            </p>
            <div className="import-preview">
              <table>
                <thead>
                  <tr>
                    {presentCols.map((c) => <th key={c}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {presentCols.map((c) => <td key={c}>{row[c] || "—"}</td>)}
                    </tr>
                  ))}
                  {rows.length > 5 && (
                    <tr>
                      <td colSpan={99} style={{ textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>
                        + {rows.length - 5} more rows…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="modal-footer" style={{ marginTop: "18px" }}>
          <button className="ut-btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="ut-btn-success"
            onClick={handleImport}
            disabled={rows.length === 0}
            style={{ opacity: rows.length === 0 ? 0.5 : 1, cursor: rows.length === 0 ? "not-allowed" : "pointer" }}
          >
             Import {rows.length > 0 ? `${rows.length} Records` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}