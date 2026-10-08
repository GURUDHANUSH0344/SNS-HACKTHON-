const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DepartmentStaff = sequelize.define('DepartmentStaff', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: false
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
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'Support Officer'
  },
  specialization: {
    type: DataTypes.STRING,
    defaultValue: 'General Maintenance'
  },
  contactNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'department_staff'
});

module.exports = DepartmentStaff;
