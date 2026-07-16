import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="site-footer">
      <div className="container py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} Nexora.{" "}
            {t("footer.rights") || "All rights reserved."}
          </div>
          <div className="flex items-center gap-5 text-xs text-[var(--text-muted)]">
            <a href="#" className="hover:text-[var(--primary)] transition-colors">
              {t("footer.support") || "Support"}
            </a>
            <a href="#" className="hover:text-[var(--primary)] transition-colors">
              {t("footer.documentation") || "Documentation"}
            </a>
            <a href="#" className="hover:text-[var(--primary)] transition-colors">
              {t("footer.privacy") || "Privacy"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
