import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import path from "path";
import { Server } from "socket.io";
import http from "http";
import clearingOfficer from "./routes/clearingOfficer.route";
import qrCodeRoutes from "./routes/qrCode.route";
import requirementReq from "./routes/requirement.route";
import studentRoutes from "./routes/student.route";
import enrollmentStudentManagementRoute from "./routes/enrollment/enrollment-student-management.route";
import enrollmentSemesterRoute from "./routes/enrollment/enrollment-semester.route";
import enrollmentCourseRoute from "./routes/enrollment/enrollment-addCourse.route";
import enrollmentSectionRoute from "./routes/enrollment/enrollment-section.route";
import enrollmentRoutes from "./routes/enrollment/enrollment.routes";
import enrollmentAuthRoute from "./routes/enrollment/enrollment-auth.route";
import updatePass from "./routes/intigration.route";
import studentRequirement from "./routes/studentRequirement.route";
import institutionalRoute from "./routes/institutional.route";
import eventRoutes from "./routes/event.route";
import setupClearance from "./routes/setupClearance.route";
import studentReqInstitutional from "./routes/studentReqInstitutional.route";
import createNotif from "./routes/notification.route";
import sendSMSRoutes from "./routes/send-sms.route";

const app: Application = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      process.env.FRONT_END_URL || "",
      process.env.FRONT_END_URL_2 || "",
      process.env.FRONT_END_URL_3 || "",
      process.env.FRONT_END_URL_4 || "",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// HTTP server wrapper (important for socket.io)
const server = http.createServer(app);

// SOCKET.IO INITIALIZATION
const io = new Server(server, {
  cors: {
    origin: "*", // allow any frontend (Flutter/React/Next.js)
  },
});

// ON CLIENT CONNECT
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // custom events if needed
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

export { io };

// Health check endpoint
app.get("/health", (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/", (_req: Request, res: Response): void => {
  res.render("index");
});

//rooutes for ASCS
app.use("/auth", clearingOfficer);
app.use("/qr-code", qrCodeRoutes);
app.use("/req", requirementReq);
app.use("/student", studentRoutes);
app.use("/clearance", setupClearance);

app.use("/updateUser", updatePass);
app.use("/studentReq", studentRequirement);

//routes for Enrollment Management System
app.use("/enrollment-auth", enrollmentAuthRoute);
app.use("/student-management", enrollmentStudentManagementRoute);
app.use("/semester-management", enrollmentSemesterRoute);
app.use("/courses", enrollmentCourseRoute);
app.use("/sections", enrollmentSectionRoute);
app.use("/enroll", enrollmentRoutes);

app.use("/event", eventRoutes);
app.use("/institutionalReq", studentReqInstitutional);

//institutional officer
app.use("/institutional", institutionalRoute);
app.use("/notif", createNotif);

//sms
app.use("/sms", sendSMSRoutes);

export default app;
