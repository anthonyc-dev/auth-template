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
exports.getClearingOfficersInASCS = exports.getClearingOfficerById = exports.getClearingOfficers = exports.deleteClearingOfficer = exports.updateClearingOfficer = exports.addClearingOfficer = exports.deleteClearingOfficers = exports.updateClearingOfficers = exports.getClearingOfficerByIds = exports.getAllClearingOfficers = exports.getProfile = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const token_1 = require("../libs/token");
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("../config/axios"));
const axios_2 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
// ---- Register
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { schoolId, firstName, lastName, email, phoneNumber, password, role, } = req.body;
        // Validate in EMS
        const response = yield axios_1.default.get(`/intigration/getCoBySchoolId/${schoolId}`);
        if (!response.data) {
            res.status(400).json({
                message: "Clearing Officer ID not found in Enrollment system.",
            });
            return;
        }
        const existing = yield prisma.clearingOfficer.findUnique({
            where: { email },
        });
        if (existing) {
            res.status(400).json({ error: "User with this email already exists" });
            return;
        }
        const existingSchoolId = yield prisma.clearingOfficer.findUnique({
            where: { schoolId },
        });
        if (existingSchoolId) {
            res
                .status(400)
                .json({ error: "User with this school ID already exists" });
            return;
        }
        const hashed = yield bcrypt_1.default.hash(password, 10);
        const user = yield prisma.clearingOfficer.create({
            data: {
                schoolId,
                firstName,
                lastName,
                email,
                phoneNumber,
                password: hashed,
                role,
            },
        });
        const accessToken = (0, token_1.signAccessToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        const refreshToken = (0, token_1.signRefreshToken)(user.id);
        yield prisma.clearingOfficer.update({
            where: { id: user.id },
            data: { refreshToken },
        });
        res.cookie("refreshToken", refreshToken, token_1.cookieOptions);
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                schoolId: user.schoolId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
            },
            accessToken,
        });
    }
    catch (error) {
        console.error("Register error:", error);
        if (axios_2.default.isAxiosError(error) && ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
            res.status(400).json({
                message: "Clearing Officer ID not found in Enrollment system.",
            });
            return;
        }
        else {
            console.error(error);
            res.status(500).json({ message: "Error validating clearing officer ID" });
            return;
        }
    }
});
exports.register = register;
// ---- Login
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield prisma.clearingOfficer.findUnique({
            where: { email },
        });
        if (!user) {
            res.status(401).json({ error: "Wrong credentials" });
            return;
        }
        const ok = yield bcrypt_1.default.compare(password, user.password);
        if (!ok) {
            res.status(401).json({ error: "Wrong credentials" });
            return;
        }
        const accessToken = (0, token_1.signAccessToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        const refreshToken = (0, token_1.signRefreshToken)(user.id);
        yield prisma.clearingOfficer.update({
            where: { id: user.id },
            data: { refreshToken },
        });
        res.cookie("refreshToken", refreshToken, token_1.cookieOptions);
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                schoolId: user.schoolId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                profileImage: user.profileImage,
            },
            accessToken,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.login = login;
// ---- Refresh with rotation
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const oldToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.refreshToken);
        if (!oldToken) {
            res.status(401).json({ error: "Refresh token required" });
            return;
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(oldToken, process.env.JWT_REFRESH_SECRET);
        }
        catch (err) {
            const status = (0, token_1.tokenErrStatus)(err);
            res.status(status).json({ error: "Invalid or expired refresh token" });
            return;
        }
        const user = yield prisma.clearingOfficer.findUnique({
            where: { id: decoded.userId },
        });
        if (!user || user.refreshToken !== oldToken) {
            res.status(403).json({ error: "Invalid refresh token" });
            return;
        }
        const newAccess = (0, token_1.signAccessToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        const newRefresh = (0, token_1.signRefreshToken)(user.id);
        yield prisma.clearingOfficer.update({
            where: { id: user.id },
            data: { refreshToken: newRefresh },
        });
        res.cookie("refreshToken", newRefresh, token_1.cookieOptions);
        res.status(200).json({ accessToken: newAccess });
    }
    catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.refreshToken = refreshToken;
