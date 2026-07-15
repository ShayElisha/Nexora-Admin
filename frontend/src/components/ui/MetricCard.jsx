export default function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = "blue",
  trend,
  onDismiss,
  className = "",
}) {
  const toneClass = {
    blue: "metric-icon-blue",
    green: "metric-icon-green",
    orange: "metric-icon-orange",
    red: "metric-icon-red",
    slate: "metric-icon-slate",
  }[tone] || "metric-icon-blue";

  const trendPositive = typeof trend === "number" ? trend >= 0 : null;

  return (
    <div className={`card card-elevated metric-card relative ${className}`.trim()}>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 end-3 text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-sm leading-none"
          aria-label="Hide widget"
        >
          ×
        </button>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="metric-label">{label}</p>
          <p className="metric-value">{value}</p>
          {hint && <p className="metric-hint">{hint}</p>}
          {typeof trend === "number" && (
            <p className={`metric-trend ${trendPositive ? "is-up" : "is-down"}`}>
              {trendPositive ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
            </p>
          )}
        </div>
        {icon && <div className={`metric-icon ${toneClass}`}>{icon}</div>}
      </div>
    </div>
  );
}
