const VARIANTS = {
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-error",
  info: "badge-info",
  neutral: "badge-neutral",
};

export function statusVariant(status = "") {
  const value = String(status).toLowerCase();
  if (["active", "sent", "paid", "succeeded", "approved"].includes(value)) return "success";
  if (["pending", "scheduled", "draft", "inactive"].includes(value)) return "warning";
  if (["failed", "critical", "rejected", "cancelled"].includes(value)) return "error";
  if (["high"].includes(value)) return "warning";
  return "neutral";
}

export default function StatusBadge({ status, variant, children, className = "" }) {
  const resolved = variant || statusVariant(status);
  return (
    <span className={`badge ${VARIANTS[resolved] || VARIANTS.neutral} ${className}`.trim()}>
      {children || status}
    </span>
  );
}
