const sequelize = require('../config/database');

const User = require('./User');
const Student = require('./Student');
const Admission = require('./Admission');
const Subject = require('./Subject');
const Exam = require('./Exam');
const Fee = require('./Fee');
const Hostel = require('./Hostel');
const Attendance = require('./Attendance');
const Assignment = require('./Assignment');
const StudentAssignment = require('./StudentAssignment');
const Quiz = require('./Quiz');
const QuizAttempt = require('./QuizAttempt');
const LearningPath = require('./LearningPath');
const SmartNotification = require('./SmartNotification');
const CampusEntity = require('./CampusEntity');
const StudentGamification = require('./StudentGamification');
const AIReport = require('./AIReport');
const Department = require('./Department');
const DepartmentStaff = require('./DepartmentStaff');
const CampusProblem = require('./CampusProblem');
const ProblemComment = require('./ProblemComment');
const ProblemStatusHistory = require('./ProblemStatusHistory');
const FacultyProfile = require('./FacultyProfile');
const ClassSchedule = require('./ClassSchedule');
const QuestionPaper = require('./QuestionPaper');
const Announcement = require('./Announcement');
const Resource = require('./Resource');
const ResourceBooking = require('./ResourceBooking');
const ResourceUsage = require('./ResourceUsage');
const ResourceMaintenance = require('./ResourceMaintenance');
const ResourceRecommendation = require('./ResourceRecommendation');
const ResourceAllocationLog = require('./ResourceAllocationLog');
const ResourceSimulation = require('./ResourceSimulation');

// User <-> Student (Optional 1:1 linkage)
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile', onDelete: 'CASCADE' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'userAccount' });

// Student -> Exam
Student.hasMany(Exam, { foreignKey: 'studentId', as: 'exams', onDelete: 'CASCADE' });
Exam.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Student -> Fee
Student.hasMany(Fee, { foreignKey: 'studentId', as: 'fees', onDelete: 'CASCADE' });
Fee.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Student -> Hostel
Student.hasOne(Hostel, { foreignKey: 'studentId', as: 'hostelAllocation' });
Hostel.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Student -> Attendance
Student.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendanceRecords', onDelete: 'CASCADE' });
Attendance.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Student -> QuizAttempt
Student.hasMany(QuizAttempt, { foreignKey: 'studentId', as: 'quizAttempts', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Student -> LearningPath
Student.hasMany(LearningPath, { foreignKey: 'studentId', as: 'learningPaths', onDelete: 'CASCADE' });
LearningPath.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Student -> SmartNotification
Student.hasMany(SmartNotification, { foreignKey: 'studentId', as: 'notifications', onDelete: 'CASCADE' });
SmartNotification.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Student -> StudentGamification
Student.hasOne(StudentGamification, { foreignKey: 'studentId', as: 'gamification', onDelete: 'CASCADE' });
StudentGamification.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// User -> FacultyProfile
User.hasOne(FacultyProfile, { foreignKey: 'userId', as: 'facultyProfile', onDelete: 'CASCADE' });
FacultyProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> ClassSchedule
User.hasMany(ClassSchedule, { foreignKey: 'userId', as: 'classSchedules' });
ClassSchedule.belongsTo(User, { foreignKey: 'userId', as: 'instructor' });

// User -> QuestionPaper
User.hasMany(QuestionPaper, { foreignKey: 'userId', as: 'questionPapers' });
QuestionPaper.belongsTo(User, { foreignKey: 'userId', as: 'creator' });

// User -> Announcement
User.hasMany(Announcement, { foreignKey: 'authorId', as: 'announcements' });
Announcement.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Quiz -> QuizAttempt
Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId', as: 'attempts', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

// Assignment -> StudentAssignment
Assignment.hasMany(StudentAssignment, { foreignKey: 'assignmentId', as: 'submissions', onDelete: 'CASCADE' });
StudentAssignment.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });

Student.hasMany(StudentAssignment, { foreignKey: 'studentId', as: 'assignments', onDelete: 'CASCADE' });
StudentAssignment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Department -> DepartmentStaff
Department.hasMany(DepartmentStaff, { foreignKey: 'departmentId', as: 'staffMembers', onDelete: 'CASCADE' });
DepartmentStaff.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

// Department -> CampusProblem
Department.hasMany(CampusProblem, { foreignKey: 'departmentId', as: 'problems' });
CampusProblem.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

// CampusProblem -> ProblemComment
CampusProblem.hasMany(ProblemComment, { foreignKey: 'problemId', as: 'comments', onDelete: 'CASCADE' });
ProblemComment.belongsTo(CampusProblem, { foreignKey: 'problemId', as: 'problem' });

// CampusProblem -> ProblemStatusHistory
CampusProblem.hasMany(ProblemStatusHistory, { foreignKey: 'problemId', as: 'history', onDelete: 'CASCADE' });
ProblemStatusHistory.belongsTo(CampusProblem, { foreignKey: 'problemId', as: 'problem' });

// Resource Associations
Resource.hasMany(ResourceBooking, { foreignKey: 'resourceId', as: 'bookings', onDelete: 'CASCADE' });
ResourceBooking.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' });

Resource.hasMany(ResourceUsage, { foreignKey: 'resourceId', as: 'usageRecords', onDelete: 'CASCADE' });
ResourceUsage.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' });

Resource.hasMany(ResourceMaintenance, { foreignKey: 'resourceId', as: 'maintenanceRecords', onDelete: 'CASCADE' });
ResourceMaintenance.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' });

Resource.hasMany(ResourceRecommendation, { foreignKey: 'resourceId', as: 'recommendations', onDelete: 'CASCADE' });
ResourceRecommendation.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' });

Resource.hasMany(ResourceAllocationLog, { foreignKey: 'resourceId', as: 'allocationLogs', onDelete: 'CASCADE' });
ResourceAllocationLog.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' });
ResourceAllocationLog.belongsTo(Resource, { foreignKey: 'previousResourceId', as: 'previousResource' });

module.exports = {
  sequelize,
  User,
  Student,
  Admission,
  Subject,
  Exam,
  Fee,
  Hostel,
  Attendance,
  Assignment,
  StudentAssignment,
  Quiz,
  QuizAttempt,
  LearningPath,
  SmartNotification,
  CampusEntity,
  StudentGamification,
  AIReport,
  Department,
  DepartmentStaff,
  CampusProblem,
  ProblemComment,
  ProblemStatusHistory,
  FacultyProfile,
  ClassSchedule,
  QuestionPaper,
  Announcement,
  Resource,
  ResourceBooking,
  ResourceUsage,
  ResourceMaintenance,
  ResourceRecommendation,
  ResourceAllocationLog,
  ResourceSimulation
};

