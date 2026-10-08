const {
  Student,
  Exam,
  Attendance,
  Fee,
  Hostel,
  Assignment,
  StudentAssignment,
  SmartNotification,
  StudentGamification,
  Subject,
  Announcement
} = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');
const bulkService = require('../services/bulkService');

// Helper to resolve student record for current user
async function resolveCurrentStudent(req) {
  if (!req.user) return null;
  let student = await Student.findOne({ where: { userId: req.user.id } });
  if (!student) {
    student = await Student.findOne({ where: { email: req.user.email } });
  }
  if (!student) {
    // Fallback to first student if demo/admin preview
    student = await Student.findOne();
  }
  return student;
}

exports.getDashboard = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    if (!student) {
      return res.redirect('/auth/login?error=Student+profile+not+found');
    }

    // 1. Attendance Summary (75% rule)
    const totalAtt = await Attendance.count({ where: { studentId: student.id } });
    const presentAtt = await Attendance.count({
      where: { studentId: student.id, status: { [Op.in]: ['Present', 'Late'] } }
    });
    const attendancePercentage = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 85;

    // 2. Academic Performance & Exams
    const exams = await Exam.findAll({
      where: { studentId: student.id },
      order: [['examDate', 'DESC']]
    });
    const avgMarks = exams.length > 0
      ? Math.round(exams.reduce((acc, c) => acc + (c.percentage || 0), 0) / exams.length)
      : 80;

    // 3. Pending Fees
    const fees = await Fee.findAll({
      where: { studentId: student.id },
      order: [['dueDate', 'ASC']]
    });
    const pendingFees = fees.filter(f => f.status === 'Unpaid' || f.status === 'Overdue' || f.status === 'Partial');

    // 4. Assignments
    const allAssignments = await Assignment.findAll({ order: [['dueDate', 'ASC']], limit: 5 });
    const submissions = await StudentAssignment.findAll({ where: { studentId: student.id } });
    const submittedIds = submissions.map(s => s.assignmentId);

    // 5. Hostel
    const hostel = await Hostel.findOne({ where: { studentId: student.id } });

    // 6. Gamification & Growth Score
    let gamification = await StudentGamification.findOne({ where: { studentId: student.id } });
    if (!gamification) {
      gamification = {
        totalXp: 450,
        level: 3,
        streakDays: 5,
        growthScore: 86,
        academicConsistency: 88,
        quizMastery: 82,
        attendanceDiscipline: attendancePercentage,
        careerReadiness: 79
      };
    }

    // 7. Notifications
    const notifications = await SmartNotification.findAll({
      where: { studentId: student.id },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // 8. AI Personalized Prediction & Insight
    const aiPrediction = await aiService.predictPerformance({
      attendanceRate: attendancePercentage,
      avgMarks,
      assignmentRate: 85,
      quizMastery: gamification.quizMastery || 80
    });

    // 9. Announcements
    const announcements = await Announcement.findAll({
      where: { targetAudience: { [Op.in]: ['All', 'Students'] } },
      order: [['createdAt', 'DESC']],
      limit: 3
    });

    res.render('student/dashboard', {
      pageTitle: 'Student Portal Dashboard — CAMPUS AI',
      student,
      attendancePercentage,
      totalAtt,
      presentAtt,
      exams,
      avgMarks,
      fees,
      pendingFees,
      allAssignments,
      submittedIds,
      hostel,
      gamification,
      notifications,
      aiPrediction,
      announcements,
      user: req.user
    });
  } catch (err) {
    console.error('[Student Dashboard Error]:', err);
    res.status(500).render('errors/500', { pageTitle: 'Error', message: 'Failed to load student dashboard.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    const hostel = await Hostel.findOne({ where: { studentId: student.id } });
    const gamification = await StudentGamification.findOne({ where: { studentId: student.id } });

    res.render('student/profile', {
      pageTitle: 'My Profile — CAMPUS AI',
      student,
      hostel,
      gamification,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/student/dashboard');
  }
};

exports.exportProfile = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    const exams = await Exam.findAll({ where: { studentId: student.id } });
    const fees = await Fee.findAll({ where: { studentId: student.id } });

    const exportData = [
      { Category: 'Profile', Field: 'Student ID', Value: student.studentId },
      { Category: 'Profile', Field: 'Full Name', Value: student.name },
      { Category: 'Profile', Field: 'Email', Value: student.email },
      { Category: 'Profile', Field: 'Course', Value: student.course },
      { Category: 'Profile', Field: 'Semester', Value: student.semester },
      ...exams.map(e => ({
        Category: 'Exams',
        Field: e.subjectName,
        Value: `${e.marksObtained}/${e.maxMarks} (${e.grade})`
      })),
      ...fees.map(f => ({
        Category: 'Fees',
        Field: f.title,
        Value: `₹ ${f.amount} - ${f.status}`
      }))
    ];

    const buffer = bulkService.exportToExcelBuffer(exportData, 'Student_Portfolio');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=CAMPUS_AI_${student.studentId}_Portfolio.xlsx`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.redirect('/student/profile?error=Export+failed');
  }
};

exports.getResults = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    const selectedSemesterQuery = req.query.semester || 'all';

    const exams = await Exam.findAll({
      where: { studentId: student.id },
      order: [['semester', 'DESC'], ['examDate', 'DESC']]
    });

    // Group exams by semester and calculate SGPA & CGPA
    const gradePointsMap = { 'O': 10, 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'P': 5, 'F': 0 };
    const examsBySemester = {};
    let totalCredits = 0;
    let totalWeightedPoints = 0;

    exams.forEach(ex => {
      const sem = ex.semester || 1;
      if (!examsBySemester[sem]) {
        examsBySemester[sem] = {
          semester: sem,
          exams: [],
          totalCredits: 0,
          totalPoints: 0,
          sgpa: 0,
          passed: true
        };
      }
      examsBySemester[sem].exams.push(ex);
      const credits = ex.credits || 4;
      const pts = gradePointsMap[ex.grade] !== undefined ? gradePointsMap[ex.grade] : 8;
      examsBySemester[sem].totalCredits += credits;
      examsBySemester[sem].totalPoints += (pts * credits);
      if (ex.grade === 'F' || ex.percentage < 40) {
        examsBySemester[sem].passed = false;
      }

      totalCredits += credits;
      totalWeightedPoints += (pts * credits);
    });

    // Compute SGPA for each semester
    const availableSemesters = Object.keys(examsBySemester)
      .map(Number)
      .sort((a, b) => b - a);

    availableSemesters.forEach(sem => {
      const group = examsBySemester[sem];
      group.sgpa = group.totalCredits > 0
        ? (group.totalPoints / group.totalCredits).toFixed(2)
        : '0.00';
    });

    const cgpa = totalCredits > 0
      ? (totalWeightedPoints / totalCredits).toFixed(2)
      : '0.00';

    res.render('student/results', {
      pageTitle: 'Academic Results & Transcripts — CAMPUS AI',
      student,
      exams,
      examsBySemester,
      availableSemesters,
      selectedSemester: selectedSemesterQuery,
      totalCredits,
      cgpa,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/student/dashboard');
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    const attendanceRecords = await Attendance.findAll({
      where: { studentId: student.id },
      order: [['date', 'DESC']]
    });

    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 85;

    res.render('student/attendance', {
      pageTitle: 'Attendance Tracking — CAMPUS AI',
      student,
      attendanceRecords,
      total,
      present,
      percentage,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/student/dashboard');
  }
};

exports.getFees = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    const fees = await Fee.findAll({
      where: { studentId: student.id },
      order: [['dueDate', 'ASC']]
    });

    res.render('student/fees', {
      pageTitle: 'My Fee Invoices & Receipts — CAMPUS AI',
      student,
      fees,
      user: req.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/student/dashboard');
  }
};

exports.getHostel = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    const hostel = await Hostel.findOne({ where: { studentId: student.id } });

    res.render('student/hostel', {
      pageTitle: 'Hostel Accommodation Details — CAMPUS AI',
      student,
      hostel,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/student/dashboard');
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    const assignments = await Assignment.findAll({ order: [['dueDate', 'ASC']] });
    const submissions = await StudentAssignment.findAll({
      where: { studentId: student.id },
      include: [{ model: Assignment, as: 'assignment' }]
    });

    const submittedMap = {};
    submissions.forEach(s => {
      submittedMap[s.assignmentId] = s;
    });

    res.render('student/assignments', {
      pageTitle: 'Assignments & Submissions — CAMPUS AI',
      student,
      assignments,
      submittedMap,
      user: req.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/student/dashboard');
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionText } = req.body;
    const student = await resolveCurrentStudent(req);
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    let submission = await StudentAssignment.findOne({
      where: { assignmentId: id, studentId: student.id }
    });

    if (submission) {
      submission.submissionText = submissionText;
      if (fileUrl) submission.fileUrl = fileUrl;
      submission.submittedAt = new Date();
      submission.status = 'Submitted';
      await submission.save();
    } else {
      await StudentAssignment.create({
        assignmentId: parseInt(id),
        studentId: student.id,
        submissionText,
        fileUrl,
        status: 'Submitted'
      });
    }

    res.redirect('/student/assignments?success=Assignment+submitted+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/student/assignments?error=Failed+to+submit+assignment');
  }
};
