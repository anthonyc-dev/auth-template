"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const send_sms_controller_1 = require("../controllers/send-sms.controller");
const router = (0, express_1.Router)();
router.post("/send-sms", send_sms_controller_1.sendSMS);
exports.default = router;
