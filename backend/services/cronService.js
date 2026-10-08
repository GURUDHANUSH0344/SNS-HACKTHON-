const cron = require('node-cron');
const { Fee, Student, Attendance, SmartNotification, sequelize } = require('../models');
const { Op } = require('sequelize');

function initCronJobs() {
  console.log('[CAMPUS AI Cron] Initializing scheduled campus intelligence tasks...');

  // Daily at 00:05 - Scan overdue fees
  cron.schedule('5 0 * * *', async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [updatedCount] = await Fee.update(
        { status: 'Overdue' },
        {
          where: {
            dueDate: { [Op.lt]: today },
            status: { [Op.in]: ['Unpaid', 'Partial'] }
          }
        }
      );
      if (updatedCount > 0) {
        console.log(`[CAMPUS AI Cron] Marked ${updatedCount} fees as Overdue.`);
      }
    } catch (err) {
      console.error('[CAMPUS AI Cron Error - Fee Scan]:', err.message);
    }
  });

  // Daily at 01:00 - Scan student attendance shortages and generate smart notifications
  cron.schedule('0 1 * * *', async () => {
    try {
      const students = await Student.findAll();
      for (const student of students) {
        const total = await Attendance.count({ where: { studentId: student.id } });
        if (total > 0) {
          const present = await Attendance.count({
            where: { studentId: student.id, status: { [Op.in]: ['Present', 'Late'] } }
          });
          const percentage = Math.round((present / total) * 100);
          if (percentage < 75) {
            // Check if alert already sent in last 48h
            const exists = await SmartNotification.findOne({
              where: {
                studentId: student.id,
                category: 'attendance',
                createdAt: { [Op.gte]: new Date(Date.now() - 48 * 60 * 60 * 1000) }
              }
            });
            if (!exists) {
              await SmartNotification.create({
                studentId: student.id,
                title: 'Attendance Shortage Alert (<75%)',
                message: `Your aggregate attendance is currently at ${percentage}%. You need to attend consecutive upcoming lectures to ensure examination eligibility.`,
                category: 'attendance',
                priority: percentage < 65 ? 'critical' : 'high',
                actionUrl: '/ai/attendance-intelligence'
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('[CAMPUS AI Cron Error - Attendance Scan]:', err.message);
    }
  });
}

module.exports = { initCronJobs };
