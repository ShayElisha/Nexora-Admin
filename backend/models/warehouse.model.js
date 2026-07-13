import mongoose from "mongoose";
import addressSchema from "./subschemas/address.schema.js";

const warehouseSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["operational", "maintenance", "offline"],
      default: "operational",
      index: true,
    },
    automation: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    utilization: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    conditions: {
      temperature: { type: Number, default: 0 },
      humidity: { type: Number, default: 0 },
    },
    throughput: {
      inbound: { type: Number, default: 0 },
      outbound: { type: Number, default: 0 },
    },
    lastAudit: {
      type: Date,
    },
    alerts: [
      {
        code: { type: String },
        message: { type: String },
        severity: {
          type: String,
          enum: ["info", "warning", "critical"],
          default: "info",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    managers: [
      {
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        name: { type: String },
      },
    ],
    address: addressSchema,
    metadata: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true }
);

warehouseSchema.index({ companyId: 1, name: 1 }, { unique: true });
warehouseSchema.index({ companyId: 1, code: 1 }, { unique: true, sparse: true });

const Warehouse =
  mongoose.models.Warehouse || mongoose.model("Warehouse", warehouseSchema);

export default Warehouse;
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const capacitySchema = new mongoose.Schema(
  {
    total: { type: Number, default: 0 },
    unit: {
      type: String,
      enum: ["units", "pallets", "cbm", "sqm"],
      default: "units",
    },
  },
  { _id: false }
);

const warehouseSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["Main", "Regional", "Store", "3PL", "Consignment", "Other"],
      default: "Main",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Under Maintenance"],
      default: "Active",
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    address: addressSchema,
    contact: contactSchema,
    capacity: capacitySchema,
    currentUtilization: {
      type: Number,
      default: 0,
      min: 0,
    },
    allowOverstock: {
      type: Boolean,
      default: true,
    },
    metadata: {
      temperatureControlled: { type: Boolean, default: false },
      hazardousMaterials: { type: Boolean, default: false },
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  { timestamps: true }
);

warehouseSchema.index(
  { companyId: 1, code: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

warehouseSchema.index({ companyId: 1, status: 1 });

const Warehouse =
  mongoose.models.Warehouse || mongoose.model("Warehouse", warehouseSchema);

export default Warehouse;


