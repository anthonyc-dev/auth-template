import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ObjectId } from "bson";

const prisma = new PrismaClient();

function parseEventDate(input: any): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

// ✅ Create Event
export async function createEvent(req: Request, res: Response) {
  try {
    const { title, description, location, eventDate } = req.body;

    if (!title) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const parsedDate = parseEventDate(eventDate);
    if (!parsedDate) {
      res.status(400).json({ error: "eventDate must be valid" });
      return;
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        location,
        eventDate: parsedDate,
      },
    });

    res.status(201).json(event);
  } catch (err) {
    console.error("createEvent error:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
}

// ✅ Get Event by ID
export async function getEvent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid event ID" });
      return;
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    res.json(event);
  } catch (err) {
    console.error("getEvent error:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
}

// ✅ Update Event
export async function updateEvent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid event ID" });
      return;
    }

    const { title, description, location, eventDate } = req.body;
    const parsedDate = eventDate ? parseEventDate(eventDate) : undefined;

    // Build update data, only include eventDate if it's valid
    const updateData: any = { title, description, location };
    if (eventDate !== undefined) {
      if (!parsedDate) {
        res.status(400).json({ error: "eventDate must be valid" });
        return;
      }
      updateData.eventDate = parsedDate;
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    res.json(event);
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    console.error("updateEvent error:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
}

// ✅ Delete Event
export async function deleteEvent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid event ID" });
      return;
    }

    await prisma.event.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    console.error("deleteEvent error:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
}

// ✅ List Events
export async function listEvents(req: Request, res: Response) {
  try {
    const { from, to, search } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
        { location: { contains: String(search), mode: "insensitive" } },
      ];
    }

    if (from || to) {
      where.eventDate = {};
      if (from) {
        const d = parseEventDate(from);
        if (!d) {
          res.status(400).json({ error: "Invalid 'from' date" });
          return;
        }
        where.eventDate.gte = d;
      }
      if (to) {
        const d = parseEventDate(to);
        if (!d) {
          res.status(400).json({ error: "Invalid 'to' date" });
          return;
        }

        where.eventDate.lte = d;
      }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { eventDate: "desc" },
    });

    res.json(events);
  } catch (err) {
    console.error("listEvents error:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
}
