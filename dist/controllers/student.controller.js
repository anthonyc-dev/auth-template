"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentProfileImage = exports.updateStudentProfile = exports.changeStudentPassword = exports.deleteStudent = exports.updateStudent = exports.getStudentBySchoolId = exports.getStudentById = exports.getStudents = exports.logoutStudent = exports.loginStudent = exports.registerStudent = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const token_1 = require("../libs/token");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("../config/axios"));
const cloudinaryUpload_1 = require("../utils/cloudinaryUpload");
const prisma = new client_1.PrismaClient();
// Create a new student
const registerStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { schoolId, firstName, lastName, email, phoneNumber, program, yearLevel, password, } = req.body;
        // Validate in EMS for student
        try {
            const response = yield axios_1.default.get(`/intigration/getStudentBySchoolId/${schoolId}`);
            if (!response.data) {
                res.status(400).json({
                    error: "Student ID not found in Enrollment system.",
                });
                return;
            }
        }
        catch (axiosError) {
            console.error("EMS validation error:", axiosError.message);
            // Check if it's a network/connection error
            if (axiosError.code === "ECONNREFUSED" ||
                axiosError.code === "ETIMEDOUT") {
                res.status(503).json({
                    error: "Unable to connect to Enrollment Management System. Please try again later.",
                });
                return;
            }
            // If EMS returns 404 or other error, treat as student not found
            if (((_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
                res.status(400).json({
                    error: "Student ID not found in Enrollment system.",
                });
                return;
            }
            // For other errors, log and return generic error
            res.status(500).json({
                error: "Error validating student with Enrollment system.",
                details: axiosError.message,
            });
            return;
        }
        const existing = yield prisma.student.findUnique({
            where: { email },
        });
        if (existing) {
            res.status(400).json({ error: "User with this email already exists" });
            return;
        }
        const existingSchoolId = yield prisma.student.findUnique({
            where: { schoolId },
        });
        if (existingSchoolId) {
            res
                .status(400)
                .json({ error: "User with this school ID already exists" });
            return;
        }
        // Hash the password before storing
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const student = yield prisma.student.create({
            data: {
                schoolId,
                firstName,
                lastName,
                email,
                phoneNumber,
                program,
                yearLevel,
                password: hashedPassword,
            },
        });
        const accessToken = (0, token_1.signAccessToken)({
            id: student.id,
            email: student.email,
        });
        const refreshToken = (0, token_1.signRefreshToken)(student.id);
        yield prisma.student.update({
            where: { id: student.id },
            data: { refreshToken },
        });
        res.cookie("refreshToken", refreshToken, token_1.cookieOptions);
        res.status(201).json({
            message: "Student registered successfully",
            student: {
                id: student.id,
                schoolId: student.schoolId,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                phoneNumber: student.phoneNumber,
                program: student.program,
                yearLevel: student.yearLevel,
            },
            accessToken,
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            message: "Internal server error during registration",
            error: error.message,
        });
    }
});
exports.registerStudent = registerStudent;
const loginStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const student = yield prisma.student.findUnique({
            where: { email },
        });
        if (!student) {
            res.status(401).json({ error: "Wrong credentials" });
            return;
        }
        const ok = yield bcrypt_1.default.compare(password, student.password);
        if (!ok) {
            res.status(401).json({ error: "Wrong credentials" });
            return;
        }
        const accessToken = (0, token_1.signAccessToken)({
            id: student.id,
            email: student.email,
        });
        const refreshToken = (0, token_1.signRefreshToken)(student.id);
        yield prisma.student.update({
            where: { id: student.id },
            data: { refreshToken },
        });
        res.cookie("refreshToken", refreshToken, token_1.cookieOptions);
        res.status(200).json({
            message: "Login successful",
            student: {
                id: student.id,
                schoolId: student.schoolId,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                phoneNumber: student.phoneNumber,
                program: student.program,
                yearLevel: student.yearLevel,
            },
            accessToken,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.loginStudent = loginStudent;
// Logout a student
const logoutStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const oldToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
        if (oldToken) {
            try {
                const decoded = jsonwebtoken_1.default.verify(oldToken, process.env.JWT_REFRESH_SECRET);
                yield prisma.student.update({
                    where: { id: decoded.userId },
                    data: { refreshToken: null },
                });
            }
            catch (_b) { }
        }
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            sameSite: "strict",
            path: "/",
        });
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.logoutStudent = logoutStudent;
// Get all students
const getStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const students = yield prisma.student.findMany();
        res.json(students);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getStudents = getStudents;
// Get a student by ID
const getStudentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const student = yield prisma.student.findUnique({
            where: { id },
        });
        if (!student) {
            res.status(404).json({ message: "Student not found" });
            return;
        }
        res.json(student);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getStudentById = getStudentById;
// Get a student by school ID
const getStudentBySchoolId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { schoolId } = req.params;
        const student = yield prisma.student.findUnique({
            where: { schoolId },
        });
        if (!student) {
            res.status(404).json({ message: "Student not found" });
            return;
        }
        res.json(student);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getStudentBySchoolId = getStudentBySchoolId;
// Update a student
const updateStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, phoneNumber, program, yearLevel } = req.body;
        const updatedStudent = yield prisma.student.update({
            where: { id },
            data: { firstName, lastName, email, phoneNumber, program, yearLevel },
        });
        res.json(updatedStudent);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateStudent = updateStudent;
