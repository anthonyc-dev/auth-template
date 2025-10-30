import { Router } from "express";
import {
  createStudentRequirement,
  deleteStudentRequirement,
  getAllStudentRequirements,
  getStudentRequirementById,
  updateStudentRequirement,
} from "../controllers/studentRequirement.controller";
import { authenticateToken } from "../middlewares/authentication";

const router = Router();

router.post("/studentRequirement", authenticateToken, createStudentRequirement);
router.get(
  "/getAllStudentRequirements",
  authenticateToken,
  getAllStudentRequirements
);
router.get(
  "/getRequirementById/:id",
  authenticateToken,
  getStudentRequirementById
);
router.put(
  "/updateStudentRequirement/:studentId",
  authenticateToken,
  updateStudentRequirement
);
router.delete(
  "/deleteStudentRequirement/:id",
  authenticateToken,
  deleteStudentRequirement
);

export default router;
