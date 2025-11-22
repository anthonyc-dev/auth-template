import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import QRCode from "qrcode";
import { io } from "../app";

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || "super_secret";
const FRONTEND_URL = process.env.FRONT_END_URL!;

// Shape of JWT payload
interface PermitTokenPayload extends JwtPayload {
  permitId: string;
  userId: string;
}

// Helper function to generate QR code (can be called internally)
export const generateQRCodeForStudent = async (
  cashierId: string,
  studentId: string
) => {
  try {
    // Ensure clearing officer exists and is cashier
    const clearingOfficer = await prisma.clearingOfficer.findUnique({
      where: { id: cashierId },
    });

    if (!clearingOfficer || clearingOfficer.role.toLowerCase() !== "cashier") {
      throw new Error("Only cashier can generate QR codes");
    }

    // Check all student requirements from studentRequirement table
    const studentRequirements = await prisma.studentRequirement.findMany({
      where: { studentId },
    });

    const allStudentReqSigned = studentRequirements.every(
      (req) => req.status.toLowerCase() === "signed"
    );

    // Check all institutional student requirements EXCEPT cashier's own requirement
    const institutionalRequirements =
      await prisma.studentRequirementInstitutional.findMany({
        where: { studentId },
      });

    // Filter out cashier's own requirement
    const nonCashierRequirements = institutionalRequirements.filter(
      (req) => req.coId !== cashierId
    );

    const allNonCashierReqSigned = nonCashierRequirements.every(
      (req) => req.status.toLowerCase() === "signed"
    );

    // Verify all requirements (except cashier's) are signed
    if (!allStudentReqSigned || !allNonCashierReqSigned) {
      throw new Error("Not all requirements are signed");
    }

    // Update cashier's own requirement to "signed" when generating QR
    await prisma.studentRequirementInstitutional.updateMany({
      where: {
        studentId,
        coId: cashierId,
      },
      data: {
        status: "signed",
        signedBy: clearingOfficer.firstName + " " + clearingOfficer.lastName,
      },
    });

    // Fetch the updated cashier requirement for socket emission
    const updatedCashierReq =
      await prisma.studentRequirementInstitutional.findFirst({
        where: {
          studentId,
          coId: cashierId,
        },
        include: {
          institutionalRequirement: true,
          clearingOfficer: true,
        },
      });

    // Emit real-time update for cashier's requirement
    io.emit("institutional:studentRequirementUpdated", {
      studentId,
      coId: cashierId,
      requirementId: updatedCashierReq?.requirementId,
      status: "signed",
      signedBy: clearingOfficer.firstName + " " + clearingOfficer.lastName,
      updatedData: updatedCashierReq,
      canGenerateQR: true,
      timestamp: new Date().toISOString(),
    });

    // Create permit
    const permit = await prisma.permit.create({
      data: {
        userId: cashierId,
        studentId: studentId,
        permitCode: `PERMIT-${Date.now()}`,
        status: "active",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { permitId: permit.id, userId: permit.userId },
      SECRET,
      { expiresIn: "30d" }
    );

    // Generate QR URL
    const qrUrl = `${FRONTEND_URL}/viewPermit/?token=${token}`;

    // Generate QR image for that URL
    const qrImage = await QRCode.toDataURL(qrUrl);

    // Emit real-time QR generation event via Socket.IO
    io.emit("qr:generated", {
      studentId,
      cashierId: cashierId,
      permit,
      qrImage,
      token,
      timestamp: new Date().toISOString(),
    });

    return { permit, qrImage, token };
  } catch (error) {
    console.error("Error generating QR:", error);
    throw error;
  }
};

// Officer signs permit & generate QR (API endpoint)
export const generateQR = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { studentId } = req.body;

    if (!userId) {
      res.status(400).json({ error: "User ID (coId) is required" });
      return;
    }

    if (!studentId) {
      res.status(400).json({ error: "Student ID is required" });
      return;
    }

    // Use the helper function
    const result = await generateQRCodeForStudent(userId, studentId);

    res.json({
      message: "Permit signed & QR generated",
      ...result,
    });
  } catch (error: any) {
    console.error("Error generating QR:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// Staff scans QR to verify permit
export const viewPermit = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.body as { token: string };

    if (!token) {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    const decoded = jwt.verify(token, SECRET) as PermitTokenPayload;

    const permit = await prisma.permit.findUnique({
      where: { id: decoded.permitId },
      include: { user: true, student: true },
    });

    if (!permit) {
      res.status(404).json({ error: "Permit not found" });
      return;
    }
    if (permit.status !== "active") {
      res.status(403).json({ error: "Permit not valid" });
      return;
    }
    if (new Date() > permit.expiresAt) {
      res.status(403).json({ error: "Permit expired" });
      return;
    }

    res.json({
      message: "✅ Permit valid, student eligible for exam",
      user: permit.user,
      permit,
    });
  } catch (err) {
    console.error("Error verifying permit:", err);
    res.status(401).json({ error: "Invalid or expired QR" });
  }
};

// Officer revokes permit early
export const revokePermit = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { permitId } = req.params;

    const permit = await prisma.permit.findUnique({
      where: { id: permitId },
    });

    if (!permit) {
      res.status(404).json({ error: "Permit not found" });
      return;
    }

    await prisma.permit.update({
      where: { id: permitId },
      data: { status: "revoked" },
    });

    res.json({ message: "Permit revoked successfully" });
  } catch (err) {
    console.error("Error revoking permit:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPermit = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    // Find the most recent active permit for the student
    const permit = await prisma.permit.findFirst({
      where: {
        studentId,
        status: "active",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!permit) {
      res
        .status(404)
        .json({ error: "No active permit found for this student" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { permitId: permit.id, userId: permit.userId },
      SECRET,
      { expiresIn: "30d" }
    );

    // Generate QR image from URL
    const qrUrl = `${FRONTEND_URL}/viewPermit/?token=${token}`;
    const qrImage = await QRCode.toDataURL(qrUrl);

    res.json({
      message: "Permit found",
      permit,
      qrImage,
      token,
    });
  } catch (error) {
    console.error("Error fetching permit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
