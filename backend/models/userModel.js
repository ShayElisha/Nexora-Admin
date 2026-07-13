import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    analytics: { type: Boolean, default: true },
    companies: { type: Boolean, default: true },
    billing: { type: Boolean, default: false },
    subscriptions: { type: Boolean, default: false },
    users: { type: Boolean, default: false },
    activity: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Owner", "Manager", "Analyst", "Support"],
      default: "Manager",
    },
    status: {
      type: String,
      enum: ["Active", "Suspended"],
      default: "Active",
    },
    permissions: { type: permissionSchema, default: () => ({}) },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
