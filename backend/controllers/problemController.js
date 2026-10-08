const {
  CampusProblem,
  ProblemComment,
  ProblemStatusHistory,
  Department,
  DepartmentStaff,
  Student,
  User
} = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');

exports.getProblems = async (req, res) => {
  try {
    const { status, category, departmentId, priority, search } = req.query;
    const where = {};

    if (status && status !== 'all') where.status = status;
    if (category && category !== 'all') where.category = category;
    if (priority && priority !== 'all') where.priority = priority;
    if (departmentId && departmentId !== 'all') where.departmentId = parseInt(departmentId);

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { ticketNumber: { [Op.like]: `%${search}%` } },
        { building: { [Op.like]: `%${search}%` } },
        { reporterName: { [Op.like]: `%${search}%` } }
      ];
    }

    const problems = await CampusProblem.findAll({
      where,
      include: [{ model: Department, as: 'department' }],
      order: [['createdAt', 'DESC']]
    });

    const departments = await Department.findAll();

    // Stats
    const allProblems = await CampusProblem.findAll();
    const openCount = allProblems.filter(p => p.status === 'Open').length;
    const inProgressCount = allProblems.filter(p => p.status === 'In Progress').length;
    const resolvedCount = allProblems.filter(p => p.status === 'Resolved' || p.status === 'Verified').length;
    const criticalCount = allProblems.filter(p => p.priority === 'Critical').length;

    res.render('problems/index', {
      pageTitle: 'Campus Problem Helpdesk & AI Auto-Routing — CAMPUS AI',
      problems,
      departments,
      openCount,
      inProgressCount,
      resolvedCount,
      criticalCount,
      selectedStatus: status || 'all',
      selectedCategory: category || 'all',
      selectedDepartment: departmentId || 'all',
      selectedPriority: priority || 'all',
      search: search || '',
      user: req.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/500', { pageTitle: 'Error', message: 'Failed to load campus problems.' });
  }
};

exports.getNewProblem = async (req, res) => {
  try {
    const departments = await Department.findAll({ where: { status: 'Active' } });
    res.render('problems/new', {
      pageTitle: 'Report Campus Issue — CAMPUS AI',
      departments,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/problems');
  }
};

exports.aiClassifyProblem = async (req, res) => {
  try {
    const { title, description, location } = req.body;
    const classification = await aiService.classifyProblem(title, description, location);
    res.json({ success: true, ...classification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'AI Classification Failed' });
  }
};

exports.createProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      building,
      block,
      floor,
      room,
      locationDescription,
      priority,
      departmentId
    } = req.body;

    const count = await CampusProblem.count();
    const ticketNumber = `TKT-2026-${String(count + 1001).padStart(4, '0')}`;
    const attachmentUrls = [];

    if (req.files && req.files.length > 0) {
      req.files.forEach(f => attachmentUrls.push(`/uploads/${f.filename}`));
    }

    // Auto-match department if not explicitly selected
    let resolvedDeptId = departmentId ? parseInt(departmentId) : null;
    if (!resolvedDeptId) {
      const classification = await aiService.classifyProblem(title, description, `${building} ${room}`);
      const matchedDept = await Department.findOne({
        where: { name: { [Op.like]: `%${classification.department.slice(0, 10)}%` } }
      });
      if (matchedDept) resolvedDeptId = matchedDept.id;
    }

    const reporterName = req.user ? req.user.name : 'Campus Member';
    const reporterEmail = req.user ? req.user.email : 'student@campusai.edu';

    const problem = await CampusProblem.create({
      ticketNumber,
      userId: req.user ? req.user.id : 1,
      reporterName,
      reporterEmail,
      title,
      description,
      category: category || 'Infrastructure',
      subcategory,
      building: building || 'Main Academic Block',
      block: block || 'A',
      floor: floor || 'Ground Floor',
      room,
      locationDescription,
      priority: priority || 'Medium',
      status: 'Open',
      departmentId: resolvedDeptId,
      attachmentUrlsJson: JSON.stringify(attachmentUrls)
    });

    await ProblemStatusHistory.create({
      problemId: problem.id,
      previousStatus: null,
      newStatus: 'Open',
      changedByUserId: req.user ? req.user.id : null,
      changedByName: reporterName,
      notes: 'Ticket submitted with AI Auto-Classification.'
    });

    res.redirect(`/problems/${problem.id}?success=Problem+ticket+registered+successfully`);
  } catch (err) {
    console.error(err);
    res.redirect('/problems/new?error=Failed+to+register+ticket');
  }
};

exports.getProblemDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await CampusProblem.findByPk(id, {
      include: [
        { model: Department, as: 'department' },
        { model: ProblemComment, as: 'comments', order: [['createdAt', 'ASC']] },
        { model: ProblemStatusHistory, as: 'history', order: [['createdAt', 'ASC']] }
      ]
    });

    if (!problem) {
      return res.status(404).render('errors/404', { pageTitle: 'Not Found', message: 'Ticket not found' });
    }

    const departments = await Department.findAll({
      include: [{ model: DepartmentStaff, as: 'staffMembers' }]
    });

    res.render('problems/detail', {
      pageTitle: `Ticket ${problem.ticketNumber} — CAMPUS AI`,
      problem,
      departments,
      attachments: problem.attachmentUrlsJson ? JSON.parse(problem.attachmentUrlsJson) : [],
      user: req.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/problems');
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const problem = await CampusProblem.findByPk(id);

    if (!problem) return res.redirect('/problems');

    const previousStatus = problem.status;
    problem.status = status;
    await problem.save();

    await ProblemStatusHistory.create({
      problemId: problem.id,
      previousStatus,
      newStatus: status,
      changedByUserId: req.user ? req.user.id : null,
      changedByName: req.user ? req.user.name : 'Campus Staff',
      notes: notes || `Status updated to ${status}`
    });

    res.redirect(`/problems/${id}?success=Ticket+status+updated+to+${status}`);
  } catch (err) {
    console.error(err);
    res.redirect(`/problems/${id}?error=Failed+to+update+status`);
  }
};

