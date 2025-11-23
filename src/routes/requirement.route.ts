import { Router } from "express";
import {
  createRequirement,
  deleteRequirement,
  deleteRequirementsByCourseCode,
  getAllRequirements,
  getRequirementById,
  getRequirementByUserId,
  updateRequirement,
} from "../controllers/requirement.controller";
import { authenticateToken } from "../middlewares/authentication";

const router = Router();

// requirements routes
router.post("/createReq", authenticateToken, createRequirement);
router.get("/getAllReq", getAllRequirements);
router.get("/getByIdReq/:id", getRequirementById);
router.get("/getByUserIdReq/:userId", getRequirementByUserId);
router.put("/updateReq/:id", updateRequirement);
router.delete("/deleteReq/:id", deleteRequirement);

router.delete(
  "/deleteByCourseCode/:courseCode",
  deleteRequirementsByCourseCode
);

export default router;
