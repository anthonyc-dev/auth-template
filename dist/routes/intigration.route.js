"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const intigration_controller_1 = require("../controllers/intigration.controller");
const authentication_1 = require("../middlewares/authentication");
const router = (0, express_1.Router)();
// PUT /clearingOfficer/update/:id
router.put("/updateUserProfile/:id", authentication_1.authenticateToken, intigration_controller_1.updateClearingOfficerProfile);
router.put("/updateUserPassword/:id", authentication_1.authenticateToken, intigration_controller_1.updateClearingOfficerPassword);
exports.default = router;
