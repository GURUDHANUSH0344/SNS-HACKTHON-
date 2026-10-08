const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

/**
 * Send an email notification with safe fallback
 */
async function sendEmail({ to, subject, html, text }) {
  if (!transporter) {
    console.log(`[CAMPUS AI Mock Email Dispatch] To: ${to} | Subject: ${subject}`);
    return { success: true, mocked: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"CAMPUS AI Ecosystem" <${process.env.EMAIL_USER || 'no-reply@campusai.edu'}>`,
      to,
      subject,
      text: text || '',
      html: html || `<p>${text}</p>`
    });
    console.log('[CAMPUS AI Email Sent]:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn('[CAMPUS AI Email Warning]: Failed to send email via SMTP, fallback to console:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Admission Decision Email
 */
async function sendAdmissionDecision(applicant, status, remarks = '') {
  const isApproved = status === 'approved';
  const subject = isApproved
    ? 'Congratulations! Admission Approved — CAMPUS AI Ecosystem'
    : 'Update on Your Admission Application — CAMPUS AI Ecosystem';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="background-color: #2563eb; padding: 15px; border-radius: 6px; text-align: center; color: #fff;">
        <h2 style="margin: 0;">CAMPUS AI</h2>
        <p style="margin: 5px 0 0; font-size: 13px;">Intelligent Digital Campus Ecosystem</p>
      </div>
      <div style="padding: 20px 0; color: #111827;">
        <h3>Dear ${applicant.name},</h3>
        ${
          isApproved
            ? `<p>We are delighted to inform you that your application (<strong>${applicant.applicationNo}</strong>) for <strong>${applicant.course}</strong> has been <strong>APPROVED</strong>!</p>
               <p>Your official student enrollment account has been generated on the <strong>CAMPUS AI</strong> portal. Please log in using your registered email address to access your schedule, hostel allocation, and digital identity card.</p>`
            : `<p>Thank you for your interest in our institution. We regret to inform you that after careful review of application (<strong>${applicant.applicationNo}</strong>), we are unable to offer you admission for the current academic session.</p>`
        }
        ${remarks ? `<div style="background: #f8fafc; padding: 12px; border-left: 4px solid #2563eb; margin: 15px 0;"><strong>Remarks:</strong> ${remarks}</div>` : ''}
        <p style="margin-top: 25px;">Warm regards,<br><strong>Office of Admissions & Academic Governance</strong><br>CAMPUS AI</p>
      </div>
    </div>
  `;

  return sendEmail({ to: applicant.email, subject, html });
}

/**
 * Send Fee Reminder Email
 */
async function sendFeeReminder(student, fee) {
  const subject = `Fee Payment Reminder: ${fee.title} Due on ${fee.dueDate} — CAMPUS AI`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="background-color: #2563eb; padding: 15px; border-radius: 6px; text-align: center; color: #fff;">
        <h2 style="margin: 0;">CAMPUS AI</h2>
        <p style="margin: 5px 0 0; font-size: 13px;">Finance & Fee Governance Cell</p>
      </div>
      <div style="padding: 20px 0; color: #111827;">
        <h3>Dear ${student.name},</h3>
        <p>This is a polite reminder regarding your pending fee invoice for <strong>${fee.title}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; background: #f8fafc;"><strong>Invoice No</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${fee.invoiceNo}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; background: #f8fafc;"><strong>Total Amount</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">₹ ${fee.amount}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; background: #f8fafc;"><strong>Due Date</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${fee.dueDate}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; background: #f8fafc;"><strong>Current Status</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #ef4444; font-weight: bold;">${fee.status}</td></tr>
        </table>
        <p>Please log in to your <strong>Student Portal</strong> to pay online and instantly generate your digital PDF receipt.</p>
        <p style="margin-top: 25px;">Sincerely,<br><strong>Finance Department</strong><br>CAMPUS AI</p>
      </div>
    </div>
  `;

  return sendEmail({ to: student.email, subject, html });
}

module.exports = {
  sendEmail,
  sendAdmissionDecision,
  sendFeeReminder
};
