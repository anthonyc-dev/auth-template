# API Routes Documentation

This document lists all available API endpoints in the ASCS (Academic Student Clearance System) server application.

## Base URL

- Development: `http://localhost:3000`
- Production: `[Your production URL]`

## Health Check & Root Routes

### Health Check

- **GET** `http://localhost:3000/health` - Check server health status

### Root

- **GET** `http://localhost:3000/` - Render index page

---

## Authentication Routes (`/auth`)

### Registration & Login

- **POST** `http://localhost:3000/auth/register` - Register a new clearing officer
- **POST** `http://localhost:3000/auth/login` - Login clearing officer

### Profile & Session Management

- **GET** `http://localhost:3000/auth/profile` - Get user profile (requires authentication)
- **POST** `http://localhost:3000/auth/refresh-token` - Refresh authentication token
- **POST** `http://localhost:3000/auth/logout` - Logout user (requires authentication)

---

## Student Routes (`/student`)

### Student Management

- **POST** `http://localhost:3000/student/registerStudent` - Register a new student
- **POST** `http://localhost:3000/student/loginStudent` - Student login
- **GET** `http://localhost:3000/student/getAllStudent` - Get all students
- **GET** `http://localhost:3000/student/getByIdStudent/:id` - Get student by ID
- **PUT** `http://localhost:3000/student/updateStudent/:id` - Update student information
- **DELETE** `http://localhost:3000/student/deleteStudent/:id` - Delete student

---

## Requirements Routes (`/req`)

_All routes require authentication_

### Requirement Management

- **POST** `http://localhost:3000/req/createReq` - Create a new requirement
- **GET** `http://localhost:3000/req/getAllReq` - Get all requirements
- **GET** `http://localhost:3000/req/getByIdReq/:id` - Get requirement by ID
- **PUT** `http://localhost:3000/req/updateReq/:id` - Update requirement
- **DELETE** `http://localhost:3000/req/deleteReq/:id` - Delete requirement

---

## QR Code Routes (`/qr-code`)

### QR Code & Permit Management

- **POST** `http://localhost:3000/qr-code/generate-qr/:userId` - Generate QR code for user
- **POST** `http://localhost:3000/qr-code/view-permit` - View permit details
- **POST** `http://localhost:3000/qr-code/revoke-permit/:permitId` - Revoke a permit

---

## Enrollment Management System Routes

### Student Management (`/student-management`)

- **POST** `http://localhost:3000/student-management/createStudent` - Create student in enrollment system
- **GET** `http://localhost:3000/student-management/getAllStudents` - Get all students in enrollment system
- **GET** `http://localhost:3000/student-management/getStudentById/:id` - Get student by ID
- **PUT** `http://localhost:3000/student-management/updateStudent/:id` - Update student
- **DELETE** `http://localhost:3000/student-management/deleteStudent/:id` - Delete student

### Semester Management (`/semester-management`)

- **POST** `http://localhost:3000/semester-management/createSemester` - Create new semester
- **GET** `http://localhost:3000/semester-management/getAllSemesters` - Get all semesters
- **GET** `http://localhost:3000/semester-management/getSemesterById/:id` - Get semester by ID
- **PUT** `http://localhost:3000/semester-management/updateSemester/:id` - Update semester
- **DELETE** `http://localhost:3000/semester-management/deleteSemester/:id` - Delete semester

### Course Management (`/courses`)

- **POST** `http://localhost:3000/courses/createCourse` - Create new course
- **GET** `http://localhost:3000/courses/getAllCourses` - Get all courses
- **GET** `http://localhost:3000/courses/getCourseById/:id` - Get course by ID
- **PUT** `http://localhost:3000/courses/updateCourse/:id` - Update course
- **DELETE** `http://localhost:3000/courses/deleteCourse/:id` - Delete course

### Section Management (`/sections`)

- **POST** `http://localhost:3000/sections/createSection` - Create new section
- **GET** `http://localhost:3000/sections/getAllSections` - Get all sections
- **GET** `http://localhost:3000/sections/getSectionById/:id` - Get section by ID
- **PUT** `http://localhost:3000/sections/updateSection/:id` - Update section
- **DELETE** `http://localhost:3000/sections/deleteSection/:id` - Delete section

### Enrollment Management (`/enroll`)

- **POST** `http://localhost:3000/enroll/createEnrollment` - Create student enrollment
- **GET** `http://localhost:3000/enroll/getAllEnrollments` - Get all enrollments
- **GET** `http://localhost:3000/enroll/getEnrollmentById/:id` - Get enrollment by ID
- **PUT** `http://localhost:3000/enroll/updateEnrollment/:id` - Update enrollment
- **DELETE** `http://localhost:3000/enroll/deleteEnrollment/:id` - Delete enrollment

### ClearingOfficer Management (`/auth`)

- GET http://localhost:3000/auth/getAllClearingOfficers - get all clearing officers
- GET http://localhost:3000/auth/getAllClearingOfficerbyId/:id - get clearing officer by ID
- PUT http://localhost:3000/auth/updateClearingOfficers/:id - update clearing officer by ID
- DELETE http://localhost:3000/auth/deleteClearingOfficer/:id - delete clearing officer by ID

---

## Authentication & Authorization Notes

### Protected Routes

- All `/req/*` routes require authentication token
- `/auth/profile` requires authentication and role authorization (admin, student, clearingOfficer)
- `/auth/logout` requires authentication token

### Validation Middleware

- Student registration uses `studentValidateRegister` middleware
- Student/Officer login uses `validateLogin` middleware
- Officer registration uses `validateRegister` middleware

### Role-based Access

- Profile access is restricted to users with roles: `admin`, `student`, or `clearingOfficer`

---

## Response Format

All endpoints typically return JSON responses with appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## CORS Configuration

- Supports credentials
- Allowed origins: Environment variable `FRONT_END_URL` and `http://localhost:5173`