// Delete a student
const deleteStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.student.delete({ where: { id } });
        res.json({ message: "Student deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteStudent = deleteStudent;
/**
 * Change student password controller
 *
 * Route: POST /student/changePassword
 *
 * Request body:
 * {
 *   "email": string,
 *   "currentPassword": string,
 *   "newPassword": string
 * }
 *
 * Returns JSON message indicating success or reasons for failure.
 */
/**
 * POST /student/changePassword
 */
const changeStudentPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, currentPassword, newPassword } = req.body;
        // Input validation
        if (!email || !currentPassword || !newPassword) {
            res.status(400).json({ error: "Missing required fields." });
            return;
        }
        if (typeof email !== "string" ||
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string") {
            res.status(400).json({ error: "Input types are invalid." });
            return;
        }
        const student = yield prisma.student.findUnique({ where: { email } });
        if (!student) {
            res.status(404).json({ error: "Student not found." });
            return;
        }
        const isMatch = yield bcrypt_1.default.compare(currentPassword, student.password);
        if (!isMatch) {
            res.status(401).json({ error: "Current password is incorrect." });
            return;
        }
        // Optional: check new password isn't the same as current
        const isSame = yield bcrypt_1.default.compare(newPassword, student.password);
        if (isSame) {
            res.status(400).json({
                error: "New password cannot be the same as the current password.",
            });
            return;
        }
        // Hash the new password securely
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        yield prisma.student.update({
            where: { email },
            data: { password: hashedPassword, updatedAt: new Date() },
        });
        res.status(200).json({ message: "Password changed successfully!" });
    }
    catch (error) {
        console.error("Password change error:", error); // For debugging
        res.status(500).json({ error: "Internal server error." });
    }
});
exports.changeStudentPassword = changeStudentPassword;
const updateStudentProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { schoolId } = req.params;
        const { firstName, lastName, email, phoneNumber } = req.body;
        const existingStudent = yield prisma.student.findUnique({
            where: { schoolId },
        });
        if (!existingStudent) {
            res.status(404).json({ message: "Student not found" });
            return;
        }
        let updatedData = {
            firstName,
            lastName,
            email,
            phoneNumber,
        };
        // Handle profile image upload if provided
        if (req.file) {
            try {
                // Upload new profile image
                const newProfileImageUrl = yield (0, cloudinaryUpload_1.uploadImageToCloudinary)(req.file, "student-profile");
                // Delete old profile image if it exists
                if (existingStudent.profileImage) {
                    try {
                        yield (0, cloudinaryUpload_1.deleteImageFromCloudinary)(existingStudent.profileImage);
                    }
                    catch (deleteError) {
                        console.error("Failed to delete old profile image:", deleteError);
                        // Continue with update even if deletion fails
                    }
                }
                updatedData.profileImage = newProfileImageUrl;
            }
            catch (uploadError) {
                console.error("Profile image upload failed:", uploadError);
                res.status(500).json({ message: "Failed to upload profile image" });
                return;
            }
        }
        const updatedStudent = yield prisma.student.update({
            where: { schoolId },
            data: updatedData,
        });
        res.json({
            message: "Student updated successfully",
            updatedStudent,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.updateStudentProfile = updateStudentProfile;
/**
 * Update only the profile image of a student by schoolId.
 *
 * Route: PUT /updateStudentProfileImage/:schoolId
 * Accepts a multipart/form-data with "profileImage" as the file key.
 * Returns: Updated student info with a success message, or error.
 */
const updateStudentProfileImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { schoolId } = req.params;
        // Fetch the existing student
        const existingStudent = yield prisma.student.findUnique({
            where: { schoolId },
        });
        if (!existingStudent) {
            res.status(404).json({ message: "Student not found" });
            return;
        }
        // Check if file was uploaded
        if (!req.file) {
            res.status(400).json({ message: "No profile image file provided" });
            return;
        }
        // Upload new profile image
        let newProfileImageUrl;
        try {
            newProfileImageUrl = yield (0, cloudinaryUpload_1.uploadImageToCloudinary)(req.file, "student-profile");
        }
        catch (uploadError) {
            console.error("Profile image upload failed:", uploadError);
            res.status(500).json({ message: "Failed to upload profile image" });
            return;
        }
        // Delete old profile image if it exists (optional cleanup)
        if (existingStudent.profileImage) {
            try {
                yield (0, cloudinaryUpload_1.deleteImageFromCloudinary)(existingStudent.profileImage);
            }
            catch (deleteError) {
                console.warn("Failed to delete old profile image:", deleteError);
                // Continue even if deletion fails to avoid blocking the action
            }
        }
        // Update only the profileImage field in the database
        const updatedStudent = yield prisma.student.update({
            where: { schoolId },
            data: {
                profileImage: newProfileImageUrl,
            },
        });
        res.json({
            message: "Profile image updated successfully",
            updatedStudent,
        });
    }
    catch (error) {
        console.error("Error updating profile image:", error);
        res.status(500).json({ message: "Server error", error: error.message });
        return;
    }
});
exports.updateStudentProfileImage = updateStudentProfileImage;
/*
  Next Steps:
  - Add a route in your router (e.g. student.route.ts):
      router.put(
        "/updateStudentProfileImage/:schoolId",
        upload.single("profileImage"),
        updateStudentProfileImage
      );
  - Test with tools like Postman to ensure the update works as expected.
  - Optional: Add input validation, file size/type restrictions, and stricter error handling.
*/
