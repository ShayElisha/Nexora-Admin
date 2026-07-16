import { useTheme } from "../context/ThemeContext.jsx";
import { useTranslation } from "react-i18next";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`util-chip util-chip-icon ${isDark ? "util-chip-active" : ""} ${className}`.trim()}
      aria-label={t("nav.toggleTheme", { defaultValue: "Toggle theme" })}
      title={isDark ? t("nav.lightMode", { defaultValue: "Light mode" }) : t("nav.darkMode", { defaultValue: "Dark mode" })}
    >
      {isDark ? (
        <svg className="w-[1.05rem] h-[1.05rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.85}
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
          />
        </svg>
      ) : (
        <svg className="w-[1.05rem] h-[1.05rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.85}
            d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414m0-11.314L7.05 7.05m11.314 11.314l-1.414-1.414M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  );
}
