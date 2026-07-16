import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchAllCompanies } from "../api/api";
import {
  sendMessage,
  fetchMessages,
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  deleteMessage,
} from "../api/api";
import PageShell from "../components/ui/PageShell.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Toolbar from "../components/ui/Toolbar.jsx";
import { MessageSquare } from "lucide-react";

export default function CommunicationCenter() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("send");
  const [companies, setCompanies] = useState([]);
  const [messages, setMessages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const [companiesData, messagesData, templatesData] = await Promise.all([
        fetchAllCompanies(token),
        fetchMessages().catch(() => ({ data: [] })),
        fetchTemplates().catch(() => ({ data: [] })),
      ]);

      const companiesList = Array.isArray(companiesData) ? companiesData : [];
      console.log("Loaded companies:", companiesList.length);
      
      setCompanies(companiesList);
      setMessages(messagesData?.data || []);
      setTemplates(templatesData?.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      setCompanies([]);
      setMessages([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const tabs = [
    { id: "send", label: t("communication.sendMessage") },
    { id: "templates", label: t("communication.templates") },
    { id: "history", label: t("communication.history") },
    { id: "scheduled", label: t("communication.scheduled") },
  ];

  return (
    <PageShell>
      {notification && (
        <div
          className={`fixed top-20 end-6 z-50 px-8 py-5 border shadow-lg animate-scale rounded-xl backdrop-blur-sm ${
            notification.type === "success"
              ? "bg-[var(--white)] border-[var(--gray-300)]"
              : "bg-[var(--gray-900)] text-white border-[var(--gray-700)]"
          }`}
        >
          <div className="text-sm font-medium flex items-center gap-2">
            {notification.type === "success" ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <PageHeader
        title={t("communication.title")}
        subtitle={t("communication.subtitle")}
        icon={<MessageSquare className="w-5 h-5" />}
      />

      <div className="page-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`page-tab ${activeTab === tab.id ? "page-tab-active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28">
            <div className="spinner mb-6" style={{ width: "40px", height: "40px", borderWidth: "2px" }} />
            <p className="text-[var(--text-muted)]">{t("communication.loading")}</p>
          </div>
        ) : (
          <>
            {activeTab === "send" && (
              <SendMessageTab
                companies={companies}
                templates={templates}
                onSuccess={(message) => {
                  showNotification(message, "success");
                  loadData();
                }}
                onError={(error) => showNotification(error, "error")}
              />
            )}
            {activeTab === "templates" && (
              <TemplatesTab
                templates={templates}
                onSuccess={(message) => {
                  showNotification(message, "success");
                  loadData();
                }}
                onError={(error) => showNotification(error, "error")}
              />
            )}
            {activeTab === "history" && (
              <HistoryTab
                messages={messages.filter((m) => m.status === "sent" || m.status === "failed")}
                onDelete={() => {
                  showNotification(t("communication.messageDeleted"), "success");
                  loadData();
                }}
              />
            )}
            {activeTab === "scheduled" && (
              <ScheduledTab
                messages={messages.filter((m) => m.status === "scheduled")}
                onDelete={() => {
                  showNotification(t("communication.messageDeleted"), "success");
                  loadData();
                }}
              />
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}

// Send Message Tab
function SendMessageTab({ companies, templates, onSuccess, onError }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    subject: "",
    content: "",
    type: "email",
    companyIds: [],
    scheduledFor: "",
    useTemplate: false,
    templateId: "",
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCompanies = companies.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleTemplateSelect = (templateId) => {
    const template = templates.find((t) => t._id === templateId);
    if (template) {
      setFormData({
        ...formData,
        subject: template.subject,
        content: template.content,
        templateId: templateId,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.content || formData.companyIds.length === 0) {
      onError(t("communication.fillAllFields"));
      return;
    }

    setLoading(true);
    try {
      await sendMessage({
        ...formData,
        companyIds: formData.companyIds,
        scheduledFor: formData.scheduledFor || null,
      });
      onSuccess(formData.scheduledFor ? t("communication.messageScheduled") : t("communication.messageSent"));
      setFormData({
        subject: "",
        content: "",
        type: "email",
        companyIds: [],
        scheduledFor: "",
        useTemplate: false,
        templateId: "",
      });
    } catch (error) {
      onError(error.message || t("communication.failedToSend"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 card card-elevated">
        <form onSubmit={handleSubmit} className="space-y-5">
          {templates.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-tertiary)]/60 p-4">
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.useTemplate}
                  onChange={(e) => setFormData({ ...formData, useTemplate: e.target.checked })}
                  className="w-4 h-4 accent-[var(--primary)]"
                />
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {t("communication.useTemplate")}
                </span>
              </label>
              {formData.useTemplate && (
                <select
                  className="input"
                  value={formData.templateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                >
                  <option value="">{t("communication.selectTemplate")}</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="field-label">{t("communication.subject")}</label>
            <input
              type="text"
              className="input"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              placeholder={t("communication.subject")}
            />
          </div>

          <div>
            <label className="field-label">{t("communication.messageContent")}</label>
            <textarea
              className="input min-h-[12rem] resize-y"
              rows={10}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              placeholder={t("communication.htmlSupported")}
            />
          </div>

          <div className="rounded-2xl border border-[var(--border)] p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.scheduledFor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scheduledFor: e.target.checked
                      ? new Date(Date.now() + 3600000).toISOString().slice(0, 16)
                      : "",
                  })
                }
                className="w-4 h-4 accent-[var(--primary)]"
              />
              <span className="text-sm font-semibold">{t("communication.scheduleMessage")}</span>
            </label>
            {formData.scheduledFor && (
              <input
                type="datetime-local"
                className="input mt-3"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
              />
            )}
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full sm:w-auto px-8">
            {loading ? (
              <div className="flex items-center gap-2">
                <div
                  className="spinner"
                  style={{ borderTopColor: "white", borderColor: "rgba(255,255,255,0.2)" }}
                />
                <span>{t("communication.sending")}</span>
              </div>
            ) : formData.scheduledFor ? (
              t("communication.schedule")
            ) : (
              t("communication.send")
            )}
          </button>
        </form>
      </div>

      <aside className="card card-elevated flex flex-col min-h-[28rem]">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {t("communication.selectCompanies")}
          </h3>
          {companies.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (formData.companyIds.length === companies.length) {
                  setFormData({ ...formData, companyIds: [] });
                } else {
                  setFormData({
                    ...formData,
                    companyIds: companies.map((c) => c._id || c.id),
                  });
                }
              }}
              className="text-xs font-semibold text-[var(--primary)] hover:underline"
            >
              {formData.companyIds.length === companies.length
                ? t("communication.deselectAll")
                : t("communication.selectAll")}
            </button>
          )}
        </div>
        <input
          type="text"
          placeholder={t("communication.searchCompanies")}
          className="input mb-3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex-1 overflow-y-auto rounded-xl border border-[var(--border)] max-h-80">
          {companies.length === 0 ? (
            <div className="text-center py-10 px-4 text-[var(--text-muted)]">
              <p className="text-sm font-medium mb-1">{t("communication.noCompanies")}</p>
              <p className="text-xs">{t("communication.noCompaniesMessage")}</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-10 px-4 text-[var(--text-muted)]">
              <p className="text-sm font-medium mb-2">{t("communication.noMatch")}</p>
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                {t("communication.clearSearch")}
              </button>
            </div>
          ) : (
            filteredCompanies.map((company, index) => {
              const id = company._id || company.id;
              const selected = formData.companyIds.includes(id);
              return (
                <label
                  key={id || index}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                    selected ? "bg-[var(--primary)]/8" : "hover:bg-[var(--gray-50)]"
                  } ${index !== filteredCompanies.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, companyIds: [...formData.companyIds, id] });
                      } else {
                        setFormData({
                          ...formData,
                          companyIds: formData.companyIds.filter((cid) => cid !== id),
                        });
                      }
                    }}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-[var(--text-primary)]">
                      {company.name || t("communication.noCompanies")}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate">
                      {company.email || t("companies.email")}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span>
            {t("communication.total")}:{" "}
            <strong className="text-[var(--text-primary)]">{companies.length}</strong>
          </span>
          <span>
            {t("communication.selected")}:{" "}
            <strong className="text-[var(--primary)]">{formData.companyIds.length}</strong>
          </span>
        </div>
      </aside>
    </div>
  );
}

// Templates Tab
function TemplatesTab({ templates, onSuccess, onError }) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    content: "",
    category: "custom",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate._id, formData);
        onSuccess(t("communication.templateUpdated"));
      } else {
        await createTemplate(formData);
        onSuccess(t("communication.templateCreated"));
      }
      setShowModal(false);
      setEditingTemplate(null);
      setFormData({ name: "", subject: "", content: "", category: "custom" });
    } catch (error) {
      onError(error.message || t("communication.failedToSave"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("communication.deleteTemplateConfirm"))) return;
    try {
      await deleteTemplate(id);
      onSuccess(t("communication.templateDeleted"));
    } catch (error) {
      onError(error.message || t("communication.failedToDelete"));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {t("communication.templates")}
        </h2>
        <button onClick={() => setShowModal(true)} className="btn btn-primary btn-compact">
          + {t("communication.createTemplate")}
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="card card-elevated">
          <EmptyState
            title={t("communication.noTemplates")}
            description={t("empty.description")}
            actionLabel={t("communication.createFirstTemplate")}
            onAction={() => setShowModal(true)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template._id} className="list-item flex flex-col">
              <div className="flex justify-between items-start gap-3 mb-3">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  {template.name}
                </h3>
                <span className="soft-badge bg-teal-50 text-teal-800 border-teal-200">
                  {t(`communication.${template.category}`) || template.category}
                </span>
              </div>
              <div className="text-sm font-medium text-[var(--text-secondary)] mb-1">
                {template.subject}
              </div>
              <div className="text-xs text-[var(--text-muted)] mb-4 line-clamp-3 flex-1">
                {template.content}
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => {
                    setEditingTemplate(template);
                    setFormData({
                      name: template.name,
                      subject: template.subject,
                      content: template.content,
                      category: template.category,
                    });
                    setShowModal(true);
                  }}
                  className="btn btn-secondary btn-compact flex-1"
                >
                  {t("common.edit")}
                </button>
                <button
                  onClick={() => handleDelete(template._id)}
                  className="btn btn-secondary btn-compact flex-1 text-rose-600"
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TemplateModal
          formData={formData}
          setFormData={setFormData}
          editingTemplate={editingTemplate}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowModal(false);
            setEditingTemplate(null);
            setFormData({ name: "", subject: "", content: "", category: "custom" });
          }}
        />
      )}
    </div>
  );
}

function TemplateModal({ formData, setFormData, editingTemplate, onSubmit, onClose }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 max-w-2xl w-full animate-scale max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {editingTemplate
              ? t("communication.editTemplate")
              : t("communication.createTemplate")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--gray-50)] hover:text-[var(--text-primary)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="field-label">{t("communication.templateName")}</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="field-label">{t("communication.category")}</label>
            <select
              className="input"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="welcome">{t("communication.welcome")}</option>
              <option value="notification">{t("communication.notification")}</option>
              <option value="alert">{t("communication.alert")}</option>
              <option value="billing">{t("communication.billing")}</option>
              <option value="custom">{t("communication.custom")}</option>
            </select>
          </div>

          <div>
            <label className="field-label">{t("communication.templateSubject")}</label>
            <input
              type="text"
              className="input"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="field-label">{t("communication.templateContent")}</label>
            <textarea
              className="input min-h-[10rem] resize-y"
              rows={8}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1 min-w-[8rem]">
              {editingTemplate ? t("users.update") : t("users.create")}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1 min-w-[8rem]">
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// History Tab
function HistoryTab({ messages, onDelete }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = messages.filter(
    (m) =>
      m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <Toolbar>
        <input
          type="text"
          placeholder={t("communication.searchCompanies")}
          className="input max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Toolbar>

      {filtered.length === 0 ? (
        <div className="card card-elevated">
          <EmptyState title={t("communication.noMessages")} description={t("empty.description")} />
        </div>
      ) : (
        <div className="list-stack">
          {filtered.map((message) => (
            <div key={message._id} className="list-item">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1.5">
                    {message.subject}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span>
                      {t("communication.sentAt")}:{" "}
                      {new Date(message.sentAt || message.createdAt).toLocaleString()}
                    </span>
                    <span
                      className={`soft-badge border ${
                        message.status === "sent"
                          ? "bg-teal-50 text-teal-800 border-teal-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {t(`communication.${message.status}`)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await deleteMessage(message._id);
                      onDelete();
                    } catch (error) {
                      console.error("Failed to delete:", error);
                    }
                  }}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-rose-50 hover:text-rose-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              <div
                className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-4"
                dangerouslySetInnerHTML={{ __html: message.content }}
              />
              <div className="text-xs text-[var(--text-muted)]">
                {t("communication.recipients")}: {message.recipients?.length || 0} ·{" "}
                {t("common.type")}: {message.type}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Scheduled Tab
function ScheduledTab({ messages, onDelete }) {
  const { t } = useTranslation();
  return (
    <div>
      {messages.length === 0 ? (
        <div className="card card-elevated">
          <EmptyState title={t("communication.noScheduled")} description={t("empty.description")} />
        </div>
      ) : (
        <div className="list-stack">
          {messages.map((message) => (
            <div key={message._id} className="list-item">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1.5">
                    {message.subject}
                  </h3>
                  <div className="text-sm text-[var(--text-muted)]">
                    {t("communication.scheduledFor")}:{" "}
                    {new Date(message.scheduledFor).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await deleteMessage(message._id);
                      onDelete();
                    } catch (error) {
                      console.error("Failed to delete:", error);
                    }
                  }}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-rose-50 hover:text-rose-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              <div
                className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-4"
                dangerouslySetInnerHTML={{ __html: message.content }}
              />
              <div className="text-xs text-[var(--text-muted)]">
                {t("communication.recipients")}: {message.recipients?.length || 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

