"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
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
const studentRequirement_route_1 = __importDefault(require("./routes/studentRequirement.route"));
const institutional_route_1 = __importDefault(require("./routes/institutional.route"));
const event_route_1 = __importDefault(require("./routes/event.route"));
const setupClearance_route_1 = __importDefault(require("./routes/setupClearance.route"));
const studentReqInstitutional_route_1 = __importDefault(require("./routes/studentReqInstitutional.route"));
const notification_route_1 = __importDefault(require("./routes/notification.route"));
const send_sms_route_1 = __importDefault(require("./routes/send-sms.route"));
const app = (0, express_1.default)();
//ejs
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "../views"));
app.use("/student", student_route_1.default);
//rooutes for ASCS
app.use("/auth", clearingOfficer_route_1.default);
app.use("/qr-code", qrCode_route_1.default);
app.use("/req", requirement_route_1.default);
app.use("/clearance", setupClearance_route_1.default);
app.use("/updateUser", intigration_route_1.default);
app.use("/studentReq", studentRequirement_route_1.default);
//routes for Enrollment Management System
app.use("/enrollment-auth", enrollment_auth_route_1.default);
app.use("/student-management", enrollment_student_management_route_1.default);
app.use("/semester-management", enrollment_semester_route_1.default);
app.use("/courses", enrollment_addCourse_route_1.default);
app.use("/sections", enrollment_section_route_1.default);
app.use("/enroll", enrollment_routes_1.default);
app.use("/event", event_route_1.default);
app.use("/institutionalReq", studentReqInstitutional_route_1.default);
//institutional officer
app.use("/institutional", institutional_route_1.default);
app.use("/notif", notification_route_1.default);
//sms
app.use("/sms", send_sms_route_1.default);
// Middleware
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: "*",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type, Authorization",
}));
// {
//   origin: [
//     process.env.FRONT_END_URL || "",
//     process.env.FRONT_END_URL_2 || "",
//     process.env.FRONT_END_URL_3 || "",
//     process.env.FRONT_END_URL_4 || "",
//     "http://localhost:5173",
//   ],
//   credentials: true,
// }
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// HTTP server wrapper (important for socket.io)
const server = http_1.default.createServer(app);
// SOCKET.IO INITIALIZATION
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // allow any frontend (Flutter/React/Next.js)
    },
});
exports.io = io;
// ON CLIENT CONNECT
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    // custom events if needed
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});
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
exports.default = app;
