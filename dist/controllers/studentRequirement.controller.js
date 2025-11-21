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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStudentRequirement = exports.updateStudentRequirement = exports.getStudentRequirementsBySchoolId = exports.getStudentRequirementById = exports.getAllStudentRequirements = exports.createStudentRequirement = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function validateStudentRequirementInput(input) {
    const { studentId, coId, requirementId, status } = input;
    // Check types and existence
    if (!studentId ||
        typeof studentId !== "string" ||
        !coId ||
        typeof coId !== "string" ||
        !requirementId ||
        typeof requirementId !== "string") {
        return "Missing or invalid required fields: studentId, coId, requirementId";
    }
    // Optionally validate `status`
    if (status && typeof status !== "string") {
        return "Invalid status field";
    }
    return null;
}
const createStudentRequirement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const errorMsg = validateStudentRequirementInput(req.body);
        if (errorMsg) {
            res.status(400).json({ message: errorMsg });
            return;
        }
        const { studentId, coId, requirementId, signedBy, status } = req.body;
        const newRequirement = yield prisma.studentRequirement.create({
            data: {
                studentId,
                coId,
                requirementId,
                signedBy,
                status: status || "Incomplete",
            },
        });
        res.status(201).json({
            message: "Student requirement created successfully",
            data: newRequirement,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create student requirement" });
    }
});
exports.createStudentRequirement = createStudentRequirement;
const getAllStudentRequirements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requirements = yield prisma.studentRequirement.findMany({
            include: { officerRequirement: true, clearingOfficer: true },
        });
        res.status(200).json(requirements);
    }
    catch (error) {
        console.error("❌ Prisma Error:", error.message);
        console.error("📄 Full Error:", error);
        res.status(500).json({
            message: error.message || "Failed to fetch student requirements",
        });
    }
});
exports.getAllStudentRequirements = getAllStudentRequirements;
const getStudentRequirementById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Basic ID validation for security - should be a non-empty string
        if (!id || typeof id !== "string") {
            res.status(400).json({ message: "Invalid or missing ID parameter" });
            return;
        }
        const requirement = yield prisma.studentRequirement.findUnique({
            where: { id },
            include: { officerRequirement: true, clearingOfficer: true },
        });
        if (!requirement) {
            res.status(404).json({ message: "Student requirement not found" });
            return;
        }
        res.status(200).json(requirement);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch student requirement" });
    }
});
exports.getStudentRequirementById = getStudentRequirementById;
/**
 * Get all student requirements by schoolId
 *
 * Route: GET /studentRequirement/bySchoolId/:schoolId
 *
 * This controller fetches all studentRequirement records that match a given schoolId.
 *
 * Security: Validate `schoolId` is a non-empty string to prevent improper queries.
 *
 * Example usage:
 *   GET /studentRequirement/bySchoolId/202200123
 */
const getStudentRequirementsBySchoolId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { schoolId } = req.params;
        // Basic validation
        if (!schoolId || typeof schoolId !== "string" || schoolId.trim() === "") {
            res
                .status(400)
                .json({ message: "Invalid or missing schoolId parameter" });
            return;
        }
        // Query student requirements by schoolId
        const studentRequirements = yield prisma.studentRequirement.findMany({
            where: { studentId: schoolId },
            include: { officerRequirement: true, clearingOfficer: true },
        });
        res.status(200).json(studentRequirements);
    }
    catch (error) {
        console.error("❌ Error in getStudentRequirementsBySchoolId:", error.message);
        res.status(500).json({
            message: error.message || "Failed to fetch student requirements by schoolId",
        });
    }
});
exports.getStudentRequirementsBySchoolId = getStudentRequirementsBySchoolId;
// export const updateStudentRequirement = async (req: Request, res: Response) => {
//   try {
//     const { studentId } = req.params;
//     if (!studentId || typeof studentId !== "string") {
//       res
//         .status(400)
//         .json({ message: "Invalid or missing student ID parameter" });
//       return;
//     }
//     const errorMsg = validateStudentRequirementInput(req.body);
//     if (errorMsg) {
//       res.status(400).json({ message: errorMsg });
//       return;
//     }
//     const { coId, requirementId, status } = req.body;
//     // 🟢 If studentId is unique
//     // const updatedRequirement = await prisma.studentRequirement.update({
//     //   where: { studentId },
//     //   data: { coId, requirementId, status },
//     // });
//     // 🔵 If studentId is NOT unique
//     const updatedRequirement = await prisma.studentRequirement.updateMany({
//       where: { studentId },
//       data: { coId, requirementId, status },
//     });
//     res.status(200).json({
//       message: "Student requirement updated successfully",
//       data: updatedRequirement,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to update student requirement" });
//     return;
//   }
// };
const updateStudentRequirement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        if (!studentId || typeof studentId !== "string") {
            res
                .status(400)
                .json({ message: "Invalid or missing student ID parameter" });
            return;
        }
        const errorMsg = validateStudentRequirementInput(req.body);
        if (errorMsg) {
            res.status(400).json({ message: errorMsg });
            return;
        }
        const { coId, requirementId, status, signedBy } = req.body;
        // Update a specific student requirement using all unique identifiers
        const updatedRequirement = yield prisma.studentRequirement.updateMany({
            where: {
                studentId,
                coId,
                requirementId,
            },
            data: {
                status,
                signedBy,
            },
        });
        if (updatedRequirement.count === 0) {
            res.status(404).json({ message: "Student requirement not found" });
            return;
        }
        res.status(200).json({
            message: "Student requirement updated successfully",
            data: updatedRequirement,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update student requirement" });
    }
});
exports.updateStudentRequirement = updateStudentRequirement;
const deleteStudentRequirement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Basic ID validation
        if (!id || typeof id !== "string") {
            res.status(400).json({ message: "Invalid or missing ID parameter" });
            return;
        }
        yield prisma.studentRequirement.delete({
            where: { id },
        });
        res
            .status(200)
            .json({ message: "Student requirement deleted successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete student requirement" });
    }
});
exports.deleteStudentRequirement = deleteStudentRequirement;
