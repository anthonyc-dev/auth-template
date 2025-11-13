import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { sendNotification } from "../app";

const prisma = new PrismaClient();

export const createNotification = async (req: Request, res: Response) => {
  const { clearingOfficerId, studentId, title, message } = req.body;

  const notifData = {
    title: title ?? "New Requirement",
    message,
    type: "requirement",
  };

  // Save notification for both users
  await prisma.notification.createMany({
    data: [
      { userId: clearingOfficerId, ...notifData },
      { userId: studentId, ...notifData },
    ],
  });

  // Send in real-time
  await sendNotification(clearingOfficerId, notifData);
  await sendNotification(studentId, notifData);

  res.json({ success: true });
};
