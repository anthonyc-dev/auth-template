"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const serviceAccountPath = path_1.default.resolve("src/firebase/ascs-dd799-firebase-adminsdk-fbsvc-631be91ffc.json");
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(JSON.parse((0, fs_1.readFileSync)(serviceAccountPath, "utf8"))),
});
exports.default = firebase_admin_1.default;
