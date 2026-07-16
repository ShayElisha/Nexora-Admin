export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 animate-in ${className}`.trim()}
    >
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] mb-5">
        {icon || (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0H4"
            />
          </svg>
        )}
      </div>
      {title && (
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-5">{description}</p>
      )}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn btn-primary w-fit px-6 py-2.5">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
