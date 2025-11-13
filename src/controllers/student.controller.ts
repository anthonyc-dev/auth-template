import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import {
  cookieOptions,
  signAccessToken,
  signRefreshToken,
} from "../libs/token";
import jwt from "jsonwebtoken";

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
    console.error(error);
    res.status(500).json({ message: error.message });
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
        await prisma.clearingOfficer.update({
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
