import { Router } from "express";

import { validateLogin, validateRegister } from "../middlewares/auth.validator";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/authentication";
import {
  addClearingOfficer,
  deleteClearingOfficer,
  deleteClearingOfficers,
  getAllClearingOfficers,
  getClearingOfficerById,
  getClearingOfficerByIds,
  getClearingOfficers,
  getClearingOfficersInASCS,
  getProfile,
  login,
  logout,
  refreshToken,
  register,
  updateClearingOfficer,
  updateClearingOfficers,
} from "../controllers/clearingOfficer.controller";

const router = Router();

// Register route
router.post("/register", validateRegister, register);

// Login route
router.post("/login", validateLogin, login);

// Profile route
router.get(
  "/profile",
  authenticateToken,
  authorizeRoles("admin", "student", "clearingOfficer"),
  getProfile
);

// Refresh token route
router.post("/refresh-token", refreshToken);

// Logout route
router.post("/logout", authenticateToken, logout);

//---Clearing officer
// Display all
router.get("/getAllClearingOfficers", getAllClearingOfficers);
// Display by ID
router.get("/getAllClearingOfficerbyId/:id", getClearingOfficerByIds);
// Update
router.put("/updateClearingOfficers/:id", updateClearingOfficers);
// Delete
router.delete("/deleteClearingOfficer/:id", deleteClearingOfficers);

//--------- Clearing officer routes EMS
router.post("/createCo", addClearingOfficer);
router.get("/getAllCo", getClearingOfficers);
router.get("/getCoById/:id", getClearingOfficerById);
router.put("/updateCo/:id", updateClearingOfficer);
router.delete("/deleteCo/:id", deleteClearingOfficer);

//---- clearing officer in ASCS----
router.get("/getAllCoInASCS", getClearingOfficersInASCS);

export default router;

//
