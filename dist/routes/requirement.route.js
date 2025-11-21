"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requirement_controller_1 = require("../controllers/requirement.controller");
const authentication_1 = require("../middlewares/authentication");
const router = (0, express_1.Router)();
// requirements routes
router.post("/createReq", authentication_1.authenticateToken, requirement_controller_1.createRequirement);
router.get("/getAllReq", requirement_controller_1.getAllRequirements);
router.get("/getByIdReq/:id", authentication_1.authenticateToken, requirement_controller_1.getRequirementById);
router.put("/updateReq/:id", authentication_1.authenticateToken, (0, authentication_1.authorizeRoles)("clearingOfficer"), requirement_controller_1.updateRequirement);
router.delete("/deleteReq/:id", requirement_controller_1.deleteRequirement);
router.delete("/deleteByCourseCode/:courseCode", requirement_controller_1.deleteRequirementsByCourseCode);
exports.default = router;
