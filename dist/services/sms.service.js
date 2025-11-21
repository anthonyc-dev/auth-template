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
exports.sendBulkSMS = exports.sendSMS = void 0;
const axios_1 = __importDefault(require("axios"));
const BASE_URL = process.env.BASE_URL;
const API_KEY = process.env.API_KEY;
const DEVICE_ID = process.env.DEVICE_ID;
/**
 * Send SMS to a single recipient
 * @param options - Phone number and message
 * @returns Promise with success status
 */
const sendSMS = (options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { phoneNumber, message } = options;
    if (!phoneNumber || !message) {
        return {
            success: false,
            error: "Phone number and message are required",
        };
    }
    try {
        const response = yield axios_1.default.post(`${BASE_URL}/gateway/devices/${DEVICE_ID}/send-sms`, {
            recipients: [phoneNumber],
            message: message,
        }, { headers: { "x-api-key": API_KEY } });
        console.log(`✅ SMS sent to ${phoneNumber}`);
        return { success: true };
    }
    catch (error) {
        console.error(`❌ SMS Error for ${phoneNumber}:`, ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return {
            success: false,
            error: ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message,
        };
    }
});
exports.sendSMS = sendSMS;
/**
 * Send SMS to multiple recipients
 * @param options - Array of phone numbers and message
 * @returns Promise with results summary
 */
const sendBulkSMS = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { recipients, message } = options;
    if (!recipients || recipients.length === 0) {
        return {
            successCount: 0,
            failureCount: 0,
            total: 0,
            errors: [],
        };
    }
    const results = {
        successCount: 0,
        failureCount: 0,
        total: recipients.length,
        errors: [],
    };
    // Send SMS to all recipients
    const smsPromises = recipients.map((phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield (0, exports.sendSMS)({ phoneNumber, message });
        if (result.success) {
            results.successCount++;
        }
        else {
            results.failureCount++;
            results.errors.push({
                phoneNumber,
                error: result.error || "Unknown error",
            });
        }
    }));
    yield Promise.allSettled(smsPromises);
    return results;
});
exports.sendBulkSMS = sendBulkSMS;
