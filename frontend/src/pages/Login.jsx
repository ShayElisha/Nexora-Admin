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
        // Store minimal user info in localStorage for UI purposes only
        // Authentication is handled via httpOnly cookies
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.replace("/dashboard");
      } else {
        setError(data.message || t("login.invalidCredentials"));
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || err.response?.data?.message || t("login.invalidCredentials"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-10" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-20 animate-in">
          <h1 className="text-5xl font-light mb-8 tracking-tight">{t("login.title")}</h1>
          <p className="text-xl text-[var(--gray-500)] font-light">{t("login.subtitle")}</p>
        </div>

        {/* Form */}
        <div className="animate-in" style={{ animationDelay: '0.1s' }}>
          {error && (
            <div className="mb-8 p-4 border border-[var(--gray-300)] bg-[var(--gray-50)] text-sm text-[var(--gray-700)] animate-scale">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-12">
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium mb-5 text-[var(--gray-600)]">
                {t("login.emailAddress")}
              </label>
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
              <label className="block text-xs uppercase tracking-wider font-medium mb-5 text-[var(--gray-600)]">
                {t("login.password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("login.passwordPlaceholder")}
                  className={`input ${isRTL ? 'pl-12' : 'pr-12'}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 transform -translate-y-1/2 text-[var(--gray-500)] hover:text-[var(--gray-700)] focus:outline-none transition-colors ${isRTL ? 'left-3' : 'right-3'}`}
                  aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className={`flex items-center justify-between text-sm pt-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                <input
                  type="checkbox"
                  className="w-4 h-4 border-[var(--gray-300)]"
                />
                <span className="text-[var(--gray-600)] font-light">{t("login.rememberMe")}</span>
              </label>
              <Link to="/forgot-password" className="text-[var(--black)] font-light underline-animate">
                {t("login.forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary w-full mt-16 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {loading ? (
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.2)' }}></div>
                  <span>{t("login.signingIn")}</span>
                </div>
              ) : (
                t("login.title")
              )}
            </button>
          </form>

          <div className="mt-16 pt-12 border-t border-[var(--gray-200)] text-center">
            <p className="text-sm text-[var(--gray-600)] font-light mb-6">
              {t("login.dontHaveAccount")}
            </p>
            <Link to="/register">
              <button type="button" className="btn btn-secondary w-full">
                {t("login.createAccount")}
              </button>
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--gray-400)] mt-12 font-light uppercase tracking-wider">
          © 2024 Nexora
        </p>
      </div>
    </div>
  );
}
