const { Admission, Student, User } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const bulkService = require('../services/bulkService');
const fs = require('fs');

// --- ADMISSIONS ---

exports.getAdmissions = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { applicationNo: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { course: { [Op.like]: `%${search}%` } }
      ];
    }

    const admissions = await Admission.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.render('admissions', {
      pageTitle: 'Admissions Management — CAMPUS AI',
      admissions,
      status: status || 'all',
      search: search || '',
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/500', { pageTitle: 'Error', message: 'Failed to load admissions.' });
  }
};

exports.createAdmission = async (req, res) => {
  try {
    const { name, email, phone, course, marksPercentage, remarks } = req.body;
    const documentUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const count = await Admission.count();
    const applicationNo = `ADM-2026-${String(count + 8801).padStart(4, '0')}`;

    await Admission.create({
      applicationNo,
      name,
      email,
      phone,
      course,
      marksPercentage: parseFloat(marksPercentage) || 85.0,
      documentUrl,
      status: 'pending',
      remarks
    });

    res.redirect('/admissions?success=Application+submitted+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/admissions?error=Failed+to+submit+application');
  }
};

exports.approveAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const admission = await Admission.findByPk(id);

    if (!admission) {
      return res.redirect('/admissions?error=Application+not+found');
    }

    // Update admission status
    admission.status = 'approved';
    admission.reviewedBy = req.user ? req.user.id : null;
    await admission.save();

    // Check if student already exists
    let student = await Student.findOne({ where: { email: admission.email } });
    if (!student) {
      const studentCount = await Student.count();
      const studentId = `CAI-2026-${String(studentCount + 101).padStart(4, '0')}`;

      student = await Student.create({
        studentId,
        name: admission.name,
        email: admission.email,
        phone: admission.phone,
        course: admission.course,
        year: 1,
        semester: 1,
        section: 'A',
        status: 'Active'
      });
    }

    // Send confirmation email
    await emailService.sendAdmissionDecision(admission, 'approved');

    if (req.xhr) {
      return res.json({ success: true, message: 'Admission approved and student ID generated.' });
    }
    res.redirect('/admissions?success=Admission+approved+and+student+enrolled');
  } catch (err) {
    console.error(err);
    if (req.xhr) return res.status(500).json({ success: false, message: 'Failed to approve admission.' });
    res.redirect('/admissions?error=Failed+to+approve+admission');
  }
};

exports.rejectAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const admission = await Admission.findByPk(id);

    if (!admission) {
      return res.redirect('/admissions?error=Application+not+found');
    }

    admission.status = 'rejected';
    admission.remarks = remarks || admission.remarks;
    await admission.save();

    await emailService.sendAdmissionDecision(admission, 'rejected', admission.remarks);

    if (req.xhr) {
      return res.json({ success: true, message: 'Admission application rejected.' });
    }
    res.redirect('/admissions?success=Application+rejected');
  } catch (err) {
    console.error(err);
    if (req.xhr) return res.status(500).json({ success: false, message: 'Failed to reject.' });
    res.redirect('/admissions?error=Failed+to+reject');
  }
};

exports.deleteAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    await Admission.destroy({ where: { id } });
    res.redirect('/admissions?success=Application+deleted');
  } catch (err) {
    console.error(err);
    res.redirect('/admissions?error=Failed+to+delete');
  }
};

exports.bulkUploadAdmissions = async (req, res) => {
  try {
    if (!req.file) {
      return res.redirect('/admissions?error=Please+select+a+valid+Excel+or+CSV+file');
    }

    const records = bulkService.parseSpreadsheet(req.file.path);
    let count = 0;

    for (const r of records) {
      if (r.name && r.email) {
        const appNo = r.applicationNo || `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        await Admission.create({
          applicationNo: appNo,
          name: r.name,
          email: r.email,
          phone: r.phone || '0000000000',
          course: r.course || 'B.Tech CSE',
          marksPercentage: parseFloat(r.marksPercentage) || 80.0,
          status: 'pending'
        });
        count++;
      }
    }

    // Clean up uploaded temp file
    fs.unlinkSync(req.file.path);
    res.redirect(`/admissions?success=Successfully+imported+${count}+admission+records`);
  } catch (err) {
    console.error(err);
    res.redirect('/admissions?error=Failed+to+process+bulk+upload');
  }
};

// --- STUDENTS MANAGEMENT ---

exports.getStudents = async (req, res) => {
  try {
    const { search, course, year } = req.query;
    const where = {};

    if (course && course !== 'all') {
      where.course = { [Op.like]: `%${course}%` };
    }
    if (year && year !== 'all') {
      where.year = parseInt(year);
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
      order: [['studentId', 'ASC']]
    });

    res.render('students', {
      pageTitle: 'Student Directory & Management — CAMPUS AI',
      students,
      search: search || '',
      course: course || 'all',
      year: year || 'all',
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/500', { pageTitle: 'Error', message: 'Failed to load students.' });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { name, email, phone, course, year, semester, section, address, guardianName, guardianPhone } = req.body;

    const count = await Student.count();
    const studentId = req.body.studentId || `CAI-2026-${String(count + 101).padStart(4, '0')}`;

    await Student.create({
      studentId,
      name,
      email,
      phone,
      course,
      year: parseInt(year) || 1,
      semester: parseInt(semester) || 1,
      section: section || 'A',
      address,
      guardianName,
      guardianPhone,
      status: 'Active'
    });

    res.redirect('/admissions/students?success=Student+added+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/admissions/students?error=Failed+to+add+student');
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, course, year, semester, section, address, status } = req.body;

    await Student.update(
      {
        name,
        email,
        phone,
        course,
        year: parseInt(year),
        semester: parseInt(semester),
        section,
        address,
        status: status || 'Active'
      },
      { where: { id } }
    );

    res.redirect('/admissions/students?success=Student+updated+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/admissions/students?error=Failed+to+update+student');
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    await Student.destroy({ where: { id } });
    res.redirect('/admissions/students?success=Student+deleted+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/admissions/students?error=Failed+to+delete+student');
  }
};

exports.bulkUploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.redirect('/admissions/students?error=Please+upload+a+valid+file');
    }

    const records = bulkService.parseSpreadsheet(req.file.path);
    let count = 0;

    for (const r of records) {
      if (r.name && r.email) {
        const studentId = r.studentId || `CAI-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        await Student.create({
          studentId,
          name: r.name,
          email: r.email,
          phone: r.phone || '',
          course: r.course || 'B.Tech CSE',
          year: parseInt(r.year) || 1,
          semester: parseInt(r.semester) || 1,
          section: r.section || 'A',
          status: 'Active'
        });
        count++;
      }
    }

    fs.unlinkSync(req.file.path);
    res.redirect(`/admissions/students?success=Imported+${count}+students+successfully`);
  } catch (err) {
    console.error(err);
    res.redirect('/admissions/students?error=Failed+to+process+bulk+upload');
  }
};

exports.bulkDeleteStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    if (studentIds && Array.isArray(studentIds)) {
      await Student.destroy({ where: { id: { [Op.in]: studentIds } } });
    }
    res.redirect('/admissions/students?success=Selected+students+deleted');
  } catch (err) {
    console.error(err);
    res.redirect('/admissions/students?error=Failed+to+delete+students');
  }
};
