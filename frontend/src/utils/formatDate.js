import i18n from "../i18n/config.js";

/**
 * Locale-aware date formatting for the active i18n language.
 */
export function formatDate(value, options = {}) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const lang = (i18n.language || "en").toLowerCase().startsWith("he")
    ? "he-IL"
    : "en-US";

  const {
    dateStyle = "medium",
    timeStyle,
    ...rest
  } = options;

  try {
    if (timeStyle) {
      return new Intl.DateTimeFormat(lang, { dateStyle, timeStyle, ...rest }).format(date);
    }
    return new Intl.DateTimeFormat(lang, { dateStyle, ...rest }).format(date);
  } catch {
    return date.toLocaleDateString(lang);
  }
}

export function formatDateTime(value) {
  return formatDate(value, { dateStyle: "medium", timeStyle: "short" });
}

export function formatDateLong(value) {
  return formatDate(value, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
