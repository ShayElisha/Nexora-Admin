import jwt from "jsonwebtoken";
import Warehouse from "../models/warehouse.model.js";
import WarehouseLocation from "../models/warehouseLocation.model.js";

const getCompanyIdFromRequest = (req) => {
  if (req.companyId) return req.companyId;
  if (req.user?.companyId) return req.user.companyId;
  if (req.query?.companyId) return req.query.companyId;

  const token = req.cookies?.auth_token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.companyId || null;
  } catch (error) {
    return null;
  }
};

const buildWarehousePayload = (body = {}) => {
  const payload = {
    name: body.name?.trim(),
    code: body.code?.trim(),
    region: body.region?.trim(),
    status: body.status,
    automation: body.automation,
    capacity: body.capacity,
    utilization: body.utilization,
    lastAudit: body.lastAudit,
    address: body.address,
    managers: body.managers,
    alerts: body.alerts,
  };

  if (body.temperature !== undefined || body.humidity !== undefined) {
    payload.conditions = {
      temperature: Number(body.temperature ?? body.conditions?.temperature ?? 0),
      humidity: Number(body.humidity ?? body.conditions?.humidity ?? 0),
    };
  } else if (body.conditions) {
    payload.conditions = body.conditions;
  }

  if (
    body.inboundToday !== undefined ||
    body.outboundToday !== undefined ||
    body.throughput
  ) {
    payload.throughput = {
      inbound: Number(body.inboundToday ?? body.throughput?.inbound ?? 0),
      outbound: Number(body.outboundToday ?? body.throughput?.outbound ?? 0),
    };
  }

  if (body.metadata) {
    payload.metadata = body.metadata;
  }

  return payload;
};

export const getWarehouses = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const filters = { companyId };
    if (req.query.status) filters.status = req.query.status;
    if (req.query.region) filters.region = req.query.region;

    const warehouses = await Warehouse.find(filters).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: warehouses });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch warehouses",
      error: error.message,
    });
  }
};

export const createWarehouse = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.body?.name || !req.body?.region) {
    return res.status(400).json({
      success: false,
      message: "Warehouse name and region are required",
    });
  }

  try {
    const payload = buildWarehousePayload(req.body);
    const warehouse = await Warehouse.create({
      companyId,
      ...payload,
    });

    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create warehouse",
      error: error.message,
    });
  }
};

export const updateWarehouse = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const payload = buildWarehousePayload(req.body);
    const warehouse = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, companyId },
      payload,
      { new: true, runValidators: true }
    );

    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update warehouse",
      error: error.message,
    });
  }
};

export const deleteWarehouse = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const warehouse = await Warehouse.findOneAndDelete({
      _id: req.params.id,
      companyId,
    });

    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    await WarehouseLocation.deleteMany({ warehouseId: req.params.id });

    res.status(200).json({ success: true, message: "Warehouse deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete warehouse",
      error: error.message,
    });
  }
};

export const getWarehouseLocations = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const locations = await WarehouseLocation.find({
      companyId,
      warehouseId: req.params.warehouseId,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch warehouse locations",
      error: error.message,
    });
  }
};

export const createWarehouseLocation = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.body?.name) {
    return res
      .status(400)
      .json({ success: false, message: "Location name is required" });
  }

  try {
    const location = await WarehouseLocation.create({
      companyId,
      warehouseId: req.params.warehouseId,
      ...req.body,
    });

    res.status(201).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create warehouse location",
      error: error.message,
    });
  }
};

export const updateWarehouseLocation = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const location = await WarehouseLocation.findOneAndUpdate(
      {
        _id: req.params.locationId,
        companyId,
        warehouseId: req.params.warehouseId,
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!location) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });
    }

    res.status(200).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update warehouse location",
      error: error.message,
    });
  }
};

export const deleteWarehouseLocation = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const location = await WarehouseLocation.findOneAndDelete({
      _id: req.params.locationId,
      companyId,
      warehouseId: req.params.warehouseId,
    });

    if (!location) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });
    }

    res.status(200).json({ success: true, message: "Location deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete warehouse location",
      error: error.message,
    });
  }
};
import jwt from "jsonwebtoken";
import Warehouse from "../models/warehouse.model.js";
import WarehouseLocation from "../models/warehouseLocation.model.js";
import Inventory from "../models/inventory.model.js";

