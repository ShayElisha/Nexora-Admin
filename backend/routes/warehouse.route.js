import express from "express";
import {
  createWarehouse,
  createWarehouseLocation,
  deleteWarehouse,
  deleteWarehouseLocation,
  getWarehouseLocations,
  getWarehouses,
  updateWarehouse,
  updateWarehouseLocation,
} from "../controllers/warehouse.controller.js";

const router = express.Router();

router.get("/", getWarehouses);
router.post("/", createWarehouse);
router.put("/:id", updateWarehouse);
router.delete("/:id", deleteWarehouse);

router.get("/:warehouseId/locations", getWarehouseLocations);
router.post("/:warehouseId/locations", createWarehouseLocation);
router.put("/:warehouseId/locations/:locationId", updateWarehouseLocation);
router.delete("/:warehouseId/locations/:locationId", deleteWarehouseLocation);

export default router;
import express from "express";
import {
  addWarehouseLocation,
  createWarehouse,
  deleteWarehouse,
  deleteWarehouseLocation,
  getWarehouseById,
  getWarehouseLocations,
  getWarehouses,
  updateWarehouse,
  updateWarehouseLocation,
} from "../controllers/warehouse.controller.js";

const router = express.Router();

router
  .route("/")
  .get(getWarehouses)
  .post(createWarehouse);

router
  .route("/:id")
  .get(getWarehouseById)
  .put(updateWarehouse)
  .delete(deleteWarehouse);

router
  .route("/:id/locations")
  .get(getWarehouseLocations)
  .post(addWarehouseLocation);

router
  .route("/:id/locations/:locationId")
  .put(updateWarehouseLocation)
  .delete(deleteWarehouseLocation);

export default router;


