const {
  Student,
  Exam,
  Attendance,
  Assignment,
  StudentAssignment,
  Quiz,
  QuizAttempt,
  LearningPath,
  SmartNotification,
  CampusEntity,
  StudentGamification,
  AIReport,
  Department,
  CampusProblem,
  Subject
} = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');
const pdfService = require('../services/pdfService');

async function resolveCurrentStudent(req) {
  if (!req.user) return await Student.findOne();
  let student = await Student.findOne({ where: { userId: req.user.id } });
  if (!student) student = await Student.findOne({ where: { email: req.user.email } });
  if (!student) student = await Student.findOne();
  return student;
}

// 1. Assistant
exports.getAssistant = async (req, res) => {
  const student = await resolveCurrentStudent(req);
  res.render('ai/assistant', {
    pageTitle: 'CampusAI Assistant — CAMPUS AI',
    student,
    user: req.user
  });
};

exports.postChat = async (req, res) => {
  try {
    const { message } = req.body;
    const student = await resolveCurrentStudent(req);
    const result = await aiService.chatAssistant(message, {
      studentName: student ? student.name : 'Student',
      course: student ? student.course : 'Engineering'
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'AI Chat Error' });
  }
};

// 2. Performance Prediction
exports.getPerformancePrediction = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    const exams = await Exam.findAll({ where: { studentId: student.id } });
    const avgMarks = exams.length > 0
      ? Math.round(exams.reduce((sum, e) => sum + (e.percentage || 0), 0) / exams.length)
      : 78;

    const totalAtt = await Attendance.count({ where: { studentId: student.id } });
    const presentAtt = await Attendance.count({
      where: { studentId: student.id, status: { [Op.in]: ['Present', 'Late'] } }
    });
    const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 82;

    const prediction = await aiService.predictPerformance({
      avgMarks,
      attendanceRate,
      assignmentRate: 85,
      quizMastery: 88
    });

    res.render('ai/performance_prediction', {
      pageTitle: 'Academic Performance Prediction (Explainable AI) — CAMPUS AI',
      student,
      prediction,
      avgMarks,
      attendanceRate,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

// 3. Early Warning
exports.getEarlyWarning = async (req, res) => {
  try {
    const students = await Student.findAll();
    const roster = [];

    for (const s of students) {
      const exams = await Exam.findAll({ where: { studentId: s.id } });
      const avgMarks = exams.length > 0
        ? Math.round(exams.reduce((sum, e) => sum + (e.percentage || 0), 0) / exams.length)
        : 74;

      const totalAtt = await Attendance.count({ where: { studentId: s.id } });
      const presentAtt = await Attendance.count({
        where: { studentId: s.id, status: { [Op.in]: ['Present', 'Late'] } }
      });
      const attendancePercentage = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 80;

      roster.push({
        id: s.id,
        studentId: s.studentId,
        name: s.name,
        course: s.course,
        averageMarks: avgMarks,
        attendancePercentage,
        pendingAssignments: 1
      });
    }

    const earlyWarnings = await aiService.evaluateEarlyWarning(roster);

    res.render('ai/early_warning', {
      pageTitle: 'Early Warning System — CAMPUS AI',
      earlyWarnings,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

// 4. Learning Path
exports.getLearningPath = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    const learningPaths = await LearningPath.findAll({
      where: { studentId: student.id },
      order: [['createdAt', 'DESC']]
    });
    const subjects = await Subject.findAll();

    res.render('ai/learning_path', {
      pageTitle: 'Personalized AI 7-Day Learning Path — CAMPUS AI',
      student,
      learningPaths,
      subjects,
      user: req.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/student/dashboard');
  }
};

exports.generateLearningPath = async (req, res) => {
  try {
    const { subject, weakTopic, goal } = req.body;
    const student = await resolveCurrentStudent(req);

    const plan = await aiService.generateLearningPath(subject, weakTopic, goal);

    await LearningPath.create({
      studentId: student.id,
      subject,
      weakTopic,
      goal: goal || 'Achieve conceptual mastery in 7 days',
      scheduleJson: JSON.stringify(plan),
      progressPercentage: 0,
      status: 'Active'
    });

    if (req.xhr) {
      return res.json({ success: true, message: '7-Day Learning Path generated!', plan });
    }
    res.redirect('/ai/learning-path?success=New+7-Day+Learning+Path+created!');
  } catch (err) {
    console.error(err);
    if (req.xhr) return res.status(500).json({ success: false, message: 'Failed to generate path' });
    res.redirect('/ai/learning-path?error=Failed+to+generate+learning+path');
  }
};

exports.toggleDayProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { dayIndex } = req.body;
    const path = await LearningPath.findByPk(id);

    if (path) {
      const schedule = JSON.parse(path.scheduleJson);
      if (schedule[dayIndex]) {
        schedule[dayIndex].completed = !schedule[dayIndex].completed;
        const completedCount = schedule.filter(s => s.completed).length;
        path.progressPercentage = Math.round((completedCount / schedule.length) * 100);
        path.scheduleJson = JSON.stringify(schedule);
        if (path.progressPercentage === 100) path.status = 'Completed';
        await path.save();
      }
    }

    res.json({ success: true, progress: path.progressPercentage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating day progress' });
  }
};

// 5. Quiz
exports.getQuiz = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    const subjects = await Subject.findAll();
    const attempts = await QuizAttempt.findAll({
      where: { studentId: student.id },
      include: [{ model: Quiz, as: 'quiz' }],
      order: [['completedAt', 'DESC']]
    });

    res.render('ai/quiz', {
      pageTitle: 'AI Dynamic Quiz Generator — CAMPUS AI',
      student,
      subjects,
      attempts,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/student/dashboard');
  }
};

exports.generateQuiz = async (req, res) => {
  try {
    const { subject, topic, difficulty, count } = req.body;
    const questions = await aiService.generateQuiz(subject, topic, difficulty, parseInt(count) || 5);

    const quiz = await Quiz.create({
      subject,
      title: `${subject}: ${topic} Adaptive Test`,
      topic,
      difficulty: difficulty || 'Medium',
      durationMinutes: 15,
      totalMarks: questions.length * 10,
      questionsJson: JSON.stringify(questions)
    });

    res.json({
      success: true,
      quizId: quiz.id,
      title: quiz.title,
      questions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to generate quiz' });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const student = await resolveCurrentStudent(req);
    const quiz = await Quiz.findByPk(quizId);

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const questions = JSON.parse(quiz.questionsJson);
    let correctCount = 0;
    const weakTopics = [];

    questions.forEach((q, idx) => {
      const selected = answers ? answers[idx] : null;
      if (selected !== null && parseInt(selected) === q.correctIndex) {
        correctCount++;
      } else {
        if (!weakTopics.includes(q.topic)) weakTopics.push(q.topic);
      }
    });

    const totalQuestions = questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const score = correctCount * 10;
    const xpEarned = correctCount * 25 + 50;

    const attempt = await QuizAttempt.create({
      quizId: quiz.id,
      studentId: student.id,
      score,
      totalQuestions,
      percentage,
      answersJson: JSON.stringify(answers || []),
      weakTopicsJson: JSON.stringify(weakTopics),
      recommendations: percentage >= 80 ? 'Mastery demonstrated! Ready for next unit.' : 'Review marked weak areas using the 7-Day AI Learning Path.',
      xpEarned
    });

    // Award XP in Gamification
    let gamification = await StudentGamification.findOne({ where: { studentId: student.id } });
    if (gamification) {
      gamification.totalXp += xpEarned;
      gamification.level = Math.floor(gamification.totalXp / 250) + 1;
      gamification.quizMastery = Math.min(100, Math.round((gamification.quizMastery + percentage) / 2));
      await gamification.save();
    }

    res.json({
      success: true,
      score,
      totalQuestions,
      percentage,
      xpEarned,
      weakTopics,
      recommendations: attempt.recommendations,
      questions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Quiz submission error' });
  }
};

// 6. Attendance Intelligence
exports.getAttendanceIntelligence = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    const total = await Attendance.count({ where: { studentId: student.id } });
    const attended = await Attendance.count({
      where: { studentId: student.id, status: { [Op.in]: ['Present', 'Late'] } }
    });

    const totalClasses = total > 0 ? total : 20;
    const attendedClasses = attended > 0 ? attended : 16;
    const currentPercentage = Math.round((attendedClasses / totalClasses) * 100);

    // Classes needed to reach 75% formula:
    // (attended + x) / (total + x) >= 0.75 => x >= (0.75 * total - attended) / 0.25
    let classesRequired = 0;
    if (currentPercentage < 75) {
      classesRequired = Math.ceil((0.75 * totalClasses - attendedClasses) / 0.25);
      if (classesRequired < 0) classesRequired = 0;
    }

    // Bunk margin: how many can skip while staying >= 75%
    // attended / (total + y) >= 0.75 => y <= (attended / 0.75) - total
    let canBunk = 0;
    if (currentPercentage >= 75) {
      canBunk = Math.floor((attendedClasses / 0.75) - totalClasses);
      if (canBunk < 0) canBunk = 0;
    }

    let statusType = 'healthy';
    if (currentPercentage < 65) statusType = 'shortage';
    else if (currentPercentage < 75) statusType = 'warning';

    res.render('ai/attendance_intelligence', {
      pageTitle: 'Attendance Intelligence & 75% Simulator — CAMPUS AI',
      student,
      totalClasses,
      attendedClasses,
      currentPercentage,
      classesRequired,
      canBunk,
      statusType,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/student/dashboard');
  }
};

// 7. Digital Profile & Growth Score
exports.getDigitalProfile = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    let gamification = await StudentGamification.findOne({ where: { studentId: student.id } });
    if (!gamification) {
      gamification = {
        growthScore: 86,
        academicConsistency: 88,
        quizMastery: 84,
        attendanceDiscipline: 82,
        careerReadiness: 79,
        totalXp: 850,
        level: 4,
        streakDays: 7,
        badgesJson: JSON.stringify([])
      };
    }

    const badges = gamification.badgesJson ? JSON.parse(gamification.badgesJson) : [];

    res.render('ai/profile', {
      pageTitle: '360° Student Digital Profile & Growth Score — CAMPUS AI',
      student,
      gamification,
      badges,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/student/dashboard');
  }
};

// 8. Career Navigator
exports.getCareerNavigator = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    const recommendations = await aiService.getCareerRecommendations(student);

    res.render('ai/career', {
      pageTitle: 'Career & Skill Navigator — CAMPUS AI',
      student,
      recommendations,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/student/dashboard');
  }
};

// 9. Gamification
exports.getGamification = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    let gamification = await StudentGamification.findOne({ where: { studentId: student.id } });
    if (!gamification) {
      gamification = {
        totalXp: 850,
        level: 4,
        streakDays: 7,
        growthScore: 88,
        badgesJson: JSON.stringify([
          { id: 'b1', title: 'Algorithmic Prodigy', icon: '🏆', description: 'Scored 100% on Advanced Graph & Tree Quiz', earnedAt: '2026-10-02' },
          { id: 'b2', title: 'Punctuality Sentinel', icon: '🛡️', description: 'Maintained 80%+ attendance for 4 consecutive weeks', earnedAt: '2026-10-05' },
          { id: 'b3', title: 'Knowledge Explorer', icon: '🚀', description: 'Completed first AI Learning Path milestone', earnedAt: '2026-10-07' }
        ])
      };
    }

    const badges = gamification.badgesJson ? JSON.parse(gamification.badgesJson) : [];

    // Leaderboard
    const leaderboard = await StudentGamification.findAll({
      order: [['totalXp', 'DESC']],
      limit: 10
    });

    const students = await Student.findAll();
    const studentMap = {};
    students.forEach(s => { studentMap[s.id] = s.name; });

    res.render('ai/gamification', {
      pageTitle: 'Campus AI Gamification & Hall of Fame — CAMPUS AI',
      student,
      gamification,
      badges,
      leaderboard,
      studentMap,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/student/dashboard');
  }
};

// 10. Campus Directory
exports.getCampusInfo = async (req, res) => {
  try {
    const { type, search } = req.query;
    const where = {};

    if (type && type !== 'all') {
      where.type = type;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { block: { [Op.like]: `%${search}%` } },
        { inCharge: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const entities = await CampusEntity.findAll({ where, order: [['name', 'ASC']] });

    res.render('ai/campus_info', {
      pageTitle: 'Campus Directory & Smart Facilities — CAMPUS AI',
      entities,
      selectedType: type || 'all',
      search: search || '',
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

exports.searchCampusInfo = async (req, res) => {
  try {
    const { q } = req.query;
    const entities = await CampusEntity.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
          { block: { [Op.like]: `%${q}%` } }
        ]
      }
    });
    res.json({ success: true, count: entities.length, results: entities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

// 11. Admin Analytics
exports.getAdminAnalytics = async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const totalAttendance = await Attendance.count();
    const presentAttendance = await Attendance.count({ where: { status: { [Op.in]: ['Present', 'Late'] } } });
    const avgAttendance = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 83;

    const problems = await CampusProblem.findAll();
    const resolvedProblems = problems.filter(p => p.status === 'Resolved' || p.status === 'Verified' || p.status === 'Closed').length;

    res.render('ai/admin_analytics', {
      pageTitle: 'Institutional AI Analytics & Trends — CAMPUS AI',
      totalStudents,
      avgAttendance,
      totalProblems: problems.length,
      resolvedProblems,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

// 12. Reports
exports.getReports = async (req, res) => {
  try {
    const reports = await AIReport.findAll({ order: [['createdAt', 'DESC']] });
    res.render('ai/reports', {
      pageTitle: 'AI Institutional Report Generator — CAMPUS AI',
      reports,
      user: req.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { department, semester } = req.body;
    const reportData = await aiService.generateInstitutionalReport({ department, semester });

    const newReport = await AIReport.create({
      generatedBy: req.user ? req.user.id : null,
      title: reportData.title,
      summary: reportData.summary,
      department: reportData.department,
      semester: reportData.semester,
      metricsJson: JSON.stringify(reportData.metrics),
      insightsJson: JSON.stringify(reportData.keyInsights),
      recommendationsJson: JSON.stringify(reportData.strategicRecommendations)
    });

    res.redirect('/ai/reports?success=Institutional+AI+report+generated+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/ai/reports?error=Failed+to+generate+report');
  }
};

exports.downloadReportPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await AIReport.findByPk(id);

    if (!report) {
      return res.status(404).send('Report not found');
    }

    const reportData = {
      title: report.title,
      department: report.department,
      semester: report.semester,
      summary: report.summary,
      metrics: report.metricsJson ? JSON.parse(report.metricsJson) : {},
      keyInsights: report.insightsJson ? JSON.parse(report.insightsJson) : [],
      strategicRecommendations: report.recommendationsJson ? JSON.parse(report.recommendationsJson) : []
    };

    pdfService.generateAIReportPDF(reportData, res);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating report PDF');
  }
};

// 13. Notifications
exports.getNotifications = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    const notifications = await SmartNotification.findAll({
      order: [['createdAt', 'DESC']],
      limit: 25
    });

    res.render('ai/notifications', {
      pageTitle: 'Smart Notifications — CAMPUS AI',
      notifications,
      student,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await SmartNotification.update({ isRead: true }, { where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// 14. CampusAI Operations & Intelligence Hub
exports.getHackathonDemo = async (req, res) => {
  try {
    const student = await resolveCurrentStudent(req);
    res.render('ai/hackathon_demo', {
      pageTitle: 'CampusAI Operations & Intelligence Hub — CAMPUS AI',
      student,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};
