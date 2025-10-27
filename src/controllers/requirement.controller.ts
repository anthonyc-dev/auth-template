import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

interface UserRequirement {
  id: string;
  userId: string;
  courseCode: string;
  courseName: string;
  yearLevel: string;
  semester: string;
  requirements: string[];
  department: string;
  dueDate: Date;
  description: string;
}
// ✅ Create new requirement
export const createRequirement = async (req: Request, res: Response) => {
  try {
    const {
      courseCode,
      courseName,
      yearLevel,
      semester,
      requirements,
      department,
      dueDate,
      description,
    }: UserRequirement = req.body;
    // Get user id from authenticated user (set by your auth middleware)
    const userId = (req as any).user?.userId; // adjust if you store it differently

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: No user ID found" });
      return;
    }

    const userRequirement = await prisma.requirement.create({
      data: {
        userId,
        courseCode,
        courseName,
        yearLevel,
        semester,
        requirements,
        department,
        dueDate,
        description,
      },
    });

    res.status(201).json(userRequirement);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllRequirements = async (_: Request, res: Response) => {
  try {
    const requirements = await prisma.requirement.findMany({
      include: { clearingOfficer: true },
    });
    res.json(requirements);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single requirement
export const getRequirementById = async (req: Request, res: Response) => {
  try {
    const requirement = await prisma.requirement.findUnique({
      where: { id: req.params.id },
      include: { studentReq: true },
    });
    if (!requirement) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    res.json(requirement);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update requirement
export const updateRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      res
        .status(400)
        .json({ error: "Requirement ID is required in the URL parameter." });
      return;
    }

    const existing = await prisma.requirement.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Requirement not found." });
      return;
    }

    const updated = await prisma.requirement.update({
      where: { id },
      data: req.body,
    });

    res.status(200).json(updated);
  } catch (err: any) {
    // 400 is for validation errors, 500 for unexpected server errors
    if (err.code === "P2025") {
      // Prisma: Record not found
      res.status(404).json({ error: "Requirement not found." });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// ✅ Delete requirement by ID
export const deleteRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      res
        .status(400)
        .json({ error: "Requirement ID is required in the URL parameter." });
      return;
    }

    // Check if requirement exists before deleting
    const existing = await prisma.requirement.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Requirement not found." });
      return;
    }

    await prisma.requirement.delete({ where: { id } });
    res.status(200).json({ message: "Requirement deleted successfully." });
  } catch (err: any) {
    // Handle Prisma record not found error
    if (err.code === "P2025") {
      res.status(404).json({ error: "Requirement not found." });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};
