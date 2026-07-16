import { useTranslation } from "react-i18next";
import EmptyState from "./EmptyState.jsx";

export default function ErrorPanel({
  title,
  message,
  onRetry,
  retryLabel,
}) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("common.somethingWentWrong");
  const resolvedRetry = retryLabel ?? t("common.tryAgain");

  return (
    <div className="card card-elevated">
      <EmptyState
        icon={
          <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        }
        title={resolvedTitle}
        description={message || t("common.databaseUnavailable")}
        actionLabel={onRetry ? resolvedRetry : undefined}
        onAction={onRetry}
      />
    </div>
  );
}
