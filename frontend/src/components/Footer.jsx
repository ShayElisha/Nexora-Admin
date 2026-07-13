import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-[var(--border)]/30 bg-[var(--bg)]/30 backdrop-blur-sm mt-auto">
      <div className="container py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} Nexora. {t("footer.rights") || "All rights reserved."}
          </div>
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">
              {t("footer.support") || "Support"}
            </a>
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">
              {t("footer.documentation") || "Documentation"}
            </a>
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">
              {t("footer.privacy") || "Privacy"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

