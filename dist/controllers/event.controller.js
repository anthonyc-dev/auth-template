"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEvent = createEvent;
exports.getEvent = getEvent;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
exports.listEvents = listEvents;
const client_1 = require("@prisma/client");
const bson_1 = require("bson");
const prisma = new client_1.PrismaClient();
function parseEventDate(input) {
    if (!input)
        return null;
    const d = input instanceof Date ? input : new Date(input);
    return isNaN(d.getTime()) ? null : d;
}
// ✅ Create Event
function createEvent(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const event = yield prisma.event.create({
                data: {
                    title,
                    description,
                    location,
                    eventDate: parsedDate,
                },
            });
            res.status(201).json(event);
        }
        catch (err) {
            console.error("createEvent error:", err);
            res.status(500).json({ error: "Internal server error" });
            return;
        }
    });
}
// ✅ Get Event by ID
function getEvent(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            if (!bson_1.ObjectId.isValid(id)) {
                res.status(400).json({ error: "Invalid event ID" });
                return;
            }
            const event = yield prisma.event.findUnique({ where: { id } });
            if (!event) {
                res.status(404).json({ error: "Event not found" });
                return;
            }
            res.json(event);
        }
        catch (err) {
            console.error("getEvent error:", err);
            res.status(500).json({ error: "Internal server error" });
            return;
        }
    });
}
// ✅ Update Event
function updateEvent(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            if (!bson_1.ObjectId.isValid(id)) {
                res.status(400).json({ error: "Invalid event ID" });
                return;
            }
            const { title, description, location, eventDate } = req.body;
            const parsedDate = eventDate ? parseEventDate(eventDate) : undefined;
            // Build update data, only include eventDate if it's valid
            const updateData = { title, description, location };
            if (eventDate !== undefined) {
                if (!parsedDate) {
                    res.status(400).json({ error: "eventDate must be valid" });
                    return;
                }
                updateData.eventDate = parsedDate;
            }
            const event = yield prisma.event.update({
                where: { id },
                data: updateData,
            });
            res.json(event);
        }
        catch (err) {
            if (err.code === "P2025") {
                res.status(404).json({ error: "Event not found" });
                return;
            }
            console.error("updateEvent error:", err);
            res.status(500).json({ error: "Internal server error" });
            return;
        }
    });
}
// ✅ Delete Event
function deleteEvent(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            if (!bson_1.ObjectId.isValid(id)) {
                res.status(400).json({ error: "Invalid event ID" });
                return;
            }
            yield prisma.event.delete({ where: { id } });
            res.status(204).send();
        }
        catch (err) {
            if (err.code === "P2025") {
                res.status(404).json({ error: "Event not found" });
                return;
            }
            console.error("deleteEvent error:", err);
            res.status(500).json({ error: "Internal server error" });
            return;
        }
    });
}
// ✅ List Events
function listEvents(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { from, to, search } = req.query;
            const where = {};
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
            const events = yield prisma.event.findMany({
                where,
                orderBy: { eventDate: "desc" },
            });
            res.json(events);
        }
        catch (err) {
            console.error("listEvents error:", err);
            res.status(500).json({ error: "Internal server error" });
            return;
        }
    });
}
