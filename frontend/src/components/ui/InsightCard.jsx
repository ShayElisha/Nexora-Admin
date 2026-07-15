export default function InsightCard({
  title,
  description,
  tone = "primary",
  icon,
  className = "",
}) {
  return (
    <div className={`insight-card insight-${tone} ${className}`.trim()}>
      <div className="flex items-start gap-3">
        {icon && <div className="insight-icon">{icon}</div>}
        <div className="min-w-0">
          {title && <p className="insight-title">{title}</p>}
          {description && <p className="insight-description">{description}</p>}
        </div>
      </div>
    </div>
  );
}
