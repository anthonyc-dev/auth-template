import { Router } from "express";
import {
  createRequirement,
  deleteRequirement,
  deleteRequirementsByCourseCode,
  getAllRequirements,
  getRequirementById,
  updateRequirement,
} from "../controllers/requirement.controller";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/authentication";

const router = Router();

// requirements routes
router.post("/createReq", authenticateToken, createRequirement);
router.get("/getAllReq", getAllRequirements);
router.get("/getByIdReq/:id", authenticateToken, getRequirementById);
router.put(
  "/updateReq/:id",
  authenticateToken,
  authorizeRoles("clearingOfficer"),
  updateRequirement
);
router.delete("/deleteReq/:id", deleteRequirement);

router.delete(
  "/deleteByCourseCode/:courseCode",
  deleteRequirementsByCourseCode
);

export default router;
