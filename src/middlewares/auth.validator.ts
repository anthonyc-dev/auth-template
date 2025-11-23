import { Request, Response, NextFunction } from "express";
import validator from "validator";
import {
  LoginRequest,
  RegisterRequest,
  StudentRegisterRequest,
} from "../types/type";

export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      schoolId,
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role,
    }: RegisterRequest = req.body;

    // Check if all required fields are present
    if (
      !schoolId ||
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !password ||
      !role
    ) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // Validate password length
    if (password.length < 8) {
      res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
      return;
    }

    // Validate phone number (basic validation)
    if (!validator.isMobilePhone(phoneNumber)) {
      res.status(400).json({ error: "Invalid phone number format" });
      return;
    }

    // Validate role
    const validRoles = [
      "student",
      "clearingOfficer",
      "admin",
      "registrar",
      "dean",
      "sao",
      "cashier",
      "laboratory",
      "library",
      "tailoring",
      "guidance",
      "umsa",
      "sgo",
      "kahayag",
    ];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        error: "Role must be one of: student, clearing officer, admin",
      });
      return;
    }

    // Validate school ID format: must match 00-0000 (two digits, hyphen, four digits)
    if (!/^\d{2}-\d{4}$/.test(schoolId)) {
      res.status(400).json({
        error: "School ID must be in the format 00-0000",
      });
      return;
    }

    // Validate first name (should contain only letters and spaces)
    if (!validator.matches(firstName, /^[a-zA-Z\s]+$/)) {
      res.status(400).json({
        error: "First name must contain only letters and spaces",
      });
      return;
    }

    // Validate last name (should contain only letters and spaces)
    if (!validator.matches(lastName, /^[a-zA-Z\s]+$/)) {
      res.status(400).json({
        error: "Last name must contain only letters and spaces",
      });
      return;
    }

    // Validate password: must contain uppercase, lowercase, number, and special character
    const passwordRequirements = [
      {
        regex: /[A-Z]/,
        message: "Password must contain at least one uppercase letter",
      },
      {
        regex: /[a-z]/,
        message: "Password must contain at least one lowercase letter",
      },
      { regex: /[0-9]/, message: "Password must contain at least one number" },
      {
        regex: /[!@#$%^&*(),.?":{}|<>_\-\\[\];'/`~+=]/,
        message: "Password must contain at least one special character",
      },
    ];

    for (const requirement of passwordRequirements) {
      if (!requirement.regex.test(password)) {
        res.status(400).json({ error: requirement.message });
        return;
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Validation error occurred" });
    return;
  }
};

export const studentValidateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      schoolId,
      firstName,
      lastName,
      email,
      phoneNumber,
      program,
      yearLevel,
      password,
    }: StudentRegisterRequest = req.body;

    // Check if all required fields are present
    if (
      !schoolId ||
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !program ||
      !yearLevel ||
      !password
    ) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // Validate password length
    if (password.length < 8) {
      res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
      return;
    }

    // Validate phone number (basic validation)
    if (!validator.isMobilePhone(phoneNumber)) {
      res.status(400).json({ error: "Invalid phone number format" });
      return;
    }

    //program and year level validation
    if (!validator.matches(program, /^[a-zA-Z\s]+$/)) {
      res.status(400).json({
        error: "Program must contain only letters and spaces",
      });
      return;
    }

    // Allow yearLevel to contain letters, numbers, and spaces (e.g., "3rd Year", "2023", "First Year")
    if (!validator.matches(yearLevel, /^[a-zA-Z0-9\s]+$/)) {
      res.status(400).json({
        error: "Year level must contain only letters, numbers, and spaces",
      });
      return;
    }

    // Validate school ID format: must match 00-0000 (two digits, hyphen, four digits)
    if (!/^\d{2}-\d{4}$/.test(schoolId)) {
      res.status(400).json({
        error: "School ID must be in the format 00-0000",
      });
      return;
    }

    // Validate first name (should contain only letters and spaces)
    if (!validator.matches(firstName, /^[a-zA-Z\s]+$/)) {
      res.status(400).json({
        error: "First name must contain only letters and spaces",
      });
      return;
    }

    // Validate last name (should contain only letters and spaces)
    if (!validator.matches(lastName, /^[a-zA-Z\s]+$/)) {
      res.status(400).json({
        error: "Last name must contain only letters and spaces",
      });
      return;
    }

    // Validate password: must contain uppercase, lowercase, number, and special character
    const passwordRequirements = [
      {
        regex: /[A-Z]/,
        message: "Password must contain at least one uppercase letter",
      },
      {
        regex: /[a-z]/,
        message: "Password must contain at least one lowercase letter",
      },
      { regex: /[0-9]/, message: "Password must contain at least one number" },
      {
        regex: /[!@#$%^&*(),.?":{}|<>_\-\\[\];'/`~+=]/,
        message: "Password must contain at least one special character",
      },
    ];

    for (const requirement of passwordRequirements) {
      if (!requirement.regex.test(password)) {
        res.status(400).json({ error: requirement.message });
        return;
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Validation error occurred" });
    return;
  }
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Check if required fields are present
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (email && !password) {
      res.status(400).json({ error: "Wrong credentials" });
      return;
    }
    if (!email && password) {
      res.status(400).json({ error: "Wrong credentials" });
      return;
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // Validate password is not empty
    if (password.trim().length === 0) {
      res.status(400).json({ error: "Password cannot be empty" });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Validation error occurred" });
    return;
  }
};
