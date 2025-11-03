import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  updateEvent,
} from "../controllers/event.controller";

const router = Router();

router.post("/createEvent", createEvent);
router.get("/listEvent", listEvents);
router.get("/getEventById/:id", getEvent);
router.put("/updateEvent/:id", updateEvent);
router.delete("/deleteEvent/:id", deleteEvent);

export default router;
