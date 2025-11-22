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

// Officer signs permit & generate QR
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

    // Ensure clearing officer exists and is cashier
    const clearingOfficer = await prisma.clearingOfficer.findUnique({
      where: { id: userId },
    });

    if (!clearingOfficer) {
      res.status(404).json({ error: "Clearing officer not found" });
      return;
    }

    if (clearingOfficer.role.toLowerCase() !== "cashier") {
      res.status(403).json({ error: "Only cashier can generate QR codes" });
      return;
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

    // Filter out cashier's own requirement - cashier can generate QR even if their own req isn't signed
    const nonCashierRequirements = institutionalRequirements.filter(
      (req) => req.coId !== userId
    );

    const allNonCashierReqSigned = nonCashierRequirements.every(
      (req) => req.status.toLowerCase() === "signed"
    );

    // Verify all requirements (except cashier's) are signed
    if (!allStudentReqSigned || !allNonCashierReqSigned) {
      res.status(400).json({
        error: "Cannot generate QR code: Not all requirements are signed",
        studentRequirementsSigned: allStudentReqSigned,
        institutionalRequirementsSigned: allNonCashierReqSigned,
        pendingRequirements: {
          studentRequirements: studentRequirements.filter(
            (req) => req.status.toLowerCase() !== "signed"
          ),
          studentRequirementInstitutional: nonCashierRequirements.filter(
            (req) => req.status.toLowerCase() !== "signed"
          ),
        },
      });
      return;
    }

    // Update cashier's own requirement to "signed" when generating QR
    await prisma.studentRequirementInstitutional.updateMany({
      where: {
        studentId,
        coId: userId, // Cashier's own requirement
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
          coId: userId,
        },
        include: {
          institutionalRequirement: true,
          clearingOfficer: true,
        },
      });

    // Emit real-time update for cashier's requirement
    io.emit("institutional:studentRequirementUpdated", {
      studentId,
      coId: userId,
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
        userId: userId,
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

    // // Generate QR image from token
    // const qrImage = await QRCode.toDataURL(token);

    // 👇 Instead of encoding token, we encode a frontend URL with token query param
    const qrUrl = `${FRONTEND_URL}/viewPermit/?token=${token}`;

    // Generate QR image for that URL
    const qrImage = await QRCode.toDataURL(qrUrl);

    // Emit real-time QR generation event via Socket.IO
    io.emit("qr:generated", {
      studentId,
      cashierId: userId,
      permit,
      qrImage, // Add this line
      token, // Optional: you can also include the token
      timestamp: new Date().toISOString(),
    });

    res.json({
      message: "Permit signed & QR generated",
      permit,
      qrImage,
      token,
    });
  } catch (error) {
    console.error("Error generating QR:", error);
    res.status(500).json({ error: "Internal server error" });
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
