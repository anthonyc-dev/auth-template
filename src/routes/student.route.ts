import { Router } from "express";
import {
  changeStudentPassword,
  deleteStudent,
  getStudentById,
  getStudentBySchoolId,
  getStudents,
  loginStudent,
  logoutStudent,
  registerStudent,
  updateStudent,
  updateStudentProfile,
} from "../controllers/student.controller";
import {
  studentValidateRegister,
  validateLogin,
} from "../middlewares/auth.validator";
import { upload } from "../config/multer";

const router = Router();

router.post("/registerStudent", studentValidateRegister, registerStudent);
router.post("/loginStudent", validateLogin, loginStudent);
router.post("/logoutStudent", logoutStudent);
router.get("/getAllStudent", getStudents);
router.get("/getByIdStudent/:id", getStudentById);
router.get("/getStudentBySchoolId/:schoolId", getStudentBySchoolId);
router.post("/changeStudentPassword", changeStudentPassword);
router.put("/updateStudent/:id", updateStudent);
router.delete("/deleteStudent/:id", deleteStudent);

router.put(
  "/updateStudentProfile/:schoolId",
  upload.single("profileImage"),
  updateStudentProfile
);

export default router;
