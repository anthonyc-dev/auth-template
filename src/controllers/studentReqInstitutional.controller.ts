import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { io } from "../app";
import { generateQRCodeForStudent } from "./qrCode.controller";

const prisma = new PrismaClient();

function validateStudentRequirementInput(input: any) {
  const { studentId, coId, requirementId, status } = input;

  // Check types and existence
  if (
    !studentId ||
    typeof studentId !== "string" ||
    !coId ||
    typeof coId !== "string" ||
    !requirementId ||
    typeof requirementId !== "string"
  ) {
    return "Missing or invalid required fields: studentId, coId, requirementId";
  }
  // Optionally validate `status`
  if (status && typeof status !== "string") {
    return "Invalid status field";
  }
  return null;
}

export const createStudentRequirement = async (req: Request, res: Response) => {
  try {
    const errorMsg = validateStudentRequirementInput(req.body);
    if (errorMsg) {
      res.status(400).json({ message: errorMsg });
      return;
    }

    const { studentId, coId, requirementId, signedBy, status } = req.body;

    const newRequirement = await prisma.studentRequirementInstitutional.create({
      data: {
        studentId,
        coId,
        requirementId,
        signedBy,
        status: status || "Incomplete",
      },
    });

    res.status(201).json({
      message: "Student requirement created successfully",
      data: newRequirement,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create student requirement" });
  }
};

export const getAllStudentRequirements = async (
  req: Request,
  res: Response
) => {
  try {
    const requirements = await prisma.studentRequirementInstitutional.findMany({
      include: { institutionalRequirement: true, clearingOfficer: true },
    });

    res.status(200).json(requirements);
  } catch (error: any) {
    console.error("❌ Prisma Error:", error.message);
    console.error("📄 Full Error:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch student requirements",
    });
  }
};

export const getStudentRequirementById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    // Basic ID validation for security - should be a non-empty string
    if (!id || typeof id !== "string") {
      res.status(400).json({ message: "Invalid or missing ID parameter" });
      return;
    }

    const requirement = await prisma.studentRequirementInstitutional.findUnique(
      {
        where: { id },
        include: { institutionalRequirement: true, clearingOfficer: true },
      }
    );

    if (!requirement) {
      res.status(404).json({ message: "Student requirement not found" });
      return;
    }

    res.status(200).json(requirement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch student requirement" });
  }
};

/**
 * Get all institutional student requirements for a given studentId
 *
 * Route: GET /studentRequirementInstitutional/byStudentId/:studentId
 *
 * Returns all records from studentRequirementInstitutional that match the given studentId,
 * including institutionalRequirement and clearingOfficer details.
 */
export const getStudentRequirementsByStudentId = async (
  req: Request,
  res: Response
) => {
  try {
    const { studentId } = req.params;

    // Input validation for security
    if (
      !studentId ||
      typeof studentId !== "string" ||
      studentId.trim() === ""
    ) {
      res
        .status(400)
        .json({ message: "Invalid or missing studentId parameter" });
      return;
    }

    const requirements = await prisma.studentRequirementInstitutional.findMany({
      where: { studentId },
      include: {
        institutionalRequirement: true,
        clearingOfficer: true,
      },
    });

    res.status(200).json(requirements);
  } catch (error: any) {
    console.error(
      "❌ Error in getStudentRequirementsByStudentId:",
      error.message
    );
    res.status(500).json({
      message:
        error.message ||
        "Failed to fetch institutional student requirements by studentId",
    });
  }
};

