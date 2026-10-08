const { Fee, Student } = require('../models');
const { Op } = require('sequelize');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');
const bulkService = require('../services/bulkService');
const fs = require('fs');

exports.getFees = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    const fees = await Fee.findAll({
      where,
      include: [{ model: Student, as: 'student' }],
      order: [['dueDate', 'ASC'], ['id', 'DESC']]
    });

    const students = await Student.findAll({ order: [['name', 'ASC']] });

    // Aggregate statistics
    const allFees = await Fee.findAll();
    const totalAmount = allFees.reduce((acc, f) => acc + (f.amount || 0), 0);
    const totalCollected = allFees.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
    const pendingAmount = totalAmount - totalCollected;
    const overdueCount = allFees.filter(f => f.status === 'Overdue').length;

    res.render('fees', {
      pageTitle: 'Fee Management & Invoicing — CAMPUS AI',
      fees,
      students,
      totalAmount,
      totalCollected,
      pendingAmount,
      overdueCount,
      selectedStatus: status || 'all',
      search: search || '',
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/500', { pageTitle: 'Error', message: 'Failed to load fee records.' });
  }
};

exports.createFee = async (req, res) => {
  try {
    const { studentId, title, amount, dueDate, remarks } = req.body;
    const count = await Fee.count();
    const invoiceNo = `INV-2026-${String(count + 1050).padStart(4, '0')}`;

    await Fee.create({
      studentId: parseInt(studentId),
      invoiceNo,
      title,
      amount: parseFloat(amount),
      paidAmount: 0,
      dueDate,
      status: 'Unpaid',
      remarks
    });

    res.redirect('/fees?success=Fee+invoice+created+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/fees?error=Failed+to+create+fee+invoice');
  }
};

exports.payFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paidAmount, remarks } = req.body;
    const fee = await Fee.findByPk(id, { include: [{ model: Student, as: 'student' }] });

    if (!fee) {
      return res.redirect('/fees?error=Fee+record+not+found');
    }

    const newPayment = parseFloat(paidAmount) || (fee.amount - fee.paidAmount);
    const totalPaid = fee.paidAmount + newPayment;
    let newStatus = 'Paid';
    if (totalPaid < fee.amount) {
      newStatus = 'Partial';
    }

    fee.paidAmount = totalPaid;
    fee.paymentMethod = paymentMethod || 'Online UPI';
    fee.paymentDate = new Date().toISOString().slice(0, 10);
    fee.status = newStatus;
    fee.receiptUrl = `/fees/${fee.id}/receipt`;
    if (remarks) fee.remarks = remarks;
    await fee.save();

    if (req.xhr) {
      return res.json({ success: true, message: 'Payment recorded successfully.', fee });
    }

    // Role-sensitive redirection
    if (req.user && req.user.role === 'student') {
      return res.redirect('/student/fees?success=Payment+successful!+Digital+receipt+generated.');
    }
    res.redirect('/fees?success=Payment+recorded+successfully');
  } catch (err) {
    console.error(err);
    if (req.xhr) return res.status(500).json({ success: false, message: 'Failed to record payment.' });
    res.redirect('/fees?error=Failed+to+record+payment');
  }
};

exports.updateFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, dueDate, status, remarks } = req.body;

    await Fee.update(
      {
        title,
        amount: parseFloat(amount),
        dueDate,
        status,
        remarks
      },
      { where: { id } }
    );

    res.redirect('/fees?success=Fee+updated+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/fees?error=Failed+to+update+fee');
  }
};

exports.deleteFee = async (req, res) => {
  try {
    const { id } = req.params;
    await Fee.destroy({ where: { id } });
    res.redirect('/fees?success=Fee+record+deleted');
  } catch (err) {
    console.error(err);
    res.redirect('/fees?error=Failed+to+delete');
  }
};

exports.getReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const fee = await Fee.findByPk(id, { include: [{ model: Student, as: 'student' }] });

    if (!fee) {
      return res.status(404).send('Invoice not found');
    }

    pdfService.generateFeeReceipt(fee, fee.student, res);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating fee receipt PDF');
  }
};

exports.sendReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const fee = await Fee.findByPk(id, { include: [{ model: Student, as: 'student' }] });

    if (!fee || !fee.student) {
      return res.redirect('/fees?error=Student+or+fee+record+not+found');
    }

    await emailService.sendFeeReminder(fee.student, fee);

    if (req.xhr) {
      return res.json({ success: true, message: `Fee reminder dispatched to ${fee.student.email}` });
    }
    res.redirect('/fees?success=Fee+reminder+dispatched+successfully');
  } catch (err) {
    console.error(err);
    if (req.xhr) return res.status(500).json({ success: false, message: 'Failed to send reminder' });
    res.redirect('/fees?error=Failed+to+send+reminder');
  }
};

exports.bulkUploadFees = async (req, res) => {
  try {
    if (!req.file) {
      return res.redirect('/fees?error=Please+upload+a+valid+Excel+file');
    }

    const records = bulkService.parseSpreadsheet(req.file.path);
    let count = 0;

    for (const r of records) {
      if (r.studentId && r.title && r.amount) {
        const student = await Student.findOne({ where: { studentId: String(r.studentId) } });
        const sId = student ? student.id : parseInt(r.studentId);
        const invoiceNo = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

        await Fee.create({
          studentId: sId,
          invoiceNo,
          title: r.title,
          amount: parseFloat(r.amount),
          paidAmount: parseFloat(r.paidAmount) || 0,
          dueDate: r.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
          status: r.status || 'Unpaid'
        });
        count++;
      }
    }

    fs.unlinkSync(req.file.path);
    res.redirect(`/fees?success=Imported+${count}+fee+invoices+successfully`);
  } catch (err) {
    console.error(err);
    res.redirect('/fees?error=Failed+to+import+fees');
  }
};

exports.bulkDeleteFees = async (req, res) => {
  try {
    const { feeIds } = req.body;
    if (feeIds && Array.isArray(feeIds)) {
      await Fee.destroy({ where: { id: { [Op.in]: feeIds } } });
    }
    res.redirect('/fees?success=Selected+fees+deleted');
  } catch (err) {
    console.error(err);
    res.redirect('/fees?error=Failed+to+delete+fees');
  }
};
