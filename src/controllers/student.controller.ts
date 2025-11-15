import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import {
  cookieOptions,
  signAccessToken,
  signRefreshToken,
} from "../libs/token";
import jwt from "jsonwebtoken";
import axiosInstance from "../config/axios";

const prisma = new PrismaClient();

interface StudentType {
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  program: string;
  yearLevel: string;
  password: string;
}
// Create a new student
export const registerStudent = async (req: Request, res: Response) => {
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
    }: StudentType = req.body;

    // Validate in EMS for student
    try {
      const response = await axiosInstance.get(
        `/intigration/getStudentBySchoolId/${schoolId}`
      );

      if (!response.data) {
        res.status(400).json({
          error: "Student ID not found in Enrollment system.",
        });
        return;
      }
    } catch (axiosError: any) {
      console.error("EMS validation error:", axiosError.message);
      // Check if it's a network/connection error
      if (
        axiosError.code === "ECONNREFUSED" ||
        axiosError.code === "ETIMEDOUT"
      ) {
        res.status(503).json({
          error:
            "Unable to connect to Enrollment Management System. Please try again later.",
        });
        return;
      }
      // If EMS returns 404 or other error, treat as student not found
      if (axiosError.response?.status === 404) {
        res.status(400).json({
          error: "Student ID not found in Enrollment system.",
        });
        return;
      }
      // For other errors, log and return generic error
      res.status(500).json({
        error: "Error validating student with Enrollment system.",
        details: axiosError.message,
      });
      return;
    }

    const existing = await prisma.student.findUnique({
      where: { email },
    });
    if (existing) {
      res.status(400).json({ error: "User with this email already exists" });
      return;
    }

    const existingSchoolId = await prisma.student.findUnique({
      where: { schoolId },
    });
    if (existingSchoolId) {
      res
        .status(400)
        .json({ error: "User with this school ID already exists" });
      return;
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await prisma.student.create({
      data: {
        schoolId,
        firstName,
        lastName,
        email,
        phoneNumber,
        program,
        yearLevel,
        password: hashedPassword,
      },
    });

    const accessToken = signAccessToken({
      id: student.id,
      email: student.email,
    });
    const refreshToken = signRefreshToken(student.id);

    await prisma.student.update({
      where: { id: student.id },
      data: { refreshToken },
    });

    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.status(201).json({
      message: "Student registered successfully",
      student: {
        id: student.id,
        schoolId: student.schoolId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phoneNumber: student.phoneNumber,
        program: student.program,
        yearLevel: student.yearLevel,
      },
      accessToken,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Internal server error during registration",
      error: error.message,
    });
  }
};

export const loginStudent = async (req: Request, res: Response) => {
  try {
    const { email, password }: StudentType = req.body;

    const student = await prisma.student.findUnique({
      where: { email },
    });
    if (!student) {
      res.status(401).json({ error: "Wrong credentials" });
      return;
    }

    const ok = await bcrypt.compare(password, student.password);
    if (!ok) {
      res.status(401).json({ error: "Wrong credentials" });
      return;
    }

    const accessToken = signAccessToken({
      id: student.id,
      email: student.email,
    });
    const refreshToken = signRefreshToken(student.id);

    await prisma.student.update({
      where: { id: student.id },
      data: { refreshToken },
    });

    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.status(200).json({
      message: "Login successful",
      student: {
        id: student.id,
        schoolId: student.schoolId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phoneNumber: student.phoneNumber,
        program: student.program,
        yearLevel: student.yearLevel,
      },
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Logout a student
export const logoutStudent = async (req: Request, res: Response) => {
  try {
    const oldToken = req.cookies?.refreshToken;

    if (oldToken) {
      try {
        const decoded: any = jwt.verify(
          oldToken,
          process.env.JWT_REFRESH_SECRET!
        );
        await prisma.student.update({
          where: { id: decoded.userId },
          data: { refreshToken: null },
        });
      } catch {}
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      path: "/",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// Get all students
export const getStudents = async (req: Request, res: Response) => {
  try {
    const students = await prisma.student.findMany();
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get a student by ID
export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }
    res.json(student);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get a student by school ID
export const getStudentBySchoolId = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const student = await prisma.student.findUnique({
      where: { schoolId },
    });

    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }
    res.json(student);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update a student
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, program, yearLevel } =
      req.body;

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { firstName, lastName, email, phoneNumber, program, yearLevel },
    });

    res.json(updatedStudent);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a student
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.student.delete({ where: { id } });
    res.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Change student password controller
 *
 * Route: POST /student/changePassword
 *
 * Request body:
 * {
 *   "email": string,
 *   "currentPassword": string,
 *   "newPassword": string
 * }
 *
 * Returns JSON message indicating success or reasons for failure.
 */

/**
 * POST /student/changePassword
 */
export const changeStudentPassword = async (req: Request, res: Response) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    // Input validation
    if (!email || !currentPassword || !newPassword) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }
    if (
      typeof email !== "string" ||
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      res.status(400).json({ error: "Input types are invalid." });
      return;
    }

    const student = await prisma.student.findUnique({ where: { email } });
    if (!student) {
      res.status(404).json({ error: "Student not found." });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isMatch) {
      res.status(401).json({ error: "Current password is incorrect." });
      return;
    }

    // Optional: check new password isn't the same as current
    const isSame = await bcrypt.compare(newPassword, student.password);
    if (isSame) {
      res.status(400).json({
        error: "New password cannot be the same as the current password.",
      });
      return;
    }

    // Hash the new password securely
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.student.update({
      where: { email },
      data: { password: hashedPassword, updatedAt: new Date() },
    });

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (error: any) {
    console.error("Password change error:", error); // For debugging
    res.status(500).json({ error: "Internal server error." });
  }
};
