import { useTranslation } from "react-i18next";
import { applyDocumentLocale } from "../i18n/config.js";

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || "en").toLowerCase().startsWith("he")
    ? "he"
    : "en";

  const toggleLanguage = () => {
    const newLang = currentLang === "he" ? "en" : "he";
    i18n.changeLanguage(newLang);
    applyDocumentLocale(newLang);
    localStorage.setItem("i18nextLng", newLang);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--gray-50)] transition-colors"
      aria-label="Toggle language"
    >
      {currentLang === "he" ? "EN" : "עב"}
    </button>
  );
}
