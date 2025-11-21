"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_validator_1 = require("../middlewares/auth.validator");
const authentication_1 = require("../middlewares/authentication");
const clearingOfficer_controller_1 = require("../controllers/clearingOfficer.controller");
const router = (0, express_1.Router)();
// Register route
router.post("/register", auth_validator_1.validateRegister, clearingOfficer_controller_1.register);
// Login route
router.post("/login", auth_validator_1.validateLogin, clearingOfficer_controller_1.login);
// Profile route
router.get("/profile", authentication_1.authenticateToken, (0, authentication_1.authorizeRoles)("admin", "student", "clearingOfficer"), clearingOfficer_controller_1.getProfile);
// Refresh token route
router.post("/refresh-token", clearingOfficer_controller_1.refreshToken);
// Logout route
router.post("/logout", authentication_1.authenticateToken, clearingOfficer_controller_1.logout);
//---Clearing officer
// Display all
router.get("/getAllClearingOfficers", clearingOfficer_controller_1.getAllClearingOfficers);
// Display by ID
router.get("/getAllClearingOfficerbyId/:id", clearingOfficer_controller_1.getClearingOfficerByIds);
// Update
router.put("/updateClearingOfficers/:id", clearingOfficer_controller_1.updateClearingOfficers);
// Delete
router.delete("/deleteClearingOfficer/:id", clearingOfficer_controller_1.deleteClearingOfficers);
//--------- Clearing officer routes EMS
router.post("/createCo", clearingOfficer_controller_1.addClearingOfficer);
router.get("/getAllCo", clearingOfficer_controller_1.getClearingOfficers);
router.get("/getCoById/:id", clearingOfficer_controller_1.getClearingOfficerById);
router.put("/updateCo/:id", clearingOfficer_controller_1.updateClearingOfficer);
router.delete("/deleteCo/:id", clearingOfficer_controller_1.deleteClearingOfficer);
//---- clearing officer in ASCS----
router.get("/getAllCoInASCS", clearingOfficer_controller_1.getClearingOfficersInASCS);
exports.default = router;
//
