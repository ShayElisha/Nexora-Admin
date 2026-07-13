import mongoose from "mongoose";

const messageTemplateSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["email", "sms", "notification"],
      default: "email",
    },
    variables: [
      {
        name: { type: String },
        description: { type: String },
        example: { type: String },
      },
    ],
    category: {
      type: String,
      enum: ["welcome", "notification", "alert", "billing", "custom"],
      default: "custom",
    },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const MessageTemplate = mongoose.model("MessageTemplate", messageTemplateSchema);

export default MessageTemplate;

