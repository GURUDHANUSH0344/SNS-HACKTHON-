const {
  FacultyProfile,
  ClassSchedule,
  Student,
  Subject,
  Attendance,
  Assignment,
  StudentAssignment,
  Exam,
  QuestionPaper,
  Announcement,
  CampusProblem
} = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');

async function resolveFacultyProfile(req) {
  if (!req.user) return null;
  let profile = await FacultyProfile.findOne({ where: { userId: req.user.id } });
  if (!profile) {
    profile = await FacultyProfile.findOne();
  }
  return profile;
}

exports.getDashboard = async (req, res) => {
  try {
    const profile = await resolveFacultyProfile(req);

    // 1. Timetable / Today's classes
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()] || 'Monday';
    const dayQuery = currentDay === 'Sunday' ? 'Monday' : currentDay;

    const todayClasses = await ClassSchedule.findAll({
      where: { dayOfWeek: dayQuery },
      order: [['startTime', 'ASC']]
    });

    const totalClassesCount = await ClassSchedule.count();
    const studentsCount = await Student.count();
    const pendingAssignmentsCount = await Assignment.count();

    // 2. Attendance Summary
    const attendances = await Attendance.findAll({ limit: 100 });
    const presentCount = attendances.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const avgAttendance = attendances.length > 0 ? Math.round((presentCount / attendances.length) * 100) : 84;

    // 3. Announcements
    const announcements = await Announcement.findAll({ order: [['createdAt', 'DESC']], limit: 4 });

    // 4. Open Student Issues
    const openIssues = await CampusProblem.findAll({
      where: { status: { [Op.in]: ['Open', 'In Progress'] } },
      limit: 3
    });

    res.render('faculty/dashboard', {
      pageTitle: 'Faculty Portal Dashboard — CAMPUS AI',
      profile,
      todayClasses,
      totalClassesCount,
      studentsCount,
      pendingAssignmentsCount,
      avgAttendance,
      announcements,
      openIssues,
      currentDay: dayQuery,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/500', { pageTitle: 'Error', message: 'Failed to load faculty dashboard.' });
  }
};

exports.getTimetable = async (req, res) => {
  try {
    const profile = await resolveFacultyProfile(req);
    const schedules = await ClassSchedule.findAll({
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
    });
    const subjects = await Subject.findAll({ order: [['name', 'ASC']] });

    res.render('faculty/timetable', {
      pageTitle: 'My Academic Timetable — CAMPUS AI',
      profile,
      schedules,
      subjects,
      user: req.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/dashboard');
  }
};

exports.createTimetable = async (req, res) => {
  try {
    const { subjectName, dayOfWeek, startTime, endTime, classroom, department, year, section, studentCount } = req.body;

    await ClassSchedule.create({
      userId: req.user ? req.user.id : null,
      subjectName,
      dayOfWeek,
      startTime,
      endTime,
      classroom: classroom || 'LH-102',
      department: department || 'CSE',
      year: parseInt(year) || 3,
      section: section || 'A',
      studentCount: parseInt(studentCount) || 60
    });

    res.redirect('/faculty/timetable?success=Class+slot+added+to+timetable');
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/timetable?error=Failed+to+add+class+slot');
  }
};

exports.deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    await ClassSchedule.destroy({ where: { id } });
    res.redirect('/faculty/timetable?success=Class+slot+removed');
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/timetable?error=Failed+to+remove+slot');
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const profile = await resolveFacultyProfile(req);
    const subjects = await Subject.findAll();
    const students = await Student.findAll({ order: [['name', 'ASC']] });

    // Calculate each student's current attendance rate
    const studentStats = [];
    for (const s of students) {
      const total = await Attendance.count({ where: { studentId: s.id } });
      const present = await Attendance.count({
        where: { studentId: s.id, status: { [Op.in]: ['Present', 'Late'] } }
      });
      const pct = total > 0 ? Math.round((present / total) * 100) : 85;
      studentStats.push({
        ...s.toJSON(),
        totalClasses: total || 15,
        attendedClasses: present || 13,
        attendancePercentage: pct,
        isShortage: pct < 75
      });
    }

    res.render('faculty/attendance', {
      pageTitle: 'Attendance Management & 75% Tracker — CAMPUS AI',
      profile,
      subjects,
      studentStats,
      user: req.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/dashboard');
  }
};

exports.submitAttendance = async (req, res) => {
  try {
    const { subjectName, date, attendance } = req.body;
    // attendance is object mapping studentId => status (Present/Absent/Late)
    const targetDate = date || new Date().toISOString().slice(0, 10);

    if (attendance && typeof attendance === 'object') {
      for (const [studentId, status] of Object.entries(attendance)) {
        await Attendance.create({
          studentId: parseInt(studentId),
          subjectName: subjectName || 'Data Structures',
          date: targetDate,
          status: status || 'Present',
          facultyId: req.user ? req.user.id : null
        });
      }
    }

    res.redirect('/faculty/attendance?success=Attendance+records+saved+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/attendance?error=Failed+to+save+attendance');
  }
};

exports.getStudentsDirectory = async (req, res) => {
  try {
    const { search, course } = req.query;
    const where = {};

    if (course && course !== 'all') {
      where.course = { [Op.like]: `%${course}%` };
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const students = await Student.findAll({
      where,
      include: [
        { model: Exam, as: 'exams' },
        { model: Attendance, as: 'attendanceRecords' }
      ],
      order: [['name', 'ASC']]
    });

    res.render('faculty/students', {
      pageTitle: 'Student 360° Directory — CAMPUS AI',
      students,
      search: search || '',
      selectedCourse: course || 'all',
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/dashboard');
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const profile = await resolveFacultyProfile(req);
    const assignments = await Assignment.findAll({
      include: [{ model: StudentAssignment, as: 'submissions', include: [{ model: Student, as: 'student' }] }],
      order: [['dueDate', 'DESC']]
    });
    const subjects = await Subject.findAll();

    res.render('faculty/assignments', {
      pageTitle: 'Assignments & Grading Cell — CAMPUS AI',
      profile,
      assignments,
      subjects,
      user: req.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/dashboard');
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const { subjectName, title, description, unit, dueDate, maxScore, difficulty } = req.body;

    await Assignment.create({
      facultyId: req.user ? req.user.id : null,
      subjectName,
      title,
      description,
      unit: unit || 'Unit 1',
      dueDate,
      maxScore: parseInt(maxScore) || 100,
      difficulty: difficulty || 'Medium'
    });

    res.redirect('/faculty/assignments?success=Assignment+published+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/assignments?error=Failed+to+create+assignment');
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await Assignment.destroy({ where: { id } });
    res.redirect('/faculty/assignments?success=Assignment+deleted');
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/assignments?error=Failed+to+delete');
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, feedback } = req.body;

    await StudentAssignment.update(
      {
        score: parseFloat(score),
        feedback,
        status: 'Graded'
      },
      { where: { id } }
    );

    if (req.xhr) {
      return res.json({ success: true, message: 'Submission graded successfully.' });
    }
    res.redirect('/faculty/assignments?success=Submission+graded+successfully');
  } catch (err) {
    console.error(err);
    if (req.xhr) return res.status(500).json({ success: false, message: 'Failed to grade submission.' });
    res.redirect('/faculty/assignments?error=Failed+to+grade+submission');
  }
};

exports.getExams = async (req, res) => {
  try {
    const subjects = await Subject.findAll();
    const students = await Student.findAll({ order: [['name', 'ASC']] });
    const exams = await Exam.findAll({
      include: [{ model: Student, as: 'student' }],
      order: [['createdAt', 'DESC']],
      limit: 25
    });

    res.render('faculty/exams', {
      pageTitle: 'Exams & Marks Entry — CAMPUS AI',
      subjects,
      students,
      exams,
      user: req.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/dashboard');
  }
};

exports.getAIAnalytics = async (req, res) => {
  try {
    const students = await Student.findAll();
    const studentRoster = [];

    for (const s of students) {
      const exams = await Exam.findAll({ where: { studentId: s.id } });
      const avgMarks = exams.length > 0
        ? Math.round(exams.reduce((sum, e) => sum + (e.percentage || 0), 0) / exams.length)
        : 75;

      const totalAtt = await Attendance.count({ where: { studentId: s.id } });
      const presentAtt = await Attendance.count({
        where: { studentId: s.id, status: { [Op.in]: ['Present', 'Late'] } }
      });
      const attendancePercentage = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 85;

      studentRoster.push({
        id: s.id,
        studentId: s.studentId,
        name: s.name,
        course: s.course,
        averageMarks: avgMarks,
        attendancePercentage,
        pendingAssignments: 1
      });
    }

    const aiDiagnostics = await aiService.evaluateEarlyWarning(studentRoster);

    res.render('faculty/ai_analytics', {
      pageTitle: 'AI Student Performance Diagnostics & Early Warning — CAMPUS AI',
      aiDiagnostics,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/dashboard');
  }
};

exports.getAIAssistant = async (req, res) => {
  res.render('faculty/ai_assistant', {
    pageTitle: 'AI Teaching Assistant — CAMPUS AI',
    user: req.user
  });
};

exports.chatAIAssistant = async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await aiService.facultyAssistant(prompt, {
      facultyUser: req.user ? req.user.name : 'Faculty Member'
    });
    res.json({ success: true, ...response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'AI Assistant error' });
  }
};

exports.getQuestionPaper = async (req, res) => {
  try {
    const subjects = await Subject.findAll();
    const savedPapers = await QuestionPaper.findAll({ order: [['createdAt', 'DESC']] });

    res.render('faculty/question_paper', {
      pageTitle: 'AI Question Paper Generator — CAMPUS AI',
      subjects,
      savedPapers,
      user: req.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/dashboard');
  }
};

exports.generateQuestionPaper = async (req, res) => {
  try {
    const { subject, unit, topic, difficulty, durationMinutes, totalMarks } = req.body;
    const sections = await aiService.generateQuestionPaper(subject, topic, unit, difficulty, totalMarks);

    res.json({
      success: true,
      title: `${subject} — ${topic} (${unit})`,
      sections
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to generate question paper' });
  }
};

exports.saveQuestionPaper = async (req, res) => {
  try {
    const { title, subject, unit, topic, difficulty, durationMinutes, totalMarks, sectionsJson } = req.body;

    await QuestionPaper.create({
      userId: req.user ? req.user.id : null,
      title,
      subject,
      unit: unit || 'Unit 1 & 2',
      topic,
      difficulty: difficulty || 'Balanced',
      durationMinutes: parseInt(durationMinutes) || 90,
      totalMarks: parseInt(totalMarks) || 50,
      sectionsJson
    });

    res.json({ success: true, message: 'Question paper saved to library.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to save question paper' });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.findAll({ order: [['createdAt', 'DESC']] });
    res.render('faculty/announcements', {
      pageTitle: 'Announcements & Alerts — CAMPUS AI',
      announcements,
      user: req.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/dashboard');
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, targetAudience, priority, expiryDate } = req.body;

    await Announcement.create({
      authorId: req.user ? req.user.id : null,
      authorName: req.user ? req.user.name : 'Faculty Desk',
      title,
      content,
      targetAudience: targetAudience || 'All',
      priority: priority || 'Normal',
      expiryDate: expiryDate || null
    });

    res.redirect('/faculty/announcements?success=Announcement+broadcasted+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/announcements?error=Failed+to+broadcast+announcement');
  }
};

exports.getProfile = async (req, res) => {
  try {
    const profile = await resolveFacultyProfile(req);
    res.render('faculty/profile', {
      pageTitle: 'Faculty Profile — CAMPUS AI',
      profile,
      user: req.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/dashboard');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const profile = await resolveFacultyProfile(req);
    const { designation, qualification, specialization, officeLocation, phone, bio } = req.body;

    if (profile) {
      profile.designation = designation;
      profile.qualification = qualification;
      profile.specialization = specialization;
      profile.officeLocation = officeLocation;
      profile.phone = phone;
      profile.bio = bio;
      await profile.save();
    }

    res.redirect('/faculty/profile?success=Profile+updated+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/faculty/profile?error=Failed+to+update+profile');
  }
};
