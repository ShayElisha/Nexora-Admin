export default function UnauthorizedCard({
  title = "Unauthorized",
  description = "You don't have permission to view this page. Please sign in with an account that has access.",
  actionLabel = "Go to Sign In",
  onAction,
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="card card-elevated max-w-md w-full text-center p-8">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 flex items-center justify-center mb-5">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M16.5 10.5V7.5a4.5 4.5 0 10-9 0v3m-.75 0h10.5A1.75 1.75 0 0118.5 12.25v6A1.75 1.75 0 0116.75 20H7.25A1.75 1.75 0 015.5 18.25v-6a1.75 1.75 0 011.75-1.75z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{title}</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{description}</p>
        {onAction && (
          <button type="button" onClick={onAction} className="btn btn-primary w-fit px-6 py-2.5 mx-auto">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
