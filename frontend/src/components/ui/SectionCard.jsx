export default function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = "",
  bodyClassName = "",
}) {
  return (
    <section className={`card card-elevated ${className}`.trim()}>
      {(title || action) && (
        <div className="section-card-header">
          <div>
            {title && <h3 className="section-card-title">{title}</h3>}
            {subtitle && <p className="section-card-subtitle">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
