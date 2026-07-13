import mongoose from "mongoose";

const messageSchema = mongoose.Schema(
  {
    subject: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["email", "sms", "notification", "system"],
      default: "email",
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "failed"],
      default: "draft",
    },
    recipients: [
      {
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
        companyName: { type: String },
        companyEmail: { type: String },
        status: {
          type: String,
          enum: ["pending", "sent", "failed", "read"],
          default: "pending",
        },
        sentAt: { type: Date },
        readAt: { type: Date },
      },
    ],
    scheduledFor: { type: Date },
    sentAt: { type: Date },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MessageTemplate",
    },
    metadata: {
      emailProvider: { type: String },
      messageId: { type: String },
      error: { type: String },
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;

