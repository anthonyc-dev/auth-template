import { Router } from "express";
import {
  deleteClearance,
  extendDeadline,
  getAllClearances,
  getCurrentClearance,
  setupClearance,
  startClearance,
  stopClearance,
} from "../controllers/setupClearance.controller";

const router = Router();

// Public
router.get("/current", getCurrentClearance);
router.post("/setup", setupClearance);
router.put("/start/:id", startClearance);
router.put("/stop/:id", stopClearance);
router.put("/extend/:id", extendDeadline);
router.get("/getAllClearance", getAllClearances);
router.delete("/deleteClearance/:id", deleteClearance);

export default router;
