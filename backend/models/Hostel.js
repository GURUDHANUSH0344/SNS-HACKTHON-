const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Hostel = sequelize.define('Hostel', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  block: {
    type: DataTypes.STRING,
    allowNull: false
  },
  roomNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bedNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  roomType: {
    type: DataTypes.STRING,
    defaultValue: 'Non-AC 2-Sharing'
  },
  rentPerMonth: {
    type: DataTypes.FLOAT,
    defaultValue: 6500
  },
  status: {
    type: DataTypes.ENUM('Occupied', 'Vacant', 'Maintenance'),
    defaultValue: 'Vacant'
  },
  checkInDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  checkOutDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'hostels'
});

module.exports = Hostel;
