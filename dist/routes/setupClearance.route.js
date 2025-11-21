"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const setupClearance_controller_1 = require("../controllers/setupClearance.controller");
const router = (0, express_1.Router)();
// Public
router.get("/current", setupClearance_controller_1.getCurrentClearance);
router.post("/setup", setupClearance_controller_1.setupClearance);
router.put("/start/:id", setupClearance_controller_1.startClearance);
router.put("/stop/:id", setupClearance_controller_1.stopClearance);
router.put("/extend/:id", setupClearance_controller_1.extendDeadline);
router.get("/getAllClearance", setupClearance_controller_1.getAllClearances);
router.delete("/deleteClearance/:id", setupClearance_controller_1.deleteClearance);
exports.default = router;
