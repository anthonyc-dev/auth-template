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
// ✅ CREATE Requirement
const createRequirement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { institutionalName, requirements, department, description, semester, postedBy, } = req.body;
        if (!institutionalName ||
            !Array.isArray(requirements) ||
            requirements.length === 0 ||
            !department ||
            !semester) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        const requirement = yield prisma.institutionalRequirement.create({
            data: {
                institutionalName,
                requirements,
                department,
                description,
                semester,
                postedBy,
            },
        });
        res.status(201).json(requirement);
    }
    catch (error) {
        console.error("Error creating requirement:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createRequirement = createRequirement;
// ✅ GET All Requirements
const getAllRequirements = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requirements = yield prisma.institutionalRequirement.findMany({
            orderBy: { createdAt: "desc" },
            include: { clearingOfficer: true },
        });
        res.json(requirements);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getAllRequirements = getAllRequirements;
// ✅ GET Single Requirement by ID
const getRequirementById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const requirement = yield prisma.institutionalRequirement.findUnique({
            where: { id },
            include: { clearingOfficer: true },
        });
        if (!requirement) {
            res.status(404).json({ message: "Requirement not found" });
            return;
        }
        res.json(requirement);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getRequirementById = getRequirementById;
// ✅ UPDATE Requirement
const updateRequirement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { institutionalName, requirements, department, description, semester, } = req.body;
        const updated = yield prisma.institutionalRequirement.update({
            where: { id },
            data: {
                institutionalName,
                requirements,
                department,
                description,
                semester,
            },
        });
        res.json(updated);
    }
    catch (error) {
        console.error("Error updating requirement:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateRequirement = updateRequirement;
// ✅ DELETE Requirement
const deleteRequirement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Also delete associated StudentRequirements when a Requirement is deleted.
        yield prisma.studentRequirementInstitutional.deleteMany({
            where: { requirementId: id },
        });
        yield prisma.institutionalRequirement.delete({ where: { id } });
        res.json({ message: "Requirement deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteRequirement = deleteRequirement;
