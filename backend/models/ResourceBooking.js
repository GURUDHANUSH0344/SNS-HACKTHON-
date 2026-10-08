const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResourceBooking = sequelize.define('ResourceBooking', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  resourceId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  bookedBy: {
    type: DataTypes.STRING,
    defaultValue: 'Faculty / Department'
  },
  department: {
    type: DataTypes.STRING,
    defaultValue: 'Computer Science'
  },
  purpose: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dayOfWeek: {
    type: DataTypes.STRING,
    defaultValue: 'Wednesday'
  },
  date: {
    type: DataTypes.STRING,
    allowNull: true
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: false // e.g. "14:00"
  },
  endTime: {
    type: DataTypes.STRING,
    allowNull: false // e.g. "16:00"
  },
  expectedOccupancy: {
    type: DataTypes.INTEGER,
    defaultValue: 40
  },
  actualOccupancy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'confirmed' // confirmed, active, completed, cancelled, reallocated
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'resource_bookings'
});

module.exports = ResourceBooking;
