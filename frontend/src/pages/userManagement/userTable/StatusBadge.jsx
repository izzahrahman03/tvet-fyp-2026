// components/userTable/StatusBadge.jsx

export const STATUS_STYLES = {
  active:              { bg: "#dcfce7", color: "#16a34a", dot: "#22c55e" },
  inactive:            { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  approved:            { bg: "#dcfce7", color: "#16a34a", dot: "#22c55e" },
  accepted:            { bg: "#dcfce7", color: "#16a34a", dot: "#22c55e" },
  pending:             { bg: "#fef9c3", color: "#ca8a04", dot: "#eab308" },
  under_review:        { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  interview:           { bg: "#f3e8ff", color: "#7c3aed", dot: "#8b5cf6" },
  rejected_review:     { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  rejected_interview:  { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  withdraw:            { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
};

export const STATUS_LABEL = {
  active:             "Active",
  inactive:           "Inactive",
  approved:           "Approved",
  accepted:           "Accepted",
  pending:            "Pending",
  under_review:       "Under Review",
  interview:          "Interview",
  rejected_review:    "Rejected (Review)",
  rejected_interview: "Rejected (Interview)",
  withdraw:           "Withdrawn",
};

export default function StatusBadge({ status }) {
  const key   = (status || "").toLowerCase();
  const s     = STATUS_STYLES[key] || { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" };
  const label = STATUS_LABEL[key] || (status ?? "—");
  return (
    <span className="status-badge" style={{ background: s.bg, color: s.color }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}