// ---- Logout (works even if access token expired)
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const oldToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
        if (oldToken) {
            try {
                const decoded = jsonwebtoken_1.default.verify(oldToken, process.env.JWT_REFRESH_SECRET);
                yield prisma.clearingOfficer.update({
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
exports.logout = logout;
// ----Example protected profile
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }
        const user = yield prisma.clearingOfficer.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                schoolId: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                role: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({ user });
    }
    catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getProfile = getProfile;
// ✅ 1. Get All Clearing Officers CRUD -------------
const getAllClearingOfficers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const officers = yield prisma.clearingOfficer.findMany({
            select: {
                id: true,
                schoolId: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json(officers);
    }
    catch (error) {
        console.error("Get all error:", error);
        res.status(500).json({ message: "Failed to retrieve clearing officers" });
    }
});
exports.getAllClearingOfficers = getAllClearingOfficers;
// ✅ 2. Get Clearing Officer by ID
const getClearingOfficerByIds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const officer = yield prisma.clearingOfficer.findUnique({
            where: { id },
            select: {
                id: true,
                schoolId: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
            },
        });
        if (!officer) {
            res.status(404).json({ message: "Clearing officer not found" });
            return;
        }
        res.status(200).json(officer);
    }
    catch (error) {
        console.error("Get by ID error:", error);
        res.status(500).json({ message: "Error retrieving clearing officer" });
    }
});
exports.getClearingOfficerByIds = getClearingOfficerByIds;
// ✅ 3. Update Clearing Officer
const updateClearingOfficers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, phoneNumber, password, role } = req.body;
        const existing = yield prisma.clearingOfficer.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ message: "Clearing officer not found" });
            return;
        }
        let hashedPassword;
        if (password) {
            hashedPassword = yield bcrypt_1.default.hash(password, 10);
        }
        const updatedOfficer = yield prisma.clearingOfficer.update({
            where: { id },
            data: Object.assign({ firstName,
                lastName,
                email,
                phoneNumber,
                role }, (hashedPassword && { password: hashedPassword })),
            select: {
                id: true,
                schoolId: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                role: true,
                updatedAt: true,
            },
        });
        res.status(200).json({
            message: "Clearing officer updated successfully",
            officer: updatedOfficer,
        });
    }
    catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ message: "Failed to update clearing officer" });
    }
});
exports.updateClearingOfficers = updateClearingOfficers;
// ✅ 4. Delete Clearing Officer
const deleteClearingOfficers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const existing = yield prisma.clearingOfficer.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ message: "Clearing officer not found" });
            return;
        }
        yield prisma.clearingOfficer.delete({ where: { id } });
        res.status(200).json({ message: "Clearing officer deleted successfully" });
    }
    catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: "Failed to delete clearing officer" });
    }
});
exports.deleteClearingOfficers = deleteClearingOfficers;
// ----Clearing officer endpoints managements----------
//add clearing officer
const addClearingOfficer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { schoolId, firstName, lastName, email, phoneNumber, position, department, } = req.body;
        // ✅ Validate required fields
        if (!schoolId || !firstName || !lastName || !email || !phoneNumber) {
            res.status(400).json({
                message: "Missing required fields. Please provide all necessary data.",
            });
            return;
        }
        // ✅ Check if the user already exists by email or schoolId
        const existingUser = yield prisma.clearingOfficerManagement.findFirst({
            where: {
                OR: [{ email }, { schoolId }],
            },
        });
        if (existingUser) {
            res.status(409).json({
                message: "A user with that email or schoolId already exists.",
            });
            return;
        }
        // // ✅ Handle password hashing (detect bcrypt hash pattern)
        // const bcryptHashPattern = /^\$2[aby]\$.{56}$/;
        // const hashedPassword = bcryptHashPattern.test(password)
        //   ? password
        //   : await bcrypt.hash(password, 10);
        // ✅ Create clearing officer
        const newOfficer = yield prisma.clearingOfficerManagement.create({
            data: {
                schoolId,
                firstName,
                lastName,
                email,
                phoneNumber,
                position: position || "N/A",
                department: department || "N/A",
            },
        });
        // ✅ Success response (exclude password)
        res.status(201).json({
            message: "Clearing officer created successfully.",
            data: {
                id: newOfficer.id,
                schoolId: newOfficer.schoolId,
                firstName: newOfficer.firstName,
                lastName: newOfficer.lastName,
                email: newOfficer.email,
                phoneNumber: newOfficer.phoneNumber,
                position: newOfficer.position,
                department: newOfficer.department,
                createdAt: newOfficer.createdAt,
            },
        });
    }
    catch (error) {
        console.error("Error creating clearing officer:", error);
        res.status(500).json({
            message: "Internal server error.",
            error: error.message || error,
        });
    }
});
exports.addClearingOfficer = addClearingOfficer;
const updateClearingOfficer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { schoolId, firstName, lastName, email, phoneNumber, position, department, } = req.body;
        const clearingOfficer = yield prisma.clearingOfficerManagement.update({
            where: { id },
            data: {
                schoolId,
                firstName,
                lastName,
                email,
                phoneNumber,
                position,
                department,
            },
        });
        res.status(200).json({
            message: "Clearing officer updated successfully",
            clearingOfficer,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateClearingOfficer = updateClearingOfficer;
// Delete a clearing officer
const deleteClearingOfficer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.clearingOfficerManagement.delete({
            where: { id },
        });
        res.status(200).json({ message: "Clearing officer deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteClearingOfficer = deleteClearingOfficer;
// Get all clearing officer
const getClearingOfficers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clearingOfficers = yield prisma.clearingOfficerManagement.findMany();
        res.json(clearingOfficers);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getClearingOfficers = getClearingOfficers;
// Get a clearing officer by ID
const getClearingOfficerById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const clearingOfficer = yield prisma.clearingOfficerManagement.findUnique({
            where: { id },
        });
        if (!clearingOfficer) {
            res.status(404).json({ message: "Clearing officer not found" });
            return;
        }
        res.status(200).json({ clearingOfficer });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getClearingOfficerById = getClearingOfficerById;
//---- clearing officer in ASCS----
// Get all clearing officer in ASCS
const getClearingOfficersInASCS = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clearingOfficers = yield prisma.clearingOfficer.findMany();
        res.json(clearingOfficers);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getClearingOfficersInASCS = getClearingOfficersInASCS;
