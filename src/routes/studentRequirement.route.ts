import { Router } from "express";
import {
  createStudentRequirement,
  deleteStudentRequirement,
  getAllStudentRequirements,
  getStudentRequirementById,
  getStudentRequirementsBySchoolId,
  updateStudentRequirement,
} from "../controllers/studentRequirement.controller";
import { authenticateToken } from "../middlewares/authentication";

const router = Router();

router.post("/studentRequirement", authenticateToken, createStudentRequirement);
router.get("/getAllStudentRequirements", getAllStudentRequirements);
router.get(
  "/getRequirementById/:id",
  authenticateToken,
  getStudentRequirementById
);
router.get(
  "/getStudentRequirementsBySchoolId/:schoolId",
  getStudentRequirementsBySchoolId
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
