const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  course: {
    type: DataTypes.STRING,
    defaultValue: 'B.Tech Computer Science & Engineering'
  },
  year: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  semester: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  section: {
    type: DataTypes.STRING,
    defaultValue: 'A'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  guardianName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guardianPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Alumni', 'Suspended'),
    defaultValue: 'Active'
  },
  enrollmentDate: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'students'
});

module.exports = Student;
