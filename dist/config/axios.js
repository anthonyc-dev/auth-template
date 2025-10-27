"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
// Create axios instance with base configuration
const axiosInstance = axios_1.default.create({
    baseURL: process.env.DATA_INTIGRATION_API || "http://localhost:4000",
    timeout: 10000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});
exports.default = axiosInstance;
