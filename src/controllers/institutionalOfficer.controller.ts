import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ CREATE Requirement
export const createRequirement = async (req: Request, res: Response) => {
  try {
    const {
      institutionalName,
      requirements,
      department,
      description,
      semester,
      deadline,
    } = req.body;

    if (
      !institutionalName ||
      !Array.isArray(requirements) ||
      requirements.length === 0 ||
      !department ||
      !semester ||
      !deadline
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const requirement = await prisma.institutionalRequirement.create({
      data: {
        institutionalName,
        requirements,
        department,
        description,
        semester,
        deadline: new Date(deadline),
      },
    });

    res.status(201).json(requirement);
  } catch (error) {
    console.error("Error creating requirement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ GET All Requirements
export const getAllRequirements = async (_req: Request, res: Response) => {
  try {
    const requirements = await prisma.institutionalRequirement.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(requirements);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ GET Single Requirement by ID
export const getRequirementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requirement = await prisma.institutionalRequirement.findUnique({
      where: { id },
    });

    if (!requirement) {
      res.status(404).json({ message: "Requirement not found" });
      return;
    }

    res.json(requirement);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ UPDATE Requirement
export const updateRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      institutionalName,
      requirements,
      department,
      description,
      semester,
      deadline,
    } = req.body;

    const updated = await prisma.institutionalRequirement.update({
      where: { id },
      data: {
        institutionalName,
        requirements,
        department,
        description,
        semester,
        deadline: deadline ? new Date(deadline) : undefined,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating requirement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ DELETE Requirement
export const deleteRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.institutionalRequirement.delete({ where: { id } });

    res.json({ message: "Requirement deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
