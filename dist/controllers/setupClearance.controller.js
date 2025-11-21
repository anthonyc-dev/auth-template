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
exports.updateClearance = exports.deleteClearance = exports.getAllClearances = exports.extendDeadline = exports.stopClearance = exports.startClearance = exports.getCurrentClearance = exports.setupClearance = void 0;
const client_1 = require("@prisma/client");
const sms_service_1 = require("../services/sms.service");
const prisma = new client_1.PrismaClient();
/**
 * Helper function to send SMS notifications to all students with requirements
 * @param message - The SMS message to send
 * @returns Promise with SMS results
 */
const notifyStudentsWithRequirements = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get all student IDs who have requirements assigned
        const studentRequirements = yield prisma.studentRequirement.findMany({
            select: {
                studentId: true,
            },
        });
        // Extract unique student IDs using Set
        const uniqueStudentIds = new Set();
        studentRequirements.forEach((sr) => {
            if (sr.studentId) {
                uniqueStudentIds.add(sr.studentId);
            }
        });
        const studentIds = Array.from(uniqueStudentIds);
        if (studentIds.length === 0) {
            return {
                successCount: 0,
                failureCount: 0,
                total: 0,
                message: "No students with requirements found",
            };
        }
        // Fetch student phone numbers
        const students = yield prisma.student.findMany({
            where: {
                schoolId: { in: studentIds },
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
        if (studentsWithPhones.length === 0) {
            return {
                successCount: 0,
                failureCount: 0,
                total: 0,
                message: "No students with valid phone numbers found",
            };
        }
        // Send SMS to all students
        const smsResults = yield (0, sms_service_1.sendBulkSMS)({
            recipients: studentsWithPhones.map((s) => s.phoneNumber),
            message: message,
        });
        return {
            successCount: smsResults.successCount,
            failureCount: smsResults.failureCount,
            total: smsResults.total,
            message: `SMS sent to ${smsResults.successCount}/${smsResults.total} students`,
        };
    }
    catch (error) {
        console.error("⚠️ Error in notifyStudentsWithRequirements:", error);
        return {
            successCount: 0,
            failureCount: 0,
            total: 0,
            message: "Failed to send SMS notifications",
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
});
// Create a new clearance setup
const setupClearance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { semesterType, academicYear, deadline } = req.body;
        if (!semesterType || !academicYear || !deadline) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        const clearance = yield prisma.setUpClearance.create({
            data: {
                semesterType,
                academicYear,
                deadline: new Date(deadline),
                isActive: false,
            },
        });
        res.status(201).json({
            message: "Clearance setup completed successfully",
            clearance,
        });
    }
    catch (error) {
        console.error("Setup Clearance Error:", error);
        res.status(500).json({ message: error.message });
    }
});
exports.setupClearance = setupClearance;
// Get current (latest) clearance
const getCurrentClearance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clearance = yield prisma.setUpClearance.findFirst({
            orderBy: { createdAt: "desc" },
        });
        if (!clearance) {
            res.status(404).json({ message: "No clearance found" });
            return;
        }
        res.status(200).json(clearance);
    }
    catch (error) {
        console.error("Fetch Clearance Error:", error);
        res.status(500).json({ message: error.message });
    }
});
exports.getCurrentClearance = getCurrentClearance;
// Start clearance
const startClearance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const clearance = yield prisma.setUpClearance.update({
            where: { id },
            data: {
                isActive: true,
                startDate: new Date(),
            },
        });
        // Send SMS notifications to all students with requirements (non-blocking)
        const deadlineDate = clearance.extendedDeadline || clearance.deadline;
        const deadlineText = deadlineDate
            ? new Date(deadlineDate).toLocaleDateString()
            : "TBA";
        const smsMessage = `Clearance has started! Please complete your clearance requirements. Deadline: ${deadlineText}. Login to the clearance system to view your requirements.`;
        // Send SMS asynchronously (don't wait for it)
        notifyStudentsWithRequirements(smsMessage)
            .then((result) => {
            console.log(`📱 Start Clearance SMS: ${result.successCount}/${result.total} sent successfully`);
        })
            .catch((error) => {
            console.error("⚠️ Failed to send start clearance SMS:", error);
        });
        res.status(200).json({
            message: "Clearance started successfully",
            clearance,
        });
    }
    catch (error) {
        console.error("Start Clearance Error:", error);
        res.status(500).json({ message: error.message });
    }
});
exports.startClearance = startClearance;
// Stop clearance
const stopClearance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const clearance = yield prisma.setUpClearance.update({
            where: { id },
            data: { isActive: false },
        });
        // Send SMS notifications to all students with requirements (non-blocking)
        const smsMessage = `Clearance has been stopped. Please contact the administration for more information.`;
        // Send SMS asynchronously (don't wait for it)
        notifyStudentsWithRequirements(smsMessage)
            .then((result) => {
            console.log(`📱 Stop Clearance SMS: ${result.successCount}/${result.total} sent successfully`);
        })
            .catch((error) => {
            console.error("⚠️ Failed to send stop clearance SMS:", error);
        });
        res.status(200).json({
            message: "Clearance stopped successfully",
            clearance,
        });
    }
    catch (error) {
        console.error("Stop Clearance Error:", error);
        res.status(500).json({ message: error.message });
    }
});
exports.stopClearance = stopClearance;
// Extend clearance deadline
const extendDeadline = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { newDeadline } = req.body;
        if (!newDeadline) {
            res.status(400).json({ message: "New deadline required" });
            return;
        }
        const clearance = yield prisma.setUpClearance.update({
            where: { id },
            data: {
                extendedDeadline: new Date(newDeadline),
            },
        });
        const newDeadlineDate = new Date(newDeadline).toLocaleDateString();
        // Send SMS notifications to all students with requirements (non-blocking)
        const smsMessage = `Clearance deadline has been extended to ${newDeadlineDate}. Please complete your requirements before the new deadline.`;
        // Send SMS asynchronously (don't wait for it)
        notifyStudentsWithRequirements(smsMessage)
            .then((result) => {
            console.log(`📱 Extend Deadline SMS: ${result.successCount}/${result.total} sent successfully`);
        })
            .catch((error) => {
            console.error("⚠️ Failed to send extend deadline SMS:", error);
        });
        res.status(200).json({
            message: `Deadline extended to ${newDeadlineDate}`,
            clearance,
        });
    }
    catch (error) {
        console.error("Extend Deadline Error:", error);
        res.status(500).json({ message: error.message });
    }
});
exports.extendDeadline = extendDeadline;
// Get all clearances (admin list)
const getAllClearances = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clearances = yield prisma.setUpClearance.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json(clearances);
    }
    catch (error) {
        console.error("Get All Clearances Error:", error);
        res.status(500).json({ message: error.message });
    }
});
exports.getAllClearances = getAllClearances;
// Delete a clearance record (optional admin action)
const deleteClearance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.setUpClearance.delete({ where: { id } });
        res.status(200).json({ message: "Clearance deleted successfully" });
    }
    catch (error) {
        console.error("Delete Clearance Error:", error);
        res.status(500).json({ message: error.message });
    }
});
exports.deleteClearance = deleteClearance;
// Update a clearance record (admin action)
const updateClearance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Reject if no ID is provided
        if (!id) {
            res.status(400).json({ message: "Clearance ID is required." });
            return;
        }
        // Check if clearance exists
        const existing = yield prisma.setUpClearance.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ message: "Clearance not found." });
            return;
        }
        // (Optional) Sanitize fields to prevent unwanted field updates
        // Only allow fields you want to be updated
        const allowedFields = [
            "semester",
            "academicYear",
            "startDate",
            "endDate",
            "extendedDeadline",
            "status",
            "description",
            // add more keys as needed
        ];
        const sanitizedData = {};
        for (const key of allowedFields) {
            if (updateData.hasOwnProperty(key)) {
                sanitizedData[key] = updateData[key];
            }
        }
        if (Object.keys(sanitizedData).length === 0) {
            res.status(400).json({ message: "No valid fields provided for update." });
            return;
        }
        const updatedClearance = yield prisma.setUpClearance.update({
            where: { id },
            data: sanitizedData,
        });
        res.status(200).json({
            message: "Clearance updated successfully.",
            clearance: updatedClearance,
        });
    }
    catch (error) {
        console.error("Update Clearance Error:", error);
        if (error.code === "P2025") {
            res.status(404).json({ message: "Clearance not found." });
        }
        else {
            res.status(500).json({ message: error.message });
        }
    }
});
exports.updateClearance = updateClearance;
