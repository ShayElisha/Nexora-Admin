import { useState } from "react";
import { useTranslation } from "react-i18next";
import { loginUser } from "../api/api";
import { Link } from "react-router-dom";

export default function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isRTL = i18n.language === "he";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await loginUser(email, password);
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.replace("/dashboard");
      } else {
        setError(data.message || t("login.invalidCredentials"));
        setLoading(false);
      }
    } catch (err) {
      setError(
        err.message || err.response?.data?.message || t("login.invalidCredentials")
      );
      setLoading(false);
    }
  };

  return (
    <div className="auth-stage" dir={isRTL ? "rtl" : "ltr"}>
      <div className="auth-card animate-in">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="brand-mark-dot" />
            <span className="brand-mark-text text-[var(--text-primary)]">Nexora</span>
          </div>
          <h1 className="auth-brand">{t("login.title")}</h1>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {t("login.subtitle")}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="field-label">{t("login.emailAddress")}</label>
            <input
              type="email"
              placeholder={t("login.emailPlaceholder")}
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              dir="ltr"
            />
          </div>

          <div>
            <label className="field-label">{t("login.password")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("login.passwordPlaceholder")}
                className="input pe-14"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label={
                  showPassword ? t("login.hidePassword") : t("login.showPassword")
                }
              >
                {showPassword ? t("login.hide") : t("login.show")}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2 text-[var(--text-secondary)]">
              <input type="checkbox" className="rounded border-[var(--border-strong)]" />
              {t("login.rememberMe")}
            </label>
            <Link to="/forgot-password" className="font-medium underline-animate">
              {t("login.forgotPassword")}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full mt-2"
          >
            {loading ? t("login.signingIn") : t("login.title")}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            {t("login.dontHaveAccount")}
          </p>
          <Link to="/register" className="btn btn-secondary btn-compact mx-auto">
            {t("login.createAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}
