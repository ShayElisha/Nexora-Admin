import { useTranslation } from "react-i18next";
import { applyDocumentLocale } from "../i18n/config.js";

export default function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || "en").toLowerCase().startsWith("he")
    ? "he"
    : "en";

  const setLanguage = (newLang) => {
    if (newLang === currentLang) return;
    i18n.changeLanguage(newLang);
    applyDocumentLocale(newLang);
    localStorage.setItem("i18nextLng", newLang);
  };

  return (
    <div
      className="lang-switch"
      role="group"
      aria-label={t("nav.toggleLanguage", { defaultValue: "Language" })}
    >
      <button
        type="button"
        className={`lang-switch-option ${currentLang === "en" ? "is-active" : ""}`}
        onClick={() => setLanguage("en")}
        aria-pressed={currentLang === "en"}
      >
        EN
      </button>
      <button
        type="button"
        className={`lang-switch-option ${currentLang === "he" ? "is-active" : ""}`}
        onClick={() => setLanguage("he")}
        aria-pressed={currentLang === "he"}
      >
        עב
      </button>
    </div>
  );
}
