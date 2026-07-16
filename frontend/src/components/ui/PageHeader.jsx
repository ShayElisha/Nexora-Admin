export default function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  className = "",
}) {
  return (
    <header className={`page-header page-header-row ${className}`.trim()}>
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-1.5">
          {icon && <div className="page-header-icon">{icon}</div>}
          <h1 className="page-title mb-0">{title}</h1>
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
