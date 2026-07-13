import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "company_pending",
        "payment_issue",
        "subscription_expiring",
        "system_error",
        "at_risk_company",
        "high_priority_ticket",
        "subscription_expired",
        "payment_failed",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["unread", "read", "resolved"],
      default: "unread",
    },
    // Related entity information
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["Company", "SupportTicket", "User", "System"],
      },
      entityId: {
        type: String,
      },
    },
    actionUrl: {
      type: String,
    },
    actionLabel: {
      type: String,
    },
    readAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Indexes for performance
alertSchema.index({ status: 1, createdAt: -1 });
alertSchema.index({ type: 1, status: 1 });
alertSchema.index({ priority: 1, status: 1 });
alertSchema.index({ "relatedEntity.entityType": 1, "relatedEntity.entityId": 1 });

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;

