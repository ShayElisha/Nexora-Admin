import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../components/Toaster.jsx";

export default function Settings() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Nexora",
    siteEmail: "admin@nexora.com",
    maintenanceMode: false,
    allowRegistrations: true,
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "noreply@nexora.com",
    fromName: "Nexora",
  });

  const [emailTemplates, setEmailTemplates] = useState([
    {
      id: 1,
      name: "Welcome Email",
      subject: "Welcome to Nexora",
      body: "Dear {{name}},\n\nWelcome to Nexora! We're excited to have you on board.",
    },
    {
      id: 2,
      name: "Payment Confirmation",
      subject: "Payment Received",
      body: "Dear {{name}},\n\nYour payment of {{amount}} has been received. Thank you!",
    },
    {
      id: 3,
      name: "Subscription Ending",
      subject: "Your Subscription is Ending Soon",
      body: "Dear {{name}},\n\nYour subscription will end on {{endDate}}. Please renew to continue using our services.",
    },
  ]);

  const [integrations, setIntegrations] = useState({
    stripe: {
      enabled: true,
      publicKey: "",
      secretKey: "",
    },
    emailService: {
      enabled: true,
      provider: "smtp",
    },
  });

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      // TODO: Implement API call to save general settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast("General settings saved", "success");
    } catch (err) {
      showToast(err?.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setSaving(true);
    try {
      // TODO: Implement API call to save email settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast("Email settings saved", "success");
    } catch (err) {
      showToast(err?.message || "Failed to save email settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async (template) => {
    setSaving(true);
    try {
      // TODO: Implement API call to save email template
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast(`Template "${template.name}" saved`, "success");
    } catch (err) {
      showToast(err?.message || "Failed to save template", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIntegrations = async () => {
    setSaving(true);
    try {
      // TODO: Implement API call to save integrations
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast("Integration settings saved", "success");
    } catch (err) {
      showToast(err?.message || "Failed to save integrations", "error");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "general", label: t("settings.general") },
    { id: "email", label: t("settings.email") },
    { id: "templates", label: t("settings.templates") },
    { id: "integrations", label: t("settings.integrations") },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t("settings.title")}</h1>
          <p className="text-[var(--text-secondary)]">
            {t("settings.subtitle")}
          </p>
        </header>

        {/* Tabs */}
        <div className="card p-6 mb-8">
          <div className="flex gap-2 border-b border-[var(--border)]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-[var(--primary)] border-b-2 border-[var(--primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* General Settings */}
        {activeTab === "general" && (
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-6">
              {t("settings.generalSettings")}
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-2">
                  {t("settings.siteName")}
                </label>
                <input
                  type="text"
                  className="input w-full"
                  value={generalSettings.siteName}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      siteName: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm mb-2">
                  {t("settings.siteEmail")}
                </label>
                <input
                  type="email"
                  className="input w-full"
                  value={generalSettings.siteEmail}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      siteEmail: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={generalSettings.maintenanceMode}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      maintenanceMode: e.target.checked,
                    })
                  }
                />
                <label htmlFor="maintenanceMode" className="text-sm">
                  {t("settings.maintenanceMode")}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowRegistrations"
                  checked={generalSettings.allowRegistrations}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      allowRegistrations: e.target.checked,
                    })
                  }
                />
                <label htmlFor="allowRegistrations" className="text-sm">
                  {t("settings.allowRegistrations")}
                </label>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSaveGeneral}
                disabled={saving}
              >
                {saving ? t("settings.saving") : t("settings.save")}
              </button>
            </div>
          </div>
        )}

        {/* Email Settings */}
        {activeTab === "email" && (
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-6">
              {t("settings.emailSettings")}
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-2">
                  {t("settings.smtpHost")}
                </label>
                <input
                  type="text"
                  className="input w-full"
                  value={emailSettings.smtpHost}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      smtpHost: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">
                    {t("settings.smtpPort")}
                  </label>
                  <input
                    type="number"
                    className="input w-full"
                    value={emailSettings.smtpPort}
                    onChange={(e) =>
                      setEmailSettings({
                        ...emailSettings,
                        smtpPort: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">
                    {t("settings.smtpUser")}
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    value={emailSettings.smtpUser}
                    onChange={(e) =>
                      setEmailSettings({
                        ...emailSettings,
                        smtpUser: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">
                  {t("settings.smtpPassword")}
                </label>
                <input
                  type="password"
                  className="input w-full"
                  value={emailSettings.smtpPassword}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      smtpPassword: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">
                    {t("settings.fromEmail")}
                  </label>
                  <input
                    type="email"
                    className="input w-full"
                    value={emailSettings.fromEmail}
                    onChange={(e) =>
                      setEmailSettings({
                        ...emailSettings,
                        fromEmail: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">
                    {t("settings.fromName")}
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    value={emailSettings.fromName}
                    onChange={(e) =>
                      setEmailSettings({
                        ...emailSettings,
                        fromName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSaveEmail}
                disabled={saving}
              >
                {saving ? t("settings.saving") : t("settings.save")}
              </button>
            </div>
          </div>
        )}

        {/* Email Templates */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            {emailTemplates.map((template) => (
              <div key={template.id} className="card p-6">
                <h3 className="text-xl font-bold mb-4">{template.name}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">
                      {t("settings.subject")}
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      value={template.subject}
                      onChange={(e) => {
                        const updated = emailTemplates.map((t) =>
                          t.id === template.id
                            ? { ...t, subject: e.target.value }
                            : t
                        );
                        setEmailTemplates(updated);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">
                      {t("settings.body")}
                    </label>
                    <textarea
                      className="textarea w-full"
                      rows={6}
                      value={template.body}
                      onChange={(e) => {
                        const updated = emailTemplates.map((t) =>
                          t.id === template.id
                            ? { ...t, body: e.target.value }
                            : t
                        );
                        setEmailTemplates(updated);
                      }}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSaveTemplate(template)}
                    disabled={saving}
                  >
                    {saving ? t("settings.saving") : t("settings.save")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Integrations */}
        {activeTab === "integrations" && (
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-6">
              {t("settings.integrations")}
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Stripe</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      {t("settings.stripeDescription")}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={integrations.stripe.enabled}
                      onChange={(e) =>
                        setIntegrations({
                          ...integrations,
                          stripe: {
                            ...integrations.stripe,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                  </label>
                </div>
                {integrations.stripe.enabled && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm mb-2">
                        {t("settings.publicKey")}
                      </label>
                      <input
                        type="text"
                        className="input w-full"
                        value={integrations.stripe.publicKey}
                        onChange={(e) =>
                          setIntegrations({
                            ...integrations,
                            stripe: {
                              ...integrations.stripe,
                              publicKey: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">
                        {t("settings.secretKey")}
                      </label>
                      <input
                        type="password"
                        className="input w-full"
                        value={integrations.stripe.secretKey}
                        onChange={(e) =>
                          setIntegrations({
                            ...integrations,
                            stripe: {
                              ...integrations.stripe,
                              secretKey: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSaveIntegrations}
                disabled={saving}
              >
                {saving ? t("settings.saving") : t("settings.save")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

