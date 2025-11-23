import { Router } from "express";
import {
  getAllStudentBySchoolId,
  updateClearingOfficerPassword,
  updateClearingOfficerProfile,
} from "../controllers/intigration.controller";
import { upload } from "../config/multer";

const router = Router();

// PUT /clearingOfficer/update/:id
router.put(
  "/updateUserProfile/:id",
  upload.single("profileImage"),
  updateClearingOfficerProfile
);
router.put("/updateUserPassword/:id", updateClearingOfficerPassword);

router.get("/getAllStudentBySchoolId/:schoolId", getAllStudentBySchoolId);

export default router;
