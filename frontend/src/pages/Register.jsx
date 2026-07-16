import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { registerUser } from "../api/api";

export default function Register() {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isRTL = i18n.language === "he";

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await registerUser({ name, email, password });
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.replace("/dashboard");
      } else {
        setError(data.message || t("register.failed"));
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || err.error || t("register.failed"));
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
          <h1 className="auth-brand">{t("register.title")}</h1>
          <p className="text-[var(--text-secondary)] text-sm">{t("register.subtitle")}</p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="field-label">{t("register.name")}</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label">{t("register.email")}</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div>
            <label className="field-label">{t("register.password")}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? t("register.creating") : t("register.createAccount")}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--border)] text-center text-sm text-[var(--text-secondary)]">
          {t("register.haveAccount")}{" "}
          <Link to="/" className="font-semibold text-[var(--primary)]">
            {t("register.signIn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
