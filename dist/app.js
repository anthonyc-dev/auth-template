"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const clearingOfficer_route_1 = __importDefault(require("./routes/clearingOfficer.route"));
const qrCode_route_1 = __importDefault(require("./routes/qrCode.route"));
const requirement_route_1 = __importDefault(require("./routes/requirement.route"));
const student_route_1 = __importDefault(require("./routes/student.route"));
const enrollment_student_management_route_1 = __importDefault(require("./routes/enrollment/enrollment-student-management.route"));
const enrollment_semester_route_1 = __importDefault(require("./routes/enrollment/enrollment-semester.route"));
const enrollment_addCourse_route_1 = __importDefault(require("./routes/enrollment/enrollment-addCourse.route"));
const enrollment_section_route_1 = __importDefault(require("./routes/enrollment/enrollment-section.route"));
const enrollment_routes_1 = __importDefault(require("./routes/enrollment/enrollment.routes"));
const enrollment_auth_route_1 = __importDefault(require("./routes/enrollment/enrollment-auth.route"));
const intigration_route_1 = __importDefault(require("./routes/intigration.route"));
const app = (0, express_1.default)();
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "../views"));
// Middleware
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: [
        process.env.FRONT_END_URL || "",
        process.env.FRONT_END_URL_2 || "",
        process.env.FRONT_END_URL_3 || "",
        process.env.FRONT_END_URL_4 || "",
        "http://localhost:5173",
    ],
    credentials: true,
}));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
    });
});
app.get("/", (_req, res) => {
    res.render("index");
});
//rooutes for ASCS
app.use("/auth", clearingOfficer_route_1.default);
app.use("/qr-code", qrCode_route_1.default);
app.use("/req", requirement_route_1.default);
app.use("/student", student_route_1.default);
app.use("/updateUser", intigration_route_1.default);
//routes for Enrollment Management System
app.use("/enrollment-auth", enrollment_auth_route_1.default);
app.use("/student-management", enrollment_student_management_route_1.default);
app.use("/semester-management", enrollment_semester_route_1.default);
app.use("/courses", enrollment_addCourse_route_1.default);
app.use("/sections", enrollment_section_route_1.default);
app.use("/enroll", enrollment_routes_1.default);
exports.default = app;
