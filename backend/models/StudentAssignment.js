const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentAssignment = sequelize.define('StudentAssignment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  submissionText: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Submitted', 'Graded', 'Late'),
    defaultValue: 'Submitted'
  }
}, {
  timestamps: true,
  tableName: 'student_assignments'
});

module.exports = StudentAssignment;
