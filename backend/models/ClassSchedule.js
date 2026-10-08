const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClassSchedule = sequelize.define('ClassSchedule', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  facultyId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  subjectName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dayOfWeek: {
    type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
    allowNull: false
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: false
  },
  endTime: {
    type: DataTypes.STRING,
    allowNull: false
  },
  classroom: {
    type: DataTypes.STRING,
    defaultValue: 'LH-102'
  },
  department: {
    type: DataTypes.STRING,
    defaultValue: 'CSE'
  },
  year: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  section: {
    type: DataTypes.STRING,
    defaultValue: 'A'
  },
  studentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  }
}, {
  timestamps: true,
  tableName: 'class_schedules'
});

module.exports = ClassSchedule;
