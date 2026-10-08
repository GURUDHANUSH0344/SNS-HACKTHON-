const { Exam, Student, Subject } = require('../models');
const { Op } = require('sequelize');
const bulkService = require('../services/bulkService');
const fs = require('fs');

function calculateGrade(percentage) {
  if (percentage >= 90) return 'O (Outstanding)';
  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B+';
  if (percentage >= 50) return 'B';
  if (percentage >= 40) return 'C (Pass)';
  return 'F (Fail/Remedial)';
}

exports.getExams = async (req, res) => {
  try {
    const { semester, subject, studentId, search } = req.query;
    const where = {};

    if (semester && semester !== 'all') {
      where.semester = parseInt(semester);
    }
    if (subject && subject !== 'all') {
      where.subjectName = subject;
    }
    if (studentId) {
      where.studentId = parseInt(studentId);
    }

    const exams = await Exam.findAll({
      where,
      include: [{ model: Student, as: 'student' }],
      order: [['examDate', 'DESC'], ['id', 'DESC']]
    });

    const students = await Student.findAll({ order: [['name', 'ASC']] });
    const subjects = await Subject.findAll({ order: [['name', 'ASC']] });

    res.render('exams', {
      pageTitle: 'Exam & Academic Performance Management — CAMPUS AI',
      exams,
      students,
      subjects,
      selectedSemester: semester || 'all',
      selectedSubject: subject || 'all',
      search: search || '',
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/500', { pageTitle: 'Error', message: 'Failed to load exams.' });
  }
};

exports.createExam = async (req, res) => {
  try {
    const { studentId, subjectName, examType, semester, marksObtained, maxMarks, examDate, remarks } = req.body;

    const obtained = parseFloat(marksObtained);
    const max = parseFloat(maxMarks) || 100;
    const percentage = Math.round((obtained / max) * 100);
    const grade = calculateGrade(percentage);

    await Exam.create({
      studentId: parseInt(studentId),
      subjectName,
      examType: examType || 'Mid Term',
      semester: parseInt(semester) || 5,
      marksObtained: obtained,
      maxMarks: max,
      percentage,
      grade,
      credits: 4,
      examDate: examDate || new Date().toISOString().slice(0, 10),
      remarks
    });

    res.redirect('/exams?success=Marks+recorded+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/exams?error=Failed+to+record+marks');
  }
};

exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { marksObtained, maxMarks, examType, remarks } = req.body;

    const obtained = parseFloat(marksObtained);
    const max = parseFloat(maxMarks) || 100;
    const percentage = Math.round((obtained / max) * 100);
    const grade = calculateGrade(percentage);

    await Exam.update(
      {
        marksObtained: obtained,
        maxMarks: max,
        percentage,
        grade,
        examType,
        remarks
      },
      { where: { id } }
    );

    res.redirect('/exams?success=Exam+record+updated+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/exams?error=Failed+to+update+exam');
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    await Exam.destroy({ where: { id } });
    res.redirect('/exams?success=Exam+record+deleted');
  } catch (err) {
    console.error(err);
    res.redirect('/exams?error=Failed+to+delete');
  }
};

exports.bulkUploadExams = async (req, res) => {
  try {
    if (!req.file) {
      return res.redirect('/exams?error=Please+upload+a+valid+Excel+file');
    }

    const records = bulkService.parseSpreadsheet(req.file.path);
    let count = 0;

    for (const r of records) {
      if (r.studentId && r.subjectName && r.marksObtained) {
        const student = await Student.findOne({ where: { studentId: String(r.studentId) } });
        const sId = student ? student.id : parseInt(r.studentId);

        const obtained = parseFloat(r.marksObtained);
        const max = parseFloat(r.maxMarks) || 100;
        const percentage = Math.round((obtained / max) * 100);

        await Exam.create({
          studentId: sId,
          subjectName: r.subjectName,
          examType: r.examType || 'Semester Exam',
          semester: parseInt(r.semester) || 5,
          marksObtained: obtained,
          maxMarks: max,
          percentage,
          grade: calculateGrade(percentage),
          credits: parseInt(r.credits) || 4,
          examDate: r.examDate || new Date().toISOString().slice(0, 10)
        });
        count++;
      }
    }

    fs.unlinkSync(req.file.path);
    res.redirect(`/exams?success=Bulk+imported+${count}+exam+scores+successfully`);
  } catch (err) {
    console.error(err);
    res.redirect('/exams?error=Failed+to+import+exams');
  }
};
