import { Router } from "express";
import {
  getAllStudentBySchoolId,
  updateClearingOfficerPassword,
  updateClearingOfficerProfile,
} from "../controllers/intigration.controller";
import { authenticateToken } from "../middlewares/authentication";
import { upload } from "../config/multer";

const router = Router();

// PUT /clearingOfficer/update/:id
router.put(
  "/updateUserProfile/:id",
  authenticateToken,
  upload.single("profileImage"),
  updateClearingOfficerProfile
);
router.put(
  "/updateUserPassword/:id",
  authenticateToken,
  updateClearingOfficerPassword
);

router.get(
  "/getAllStudentBySchoolId/:schoolId",
  authenticateToken,
  getAllStudentBySchoolId
);

export default router;
