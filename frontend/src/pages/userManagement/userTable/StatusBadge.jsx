// components/userTable/StatusBadge.jsx

export const STATUS_STYLES = {
  draft:               { bg: "#f1f5f9", color: "#475569" },
  none:                { bg: "#f1f5f9", color: "#475569" },
  submitted:           { bg: "#dbeafe", color: "#1e40af" },
  attended:            { bg: "#e0f2fe", color: "#075985" },
  absent:              { bg: "#ffedd5", color: "#9a3412" },
  passed:              { bg: "#dcfce7", color: "#166534" },
  failed:              { bg: "#fee2e2", color: "#991b1b" },
  accepted:            { bg: "#dcfce7", color: "#166534" },
  rejected:            { bg: "#fee2e2", color: "#991b1b" },
  // ── User account ─────────────────────────────────────────
  active:              { bg: "#dcfce7", color: "#166534" },
  inactive:            { bg: "#f1f5f9", color: "#64748b" },
  // ── Vacancy ──────────────────────────────────────────────
  open:                { bg: "#dcfce7", color: "#166534" },
  closed:              { bg: "#f1f5f9", color: "#64748b" },
  // ── Internship application ────────────────────────────────
  pending:             { bg: "#eff6ff", color: "#1d4ed8" },
  interview:           { bg: "#f5f3ff", color: "#6d28d9" },
  withdrawn:           { bg: "#f8fafc", color: "#64748b" },
  withdrawn_requested: { bg: "#fff7ed", color: "#c2410c" },
  terminated:          { bg: "#fee2e2", color: "#991b1b" },
};

export const STATUS_LABEL = {
  draft:               "Draft",
  none:                "None",
  submitted:           "Submitted",
  attended:            "Attended",
  absent:              "Absent",
  passed:              "Passed",
  failed:              "Failed",
  accepted:            "Accepted",
  rejected:            "Rejected",
  // ── User account ─────────────────────────────────────────
  active:              "Active",
  inactive:            "Inactive",
  // ── Vacancy ──────────────────────────────────────────────
  open:                "Open",
  closed:              "Closed",
  // ── Internship application ────────────────────────────────
  pending:             "Pending",
  interview:           "Interview",
  withdrawn:           "Withdrawn",
  withdrawn_requested: "Withdraw Requested",
  terminated:          "Terminated",
};

export default function StatusBadge({ status }) {
  const key   = (status || "").toLowerCase();
  const s     = STATUS_STYLES[key] || { bg: "#f1f5f9", color: "#64748b" };
  const label = STATUS_LABEL[key]  || (status ?? "None");
  return (
    <span className="ut-status-badge" style={{ background: s.bg, color: s.color }}>
      {label}
    </span>
  );
}