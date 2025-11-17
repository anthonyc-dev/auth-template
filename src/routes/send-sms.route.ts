import { Router } from "express";
import { sendSMS } from "../controllers/send-sms.controller";

const router = Router();

router.post("/send-sms", sendSMS);

export default router;
