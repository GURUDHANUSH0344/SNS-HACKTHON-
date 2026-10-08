const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Exam = sequelize.define('Exam', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  subjectName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  examType: {
    type: DataTypes.STRING,
    defaultValue: 'Mid Term'
  },
  semester: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  marksObtained: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  maxMarks: {
    type: DataTypes.FLOAT,
    defaultValue: 100
  },
  percentage: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  grade: {
    type: DataTypes.STRING,
    defaultValue: 'A'
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 4
  },
  examDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'exams'
});

module.exports = Exam;
