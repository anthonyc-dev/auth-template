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
exports.sendSMS = void 0;
const axios_1 = __importDefault(require("axios"));
const BASE_URL = process.env.BASE_URL;
const API_KEY = process.env.API_KEY;
const DEVICE_ID = process.env.DEVICE_ID;
const sendSMS = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { phoneNumber, message } = req.body;
    // Validate inputs
    if (!phoneNumber || !message) {
        res.status(400).json({ message: "Phone number and message are required" });
        return;
    }
    try {
        const response = yield axios_1.default.post(`${BASE_URL}/gateway/devices/${DEVICE_ID}/send-sms`, {
            recipients: [phoneNumber],
            message: message,
        }, { headers: { "x-api-key": API_KEY } });
        res.status(200).json(response.data);
    }
    catch (error) {
        console.error("TextBee API Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        res.status(500).json({
            message: "Failed to send SMS",
            error: ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message,
        });
    }
});
exports.sendSMS = sendSMS;