const getCompanyIdFromRequest = (req) => {
  const token = req.cookies["auth_token"];
  if (!token) {
    return null;
  }
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  return decodedToken?.companyId || null;
};

const ensureCompanyAccess = (companyId, res) => {
  if (!companyId) {
    res
      .status(401)
      .json({ success: false, message: "Authentication required" });
    return false;
  }
  return true;
};

export const createWarehouse = async (req, res) => {
  try {
    const companyId = getCompanyIdFromRequest(req);
    if (!ensureCompanyAccess(companyId, res)) return;

    const payload = { ...req.body };
    if (!payload.name || !payload.code) {
      return res.status(400).json({
        success: false,
        message: "Warehouse name and code are required",
      });
    }

    payload.companyId = companyId;
    payload.code = payload.code.trim().toUpperCase();

    const warehouse = await Warehouse.create(payload);

    if (warehouse.isDefault) {
      await Warehouse.updateMany(
        { companyId, _id: { $ne: warehouse._id } },
        { isDefault: false }
      );
    }

    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    console.error("Error creating warehouse:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create warehouse",
      error: error.message,
    });
  }
};

export const getWarehouses = async (req, res) => {
  try {
    const companyId = getCompanyIdFromRequest(req);
    if (!ensureCompanyAccess(companyId, res)) return;

    const { status, search, includeLocations = "false" } = req.query;

    const filters = { companyId };
    if (status) {
      filters.status = status;
    }
    if (search) {
      filters.$or = [
        { name: new RegExp(search, "i") },
        { code: new RegExp(search, "i") },
      ];
    }

    const warehouses = await Warehouse.find(filters).sort({ createdAt: -1 });

    if (warehouses.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const warehouseIds = warehouses.map((w) => w._id);
    const [locationCounts, inventoryCounts] = await Promise.all([
      WarehouseLocation.aggregate([
        { $match: { warehouseId: { $in: warehouseIds } } },
        { $group: { _id: "$warehouseId", count: { $sum: 1 } } },
      ]),
      Inventory.aggregate([
        { $match: { warehouseId: { $in: warehouseIds } } },
        { $group: { _id: "$warehouseId", count: { $sum: 1 } } },
      ]),
    ]);

    const locationCountMap = new Map(
      locationCounts.map((item) => [item._id.toString(), item.count])
    );
    const inventoryCountMap = new Map(
      inventoryCounts.map((item) => [item._id.toString(), item.count])
    );

    let locationsByWarehouse = {};
    if (includeLocations === "true") {
      const locations = await WarehouseLocation.find({
        warehouseId: { $in: warehouseIds },
      }).sort({ sequence: 1, createdAt: -1 });
      locationsByWarehouse = locations.reduce((acc, location) => {
        const key = location.warehouseId.toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(location);
        return acc;
      }, {});
    }

    const data = warehouses.map((warehouse) => {
      const id = warehouse._id.toString();
      return {
        ...warehouse.toObject(),
        locationsCount: locationCountMap.get(id) || 0,
        inventoryItems: inventoryCountMap.get(id) || 0,
        locations: includeLocations === "true" ? locationsByWarehouse[id] || [] : undefined,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch warehouses",
      error: error.message,
    });
  }
};

export const getWarehouseById = async (req, res) => {
  try {
    const companyId = getCompanyIdFromRequest(req);
    if (!ensureCompanyAccess(companyId, res)) return;

    const { includeLocations = "false" } = req.query;

    const warehouse = await Warehouse.findOne({
      _id: req.params.id,
      companyId,
    });

    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    let locations = [];
    if (includeLocations === "true") {
      locations = await WarehouseLocation.find({
        warehouseId: warehouse._id,
      }).sort({ sequence: 1, createdAt: -1 });
    }

    res.json({
      success: true,
      data: {
        ...warehouse.toObject(),
        locations: includeLocations === "true" ? locations : undefined,
      },
    });
  } catch (error) {
    console.error("Error fetching warehouse:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch warehouse",
      error: error.message,
    });
  }
};

export const updateWarehouse = async (req, res) => {
  try {
    const companyId = getCompanyIdFromRequest(req);
    if (!ensureCompanyAccess(companyId, res)) return;

    const updates = { ...req.body };
    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }

    const warehouse = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, companyId },
      updates,
      { new: true, runValidators: true }
    );

    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    if (updates.isDefault) {
      await Warehouse.updateMany(
        { companyId, _id: { $ne: warehouse._id } },
        { isDefault: false }
      );
    }

    res.json({ success: true, data: warehouse });
  } catch (error) {
    console.error("Error updating warehouse:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update warehouse",
      error: error.message,
    });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    const companyId = getCompanyIdFromRequest(req);
    if (!ensureCompanyAccess(companyId, res)) return;

    const warehouse = await Warehouse.findOne({
      _id: req.params.id,
      companyId,
    });
    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    if (warehouse.isDefault) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the default warehouse",
      });
    }

    const [hasInventory, hasLocations] = await Promise.all([
      Inventory.exists({ warehouseId: warehouse._id }),
      WarehouseLocation.exists({ warehouseId: warehouse._id }),
    ]);

    if (hasInventory) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete warehouse with inventory items",
      });
    }

    if (hasLocations) {
      return res.status(400).json({
        success: false,
        message: "Remove warehouse locations before deleting",
      });
    }

    await warehouse.deleteOne();
    res.json({ success: true, message: "Warehouse deleted successfully" });
  } catch (error) {
    console.error("Error deleting warehouse:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete warehouse",
      error: error.message,
    });
  }
};

