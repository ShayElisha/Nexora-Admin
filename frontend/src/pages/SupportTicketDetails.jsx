import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchSupportTicketById, updateSupportTicketStatus, addSupportTicketComment } from "../api/api";
import { useToast } from "../components/Toaster.jsx";
import { format } from "date-fns";
import { ArrowLeft, MessageSquare, Send, User, Calendar, Building } from "lucide-react";

const getStatusColor = (status) => {
  switch (status) {
    case "Open":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "Resolved":
      return "bg-green-100 text-green-700 border-green-300";
    case "Closed":
      return "bg-gray-100 text-gray-700 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case "Bug Report":
      return "🐛";
    case "Feature Request":
      return "✨";
    case "Technical Support":
      return "🔧";
    case "Billing":
      return "💳";
    case "General Question":
      return "❓";
    case "Account Issue":
      return "👤";
    default:
      return "📋";
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case "Urgent":
      return "text-red-600 font-bold";
    case "High":
      return "text-orange-600 font-semibold";
    case "Medium":
      return "text-yellow-600";
    case "Low":
      return "text-gray-500";
    default:
      return "text-gray-400";
  }
};

export default function SupportTicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const isRTL = i18n.language === "he";

  useEffect(() => {
    const loadTicket = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const token = (() => {
          try {
            return JSON.parse(localStorage.getItem("user"))?.token;
          } catch {
            return null;
          }
        })();
        const data = await fetchSupportTicketById(id, token);
        setTicket(data?.data || data);
      } catch (err) {
        setError(err?.message || t("supportTickets.ticketDetails.failedToLoad"));
        showToast(err?.message || t("supportTickets.ticketDetails.failedToLoad"), "error");
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [id, showToast]);

  const handleStatusChange = async (newStatus) => {
    if (!ticket) return;
    setIsUpdatingStatus(true);
    try {
      const token = (() => {
        try {
          return JSON.parse(localStorage.getItem("user"))?.token;
        } catch {
          return null;
        }
      })();
      await updateSupportTicketStatus(ticket._id, newStatus, token);
      setTicket({ ...ticket, status: newStatus });
      showToast(t("supportTickets.ticketDetails.statusUpdated"), "success");
    } catch (err) {
      showToast(err?.message || t("supportTickets.ticketDetails.failedToUpdateStatus"), "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !ticket) return;
    setIsSubmittingComment(true);
    try {
      const token = (() => {
        try {
          return JSON.parse(localStorage.getItem("user"))?.token;
        } catch {
          return null;
        }
      })();
      await addSupportTicketComment(ticket._id, newComment, token);
      // Reload ticket to get updated comments
      const data = await fetchSupportTicketById(ticket._id, token);
      setTicket(data?.data || data);
      setNewComment("");
      showToast(t("supportTickets.ticketDetails.commentAdded"), "success");
    } catch (err) {
      showToast(err?.message || t("supportTickets.ticketDetails.failedToAddComment"), "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[var(--bg)]">
        <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "2px" }}></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[var(--bg)]">
        <div className="card text-center">
          <p className="text-red-500 font-medium text-lg mb-4">{t("supportTickets.ticketDetails.notFound")}</p>
          <Link to="/support-tickets" className="btn btn-primary">
            {t("supportTickets.ticketDetails.back")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container space-y-6">
        <div>
          <button
            onClick={() => navigate("/support-tickets")}
            className="btn btn-secondary mb-6 flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            {t("supportTickets.ticketDetails.back")}
          </button>
          
          <div className="card mb-6">
            <div className={`flex items-start gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-4xl">{getCategoryIcon(ticket.category)}</span>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-3">{ticket.title}</h1>
                <div className={`flex items-center gap-6 text-sm text-[var(--text-muted)] flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <User size={16} />
                    <span>{ticket.createdBy?.name || t("supportTickets.unknown")}</span>
                  </span>
                  <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Calendar size={16} />
                    <span>{format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                  </span>
                  {ticket.companyId && (
                    <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Building size={16} />
                      <span>{ticket.companyId?.name || t("supportTickets.unknown")}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <label className="block text-xs uppercase tracking-[0.5em] mb-3 font-medium text-[var(--text-muted)]">
              {t("supportTickets.ticketDetails.status")}
            </label>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdatingStatus}
              className="input w-full"
            >
              <option value="Open">{t("supportTickets.open")}</option>
              <option value="In Progress">{t("supportTickets.inProgress")}</option>
              <option value="Resolved">{t("supportTickets.resolved")}</option>
              <option value="Closed">{t("supportTickets.closed")}</option>
            </select>
          </div>
          <div className="card">
            <label className="block text-xs uppercase tracking-[0.5em] mb-3 font-medium text-[var(--text-muted)]">
              {t("supportTickets.ticketDetails.priority")}
            </label>
            <div className={`px-4 py-3 rounded-lg border text-center font-bold text-lg ${getStatusColor(ticket.status)} ${getPriorityColor(ticket.priority)}`}>
              {t(`supportTickets.priorities.${ticket.priority}`) || ticket.priority}
            </div>
          </div>
          <div className="card">
            <label className="block text-xs uppercase tracking-[0.5em] mb-3 font-medium text-[var(--text-muted)]">
              {t("supportTickets.ticketDetails.category")}
            </label>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-3xl">{getCategoryIcon(ticket.category)}</span>
              <span className="text-lg font-semibold">{t(`supportTickets.categories.${ticket.category}`) || ticket.category}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">{t("supportTickets.ticketDetails.description")}</h2>
          <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]">
            <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>
        </div>

        {/* Comments Section */}
        <div className="card">
          <h2 className={`text-xl font-bold mb-6 flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <MessageSquare size={20} />
            {t("supportTickets.ticketDetails.comments")} 
            <span className="px-3 py-1 rounded-full bg-[var(--bg-tertiary)] text-sm font-bold">
              {ticket.comments?.length || 0}
            </span>
          </h2>

          {/* Comments List */}
          <div className="space-y-4 mb-6">
            {ticket.comments && ticket.comments.length > 0 ? (
              ticket.comments.map((comment, index) => (
                <div key={index} className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)]">
                  <div className={`flex items-center gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold">
                      {comment.userId?.name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{comment.userId?.name || t("supportTickets.unknown")}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className={isRTL ? "pr-14" : "pl-14"}>
                    <p className="text-[var(--text-secondary)] leading-relaxed" dir="auto">{comment.comment}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-lg">
                <MessageSquare size={48} className="mx-auto mb-3 text-[var(--text-muted)]" />
                <p className="text-[var(--text-secondary)] font-medium">{t("supportTickets.ticketDetails.noComments")}</p>
              </div>
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="space-y-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("supportTickets.ticketDetails.addComment")}
              rows={4}
              className="input w-full resize-none"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !newComment.trim()}
              className={`btn btn-primary w-full flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {isSubmittingComment ? (
                <>
                  <div className="spinner border-white" style={{ width: "18px", height: "18px", borderWidth: "2px" }}></div>
                  {t("supportTickets.ticketDetails.adding")}
                </>
              ) : (
                <>
                  <Send size={18} />
                  {t("supportTickets.ticketDetails.addCommentButton")}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
