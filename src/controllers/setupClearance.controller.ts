import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a new clearance setup
export const setupClearance = async (req: Request, res: Response) => {
  try {
    const { semesterType, academicYear, deadline } = req.body;

    if (!semesterType || !academicYear || !deadline) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const clearance = await prisma.setUpClearance.create({
      data: {
        semesterType,
        academicYear,
        deadline: new Date(deadline),
        isActive: false,
      },
    });

    res.status(201).json({
      message: "Clearance setup completed successfully",
      clearance,
    });
  } catch (error: any) {
    console.error("Setup Clearance Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get current (latest) clearance
export const getCurrentClearance = async (req: Request, res: Response) => {
  try {
    const clearance = await prisma.setUpClearance.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!clearance) {
      res.status(404).json({ message: "No clearance found" });
      return;
    }

    res.status(200).json(clearance);
  } catch (error: any) {
    console.error("Fetch Clearance Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Start clearance
export const startClearance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const clearance = await prisma.setUpClearance.update({
      where: { id },
      data: {
        isActive: true,
        startDate: new Date(),
      },
    });

    res.status(200).json({
      message: "Clearance started successfully",
      clearance,
    });
  } catch (error: any) {
    console.error("Start Clearance Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Stop clearance
export const stopClearance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const clearance = await prisma.setUpClearance.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({
      message: "Clearance stopped successfully",
      clearance,
    });
  } catch (error: any) {
    console.error("Stop Clearance Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Extend clearance deadline
export const extendDeadline = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newDeadline } = req.body;

    if (!newDeadline) {
      res.status(400).json({ message: "New deadline required" });
      return;
    }

    const clearance = await prisma.setUpClearance.update({
      where: { id },
      data: {
        extendedDeadline: new Date(newDeadline),
      },
    });

    res.status(200).json({
      message: `Deadline extended to ${new Date(
        newDeadline
      ).toLocaleDateString()}`,
      clearance,
    });
  } catch (error: any) {
    console.error("Extend Deadline Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all clearances (admin list)
export const getAllClearances = async (req: Request, res: Response) => {
  try {
    const clearances = await prisma.setUpClearance.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(clearances);
  } catch (error: any) {
    console.error("Get All Clearances Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a clearance record (optional admin action)
export const deleteClearance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.setUpClearance.delete({ where: { id } });

    res.status(200).json({ message: "Clearance deleted successfully" });
  } catch (error: any) {
    console.error("Delete Clearance Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update a clearance record (admin action)
export const updateClearance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Reject if no ID is provided
    if (!id) {
      res.status(400).json({ message: "Clearance ID is required." });
      return;
    }

    // Check if clearance exists
    const existing = await prisma.setUpClearance.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Clearance not found." });
      return;
    }

    // (Optional) Sanitize fields to prevent unwanted field updates
    // Only allow fields you want to be updated
    const allowedFields = [
      "semester",
      "academicYear",
      "startDate",
      "endDate",
      "extendedDeadline",
      "status",
      "description",
      // add more keys as needed
    ];
    const sanitizedData: { [key: string]: any } = {};
    for (const key of allowedFields) {
      if (updateData.hasOwnProperty(key)) {
        sanitizedData[key] = updateData[key];
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      res.status(400).json({ message: "No valid fields provided for update." });
      return;
    }

    const updatedClearance = await prisma.setUpClearance.update({
      where: { id },
      data: sanitizedData,
    });

    res.status(200).json({
      message: "Clearance updated successfully.",
      clearance: updatedClearance,
    });
  } catch (error: any) {
    console.error("Update Clearance Error:", error);
    if (error.code === "P2025") {
      res.status(404).json({ message: "Clearance not found." });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};
