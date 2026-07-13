import mongoose from "mongoose";

const warehouseLocationSchema = new mongoose.Schema(
  {
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
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
    zone: {
      type: String,
      trim: true,
    },
    aisle: {
      type: String,
      trim: true,
    },
    shelf: {
      type: String,
      trim: true,
    },
    binCode: {
      type: String,
      trim: true,
    },
    temperatureControlled: {
      type: Boolean,
      default: false,
    },
    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentUtilization: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

warehouseLocationSchema.index(
  { companyId: 1, warehouseId: 1, name: 1 },
  { unique: true }
);

const WarehouseLocation =
  mongoose.models.WarehouseLocation ||
  mongoose.model("WarehouseLocation", warehouseLocationSchema);

export default WarehouseLocation;
import mongoose from "mongoose";

const restrictionSchema = new mongoose.Schema(
  {
    temperatureControlled: { type: Boolean, default: false },
    hazardousMaterials: { type: Boolean, default: false },
    maxWeight: { type: Number, default: null },
  },
  { _id: false }
);

const warehouseLocationSchema = new mongoose.Schema(
  {
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
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
    level: {
      type: String,
      enum: ["Zone", "Aisle", "Rack", "Shelf", "Bin", "Bulk", "Floor"],
      default: "Shelf",
    },
    zone: { type: String, trim: true },
    aisle: { type: String, trim: true },
    row: { type: String, trim: true },
    shelf: { type: String, trim: true },
    bin: { type: String, trim: true },
    sequence: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Blocked"],
      default: "Active",
    },
    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    capacityUnit: {
      type: String,
      enum: ["units", "pallets", "cbm", "sqm"],
      default: "units",
    },
    restrictions: restrictionSchema,
    notes: { type: String, trim: true },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

warehouseLocationSchema.index(
  { warehouseId: 1, code: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

warehouseLocationSchema.index({ warehouseId: 1, status: 1 });

const WarehouseLocation =
  mongoose.models.WarehouseLocation ||
  mongoose.model("WarehouseLocation", warehouseLocationSchema);

export default WarehouseLocation;


