const {
  User,
  Student,
  Admission,
  Fee,
  Hostel,
  Exam,
  Attendance,
  CampusProblem,
  Department
} = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');

exports.getDashboard = async (req, res) => {
  try {
    // 1. Metric Counts
    const totalAdmissions = await Admission.count();
    const activeStudents = await Student.count({ where: { status: 'Active' } });
    const pendingFeesCount = await Fee.count({ where: { status: { [Op.in]: ['Unpaid', 'Overdue'] } } });
    const hostelOccupants = await Hostel.count({ where: { status: 'Occupied' } });

    // 2. Pending Admin Approvals
    const pendingApprovals = await User.findAll({
      where: { role: 'admin', status: 'pending' },
      order: [['createdAt', 'DESC']]
    });

    // 3. At-Risk Students for AI Predictive Insights
    const students = await Student.findAll({ limit: 10 });
    const studentRiskProfiles = [];

    for (const s of students) {
      const totalAtt = await Attendance.count({ where: { studentId: s.id } });
      const presentAtt = await Attendance.count({
        where: { studentId: s.id, status: { [Op.in]: ['Present', 'Late'] } }
      });
      const attendancePercentage = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 85;

      const exams = await Exam.findAll({ where: { studentId: s.id } });
      const avgMarks = exams.length > 0
        ? Math.round(exams.reduce((acc, cur) => acc + (cur.percentage || 0), 0) / exams.length)
        : 75;

      const pendingFee = await Fee.findOne({ where: { studentId: s.id, status: 'Overdue' } });

      studentRiskProfiles.push({
        id: s.id,
        studentId: s.studentId,
        name: s.name,
        course: s.course,
        attendancePercentage,
        averageMarks: avgMarks,
        pendingAssignments: 1,
        feeStatus: pendingFee ? 'Overdue' : 'Clear'
      });
    }

    const aiRiskAnalysis = await aiService.evaluateEarlyWarning(studentRiskProfiles);
    const atRiskStudents = aiRiskAnalysis.filter(r => r.riskLevel === 'Critical' || r.riskLevel === 'High' || r.riskLevel === 'Medium');

    // 4. Open Campus Problems
    const openProblems = await CampusProblem.findAll({
      where: { status: { [Op.in]: ['Open', 'In Progress', 'Escalated'] } },
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    // 5. Total Fee Amount
    const fees = await Fee.findAll();
    const totalFeeAmount = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalCollected = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);

    res.render('dashboard', {
      pageTitle: 'CAMPUS AI ADMIN DASHBOARD',
      totalAdmissions,
      activeStudents,
      pendingFeesCount,
      hostelOccupants,
      pendingApprovals,
      atRiskStudents,
      openProblems,
      totalFeeAmount,
      totalCollected,
      user: req.user
    });
  } catch (err) {
    console.error('[Admin Dashboard Error]:', err);
    res.status(500).render('errors/500', {
      pageTitle: 'Server Error',
      message: 'Failed to load administrator dashboard.'
    });
  }
};

exports.getApprovals = async (req, res) => {
  try {
    const pendingAdmins = await User.findAll({
      where: { status: 'pending' },
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/approvals', {
      pageTitle: 'Pending Account Approvals — CAMPUS AI',
      pendingAdmins,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.update({ status: 'active' }, { where: { id } });
    if (req.xhr) return res.json({ success: true, message: 'User approved successfully.' });
    res.redirect('/?success=User+approved');
  } catch (err) {
    console.error(err);
    if (req.xhr) return res.status(500).json({ success: false, message: 'Failed to approve.' });
    res.redirect('/?error=Failed+to+approve');
  }
};

exports.rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.update({ status: 'rejected' }, { where: { id } });
    if (req.xhr) return res.json({ success: true, message: 'User rejected.' });
    res.redirect('/?success=User+rejected');
  } catch (err) {
    console.error(err);
    if (req.xhr) return res.status(500).json({ success: false, message: 'Failed to reject.' });
    res.redirect('/?error=Failed+to+reject');
  }
};
