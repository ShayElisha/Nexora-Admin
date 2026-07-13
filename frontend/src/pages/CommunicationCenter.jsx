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
    <div className="min-h-screen pt-24 pb-16">
      {/* Toast */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 px-8 py-5 border shadow-lg animate-scale rounded-xl backdrop-blur-sm ${
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

      <div className="container">
        {/* Header */}
        <div className="mb-20 animate-in">
          <h1 className="text-6xl font-light mb-8 tracking-tight">{t("communication.title")}</h1>
          <p className="text-xl text-[var(--gray-500)] font-light">{t("communication.subtitle")}</p>
        </div>

        {/* Tabs */}
        <div className="mb-12 animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex gap-4 border-b border-[var(--gray-200)]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm uppercase tracking-wider font-light transition-all border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "border-[var(--black)] text-[var(--black)]"
                    : "border-transparent text-[var(--gray-500)] hover:text-[var(--black)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="animate-in" style={{ animationDelay: "0.2s" }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="spinner mb-6" style={{ width: "40px", height: "40px", borderWidth: "2px" }}></div>
              <p className="text-[var(--gray-500)] font-light">{t("communication.loading")}</p>
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
      </div>
    </div>
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="card border p-6">
              <label className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={formData.useTemplate}
                  onChange={(e) => setFormData({ ...formData, useTemplate: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">{t("communication.useTemplate")}</span>
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

          {/* Subject */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-medium mb-3 text-[var(--gray-600)]">
              {t("communication.subject")}
            </label>
            <input
              type="text"
              className="input"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              placeholder={t("communication.subject")}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-medium mb-3 text-[var(--gray-600)]">
              {t("communication.messageContent")}
            </label>
            <textarea
              className="input"
              rows={12}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              placeholder={t("communication.htmlSupported")}
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={!!formData.scheduledFor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scheduledFor: e.target.checked ? new Date(Date.now() + 3600000).toISOString().slice(0, 16) : "",
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">{t("communication.scheduleMessage")}</span>
            </label>
            {formData.scheduledFor && (
              <input
                type="datetime-local"
                className="input"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
              />
            )}
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="spinner" style={{ borderTopColor: "white", borderColor: "rgba(255,255,255,0.2)" }}></div>
                <span>{t("communication.sending")}</span>
              </div>
            ) : (
              formData.scheduledFor ? t("communication.schedule") : t("communication.send")
            )}
          </button>
        </form>
      </div>

      {/* Company Selection */}
      <div className="card border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">{t("communication.selectCompanies")}</h3>
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
              className="text-xs text-[var(--gray-500)] hover:text-[var(--black)] underline-animate"
            >
              {formData.companyIds.length === companies.length ? t("communication.deselectAll") : t("communication.selectAll")}
            </button>
          )}
        </div>
        <input
          type="text"
          placeholder={t("communication.searchCompanies")}
          className="input mb-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="space-y-1 max-h-96 overflow-y-auto border border-[var(--gray-200)] rounded">
          {companies.length === 0 ? (
            <div className="text-center py-12 text-[var(--gray-500)]">
              <svg className="w-12 h-12 mx-auto mb-4 text-[var(--gray-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm font-medium mb-2">{t("communication.noCompanies")}</p>
              <p className="text-xs">{t("communication.noCompaniesMessage")}</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12 text-[var(--gray-500)]">
              <p className="text-sm font-medium mb-2">{t("communication.noMatch")}</p>
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-xs text-[var(--black)] hover:underline"
              >
                {t("communication.clearSearch")}
              </button>
            </div>
          ) : (
            filteredCompanies.map((company, index) => (
              <label
                key={company._id || company.id || index}
                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                  formData.companyIds.includes(company._id || company.id)
                    ? "bg-[var(--gray-100)]"
                    : "hover:bg-[var(--gray-50)]"
                } ${index !== filteredCompanies.length - 1 ? "border-b border-[var(--gray-100)]" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={formData.companyIds.includes(company._id || company.id)}
                  onChange={(e) => {
                    const companyId = company._id || company.id;
                    if (e.target.checked) {
                      setFormData({ ...formData, companyIds: [...formData.companyIds, companyId] });
                    } else {
                      setFormData({
                        ...formData,
                        companyIds: formData.companyIds.filter((id) => id !== companyId),
                      });
                    }
                  }}
                  className="w-4 h-4 text-[var(--black)] border-[var(--gray-300)] rounded focus:ring-[var(--black)]"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{company.name || t("communication.noCompanies")}</div>
                  <div className="text-xs text-[var(--gray-500)] truncate">{company.email || t("companies.email")}</div>
                </div>
                {formData.companyIds.includes(company._id || company.id) && (
                  <svg className="w-5 h-5 text-[var(--black)] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </label>
            ))
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--gray-200)]">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--gray-500)]">
              {t("communication.total")}: <span className="font-medium text-[var(--black)]">{companies.length}</span> | 
              {t("communication.showing")}: <span className="font-medium text-[var(--black)]">{filteredCompanies.length}</span>
            </span>
            <span className={`font-medium ${formData.companyIds.length > 0 ? "text-[var(--black)]" : "text-[var(--gray-500)]"}`}>
              {t("communication.selected")}: {formData.companyIds.length}
            </span>
          </div>
        </div>
      </div>
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
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-light">{t("communication.templates")}</h2>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + {t("communication.createTemplate")}
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--gray-500)] mb-4">{t("communication.noTemplates")}</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            {t("communication.createFirstTemplate")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
          <div key={template._id} className="card border p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">{template.name}</h3>
              <span className="badge badge-success text-xs">{t(`communication.${template.category}`) || template.category}</span>
            </div>
            <div className="text-sm text-[var(--gray-600)] mb-2">{template.subject}</div>
            <div className="text-xs text-[var(--gray-500)] mb-4 line-clamp-3">{template.content}</div>
            <div className="flex gap-2">
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
                className="btn btn-secondary flex-1 text-xs"
              >
                {t("common.edit")}
              </button>
              <button
                onClick={() => handleDelete(template._id)}
                className="btn btn-secondary flex-1 text-xs"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full animate-scale max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light">{editingTemplate ? t("communication.editTemplate") : t("communication.createTemplate")}</h2>
          <button onClick={onClose} className="text-[var(--gray-400)] hover:text-[var(--black)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">{t("communication.templateName")}</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">{t("communication.category")}</label>
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
            <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">{t("communication.templateSubject")}</label>
            <input
              type="text"
              className="input"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--gray-500)] mb-2">{t("communication.templateContent")}</label>
            <textarea
              className="input"
              rows={10}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              {editingTemplate ? t("users.update") : t("users.create")}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
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
    <div>
      <div className="mb-8">
        <input
          type="text"
          placeholder={t("communication.searchCompanies")}
          className="input max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--gray-500)]">{t("communication.noMessages")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((message) => (
          <div key={message._id} className="card border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium mb-2">{message.subject}</h3>
                <div className="flex items-center gap-4 text-sm text-[var(--gray-500)]">
                  <span>{t("communication.sentAt")}: {new Date(message.sentAt || message.createdAt).toLocaleString()}</span>
                  <span className={`badge ${message.status === "sent" ? "badge-success" : "badge-warning"}`}>
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
                className="text-[var(--gray-400)] hover:text-[var(--black)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div className="text-sm text-[var(--gray-600)] mb-4" dangerouslySetInnerHTML={{ __html: message.content }} />
            <div className="text-xs text-[var(--gray-500)]">
              {t("communication.recipients")}: {message.recipients?.length || 0} | {t("common.type")}: {message.type}
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
        <div className="text-center py-16">
          <p className="text-[var(--gray-500)]">{t("communication.noScheduled")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {messages.map((message) => (
          <div key={message._id} className="card border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium mb-2">{message.subject}</h3>
                <div className="text-sm text-[var(--gray-500)]">
                  {t("communication.scheduledFor")}: {new Date(message.scheduledFor).toLocaleString()}
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
                className="text-[var(--gray-400)] hover:text-[var(--black)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div className="text-sm text-[var(--gray-600)] mb-4" dangerouslySetInnerHTML={{ __html: message.content }} />
            <div className="text-xs text-[var(--gray-500)]">
              {t("communication.recipients")}: {message.recipients?.length || 0}
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}

