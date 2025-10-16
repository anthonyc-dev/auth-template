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
exports.getProfile = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const token_1 = require("../libs/token");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ---- Register
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { schoolId, firstName, lastName, email, phoneNumber, password, role, } = req.body;
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
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
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
                role: user.role,
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
