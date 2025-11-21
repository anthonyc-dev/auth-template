"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_1 = require("../controllers/student.controller");
const auth_validator_1 = require("../middlewares/auth.validator");
const multer_1 = require("../config/multer");
const router = (0, express_1.Router)();
router.put("/updateStudentProfileImage/:schoolId", multer_1.upload.single("profileImage"), student_controller_1.updateStudentProfileImage);
router.post("/registerStudent", auth_validator_1.studentValidateRegister, student_controller_1.registerStudent);
router.post("/loginStudent", auth_validator_1.validateLogin, student_controller_1.loginStudent);
router.post("/logoutStudent", student_controller_1.logoutStudent);
router.get("/getAllStudent", student_controller_1.getStudents);
router.get("/getByIdStudent/:id", student_controller_1.getStudentById);
router.get("/getStudentBySchoolId/:schoolId", student_controller_1.getStudentBySchoolId);
router.post("/changeStudentPassword", student_controller_1.changeStudentPassword);
router.put("/updateStudent/:id", student_controller_1.updateStudent);
router.delete("/deleteStudent/:id", student_controller_1.deleteStudent);
// router.put(
//   "/updateStudentProfile/:schoolId",
//   upload.single("profileImage"),
//   updateStudentProfile
// );
exports.default = router;
