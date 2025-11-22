import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { io } from "../app";

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

    const newRequirement = await prisma.studentRequirement.create({
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
    const requirements = await prisma.studentRequirement.findMany({
      include: { officerRequirement: true, clearingOfficer: true },
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

    const requirement = await prisma.studentRequirement.findUnique({
      where: { id },
      include: { officerRequirement: true, clearingOfficer: true },
    });

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
 * Get all student requirements by schoolId
 *
 * Route: GET /studentRequirement/bySchoolId/:schoolId
 *
 * This controller fetches all studentRequirement records that match a given schoolId.
 *
 * Security: Validate `schoolId` is a non-empty string to prevent improper queries.
 *
 * Example usage:
 *   GET /studentRequirement/bySchoolId/202200123
 */
export const getStudentRequirementsBySchoolId = async (
  req: Request,
  res: Response
) => {
  try {
    const { schoolId } = req.params;

    // Input validation
    if (!schoolId || typeof schoolId !== "string" || schoolId.trim() === "") {
      res
        .status(400)
        .json({ message: "Invalid or missing schoolId parameter" });
      return;
    }

    // Query student requirements by schoolId
    const studentRequirements = await prisma.studentRequirement.findMany({
      where: { studentId: schoolId },
      include: { officerRequirement: true, clearingOfficer: true },
    });

    res.status(200).json(studentRequirements);
  } catch (error: any) {
    console.error(
      "❌ Error in getStudentRequirementsBySchoolId:",
      error.message
    );
    res.status(500).json({
      message:
        error.message || "Failed to fetch student requirements by schoolId",
    });
  }
};

// export const updateStudentRequirement = async (req: Request, res: Response) => {
//   try {
//     const { studentId } = req.params;

//     if (!studentId || typeof studentId !== "string") {
//       res
//         .status(400)
//         .json({ message: "Invalid or missing student ID parameter" });
//       return;
//     }

//     const errorMsg = validateStudentRequirementInput(req.body);
//     if (errorMsg) {
//       res.status(400).json({ message: errorMsg });
//       return;
//     }

//     const { coId, requirementId, status } = req.body;

//     // 🟢 If studentId is unique
//     // const updatedRequirement = await prisma.studentRequirement.update({
//     //   where: { studentId },
//     //   data: { coId, requirementId, status },
//     // });

//     // 🔵 If studentId is NOT unique
//     const updatedRequirement = await prisma.studentRequirement.updateMany({
//       where: { studentId },
//       data: { coId, requirementId, status },
//     });

//     res.status(200).json({
//       message: "Student requirement updated successfully",
//       data: updatedRequirement,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to update student requirement" });
//     return;
//   }
// };
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

    // Update a specific student requirement using all unique identifiers
    const updatedRequirement = await prisma.studentRequirement.updateMany({
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
    const updatedData = await prisma.studentRequirement.findFirst({
      where: {
        studentId,
        coId,
        requirementId,
      },
      include: {
        officerRequirement: true,
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
          reason: "Requirement status changed to incomplete",
          revokedBy: coId,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Emit real-time update via Socket.IO
    io.emit("studentRequirementUpdated", {
      studentId,
      coId,
      requirementId,
      status,
      signedBy,
      updatedData,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      message: "Student requirement updated successfully",
      data: updatedRequirement,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update student requirement" });
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

    // Fetch the requirement data before deletion for socket emission
    const requirementToDelete = await prisma.studentRequirement.findUnique({
      where: { id },
      include: {
        officerRequirement: true,
        clearingOfficer: true,
      },
    });

    if (!requirementToDelete) {
      res.status(404).json({ message: "Student requirement not found" });
      return;
    }

    await prisma.studentRequirement.delete({
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
          reason: "Student requirement was deleted",
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Emit real-time delete event via Socket.IO
    io.emit("requirement:deleted", {
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
