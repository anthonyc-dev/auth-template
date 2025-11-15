import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import cron from "node-cron";
import axiosInstance from "../config/axios";

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
// export const createRequirement = async (req: Request, res: Response) => {
//   try {
//     const {
//       courseCode,
//       courseName,
//       yearLevel,
//       semester,
//       requirements,
//       department,
//       dueDate,
//       description,
//     }: UserRequirement = req.body;
//     // Get user id from authenticated user (set by your auth middleware)
//     const userId = (req as any).user?.userId; // adjust if you store it differently

//     if (!userId) {
//       res.status(401).json({ error: "Unauthorized: No user ID found" });
//       return;
//     }

//     const userRequirement = await prisma.requirement.create({
//       data: {
//         userId,
//         courseCode,
//         courseName,
//         yearLevel,
//         semester,
//         requirements,
//         department,
//         dueDate,
//         description,
//       },
//     });

//     res.status(201).json(userRequirement);
//   } catch (err: any) {
//     res.status(400).json({ error: err.message });
//   }
// };

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

interface EnrollmentData {
  schoolId: string;
  courseCode: string;
  prerequisites: string[];
  // Add other fields as needed
}

export const createRequirement = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // 1. Validate user authentication
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        error: "Unauthorized: No user ID found",
        message: "Please login to continue",
      });
      return;
    }

    // Get user's role along with userId
    const userRole = req.user?.role;
    if (!userRole) {
      res.status(401).json({
        error: "Unauthorized: No user Role found",
        message: "Please login to continue",
      });
      return;
    }

    // 2. Validate request body
    const {
      courseCode,
      courseName,
      yearLevel,
      semester,
      requirements,
      department,
      description,
    }: UserRequirement = req.body;

    // Basic validation
    if (
      !courseCode ||
      !courseName ||
      !yearLevel ||
      !semester ||
      !requirements ||
      !department
    ) {
      res.status(400).json({
        error: "Missing required fields",
        required: [
          "courseCode",
          "courseName",
          "yearLevel",
          "semester",
          "requirements",
          "department",
        ],
      });
      return;
    }

    if (!Array.isArray(requirements) || requirements.length === 0) {
      res.status(400).json({
        error: "Requirements must be a non-empty array",
      });
      return;
    }

    // 3. Transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create requirement
      const requirement = await tx.requirement.create({
        data: {
          userId,
          courseCode,
          courseName,
          yearLevel,
          semester,
          requirements,
          department,
          description,
        },
      });

      // Fetch assigned students
      let enrollments: EnrollmentData[] = [];

      try {
        const response = await axiosInstance.get<EnrollmentData[]>(
          "/enroll/getAllEnrollments"
        );
        enrollments = response.data;
      } catch (apiError) {
        console.error("⚠️ Failed to fetch enrollments:", apiError);
        return {
          requirement,
          assignedCount: 0,
          warning:
            "Requirement created, but failed to fetch student enrollments from external API",
        };
      }

      // 🔧 FIX: Handle courseCode arrays in enrollment data
      const assignedStudents = enrollments.filter((student) => {
        const { prerequisites } = student;

        if (Array.isArray(prerequisites)) {
          return prerequisites.includes(courseCode);
        }

        return prerequisites === courseCode;
      });

      if (assignedStudents.length === 0) {
        return {
          requirement,
          assignedCount: 0,
          message:
            "Requirement created, but no students enrolled in this course.",
        };
      }

      // Create studentRequirement entries
      const studentRequirements = await tx.studentRequirement.createMany({
        data: assignedStudents.map((student) => ({
          studentId: student.schoolId,
          coId: userId,
          requirementId: requirement.id,
          status: "incomplete",
          signedBy: userRole,
        })),
      });

      return {
        requirement,
        assignedCount: studentRequirements.count,
        message: `Requirement created and assigned to ${studentRequirements.count} students.`,
      };
    });

    // 4. Send success response
    res.status(201).json(result);
  } catch (error) {
    console.error("❌ Error creating requirement:", error);

    if (error instanceof Error) {
      if (error.message.includes("P2002")) {
        res.status(409).json({
          error: "Duplicate entry",
          message: "A requirement with these details already exists",
        });
        return;
      }

      if (error.message.includes("P2003")) {
        res.status(400).json({
          error: "Foreign key constraint failed",
          message: "Invalid reference to related data",
        });
        return;
      }

      res.status(500).json({
        error: "Internal server error",
        message: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
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
      // include: { studentReq: true },
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

/**
 * Delete all requirements associated with a given courseCode.
 * Useful for batch removal of requirements for a specific course.
 *
 * Route: DELETE /deleteReqByCourse/:courseCode
 *
 * Security: Should be protected by appropriate authentication and authorization middleware in routes.
 */
export const deleteRequirementsByCourseCode = async (
  req: Request,
  res: Response
) => {
  try {
    const { courseCode } = req.params;

    // Validation: Ensure courseCode is provided
    if (!courseCode) {
      res
        .status(400)
        .json({ error: "courseCode is required in the URL parameter." });
      return;
    }

    // Check how many requirements exist for the provided courseCode
    const requirements = await prisma.requirement.findMany({
      where: { courseCode },
    });

    if (requirements.length === 0) {
      res.status(404).json({
        error: `No requirements found for courseCode '${courseCode}'.`,
      });
      return;
    }

    // Delete all associated requirements
    const deleted = await prisma.requirement.deleteMany({
      where: { courseCode },
    });

    res.status(200).json({
      message: `Deleted ${deleted.count} requirement(s) for courseCode '${courseCode}'.`,
      deletedCount: deleted.count,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update all incomplete studentRequirement statuses to 'missing' if the
 * deadline (or extendedDeadline if present) of any SetUpClearance has passed.
 *
 * This function will:
 *   1. Fetch all SetUpClearance records.
 *   2. For each record, use extendedDeadline if present; otherwise, use deadline.
 *   3. If the effective deadline is in the past, update all related studentRequirements with status 'incomplete' to 'missing'.
 *
 * To be run as a background job or by an admin trigger.
 */
export const updateStatusByDueDate = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // 1️⃣ Get all SetUpClearance records with an effective (extendedDeadline || deadline) in the past
    const expiredClearancePeriods = await prisma.setUpClearance.findMany({
      where: {
        OR: [
          {
            extendedDeadline: { not: null, lt: now },
          },
          {
            extendedDeadline: null,
            deadline: { not: null, lt: now },
          },
        ],
      },
      select: {
        id: true,
        extendedDeadline: true,
        deadline: true,
        // Add other identifiers if you plan to filter requirements/studentRequirements by specific clearance period
      },
    });

    if (expiredClearancePeriods.length === 0) {
      return res.json({ message: "No expired SetUpClearance periods found." });
    }

    // ⚠️ If you link requirements or studentRequirements to SetUpClearance periods by foreign key,
    // you should filter by that foreign key. If not, this will update ALL incomplete studentRequirements.
    // If you want to update ALL incomplete studentRequirements when any SetUpClearance is expired, use the logic below:

    // 2️⃣ Update all studentRequirements with status = "incomplete" to "missing"
    const result = await prisma.studentRequirement.updateMany({
      where: {
        status: "incomplete",
        // Add filter if you want to target only those under these expired clearance periods
      },
      data: {
        status: "missing",
      },
    });

    res.json({
      message: "Statuses updated for expired SetUpClearance periods.",
      updatedCount: result.count,
      expiredSetUpClearanceCount: expiredClearancePeriods.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        "Failed to update student requirement statuses for expired SetUpClearance periods.",
    });
  }
};

//set schedule
cron.schedule("0 0 * * *", async () => {
  console.log("Running automatic status update...");
  await updateStatusByDueDate({} as any, { json: () => {} } as any);
});
