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
exports.createNotification = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clearingOfficerId, studentId, title, message } = req.body;
    const notifData = {
        title: title !== null && title !== void 0 ? title : "New Requirement",
        message,
        type: "requirement",
    };
    // Save notification for both users
    yield prisma.notification.createMany({
        data: [
            Object.assign({ userId: clearingOfficerId }, notifData),
            Object.assign({ userId: studentId }, notifData),
        ],
    });
    // Send in real-time
    // await sendNotification(clearingOfficerId, notifData);
    // await sendNotification(studentId, notifData);
    res.json({ success: true });
});
exports.createNotification = createNotification;
