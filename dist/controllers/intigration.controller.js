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
exports.deleteClearingOfficer = exports.updateClearingOfficerPassword = exports.updateClearingOfficerProfile = exports.getClearingOfficerById = exports.getAllClearingOfficers = exports.createClearingOfficer = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const createClearingOfficer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { schoolId, firstName, lastName, email, phoneNumber, password, role, } = req.body;
        if (!schoolId || !firstName || !lastName || !email || !phoneNumber) {
            res.status(400).json({ message: "All fields are required." });
            return;
        }
        const existingOfficer = yield prisma.clearingOfficerManagement.findUnique({
            where: { email },
        });
        if (existingOfficer) {
            res.status(409).json({ message: "Email already exists." });
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const clearingOfficer = yield prisma.clearingOfficer.create({
            data: {
                schoolId,
                firstName,
                lastName,
                email,
                phoneNumber,
                password: hashedPassword,
                role: role || "clearingOfficer",
            },
        });
        res.status(201).json({
            message: "Clearing officer created successfully",
            clearingOfficer,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
});
exports.createClearingOfficer = createClearingOfficer;
const getAllClearingOfficers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const officers = yield prisma.clearingOfficer.findMany();
        res.json(officers);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.getAllClearingOfficers = getAllClearingOfficers;
const getClearingOfficerById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const officer = yield prisma.clearingOfficer.findUnique({
            where: { id },
        });
        if (!officer)
            return res.status(404).json({ message: "Clearing officer not found" });
        res.json(officer);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.getClearingOfficerById = getClearingOfficerById;
const updateClearingOfficerProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, phoneNumber } = req.body;
        const existingOfficer = yield prisma.clearingOfficer.findUnique({
            where: { id },
        });
        if (!existingOfficer) {
            res.status(404).json({ message: "Clearing officer not found" });
            return;
        }
        let updatedData = {
            firstName,
            lastName,
            email,
            phoneNumber,
        };
        // if (password) {
        //   updatedData.password = await bcrypt.hash(password, 10);
        // }
        const updatedOfficer = yield prisma.clearingOfficer.update({
            where: { id },
            data: updatedData,
        });
        res.json({
            message: "Clearing officer updated successfully",
            updatedOfficer,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.updateClearingOfficerProfile = updateClearingOfficerProfile;
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]{8,}$/;
const updateClearingOfficerPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;
        if (!id || typeof id !== "string") {
            res.status(400).json({ message: "Invalid or missing id parameter." });
            return;
        }
        if (!newPassword || typeof newPassword !== "string") {
            res.status(400).json({ message: "New password is required." });
            return;
        }
        if (newPassword.length < PASSWORD_MIN ||
            newPassword.length > PASSWORD_MAX) {
            res.status(400).json({
                message: `Password length must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters.`,
            });
            return;
        }
        if (!PASSWORD_REGEX.test(newPassword)) {
            res.status(400).json({
                message: "Password must include letters and numbers. Add symbols or uppercase if your policy requires them.",
            });
            return;
        }
        const existingOfficer = yield prisma.clearingOfficer.findUnique({
            where: { id },
            select: { id: true, password: true, email: true, firstName: true },
        });
        if (!existingOfficer) {
            res.status(404).json({ message: "Clearing officer not found." });
            return;
        }
        if (!currentPassword || typeof currentPassword !== "string") {
            res.status(400).json({
                message: "Current password is required to change password. (Admins may have a separate flow.)",
            });
            return;
        }
        const isCurrentValid = yield bcrypt_1.default.compare(currentPassword, existingOfficer.password);
        if (!isCurrentValid) {
            res.status(401).json({ message: "Current password is incorrect." });
            return;
        }
        const isSameAsOld = yield bcrypt_1.default.compare(newPassword, existingOfficer.password);
        if (isSameAsOld) {
            res.status(400).json({
                message: "New password must be different from the current password.",
            });
            return;
        }
        const hashed = yield bcrypt_1.default.hash(newPassword, SALT_ROUNDS);
        const updatedOfficer = yield prisma.clearingOfficer.update({
            where: { id },
            data: { password: hashed },
            select: {
                id: true,
                firstName: true,
                email: true,
            },
        });
        res.status(200).json({
            message: "Password updated successfully.",
            officer: updatedOfficer,
        });
    }
    catch (err) {
        console.error("updateClearingOfficerPassword error:", err);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
    return;
});
exports.updateClearingOfficerPassword = updateClearingOfficerPassword;
const deleteClearingOfficer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const officer = yield prisma.clearingOfficer.findUnique({ where: { id } });
        if (!officer)
            return res.status(404).json({ message: "Clearing officer not found" });
        yield prisma.clearingOfficer.delete({ where: { id } });
        res.json({ message: "Clearing officer deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.deleteClearingOfficer = deleteClearingOfficer;
