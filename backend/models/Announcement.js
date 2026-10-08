const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Announcement = sequelize.define('Announcement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  authorName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  targetAudience: {
    type: DataTypes.ENUM('All', 'Students', 'Faculty', 'Department'),
    defaultValue: 'All'
  },
  priority: {
    type: DataTypes.ENUM('Normal', 'High', 'Urgent'),
    defaultValue: 'Normal'
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'announcements'
});

module.exports = Announcement;
