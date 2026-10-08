const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Fee = sequelize.define('Fee', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  invoiceNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  paidAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Paid', 'Unpaid', 'Partial', 'Overdue'),
    defaultValue: 'Unpaid'
  },
  receiptUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'fees'
});

module.exports = Fee;
