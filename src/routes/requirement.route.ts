import { Router } from "express";
import {
  createRequirement,
  deleteRequirement,
  getAllRequirements,
  getRequirementById,
  updateRequirement,
} from "../controllers/requirement.controller";
import { authenticateToken } from "../middlewares/authentication";

const router = Router();

// requirements routes
router.post("/createReq", authenticateToken, createRequirement);
router.get("/getAllReq", authenticateToken, getAllRequirements);
router.get("/getByIdReq/:id", authenticateToken, getRequirementById);
router.put("/updateReq/:id", authenticateToken, updateRequirement);
router.delete("/deleteReq/:id", authenticateToken, deleteRequirement);

export default router;
