import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const createClearingOfficer = async (req: Request, res: Response) => {
  try {
    const {
      schoolId,
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role,
    } = req.body;

    if (!schoolId || !firstName || !lastName || !email || !phoneNumber) {
      res.status(400).json({ message: "All fields are required." });
      return;
    }

    const existingOfficer = await prisma.clearingOfficerManagement.findUnique({
      where: { email },
    });
    if (existingOfficer) {
      res.status(409).json({ message: "Email already exists." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const clearingOfficer = await prisma.clearingOfficer.create({
      data: {
        schoolId,
        firstName,
        lastName,
        email,
        phoneNumber,
        password: hashedPassword,
        role: role || "clearingOfficer",
      },
    });

    res.status(201).json({
      message: "Clearing officer created successfully",
      clearingOfficer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAllClearingOfficers = async (req: Request, res: Response) => {
  try {
    const officers = await prisma.clearingOfficer.findMany();
    res.json(officers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getClearingOfficerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const officer = await prisma.clearingOfficer.findUnique({
      where: { id },
    });

    if (!officer)
      return res.status(404).json({ message: "Clearing officer not found" });
    res.json(officer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const updateClearingOfficerProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber } = req.body;

    const existingOfficer = await prisma.clearingOfficer.findUnique({
      where: { id },
    });
    if (!existingOfficer) {
      res.status(404).json({ message: "Clearing officer not found" });
      return;
    }

    let updatedData: any = {
      firstName,
      lastName,
      email,
      phoneNumber,
    };
    // if (password) {
    //   updatedData.password = await bcrypt.hash(password, 10);
    // }

    const updatedOfficer = await prisma.clearingOfficer.update({
      where: { id },
      data: updatedData,
    });

    res.json({
      message: "Clearing officer updated successfully",
      updatedOfficer,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]{8,}$/;

export const updateClearingOfficerPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!id || typeof id !== "string") {
      res.status(400).json({ message: "Invalid or missing id parameter." });
      return;
    }

    if (!newPassword || typeof newPassword !== "string") {
      res.status(400).json({ message: "New password is required." });
      return;
    }

    if (
      newPassword.length < PASSWORD_MIN ||
      newPassword.length > PASSWORD_MAX
    ) {
      res.status(400).json({
        message: `Password length must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters.`,
      });
      return;
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      res.status(400).json({
        message:
          "Password must include letters and numbers. Add symbols or uppercase if your policy requires them.",
      });
      return;
    }

    const existingOfficer = await prisma.clearingOfficer.findUnique({
      where: { id },
      select: { id: true, password: true, email: true, firstName: true },
    });

    if (!existingOfficer) {
      res.status(404).json({ message: "Clearing officer not found." });
      return;
    }

    if (!currentPassword || typeof currentPassword !== "string") {
      res.status(400).json({
        message:
          "Current password is required to change password. (Admins may have a separate flow.)",
      });
      return;
    }

    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      existingOfficer.password
    );
    if (!isCurrentValid) {
      res.status(401).json({ message: "Current password is incorrect." });
      return;
    }

    const isSameAsOld = await bcrypt.compare(
      newPassword,
      existingOfficer.password
    );
    if (isSameAsOld) {
      res.status(400).json({
        message: "New password must be different from the current password.",
      });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const updatedOfficer = await prisma.clearingOfficer.update({
      where: { id },
      data: { password: hashed },
      select: {
        id: true,
        firstName: true,
        email: true,
      },
    });

    res.status(200).json({
      message: "Password updated successfully.",
      officer: updatedOfficer,
    });
  } catch (err: any) {
    console.error("updateClearingOfficerPassword error:", err);

    res.status(500).json({ message: "Server error. Please try again later." });
  }
  return;
};

export const deleteClearingOfficer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const officer = await prisma.clearingOfficer.findUnique({ where: { id } });
    if (!officer)
      return res.status(404).json({ message: "Clearing officer not found" });

    await prisma.clearingOfficer.delete({ where: { id } });
    res.json({ message: "Clearing officer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAllStudentBySchoolId = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;

    if (!schoolId) {
      res.status(400).json({
        success: false,
        message: "School ID parameter is required.",
      });
      return;
    }

    const students = await prisma.student.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        schoolId: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        yearLevel: true,
        // department: true,
      },
    });

    if (students.length === 0) {
      res.status(404).json({
        success: false,
        message: `No students found for school ID '${schoolId}'.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error: any) {
    console.error("❌ Error fetching students by schoolId:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};
