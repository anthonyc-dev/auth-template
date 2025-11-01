import { Router } from "express";
import {
  createRequirement,
  deleteRequirement,
  getAllRequirements,
  getRequirementById,
  updateRequirement,
} from "../controllers/institutionalOfficer.controller";

const router = Router();

router.post("/createRequirement/", createRequirement);
router.get("/getAllRequirements/", getAllRequirements);
router.get("/getRequiremntById/:id", getRequirementById);
router.put("/updateRequirement/:id", updateRequirement);
router.delete("/deleteRequirement/:id", deleteRequirement);

export default router;
