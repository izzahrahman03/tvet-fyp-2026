// components/userTable/ExportModal.jsx
import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { COL_LABEL } from "./tableConfig";
import { STATUS_LABEL } from "./StatusBadge";

/**
 * ExportModal
 *
 * Props:
 *   rows      – all rows currently in the table (post-filter is passed from UserTable)
 *   selected  – Set of selected row IDs
 *   columns   – column keys for this type (from COLUMNS[type])
 *   type      – entity type string
 *   onClose   – close handler
 */
export default function ExportModal({ rows, selected, columns, type, onClose }) {
  const [scope,  setScope]  = useState(selected.size > 0 ? "selected" : "all"); // "all" | "filtered" | "selected"
  const [format, setFormat] = useState("pdf"); // "pdf" | "csv"
  const [cols,   setCols]   = useState(new Set(columns)); // which columns to include

  const toggleCol = (col) =>
    setCols((prev) => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });

  const selectAllCols  = () => setCols(new Set(columns));
  const clearAllCols   = () => setCols(new Set());

  // ── Build export data ────────────────────────────────────
  const getExportRows = () => {
    const source =
      scope === "selected" && selected.size > 0
        ? rows.filter((r) => selected.has(r.id))
        : rows;

    const orderedCols = columns.filter((c) => cols.has(c));

    return source.map((row) => {
      const out = {};
      orderedCols.forEach((col) => {
        const label = COL_LABEL[col] || col;
        let val = row[col] ?? "";
        // Human-readable status
        if (col === "status") val = STATUS_LABEL[String(val).toLowerCase()] || val;
        // Format dates
        if ((col === "date" || col === "updated_at" || col === "created_at") && val) {
          val = new Date(val).toLocaleDateString("en-MY");
        }
        out[label] = val;
      });
      return out;
    });
  };

  const handleExport = () => {
    const data = getExportRows();
    if (data.length === 0) return;

    const typeLabel = {
      applicant:           "Applicants",
      student:             "Students",
      industry_partner:    "Industry_Partners",
      industry_supervisor: "Industry_Supervisors",
      application:         "Applications",
      manager:              "Managers",
    }[type] || "Records";

    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const fileName  = `${typeLabel}_${timestamp}`;

    if (format === "pdf") {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

      // Title
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59); // green-700
      doc.text(`${typeLabel.replace(/_/g, " ")} — ${timestamp}`, 40, 36);

      const headers = Object.keys(data[0] || {});
      const rows    = data.map((r) => headers.map((h) => String(r[h] ?? "")));

      autoTable(doc, {
        head:       [headers],
        body:       rows,
        startY:     52,
        margin:     { left: 40, right: 40 },
        styles:     { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        tableLineColor: [203, 213, 225],
        tableLineWidth: 0.5,
      });

      doc.save(`${fileName}.pdf`);
    } else {
      // CSV via xlsx
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Auto-width columns
      const colWidths = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.max(key.length, ...data.map((r) => String(r[key] ?? "").length), 10),
      }));
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, typeLabel);
      XLSX.writeFile(wb, `${fileName}.csv`, { bookType: "csv" });
    }

    onClose();
  };

  const exportCount =
    scope === "selected" && selected.size > 0 ? selected.size : rows.length;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "520px" }}>

        {/* Header */}
        <div className="modal-header">
          <p className="modal-title">Export Records</p>
          <button className="ut-modal-close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18 M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-form">

          {/* ── Scope ─────────────────────────────────────── */}
          <div className="form-field">
            <label>Export scope</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { value: "all",      label: `All records (${rows.length})` },
                ...(selected.size > 0
                  ? [{ value: "selected", label: `Selected rows (${selected.size})` }]
                  : []),
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setScope(value)}
                  style={{
                    padding:      "7px 14px",
                    borderRadius: "2px",
                    border:       `1.5px solid ${scope === value ? "#1b3a6b" : "#e2e8f0"}`,
                    background:   scope === value ? "#f1f5f9" : "#fff",
                    color:        scope === value ? "#1b3a6b" : "#475569",
                    fontWeight:   scope === value ? 600 : 400,
                    fontSize:     "13.5px",
                    cursor:       "pointer",
                    transition:   "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Format ────────────────────────────────────── */}
          <div className="form-field">
            <label>File format</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { value: "pdf", label: "PDF (.pdf)" },
                { value: "csv", label: "CSV (.csv)" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFormat(value)}
                  style={{
                    flex:         1,
                    padding:      "10px 12px",
                    borderRadius: "2px",
                    border:       `1.5px solid ${format === value ? "#1b3a6b" : "#e2e8f0"}`,
                    background:   format === value ? "#f1f5f9" : "#fff",
                    color:        format === value ? "#1b3a6b" : "#475569",
                    fontWeight:   format === value ? 600 : 400,
                    fontSize:     "13.5px",
                    cursor:       "pointer",
                    display:      "flex",
                    alignItems:   "center",
                    justifyContent: "center",
                    gap:          "6px",
                    transition:   "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Column picker ─────────────────────────────── */}
          <div className="form-field">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <label style={{ margin: 0 }}>Columns to include</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={selectAllCols}
                  style={{ fontSize: "12px", color: "#1b3a6b", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}
                >
                  All
                </button>
                <span style={{ color: "#cbd5e1" }}>|</span>
                <button
                  onClick={clearAllCols}
                  style={{ fontSize: "12px", color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  None
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {columns.map((col) => {
                const active = cols.has(col);
                return (
                  <button
                    key={col}
                    onClick={() => toggleCol(col)}
                    style={{
                      padding:      "5px 12px",
                      borderRadius: "2px",
                      border:       `1.5px solid ${active ? "#1b3a6b" : "#e2e8f0"}`,
                      background:   active ? "#e2e8f0" : "#f8fafc",
                      color:        active ? "#1b3a6b" : "#64748b",
                      fontSize:     "12.5px",
                      fontWeight:   active ? 600 : 400,
                      cursor:       "pointer",
                      transition:   "all 0.15s",
                      display:      "flex",
                      alignItems:   "center",
                      gap:          "4px",
                    }}
                  >
                    {active && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1b3a6b" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {COL_LABEL[col] || col}
                  </button>
                );
              })}
            </div>
            {cols.size === 0 && (
              <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px" }}>
                Select at least one column to export.
              </p>
            )}
          </div>

          {/* ── Summary banner ────────────────────────────── */}
          <div style={{
            background:   "#f1f5f9",
            border:       "1px solid #cbd5e1",
            borderRadius: "2px",
            padding:      "12px 16px",
            fontSize:     "13.5px",
            color:        "#1b3a6b",
            display:      "flex",
            alignItems:   "center",
            gap:          "10px",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b3a6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12" />
            </svg>
            <span>
              Exporting <strong>{exportCount} record{exportCount !== 1 ? "s" : ""}</strong> with{" "}
              <strong>{cols.size} column{cols.size !== 1 ? "s" : ""}</strong> as{" "}
              <strong>.{format}</strong>
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="ut-btn-secondary" onClick={onClose}>Cancel</button>
          <button
            onClick={handleExport}
            disabled={cols.size === 0 || exportCount === 0}
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "7px",
              padding:      "9px 20px",
              borderRadius: "2px",
              border:       "none",
              background:   cols.size === 0 || exportCount === 0 ? "#e2e8f0" : "#1b3a6b",
              color:        cols.size === 0 || exportCount === 0 ? "#94a3b8" : "#fff",
              fontSize:     "14px",
              fontWeight:   600,
              cursor:       cols.size === 0 || exportCount === 0 ? "not-allowed" : "pointer",
              transition:   "background 0.15s",
            }}
            onMouseEnter={(e) => { if (cols.size > 0 && exportCount > 0) e.currentTarget.style.background = "#1b3a6b"; }}
            onMouseLeave={(e) => { if (cols.size > 0 && exportCount > 0) e.currentTarget.style.background = "#1b3a6b"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12" />
            </svg>
            Export {exportCount > 0 ? `${exportCount} Records` : ""}
          </button>
        </div>

      </div>
    </div>
  );
}