import { Router } from "express";
import {
  createStudentRequirement,
  deleteStudentRequirement,
  getAllStudentRequirements,
  getStudentRequirementById,
  updateStudentRequirement,
} from "../controllers/studentRequirement.controller";

const router = Router();

router.post("/studentRequirement", createStudentRequirement);
router.get("/getAllStudentRequirements", getAllStudentRequirements);
router.get("/getRequirementById/:id", getStudentRequirementById);
router.put("/updateStudentRequirement/:id", updateStudentRequirement);
router.delete("/deleteStudentRequirement/:id", deleteStudentRequirement);

export default router;
