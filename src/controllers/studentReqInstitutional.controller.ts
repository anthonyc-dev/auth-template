import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

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

    res.status(200).json({
      message: "Student requirement updated successfully",
      data: updatedRequirement,
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

    await prisma.studentRequirementInstitutional.delete({
      where: { id },
    });

    res
      .status(200)
      .json({ message: "Student requirement deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete student requirement" });
  }
};
