# CAMPUS AI
### Intelligent Digital Campus Ecosystem
*AI-powered academic, administrative and campus intelligence*

---

## 1. Executive Overview

**CAMPUS AI** is a production-ready, database-driven college enterprise resource planning (ERP) and artificial intelligence ecosystem. It integrates core academic governance, finance, and residential housing management with advanced explainable AI forecasting, conversational teaching assistants, dynamic adaptive quiz engines, and automated campus maintenance auto-routing.

Every button, workflow, modal, form submission, upload, report, notification, and dashboard interacts with a real relational database via Sequelize ORM.

---

## 2. Default Access Credentials

The platform initializes with seeded institutional profiles:

| Portal | Email | Password | Role | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Portal** | `admin@campusai.edu` | `admin123` | `admin` | Full ERP oversight, admissions, fee auditing, early warning triage, approvals, institutional AI reports |
| **Faculty Portal** | `faculty@campusai.edu` | `faculty123` | `teacher` | Timetables, attendance submission, grading, Bloom's question paper generator, AI teaching assistant |
| **Student Portal** | `student@campusai.edu` | `student123` | `student` | Academic results, 75% attendance simulator, 7-day AI learning paths, AI quizzes, growth profile, career navigator, helpdesk |

---

## 3. Technology Architecture

* **Backend Runtime**: Node.js & Express.js
* **View Engine & UI**: EJS (Embedded JavaScript) with custom modern academic styling (Inter & JetBrains Mono typography, CSS3 variables, glassmorphic accents)
* **Database & ORM**: Sequelize ORM (configured out-of-the-box with SQLite, with instant dialect switching for MySQL & PostgreSQL)
* **Authentication**: Session-based & JWT cookie authentication, bcrypt salt hashing, and role-based middleware (`student`, `teacher`/`faculty`, `admin`)
* **AI Engine**: Google Gemini API client with fallback to deterministic algorithmic & heuristic rules for 100% uptime
* **Document & Data Processing**:
  * **PDFKit**: Fee payment receipts formatted in INR (₹) and institutional AI reports
  * **SheetJS (XLSX)**: Student portfolio exports and bulk CSV/Excel ingestion
  * **Multer**: Media and document file upload processing with size and mime-type validation
  * **Node-Cron**: Automated daily fee scans and attendance shortage alert dispatchers

---

## 4. Key Platform Modules

### A. Core Academic ERP
1. **Admissions Module** (`/admissions`): Application workflow, document uploads, approve/reject triggers with automatic student ID allocation.
2. **Student Directory** (`/admissions/students`): Comprehensive student directory with search, filter, and CRUD management.
3. **Examination & Marks** (`/exams`): Multi-subject grades, SGPA calculation, credit progression, and semester score sheets.
4. **Fee Management** (`/fees`): Payment recording in ₹ INR, fee status filters, overdue tracking, and PDF receipts.
5. **Hostel Allocation** (`/hostel`): Block, room, and bed occupancy allocation, checkout/vacate actions, and residential statistics.
6. **Faculty Classrooms & Timetable** (`/faculty/timetable`): Weekly timetable, student roll calls, and internal marks entry.
7. **Assignments & Grading** (`/faculty/assignments`): Assignment creation, student file submissions, maximum scores, and faculty feedback.

### B. Campus Artificial Intelligence Suite
1. **CampusAI Assistant** (`/ai/assistant`): 24/7 conversational campus assistant with global floating widget on every page.
2. **Academic Performance Prediction** (`/ai/performance-prediction`): Explainable AI calculating next semester SGPA and subject risk factors.
3. **Early Warning System** (`/ai/early-warning`): Institutional student dropout and risk detection triage matrix.
4. **7-Day AI Learning Path** (`/ai/learning-path`): Dynamic day-by-day remediation schedules for student-selected weak topics.
5. **Adaptive AI Quiz Generator** (`/ai/quiz`): Instant multiple-choice tests with diagnostic evaluation, weak topic discovery, and XP awards.
6. **Attendance Intelligence** (`/ai/attendance-intelligence`): Regulatory 75% target calculator with interactive bunk margin simulator.
7. **360° Digital Growth Profile** (`/ai/profile`): Multi-dimension cognitive index (Academic Consistency, Quiz Mastery, Attendance Discipline, Career Readiness).
8. **Career & Skill Navigator** (`/ai/career`): Role compatibility engine matching student grades with high-demand tech trajectories.
9. **Gamification & Hall of Fame** (`/ai/gamification`): XP points, academic levels, streaks, unlocked micro-badges, and top-10 leaderboard.
10. **Campus Directory & Smart Facilities** (`/ai/campus-info`): Searchable catalog of laboratories, auditoriums, classrooms, and facility in-charges.
11. **Institutional AI Analytics** (`/ai/admin-analytics`): Multi-semester trend graphs, attendance heatmaps, and department SLA compliance.
12. **AI Institutional Report Generator** (`/ai/reports`): Executive AI synthesis reports with instant PDF export.
13. **CampusAI Operations & Intelligence Hub** (`/ai/operations-hub` or `/ai/hackathon-demo`): Centralized command center presenting all 14 AI modules and system architecture.

### C. Campus Problem Helpdesk & Auto-Routing
1. **Report Issue** (`/problems/new`): Geo-tagged issue submission with photo/video attachments.
2. **AI Auto-Classify** (`POST /problems/ai-classify`): NLP classifier determining category, priority level, and responsible department.
3. **Ticket Detail & State Transitions** (`/problems/:id`): Full audit history, public comments, technician dispatch, proof upload, reporter verification, and escalation.
4. **Helpdesk Analytics** (`/problems/analytics`): Spatial hotspot clustering, domain breakdowns, and mean resolution SLA timers.
5. **Department SLA Management** (`/problems/departments`): Department configuration, SLA response quotas, and technician assignment.

---

## 5. Verification & Testing

Automated test suites validate end-to-end functionality across all 42+ routes, authentication states, and deep features:

```bash
# Run comprehensive route and RBAC verification
node test_system.js

# Run deep feature tests (Excel export, PDF receipts, AI quizzes, Question papers, AI report PDFs)
node test_deep_features.js
```

---

## 6. Starting the Server

```bash
# Install dependencies (if not already installed)
npm install

# Start production server
npm start
# or
node backend/server.js
```

The application runs at **`http://localhost:3000`**.
