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
exports.deleteRequirement = exports.updateRequirement = exports.getRequirementById = exports.getAllRequirements = exports.createRequirement = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ✅ Create new requirement
const createRequirement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { courseCode, courseName, yearLevel, semester, requirements, department, dueDate, description, } = req.body;
        // Get user id from authenticated user (set by your auth middleware)
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // adjust if you store it differently
        if (!userId) {
            res.status(401).json({ error: "Unauthorized: No user ID found" });
            return;
        }
        const userRequirement = yield prisma.requirement.create({
            data: {
                userId,
                courseCode,
                courseName,
                yearLevel,
                semester,
                requirements,
                department,
                dueDate,
                description,
            },
        });
        res.status(201).json(userRequirement);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
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
            include: { studentReq: true },
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
        // Optionally: Validate body fields here for better error messages
        // Check if requirement exists before updating
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
