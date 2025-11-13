import { Router } from "express";
import {
  deleteStudent,
  getStudentById,
  getStudentBySchoolId,
  getStudents,
  loginStudent,
  logoutStudent,
  registerStudent,
  updateStudent,
} from "../controllers/student.controller";
import {
  studentValidateRegister,
  validateLogin,
} from "../middlewares/auth.validator";

const router = Router();

router.post("/registerStudent", studentValidateRegister, registerStudent);
router.post("/loginStudent", validateLogin, loginStudent);
router.post("/logoutStudent", logoutStudent);
router.get("/getAllStudent", getStudents);
router.get("/getByIdStudent/:id", getStudentById);
router.get("/getStudentBySchoolId/:schoolId", getStudentBySchoolId);
router.put("/updateStudent/:id", updateStudent);
router.delete("/deleteStudent/:id", deleteStudent);

export default router;
