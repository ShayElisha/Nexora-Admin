import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const newLang = currentLang === "he" ? "en" : "he";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "he" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
    localStorage.setItem("i18nextLng", newLang);
  };

  // Set initial direction
  useEffect(() => {
    const lang = i18n.language || "en";
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [i18n.language]);

  return (
    <button
      onClick={toggleLanguage}
      className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
      aria-label="Toggle language"
    >
      {currentLang === "he" ? "EN" : "עב"}
    </button>
  );
}