export const updateStudentRequirement = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    if (!studentId || typeof studentId !== "string") {
      res
        .status(400)
        .json({ message: "Invalid or missing student ID parameter" });
      return;
    }

    const errorMsg = validateStudentRequirementInput(req.body);
    if (errorMsg) {
      res.status(400).json({ message: errorMsg });
      return;
    }

    const { coId, requirementId, status, signedBy } = req.body;

    // Get clearing officer details to check role
    const clearingOfficer = await prisma.clearingOfficer.findUnique({
      where: { id: coId },
    });

    if (!clearingOfficer) {
      res.status(404).json({ message: "Clearing officer not found" });
      return;
    }

    // 🔵 If studentId is NOT unique
    const updatedRequirement =
      await prisma.studentRequirementInstitutional.updateMany({
        where: {
          studentId,
          coId,
          requirementId,
        },
        data: {
          status,
          signedBy,
        },
      });

    if (updatedRequirement.count === 0) {
      res.status(404).json({ message: "Student requirement not found" });
      return;
    }

    // Fetch the updated requirement to get complete data for socket emission
    const updatedData = await prisma.studentRequirementInstitutional.findFirst({
      where: {
        studentId,
        coId,
        requirementId,
      },
      include: {
        institutionalRequirement: true,
        clearingOfficer: true,
      },
    });

    // Check if status is not "signed" - if so, revoke any active permits for this student
    if (status.toLowerCase() !== "signed") {
      const revokedPermits = await prisma.permit.updateMany({
        where: {
          studentId,
          status: "active",
        },
        data: {
          status: "revoked",
        },
      });

      if (revokedPermits.count > 0) {
        // Emit revocation event
        io.emit("qr:revoked", {
          studentId,
          reason: "Institutional requirement status changed to incomplete",
          revokedBy: coId,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check if clearing officer is cashier and status is "signed"
    let canGenerateQR = false;
    let qrData = null;
    if (
      clearingOfficer.role.toLowerCase() === "cashier" &&
      status.toLowerCase() === "signed"
    ) {
      // Check all student requirements from studentRequirement
      const studentRequirements = await prisma.studentRequirement.findMany({
        where: { studentId },
      });

      const allStudentReqSigned = studentRequirements.every(
        (req) => req.status.toLowerCase() === "signed"
      );

      // Check all institutional student requirements EXCEPT cashier's own
      const institutionalRequirements =
        await prisma.studentRequirementInstitutional.findMany({
          where: { studentId },
        });

      // Filter out cashier's own requirement - cashier can generate QR even if their own req isn't signed
      const nonCashierRequirements = institutionalRequirements.filter(
        (req) => req.coId !== coId
      );

      const allNonCashierReqSigned = nonCashierRequirements.every(
        (req) => req.status.toLowerCase() === "signed"
      );

      canGenerateQR = allStudentReqSigned && allNonCashierReqSigned;

      // Auto-generate QR code if all requirements are signed
      if (canGenerateQR) {
        try {
          qrData = await generateQRCodeForStudent(coId, studentId);
        } catch (error) {
          console.error("Error auto-generating QR:", error);
          // Continue with the update even if QR generation fails
        }
      }
    }

    // Emit real-time update via Socket.IO
    io.emit("institutional:studentRequirementUpdated", {
      studentId,
      coId,
      requirementId,
      status,
      signedBy,
      updatedData,
      canGenerateQR,
      qrGenerated: !!qrData,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      message: "Student requirement updated successfully",
      data: updatedRequirement,
      canGenerateQR,
      qrGenerated: !!qrData,
      qrData: qrData || undefined,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update student requirement" });
    return;
  }
};

export const deleteStudentRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Basic ID validation
    if (!id || typeof id !== "string") {
      res.status(400).json({ message: "Invalid or missing ID parameter" });
      return;
    }

    // Fetch the requirement data before deletion
    const requirementToDelete =
      await prisma.studentRequirementInstitutional.findUnique({
        where: { id },
        include: {
          institutionalRequirement: true,
          clearingOfficer: true,
        },
      });

    if (!requirementToDelete) {
      res.status(404).json({ message: "Student requirement not found" });
      return;
    }

    await prisma.studentRequirementInstitutional.delete({
      where: { id },
    });

    // Revoke any active permits for this student since a requirement was deleted
    if (requirementToDelete.studentId) {
      const revokedPermits = await prisma.permit.updateMany({
        where: {
          studentId: requirementToDelete.studentId,
          status: "active",
        },
        data: {
          status: "revoked",
        },
      });

      if (revokedPermits.count > 0) {
        // Emit revocation event
        io.emit("qr:revoked", {
          studentId: requirementToDelete.studentId,
          reason: "Institutional requirement was deleted",
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Emit real-time delete event via Socket.IO
    io.emit("institutional:requirement:deleted", {
      id,
      studentId: requirementToDelete.studentId,
      coId: requirementToDelete.coId,
      requirementId: requirementToDelete.requirementId,
      deletedData: requirementToDelete,
      timestamp: new Date().toISOString(),
    });

    res
      .status(200)
      .json({ message: "Student requirement deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete student requirement" });
  }
};
