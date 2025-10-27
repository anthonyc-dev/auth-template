import { Router } from "express";
import {
  createRequirement,
  deleteRequirement,
  getAllRequirements,
  getRequirementById,
  updateRequirement,
} from "../controllers/requirement.controller";

const router = Router();

// requirements routes
router.post("/createReq", createRequirement);
router.get("/getAllReq", getAllRequirements);
router.get("/getByIdReq/:id", getRequirementById);
router.put("/updateReq/:id", updateRequirement);
router.delete("/deleteReq/:id", deleteRequirement);

export default router;