export const getWarehouseLocations = async (req, res) => {
  try {
    const companyId = getCompanyIdFromRequest(req);
    if (!ensureCompanyAccess(companyId, res)) return;

    const warehouse = await Warehouse.findOne({
      _id: req.params.id,
      companyId,
    });

    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    const locations = await WarehouseLocation.find({
      warehouseId: warehouse._id,
    }).sort({ sequence: 1, createdAt: -1 });

    res.json({ success: true, data: locations });
  } catch (error) {
    console.error("Error fetching warehouse locations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch warehouse locations",
      error: error.message,
    });
  }
};

export const addWarehouseLocation = async (req, res) => {
  try {
    const companyId = getCompanyIdFromRequest(req);
    if (!ensureCompanyAccess(companyId, res)) return;

    const warehouse = await Warehouse.findOne({
      _id: req.params.id,
      companyId,
    });
    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    const payload = { ...req.body };
    if (!payload.name || !payload.code) {
      return res.status(400).json({
        success: false,
        message: "Location name and code are required",
      });
    }

    payload.warehouseId = warehouse._id;
    payload.code = payload.code.trim().toUpperCase();

    const location = await WarehouseLocation.create(payload);

    res.status(201).json({ success: true, data: location });
  } catch (error) {
    console.error("Error creating warehouse location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create warehouse location",
      error: error.message,
    });
  }
};

export const updateWarehouseLocation = async (req, res) => {
  try {
    const companyId = getCompanyIdFromRequest(req);
    if (!ensureCompanyAccess(companyId, res)) return;

    const warehouse = await Warehouse.findOne({
      _id: req.params.id,
      companyId,
    });
    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    const updates = { ...req.body };
    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }

    const location = await WarehouseLocation.findOneAndUpdate(
      { _id: req.params.locationId, warehouseId: warehouse._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!location) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });
    }

    res.json({ success: true, data: location });
  } catch (error) {
    console.error("Error updating warehouse location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update warehouse location",
      error: error.message,
    });
  }
};

export const deleteWarehouseLocation = async (req, res) => {
  try {
    const companyId = getCompanyIdFromRequest(req);
    if (!ensureCompanyAccess(companyId, res)) return;

    const warehouse = await Warehouse.findOne({
      _id: req.params.id,
      companyId,
    });
    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    const location = await WarehouseLocation.findOne({
      _id: req.params.locationId,
      warehouseId: warehouse._id,
    });

    if (!location) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });
    }

    const hasInventory = await Inventory.exists({
      locationId: location._id,
    });
    if (hasInventory) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete location linked to inventory items",
      });
    }

    await location.deleteOne();
    res.json({
      success: true,
      message: "Warehouse location deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting warehouse location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete warehouse location",
      error: error.message,
    });
  }
};

