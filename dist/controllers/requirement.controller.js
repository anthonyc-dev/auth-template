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
exports.updateStatusByDueDate = exports.deleteRequirementsByCourseCode = exports.deleteRequirement = exports.updateRequirement = exports.getRequirementById = exports.getAllRequirements = exports.createRequirement = void 0;
const client_1 = require("@prisma/client");
const node_cron_1 = __importDefault(require("node-cron"));
const axios_1 = __importDefault(require("../config/axios"));
const sms_service_1 = require("../services/sms.service");
const app_1 = require("../app");
const prisma = new client_1.PrismaClient();
const createRequirement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        // 1. Validate user authentication
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({
                error: "Unauthorized: No user ID found",
                message: "Please login to continue",
            });
            return;
        }
        // Get user's role along with userId
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userRole) {
            res.status(401).json({
                error: "Unauthorized: No user Role found",
                message: "Please login to continue",
            });
            return;
        }
        // 2. Validate request body
        const { courseCode, courseName, yearLevel, semester, requirements, department, description, } = req.body;
        // Basic validation
        if (!courseCode ||
            !courseName ||
            !yearLevel ||
            !semester ||
            !requirements ||
            !department) {
            res.status(400).json({
                error: "Missing required fields",
                required: [
                    "courseCode",
                    "courseName",
                    "yearLevel",
                    "semester",
                    "requirements",
                    "department",
                ],
            });
            return;
        }
        if (!Array.isArray(requirements) || requirements.length === 0) {
            res.status(400).json({
                error: "Requirements must be a non-empty array",
            });
            return;
        }
        // 3. Transaction for consistency
        const transactionResult = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Create requirement
            const requirement = yield tx.requirement.create({
                data: {
                    userId,
                    courseCode,
                    courseName,
                    yearLevel,
                    semester,
                    requirements,
                    department,
                    description,
                },
            });
            // Fetch assigned students
            let enrollments = [];
            try {
                const response = yield axios_1.default.get("/enroll/getAllEnrollments");
                enrollments = response.data;
            }
            catch (apiError) {
                console.error("⚠️ Failed to fetch enrollments:", apiError);
                return {
                    requirement,
                    assignedCount: 0,
                    assignedStudentIds: [],
                    warning: "Requirement created, but failed to fetch student enrollments from external API",
                };
            }
            // 🔧 FIX: Handle courseCode arrays in enrollment data
            const assignedStudents = enrollments.filter((student) => {
                const { prerequisites } = student;
                if (Array.isArray(prerequisites)) {
                    return prerequisites.includes(courseCode);
                }
                return prerequisites === courseCode;
            });
            if (assignedStudents.length === 0) {
                return {
                    requirement,
                    assignedCount: 0,
                    assignedStudentIds: [],
                    message: "Requirement created, but no students enrolled in this course.",
                };
            }
            // Create studentRequirement entries
            const studentRequirements = yield tx.studentRequirement.createMany({
                data: assignedStudents.map((student) => ({
                    studentId: student.schoolId,
                    coId: userId,
                    requirementId: requirement.id,
                    status: "incomplete",
                    signedBy: userRole,
                })),
            });
            //real-time using socket.io
            app_1.io.emit("requirement:created", studentRequirements);
            return {
                requirement,
                assignedCount: studentRequirements.count,
                assignedStudentIds: assignedStudents.map((s) => s.schoolId),
                message: `Requirement created and assigned to ${studentRequirements.count} students.`,
            };
        }));
        // 4. Prepare response object with SMS notification
        const result = Object.assign({}, transactionResult);
        // 5. Send SMS notifications to assigned students (non-blocking)
        if (result.assignedCount > 0 && ((_c = result.assignedStudentIds) === null || _c === void 0 ? void 0 : _c.length) > 0) {
            try {
                // Fetch student phone numbers
                const students = yield prisma.student.findMany({
                    where: {
                        schoolId: { in: result.assignedStudentIds },
                    },
                    select: {
                        schoolId: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                    },
                });
                // Filter out students without phone numbers
                const studentsWithPhones = students.filter((s) => s.phoneNumber && s.phoneNumber.trim() !== "");
                if (studentsWithPhones.length > 0) {
                    // Create personalized SMS message
                    const requirementsList = requirements.join(", ");
                    const message = `Hello! You have new clearance requirements for ${courseCode} - ${courseName}. Required: ${requirementsList}. Please complete them in the clearance system.`;
                    // Send SMS to all students
                    const smsResults = yield (0, sms_service_1.sendBulkSMS)({
                        recipients: studentsWithPhones.map((s) => s.phoneNumber),
                        message: message,
                    });
                    // Add SMS results to response
                    result.smsNotification = {
                        sent: smsResults.successCount,
                        failed: smsResults.failureCount,
                        total: smsResults.total,
                    };
                    console.log(`📱 SMS notifications: ${smsResults.successCount}/${smsResults.total} sent successfully`);
                }
                else {
                    result.smsNotification = {
                        sent: 0,
                        failed: 0,
                        total: 0,
                        warning: "No students with valid phone numbers found",
                    };
                }
            }
            catch (smsError) {
                // Log error but don't fail the request
                console.error("⚠️ Failed to send SMS notifications:", smsError);
                result.smsNotification = {
                    sent: 0,
                    failed: 0,
                    total: 0,
                    error: "Failed to send SMS notifications",
                };
            }
        }
        // 6. Send success response
        res.status(201).json(result);
    }
    catch (error) {
        console.error("❌ Error creating requirement:", error);
        if (error instanceof Error) {
            if (error.message.includes("P2002")) {
                res.status(409).json({
                    error: "Duplicate entry",
                    message: "A requirement with these details already exists",
                });
                return;
            }
            if (error.message.includes("P2003")) {
                res.status(400).json({
                    error: "Foreign key constraint failed",
                    message: "Invalid reference to related data",
                });
                return;
            }
            res.status(500).json({
                error: "Internal server error",
                message: error.message,
                details: process.env.NODE_ENV === "development" ? error.stack : undefined,
            });
        }
        else {
            res.status(500).json({ error: "Unknown error occurred" });
        }
    }
});
exports.createRequirement = createRequirement;
const getAllRequirements = (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requirements = yield prisma.requirement.findMany({
            include: { clearingOfficer: true },
        });
        res.json(requirements);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.getAllRequirements = getAllRequirements;
// ✅ Get single requirement
const getRequirementById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requirement = yield prisma.requirement.findUnique({
            where: { id: req.params.id },
            // include: { studentReq: true },
        });
        if (!requirement) {
            res.status(404).json({ message: "Not found" });
            return;
        }
        res.json(requirement);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.getRequirementById = getRequirementById;
// ✅ Update requirement
const updateRequirement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Validate ID
        if (!id) {
            res
                .status(400)
                .json({ error: "Requirement ID is required in the URL parameter." });
            return;
        }
        const existing = yield prisma.requirement.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: "Requirement not found." });
            return;
        }
        const updated = yield prisma.requirement.update({
            where: { id },
            data: req.body,
        });
        res.status(200).json(updated);
    }
    catch (err) {
        // 400 is for validation errors, 500 for unexpected server errors
        if (err.code === "P2025") {
            // Prisma: Record not found
            res.status(404).json({ error: "Requirement not found." });
        }
        else {
            res.status(500).json({ error: err.message });
        }
    }
});
exports.updateRequirement = updateRequirement;
// ✅ Delete requirement by ID
const deleteRequirement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Validate ID
        if (!id) {
            res
                .status(400)
                .json({ error: "Requirement ID is required in the URL parameter." });
            return;
        }
        // Check if requirement exists before deleting
        const existing = yield prisma.requirement.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: "Requirement not found." });
            return;
        }
        // Also delete associated StudentRequirements when a Requirement is deleted.
        yield prisma.studentRequirement.deleteMany({
            where: { requirementId: id },
        });
        yield prisma.requirement.delete({ where: { id } });
        res.status(200).json({ message: "Requirement deleted successfully." });
    }
    catch (err) {
        // Handle Prisma record not found error
        if (err.code === "P2025") {
            res.status(404).json({ error: "Requirement not found." });
        }
        else {
            res.status(500).json({ error: err.message });
        }
    }
});
exports.deleteRequirement = deleteRequirement;
/**
 * Delete all requirements associated with a given courseCode.
 * Useful for batch removal of requirements for a specific course.
 *
 * Route: DELETE /deleteReqByCourse/:courseCode
 *
 * Security: Should be protected by appropriate authentication and authorization middleware in routes.
 */
const deleteRequirementsByCourseCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { courseCode } = req.params;
        // Validation: Ensure courseCode is provided
        if (!courseCode) {
            res
                .status(400)
                .json({ error: "courseCode is required in the URL parameter." });
            return;
        }
        // Check how many requirements exist for the provided courseCode
        const requirements = yield prisma.requirement.findMany({
            where: { courseCode },
        });
        if (requirements.length === 0) {
            res.status(404).json({
                error: `No requirements found for courseCode '${courseCode}'.`,
            });
            return;
        }
        // Delete all associated requirements
        const deleted = yield prisma.requirement.deleteMany({
            where: { courseCode },
        });
        res.status(200).json({
            message: `Deleted ${deleted.count} requirement(s) for courseCode '${courseCode}'.`,
            deletedCount: deleted.count,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.deleteRequirementsByCourseCode = deleteRequirementsByCourseCode;
/**
 * Update all incomplete studentRequirement statuses to 'missing' if the
 * deadline (or extendedDeadline if present) of any SetUpClearance has passed.
 *
 * This function will:
 *   1. Fetch all SetUpClearance records.
 *   2. For each record, use extendedDeadline if present; otherwise, use deadline.
 *   3. If the effective deadline is in the past, update all related studentRequirements with status 'incomplete' to 'missing'.
 *
 * To be run as a background job or by an admin trigger.
 */
const updateStatusByDueDate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        // 1️⃣ Get all SetUpClearance records with an effective (extendedDeadline || deadline) in the past
        const expiredClearancePeriods = yield prisma.setUpClearance.findMany({
            where: {
                OR: [
                    {
                        extendedDeadline: { not: null, lt: now },
                    },
                    {
                        extendedDeadline: null,
                        deadline: { not: null, lt: now },
                    },
                ],
            },
            select: {
                id: true,
                extendedDeadline: true,
                deadline: true,
                // Add other identifiers if you plan to filter requirements/studentRequirements by specific clearance period
            },
        });
        if (expiredClearancePeriods.length === 0) {
            return res.json({ message: "No expired SetUpClearance periods found." });
        }
        // ⚠️ If you link requirements or studentRequirements to SetUpClearance periods by foreign key,
        // you should filter by that foreign key. If not, this will update ALL incomplete studentRequirements.
        // If you want to update ALL incomplete studentRequirements when any SetUpClearance is expired, use the logic below:
        // 2️⃣ Update all studentRequirements with status = "incomplete" to "missing"
        const result = yield prisma.studentRequirement.updateMany({
            where: {
                status: "incomplete",
                // Add filter if you want to target only those under these expired clearance periods
            },
            data: {
                status: "missing",
            },
        });
        res.json({
            message: "Statuses updated for expired SetUpClearance periods.",
            updatedCount: result.count,
            expiredSetUpClearanceCount: expiredClearancePeriods.length,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to update student requirement statuses for expired SetUpClearance periods.",
        });
    }
});
exports.updateStatusByDueDate = updateStatusByDueDate;
//set schedule
node_cron_1.default.schedule("0 0 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Running automatic status update...");
    yield (0, exports.updateStatusByDueDate)({}, { json: () => { } });
}));
