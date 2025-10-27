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
exports.deleteCourse = exports.updateCourse = exports.getCourseById = exports.getAllCourses = exports.createCourse = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ✅ Create new course
const createCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { courseCode, courseName, description, units, department, prerequisites, maxCapacity, schedules, semester, yearLevel, } = req.body;
        // Validation
        if (!courseCode ||
            !courseName ||
            !units ||
            !department ||
            !maxCapacity ||
            !semester) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        const existingCourse = yield prisma.courses.findUnique({
            where: { courseCode },
        });
        if (existingCourse) {
            res.status(400).json({ message: "Course code already exists" });
            return;
        }
        const newCourse = yield prisma.courses.create({
            data: {
                courseCode,
                courseName,
                description,
                units: Number(units),
                department,
                prerequisites: prerequisites || [],
                maxCapacity,
                schedules: {
                    set: schedules || [],
                },
                semester,
                yearLevel,
            },
        });
        res.status(201).json({
            message: "Course created successfully",
            data: newCourse,
        });
    }
    catch (error) {
        console.error("Error creating course:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createCourse = createCourse;
// ✅ Get all courses
const getAllCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courses = yield prisma.courses.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json(courses);
    }
    catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getAllCourses = getAllCourses;
// ✅ Get a course by ID
const getCourseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const course = yield prisma.courses.findUnique({
            where: { id },
        });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }
        res.status(200).json(course);
    }
    catch (error) {
        console.error("Error fetching course:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getCourseById = getCourseById;
// ✅ Update course
const updateCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { courseCode, courseName, description, units, department, prerequisites, maxCapacity, schedules, semester, yearLevel, } = req.body;
        const course = yield prisma.courses.findUnique({ where: { id } });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }
        const updatedCourse = yield prisma.courses.update({
            where: { id },
            data: Object.assign(Object.assign({ courseCode,
                courseName,
                description, units: Number(units), department, prerequisites: prerequisites || [], maxCapacity }, (schedules && { schedules: { set: schedules } })), { semester,
                yearLevel }),
        });
        res.status(200).json({
            message: "Course updated successfully",
            data: updatedCourse,
        });
    }
    catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateCourse = updateCourse;
// ✅ Delete course
const deleteCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const course = yield prisma.courses.findUnique({ where: { id } });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }
        yield prisma.courses.delete({ where: { id } });
        res.status(200).json({ message: "Course deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteCourse = deleteCourse;
