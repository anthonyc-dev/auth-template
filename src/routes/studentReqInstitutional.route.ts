import { Router } from "express";

import { authenticateToken } from "../middlewares/authentication";
import {
  createStudentRequirement,
  deleteStudentRequirement,
  getAllStudentRequirements,
  getStudentRequirementById,
  getStudentRequirementsByStudentId,
  updateStudentRequirement,
} from "../controllers/studentReqInstitutional.controller";

const router = Router();

router.post("/studentRequirement", createStudentRequirement);
router.get("/getAllStudentRequirements", getAllStudentRequirements);
router.get(
  "/getRequirementById/:id",
  authenticateToken,
  getStudentRequirementById
);
router.get(
  "/getStudentRequirementsByStudentId/:studentId",
  getStudentRequirementsByStudentId
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
