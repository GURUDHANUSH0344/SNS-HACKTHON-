const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SmartNotification = sequelize.define('SmartNotification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('attendance', 'fee', 'assignment', 'exam', 'ai', 'campus', 'general'),
    defaultValue: 'general'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  actionUrl: {
    type: DataTypes.STRING,
    defaultValue: '#'
  }
}, {
  timestamps: true,
  tableName: 'smart_notifications'
});

module.exports = SmartNotification;
