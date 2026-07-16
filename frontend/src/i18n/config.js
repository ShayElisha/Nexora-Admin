import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslations from "./locales/en.json";
import heTranslations from "./locales/he.json";

/** Turn raw keys like nav.userActivity into "User Activity" when missing. */
export function humanizeKey(key = "") {
  const leaf = String(key).split(".").pop() || String(key);
  return leaf
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function isRtlLanguage(lang) {
  const code = String(lang || "en").toLowerCase().split("-")[0];
  return code === "he" || code === "ar";
}

export function applyDocumentLocale(lang) {
  const code = String(lang || "en").toLowerCase().split("-")[0] || "en";
  const dir = isRtlLanguage(code) ? "rtl" : "ltr";
  document.documentElement.lang = code;
  document.documentElement.dir = dir;
  document.body?.setAttribute("dir", dir);
  return { lang: code, dir };
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      he: { translation: heTranslations },
    },
    fallbackLng: "en",
    debug: false,
    returnNull: false,
    returnEmptyString: false,
    parseMissingKeyHandler: (key) => humanizeKey(key),
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

applyDocumentLocale(i18n.language);

i18n.on("languageChanged", (lang) => {
  applyDocumentLocale(lang);
});

export default i18n;