exports.assignProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentId, staffId } = req.body;
    const problem = await CampusProblem.findByPk(id);

    if (problem) {
      if (departmentId) problem.departmentId = parseInt(departmentId);
      if (staffId) problem.assignedStaffId = parseInt(staffId);
      problem.status = 'In Progress';
      await problem.save();

      await ProblemStatusHistory.create({
        problemId: problem.id,
        previousStatus: 'Open',
        newStatus: 'In Progress',
        changedByUserId: req.user ? req.user.id : null,
        changedByName: req.user ? req.user.name : 'Dispatcher',
        notes: `Assigned to department and technician.`
      });
    }

    res.redirect(`/problems/${id}?success=Ticket+dispatched+successfully`);
  } catch (err) {
    console.error(err);
    res.redirect(`/problems/${id}?error=Assignment+failed`);
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;

    await ProblemComment.create({
      problemId: parseInt(id),
      userId: req.user ? req.user.id : 1,
      authorName: req.user ? req.user.name : 'Anonymous',
      authorRole: req.user ? req.user.role : 'student',
      comment,
      attachmentUrl
    });

    res.redirect(`/problems/${id}?success=Comment+added`);
  } catch (err) {
    console.error(err);
    res.redirect(`/problems/${id}?error=Failed+to+add+comment`);
  }
};

exports.resolveProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionSummary } = req.body;
    const problem = await CampusProblem.findByPk(id);

    if (problem) {
      const proofUrl = req.file ? `/uploads/${req.file.filename}` : null;
      problem.status = 'Resolved';
      problem.resolutionSummary = resolutionSummary;
      if (proofUrl) problem.resolutionProofUrl = proofUrl;
      await problem.save();

      await ProblemStatusHistory.create({
        problemId: problem.id,
        previousStatus: 'In Progress',
        newStatus: 'Resolved',
        changedByUserId: req.user ? req.user.id : null,
        changedByName: req.user ? req.user.name : 'Field Technician',
        notes: `Resolved: ${resolutionSummary}`
      });
    }

    res.redirect(`/problems/${id}?success=Ticket+marked+as+Resolved`);
  } catch (err) {
    console.error(err);
    res.redirect(`/problems/${id}?error=Failed+to+resolve+ticket`);
  }
};

exports.verifyProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await CampusProblem.findByPk(id);

    if (problem) {
      problem.status = 'Verified';
      problem.verifiedAt = new Date();
      await problem.save();

      await ProblemStatusHistory.create({
        problemId: problem.id,
        previousStatus: 'Resolved',
        newStatus: 'Verified',
        changedByUserId: req.user ? req.user.id : null,
        changedByName: req.user ? req.user.name : 'Reporter',
        notes: 'Resolution verified by student/reporter.'
      });
    }

    res.redirect(`/problems/${id}?success=Resolution+verified!+Ticket+closed.`);
  } catch (err) {
    console.error(err);
    res.redirect(`/problems/${id}?error=Verification+failed`);
  }
};

exports.escalateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { escalatedReason } = req.body;
    const problem = await CampusProblem.findByPk(id);

    if (problem) {
      problem.status = 'Escalated';
      problem.priority = 'Critical';
      problem.escalatedReason = escalatedReason;
      await problem.save();

      await ProblemStatusHistory.create({
        problemId: problem.id,
        previousStatus: 'Open',
        newStatus: 'Escalated',
        changedByUserId: req.user ? req.user.id : null,
        changedByName: req.user ? req.user.name : 'Supervisor',
        notes: `ESCALATED: ${escalatedReason}`
      });
    }

    res.redirect(`/problems/${id}?success=Ticket+escalated+to+Critical+priority`);
  } catch (err) {
    console.error(err);
    res.redirect(`/problems/${id}?error=Escalation+failed`);
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const problems = await CampusProblem.findAll({
      include: [{ model: Department, as: 'department' }]
    });

    const totalIssues = problems.length;
    const resolvedCount = problems.filter(p => p.status === 'Resolved' || p.status === 'Verified' || p.status === 'Closed').length;
    const overdueCount = problems.filter(p => p.priority === 'Critical' && p.status !== 'Resolved').length;

    res.render('problems/analytics', {
      pageTitle: 'Problem Helpdesk Analytics & Hotspots — CAMPUS AI',
      totalIssues,
      resolvedCount,
      overdueCount,
      problems,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/problems');
  }
};

// Department Management
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [{ model: DepartmentStaff, as: 'staffMembers' }]
    });

    res.render('problems/departments', {
      pageTitle: 'Department Management & SLAs — CAMPUS AI',
      departments,
      user: req.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/problems');
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, code, headOfDepartment, email, phone, location, slaHours } = req.body;

    await Department.create({
      name,
      code,
      headOfDepartment,
      email,
      phone,
      location,
      slaHours: parseInt(slaHours) || 24,
      status: 'Active'
    });

    res.redirect('/problems/departments?success=Department+created+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/problems/departments?error=Failed+to+create+department');
  }
};

exports.addDepartmentStaff = async (req, res) => {
  try {
    const { departmentId, name, email, role, specialization, contactNumber } = req.body;

    await DepartmentStaff.create({
      departmentId: parseInt(departmentId),
      name,
      email,
      role: role || 'Support Officer',
      specialization,
      contactNumber,
      isActive: true
    });

    res.redirect('/problems/departments?success=Staff+member+added+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/problems/departments?error=Failed+to+add+staff');
  }
};
