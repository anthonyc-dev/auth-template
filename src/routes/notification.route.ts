import { Router } from "express";
import { createNotification } from "../controllers/notification.controller";

const router = Router();

// notification route
router.post("/notification", createNotification);

export default router;
