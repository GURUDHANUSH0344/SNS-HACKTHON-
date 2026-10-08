const bcrypt = require('bcryptjs');
const {
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
  Announcement
} = require('../models');

async function seedDatabase() {
  try {
    console.log('[CAMPUS AI] Synchronizing database tables...');
    await sequelize.sync({ force: false });

    // Check if admin user already exists
    const adminExists = await User.findOne({ where: { email: 'admin@campusai.edu' } });
    if (adminExists) {
      console.log('[CAMPUS AI] Database already seeded. Skipping initial seeding.');
      return;
    }

    console.log('[CAMPUS AI] Seeding database with production initial datasets...');

    // 1. Password Hashing
    const adminPass = await bcrypt.hash('admin123', 10);
    const facultyPass = await bcrypt.hash('faculty123', 10);
    const studentPass = await bcrypt.hash('student123', 10);

    // 2. Create Core Users
    const adminUser = await User.create({
      name: 'Dr. Arthur Vance (Dean/Admin)',
      email: 'admin@campusai.edu',
      password: adminPass,
      role: 'admin',
      status: 'active',
      department: 'Academic Administration',
      avatar: '/images/avatar-admin.png'
    });

    const facultyUser = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'faculty@campusai.edu',
      password: facultyPass,
      role: 'teacher',
      status: 'active',
      department: 'Computer Science & Engineering',
      avatar: '/images/avatar-faculty.png'
    });

    const studentUser = await User.create({
      name: 'Farhan Akhtar',
      email: 'student@campusai.edu',
      password: studentPass,
      role: 'student',
      status: 'active',
      department: 'Computer Science & Engineering',
      avatar: '/images/avatar-student.png'
    });

    // 3. Create Faculty Profile
    await FacultyProfile.create({
      userId: facultyUser.id,
      employeeId: 'EMP-CSE-042',
      name: 'Dr. Sarah Jenkins',
      department: 'Computer Science & Engineering',
      designation: 'Associate Professor & AI Research Lead',
      qualification: 'Ph.D. in Artificial Intelligence & Robotics',
      specialization: 'Deep Learning, System Design, Algorithms',
      officeLocation: 'Academic Complex Block B, Room 304',
      phone: '+91 98765 43210',
      bio: 'Leading the Smart Campus AI Initiative and guiding undergraduate cohorts in advanced machine learning and data engineering.'
    });

    // 4. Create Subjects (Section 83 Requirement)
    const subjectList = [
      { code: 'CS101', name: 'Mathematics I', department: 'Basic Sciences', semester: 1, credits: 4 },
      { code: 'CS102', name: 'Physics', department: 'Basic Sciences', semester: 1, credits: 4 },
      { code: 'CS103', name: 'Chemistry', department: 'Basic Sciences', semester: 1, credits: 3 },
      { code: 'CS104', name: 'Programming in C', department: 'Computer Science & Engineering', semester: 2, credits: 4 },
      { code: 'CS201', name: 'Data Structures', department: 'Computer Science & Engineering', semester: 3, credits: 4 },
      { code: 'CS202', name: 'Algorithms', department: 'Computer Science & Engineering', semester: 4, credits: 4 },
      { code: 'CS301', name: 'Database Management', department: 'Computer Science & Engineering', semester: 5, credits: 4 },
      { code: 'CS302', name: 'Operating Systems', department: 'Computer Science & Engineering', semester: 5, credits: 4 },
      { code: 'CS303', name: 'Computer Networks', department: 'Computer Science & Engineering', semester: 5, credits: 4 },
      { code: 'CS304', name: 'Software Engineering', department: 'Computer Science & Engineering', semester: 6, credits: 3 },
      { code: 'CS401', name: 'Machine Learning', department: 'Computer Science & Engineering', semester: 7, credits: 4 },
      { code: 'CS402', name: 'Artificial Intelligence', department: 'Computer Science & Engineering', semester: 7, credits: 4 }
    ];
    const createdSubjects = await Subject.bulkCreate(subjectList);

    // 5. Create Students
    const studentFarhan = await Student.create({
      studentId: 'CAI-2023-0101',
      userId: studentUser.id,
      name: 'Farhan Akhtar',
      email: 'student@campusai.edu',
      phone: '+91 98451 23456',
      course: 'B.Tech Computer Science & Engineering',
      year: 3,
      semester: 5,
      section: 'A',
      address: 'Hostel Block A, Room 204, Campus AI Residential Park',
      guardianName: 'Rahim Akhtar',
      guardianPhone: '+91 98451 99999',
      status: 'Active',
      enrollmentDate: '2023-08-01'
    });

    const student2 = await Student.create({
      studentId: 'CAI-2023-0102',
      name: 'Priya Sharma',
      email: 'priya.sharma@campusai.edu',
      phone: '+91 98112 34567',
      course: 'B.Tech Computer Science & Engineering',
      year: 3,
      semester: 5,
      section: 'A',
      address: '22 Park Lane, Tech Enclave',
      guardianName: 'Sunil Sharma',
      guardianPhone: '+91 98112 88888',
      status: 'Active',
      enrollmentDate: '2023-08-01'
    });

    const student3 = await Student.create({
      studentId: 'CAI-2023-0103',
      name: 'Aarav Patel',
      email: 'aarav.patel@campusai.edu',
      phone: '+91 98223 45678',
      course: 'B.Tech Computer Science & Engineering',
      year: 3,
      semester: 5,
      section: 'A',
      address: 'Hostel Block B, Room 108',
      guardianName: 'Kishore Patel',
      guardianPhone: '+91 98223 77777',
      status: 'Active',
      enrollmentDate: '2023-08-01'
    });

    const student4 = await Student.create({
      studentId: 'CAI-2023-0104',
      name: 'Ananya Roy',
      email: 'ananya.roy@campusai.edu',
      phone: '+91 98334 56789',
      course: 'B.Tech Computer Science & Engineering',
      year: 3,
      semester: 5,
      section: 'B',
      address: 'Hostel Block C, Room 312',
      guardianName: 'Debashis Roy',
      guardianPhone: '+91 98334 66666',
      status: 'Active',
      enrollmentDate: '2023-08-01'
    });

    // 6. Create Admissions (Pending, Approved, Rejected)
    await Admission.bulkCreate([
      {
        applicationNo: 'ADM-2026-8801',
        name: 'Rohan Mehra',
        email: 'rohan.mehra@gmail.com',
        phone: '+91 97112 33445',
        course: 'B.Tech Artificial Intelligence & Data Science',
        marksPercentage: 92.5,
        status: 'pending',
        remarks: 'Candidate has outstanding mathematics and physics scores.'
      },
      {
        applicationNo: 'ADM-2026-8802',
        name: 'Sneha Kulkarni',
        email: 'sneha.k@gmail.com',
        phone: '+91 97223 44556',
        course: 'B.Tech Computer Science & Engineering',
        marksPercentage: 94.0,
        status: 'approved',
        remarks: 'Direct merit seat approved by Admissions Dean.'
      },
      {
        applicationNo: 'ADM-2026-8803',
        name: 'Vikram Singh',
        email: 'vikram.singh@gmail.com',
        phone: '+91 97334 55667',
        course: 'B.Tech Electronics & Communication',
        marksPercentage: 68.0,
        status: 'rejected',
        remarks: 'Did not meet the prerequisite cutoff for Tier 1 engineering entrance.'
      }
    ]);

    // 7. Create Exams & Marks for Farhan & others
    await Exam.bulkCreate([
      {
        studentId: studentFarhan.id,
        subjectId: createdSubjects[4].id,
        subjectName: 'Data Structures',
        examType: 'Mid Term Exam',
        semester: 5,
        marksObtained: 88,
        maxMarks: 100,
        percentage: 88,
        grade: 'A+',
        credits: 4,
        examDate: '2026-09-15',
        remarks: 'Excellent algorithmic efficiency and code cleanliness.'
      },
      {
        studentId: studentFarhan.id,
        subjectId: createdSubjects[6].id,
        subjectName: 'Database Management',
        examType: 'Mid Term Exam',
        semester: 5,
        marksObtained: 84,
        maxMarks: 100,
        percentage: 84,
        grade: 'A',
        credits: 4,
        examDate: '2026-09-18',
        remarks: 'Strong relational modeling and query optimization.'
      },
      {
        studentId: studentFarhan.id,
        subjectId: createdSubjects[7].id,
        subjectName: 'Operating Systems',
        examType: 'Mid Term Exam',
        semester: 5,
        marksObtained: 72,
        maxMarks: 100,
        percentage: 72,
        grade: 'B+',
        credits: 4,
        examDate: '2026-09-22',
        remarks: 'Needs review on semaphore synchronization and kernel paging.'
      },
      {
        studentId: studentFarhan.id,
        subjectId: createdSubjects[8].id,
        subjectName: 'Computer Networks',
        examType: 'Mid Term Exam',
        semester: 5,
        marksObtained: 80,
        maxMarks: 100,
        percentage: 80,
        grade: 'A',
        credits: 4,
        examDate: '2026-09-25',
        remarks: 'Good grasp of TCP/IP handshakes and routing algorithms.'
      },
      // Semester 1
      { studentId: studentFarhan.id, subjectName: 'Mathematics I', examType: 'End Term Examination', semester: 1, marksObtained: 86, maxMarks: 100, percentage: 86, grade: 'A', credits: 4, examDate: '2024-11-20', remarks: 'Strong foundation in calculus and linear algebra.' },
      { studentId: studentFarhan.id, subjectName: 'Physics', examType: 'End Term Examination', semester: 1, marksObtained: 82, maxMarks: 100, percentage: 82, grade: 'A', credits: 4, examDate: '2024-11-23', remarks: 'Good grasp of electromagnetism and wave optics.' },
      { studentId: studentFarhan.id, subjectName: 'Chemistry', examType: 'End Term Examination', semester: 1, marksObtained: 79, maxMarks: 100, percentage: 79, grade: 'B+', credits: 3, examDate: '2024-11-26', remarks: 'Consistent laboratory and theoretical performance.' },
      { studentId: studentFarhan.id, subjectName: 'Basic Electrical Engineering', examType: 'End Term Examination', semester: 1, marksObtained: 90, maxMarks: 100, percentage: 90, grade: 'A+', credits: 3, examDate: '2024-11-29', remarks: 'Outstanding circuit analysis capabilities.' },

      // Semester 2
      { studentId: studentFarhan.id, subjectName: 'Mathematics II', examType: 'End Term Examination', semester: 2, marksObtained: 84, maxMarks: 100, percentage: 84, grade: 'A', credits: 4, examDate: '2025-04-18', remarks: 'Proficient in differential equations and transforms.' },
      { studentId: studentFarhan.id, subjectName: 'Programming in C', examType: 'End Term Examination', semester: 2, marksObtained: 92, maxMarks: 100, percentage: 92, grade: 'A+', credits: 4, examDate: '2025-04-22', remarks: 'Exceptional procedural problem solving and pointer mastery.' },
      { studentId: studentFarhan.id, subjectName: 'Digital Logic & Design', examType: 'End Term Examination', semester: 2, marksObtained: 85, maxMarks: 100, percentage: 85, grade: 'A', credits: 4, examDate: '2025-04-25', remarks: 'Sound comprehension of Boolean circuits and counters.' },
      { studentId: studentFarhan.id, subjectName: 'Environmental Studies', examType: 'End Term Examination', semester: 2, marksObtained: 88, maxMarks: 100, percentage: 88, grade: 'A+', credits: 2, examDate: '2025-04-28', remarks: 'Comprehensive sustainability evaluation project.' },

      // Semester 3
      { studentId: studentFarhan.id, subjectName: 'Data Structures & Algorithms I', examType: 'End Term Examination', semester: 3, marksObtained: 91, maxMarks: 100, percentage: 91, grade: 'A+', credits: 4, examDate: '2025-11-15', remarks: 'Mastered linked lists, trees, and balanced graphs.' },
      { studentId: studentFarhan.id, subjectName: 'Object Oriented Programming (Java)', examType: 'End Term Examination', semester: 3, marksObtained: 87, maxMarks: 100, percentage: 87, grade: 'A', credits: 4, examDate: '2025-11-18', remarks: 'Robust design pattern and encapsulation implementation.' },
      { studentId: studentFarhan.id, subjectName: 'Discrete Mathematics', examType: 'End Term Examination', semester: 3, marksObtained: 80, maxMarks: 100, percentage: 80, grade: 'A', credits: 4, examDate: '2025-11-22', remarks: 'Clear logic proofs and combinatorics problem-solving.' },
      { studentId: studentFarhan.id, subjectName: 'Computer Organization & Architecture', examType: 'End Term Examination', semester: 3, marksObtained: 78, maxMarks: 100, percentage: 78, grade: 'B+', credits: 4, examDate: '2025-11-25', remarks: 'Solid understanding of CPU pipelining and cache hierarchy.' },

      // Semester 4
      { studentId: studentFarhan.id, subjectName: 'Design & Analysis of Algorithms', examType: 'End Term Examination', semester: 4, marksObtained: 89, maxMarks: 100, percentage: 89, grade: 'A+', credits: 4, examDate: '2026-04-12', remarks: 'Excellent dynamic programming and complexity analysis.' },
      { studentId: studentFarhan.id, subjectName: 'Software Engineering', examType: 'End Term Examination', semester: 4, marksObtained: 85, maxMarks: 100, percentage: 85, grade: 'A', credits: 3, examDate: '2026-04-16', remarks: 'Strong agile development and test automation artifacts.' },
      { studentId: studentFarhan.id, subjectName: 'Microprocessors & Interfacing', examType: 'End Term Examination', semester: 4, marksObtained: 82, maxMarks: 100, percentage: 82, grade: 'A', credits: 4, examDate: '2026-04-20', remarks: 'Good assembly programming and bus interfacing.' },
      { studentId: studentFarhan.id, subjectName: 'Theory of Computation', examType: 'End Term Examination', semester: 4, marksObtained: 86, maxMarks: 100, percentage: 86, grade: 'A', credits: 4, examDate: '2026-04-24', remarks: 'Deep comprehension of automata and Turing machines.' },
      {
        studentId: student2.id,
        subjectId: createdSubjects[4].id,
        subjectName: 'Data Structures',
        examType: 'Mid Term Exam',
        semester: 5,
        marksObtained: 94,
        maxMarks: 100,
        percentage: 94,
        grade: 'O (Outstanding)',
        credits: 4,
        examDate: '2026-09-15',
        remarks: 'Top score in cohort.'
      },
      {
        studentId: student3.id,
        subjectId: createdSubjects[4].id,
        subjectName: 'Data Structures',
        examType: 'Mid Term Exam',
        semester: 5,
        marksObtained: 46,
        maxMarks: 100,
        percentage: 46,
        grade: 'D',
        credits: 4,
        examDate: '2026-09-15',
        remarks: 'Remedial tutoring recommended.'
      }
    ]);

    // 8. Create Fees (₹ currency, Paid, Unpaid, Overdue)
    await Fee.bulkCreate([
      {
        studentId: studentFarhan.id,
        invoiceNo: 'INV-2026-0912',
        title: 'Semester 5 Tuition & Laboratory Fee',
        amount: 65000,
        paidAmount: 65000,
        dueDate: '2026-08-15',
        paymentDate: '2026-08-10',
        paymentMethod: 'UPI (Google Pay)',
        status: 'Paid',
        receiptUrl: '/fees/1/receipt',
        remarks: 'Paid in full on time.'
      },
      {
        studentId: studentFarhan.id,
        invoiceNo: 'INV-2026-1044',
        title: 'Odd Semester Examination & Digital Certification Fee',
        amount: 3500,
        paidAmount: 0,
        dueDate: '2026-10-25',
        paymentMethod: null,
        status: 'Unpaid',
        remarks: 'Upcoming university examination board registration.'
      },
      {
        studentId: student3.id,
        invoiceNo: 'INV-2026-0830',
        title: 'Hostel Accommodation & Dining Mess Fee',
        amount: 32000,
        paidAmount: 10000,
        dueDate: '2026-09-01',
        paymentDate: '2026-08-28',
        paymentMethod: 'Net Banking',
        status: 'Overdue',
        remarks: 'Partial payment received. Balance ₹22,000 overdue.'
      }
    ]);

    // 9. Create Hostel Allocations
    await Hostel.bulkCreate([
      {
        studentId: studentFarhan.id,
        block: 'Block A (Aryabhata)',
        roomNumber: 'A-204',
        bedNumber: 'Bed-1',
        roomType: 'Non-AC 2-Sharing',
        rentPerMonth: 6500,
        status: 'Occupied',
        checkInDate: '2026-08-01',
        remarks: 'Allocated for academic year 2026-27.'
      },
      {
        studentId: student3.id,
        block: 'Block B (Ramanujan)',
        roomNumber: 'B-108',
        bedNumber: 'Bed-2',
        roomType: 'Non-AC 3-Sharing',
        rentPerMonth: 5500,
        status: 'Occupied',
        checkInDate: '2026-08-01',
        remarks: 'Allocated.'
      },
      {
        studentId: null,
        block: 'Block A (Aryabhata)',
        roomNumber: 'A-205',
        bedNumber: 'Bed-1',
        roomType: 'Non-AC 2-Sharing',
        rentPerMonth: 6500,
        status: 'Vacant',
        remarks: 'Ready for new occupant.'
      },
      {
        studentId: null,
        block: 'Block C (Visvesvaraya)',
        roomNumber: 'C-301',
        bedNumber: 'Bed-1',
        roomType: 'AC 2-Sharing Deluxe',
        rentPerMonth: 8500,
        status: 'Vacant',
        remarks: 'Available.'
      }
    ]);

    // 10. Create Attendance records (Healthy 82% for Farhan, Shortage for Student 3)
    const attendanceDates = [
      '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05',
      '2026-10-06', '2026-10-07', '2026-10-08'
    ];

    for (const d of attendanceDates) {
      await Attendance.create({
        studentId: studentFarhan.id,
        subjectId: createdSubjects[4].id,
        subjectName: 'Data Structures',
        date: d,
        status: d === '2026-10-04' ? 'Absent' : 'Present',
        facultyId: facultyUser.id
      });

      await Attendance.create({
        studentId: studentFarhan.id,
        subjectId: createdSubjects[6].id,
        subjectName: 'Database Management',
        date: d,
        status: 'Present',
        facultyId: facultyUser.id
      });

      await Attendance.create({
        studentId: studentFarhan.id,
        subjectId: createdSubjects[7].id,
        subjectName: 'Operating Systems',
        date: d,
        status: d === '2026-10-02' || d === '2026-10-06' ? 'Absent' : 'Present',
        facultyId: facultyUser.id
      });

      // Student 3 with heavy absences (<60%)
      await Attendance.create({
        studentId: student3.id,
        subjectId: createdSubjects[4].id,
        subjectName: 'Data Structures',
        date: d,
        status: d === '2026-10-01' || d === '2026-10-03' ? 'Present' : 'Absent',
        facultyId: facultyUser.id
      });
    }

    // 11. Create Assignments & Submissions
    const asgn1 = await Assignment.create({
      facultyId: facultyUser.id,
      subjectId: createdSubjects[4].id,
      subjectName: 'Data Structures',
      title: 'Graph Traversal & Shortest Path Algorithms',
      description: 'Implement Dijkstra and A* pathfinding on weighted graphs with benchmark runtime comparison.',
      unit: 'Unit 3',
      dueDate: '2026-10-15',
      maxScore: 100,
      difficulty: 'Medium'
    });

    const asgn2 = await Assignment.create({
      facultyId: facultyUser.id,
      subjectId: createdSubjects[6].id,
      subjectName: 'Database Management',
      title: 'B-Tree Indexing and Query Execution Plans',
      description: 'Analyze EXPLAIN query plans on a 100,000 record university database and write tuning recommendations.',
      unit: 'Unit 4',
      dueDate: '2026-10-20',
      maxScore: 100,
      difficulty: 'Hard'
    });

    await StudentAssignment.create({
      assignmentId: asgn1.id,
      studentId: studentFarhan.id,
      submissionText: 'Implemented Dijkstra and A* in C++ with test graphs. Time complexity O((V+E)log V) achieved with priority queue.',
      status: 'Graded',
      score: 92,
      feedback: 'Excellent clean documentation and optimal asymptotic performance.'
    });

    // 12. Create Quizzes & Attempts
    const sampleQuestions = [
      {
        question: 'What is the worst-case time complexity of QuickSort when the pivot chosen is always the minimum or maximum element?',
        options: ['O(n log n)', 'O(n)', 'O(n^2)', 'O(log n)'],
        correctIndex: 2,
        explanation: 'Degenerate recursion partitioning leads to O(n^2) when an unbalanced pivot is picked consecutively.',
        topic: 'Sorting & Complexity'
      },
      {
        question: 'Which self-balancing binary search tree maintains a height difference factor of at most 1 between left and right subtrees?',
        options: ['Red-Black Tree', 'AVL Tree', 'B+ Tree', 'Splay Tree'],
        correctIndex: 1,
        explanation: 'AVL trees strictly enforce balance factor |BF| <= 1 via single and double rotations.',
        topic: 'Balanced Trees'
      },
      {
        question: 'In graph theory, which algorithm is optimal for finding strongly connected components in linear O(V + E) time?',
        options: ['Kruskal Algorithm', 'Tarjan Algorithm', 'Floyd-Warshall Algorithm', 'Prim Algorithm'],
        correctIndex: 1,
        explanation: 'Tarjan or Kosaraju algorithms detect SCCs via single DFS traversals with node discovery timestamps.',
        topic: 'Graph Algorithms'
      }
    ];

    const quiz1 = await Quiz.create({
      facultyId: facultyUser.id,
      subjectId: createdSubjects[4].id,
      subject: 'Data Structures',
      title: 'Advanced Graph & Tree Structures Master Quiz',
      unit: 'Unit 2 & 3',
      topic: 'Binary Search Trees & Graph Algorithms',
      difficulty: 'Medium',
      durationMinutes: 15,
      totalMarks: 30,
      questionsJson: JSON.stringify(sampleQuestions)
    });

    await QuizAttempt.create({
      quizId: quiz1.id,
      studentId: studentFarhan.id,
      score: 30,
      totalQuestions: 3,
      percentage: 100,
      answersJson: JSON.stringify([2, 1, 1]),
      weakTopicsJson: JSON.stringify([]),
      recommendations: 'Flawless performance! Ready for competitive programming and systems-level memory architecture.',
      xpEarned: 100
    });

    // 13. Create 7-Day AI Learning Path for Farhan
    const sampleLearningPlan = [
      {
        day: 1,
        title: 'Foundational Diagnostics & Concept Deconstruction',
        task: 'Review process synchronization primitives (Mutex, Semaphores, Monitors).',
        studyRecommendation: 'Read Silberschatz OS Chapter 6 & watch synchronization lecture.',
        practiceActivity: 'Identify deadlock conditions in classic Dining Philosophers problem.',
        completed: true
      },
      {
        day: 2,
        title: 'Producer-Consumer Boundary Visualization',
        task: 'Solve bounded buffer problem using counting and binary semaphores.',
        studyRecommendation: 'Trace race conditions step by step with thread scheduling switches.',
        practiceActivity: 'Implement multi-threaded producer consumer in C with POSIX pthreads.',
        completed: true
      },
      {
        day: 3,
        title: 'Deadlock Detection & Avoidance Mechanics',
        task: 'Master Bankers Algorithm safe-state verification matrix calculations.',
        studyRecommendation: 'Review resource allocation graphs and circular wait detection.',
        practiceActivity: 'Compute work and allocation vectors for 5 processes and 3 resource instances.',
        completed: false
      },
      {
        day: 4,
        title: 'Memory Management & Paging Architectures',
        task: 'Analyze Virtual Memory, Translation Lookaside Buffers (TLB), and Page Replacement.',
        studyRecommendation: 'Compare LRU, FIFO, and Optimal page replacement algorithms.',
        practiceActivity: 'Calculate effective memory access time given 90% TLB hit ratio.',
        completed: false
      },
      {
        day: 5,
        title: 'Virtual Memory Thrashing & Working Set Model',
        task: 'Investigate working set principle and page fault frequency mitigation.',
        studyRecommendation: 'Study Linux virtual memory sub-system and swap space handling.',
        practiceActivity: 'Write a simulation tracking page fault counts across 100 memory references.',
        completed: false
      },
      {
        day: 6,
        title: 'Mock University Exam & Problem Solving Session',
        task: 'Take timed 10-question MCQ and descriptive quiz on CAMPUS AI Quiz portal.',
        studyRecommendation: 'Review weak spots in error notebook with root-cause annotations.',
        practiceActivity: 'Retake flawed questions until reaching 100% conceptual mastery.',
        completed: false
      },
      {
        day: 7,
        title: 'Capstone Review & Exam Synthesis',
        task: 'Synthesize all synchronization and memory management principles.',
        studyRecommendation: 'Prepare a 5-minute explanation as if teaching the topic to a junior peer.',
        practiceActivity: 'Submit final progress certificate for bonus XP.',
        completed: false
      }
    ];

    await LearningPath.create({
      studentId: studentFarhan.id,
      subject: 'Operating Systems',
      weakTopic: 'Process Synchronization & Virtual Memory Paging',
      goal: 'Achieve 85%+ in end-semester operating systems examination',
      scheduleJson: JSON.stringify(sampleLearningPlan),
      progressPercentage: 28.5,
      status: 'Active'
    });

    // 14. Create Student Gamification (Growth Score & Badges)
    const sampleBadges = [
      { id: 'b1', title: 'Algorithmic Prodigy', icon: '🏆', description: 'Scored 100% on Advanced Graph & Tree Quiz', earnedAt: '2026-10-02' },
      { id: 'b2', title: 'Punctuality Sentinel', icon: '🛡️', description: 'Maintained 80%+ attendance for 4 consecutive weeks', earnedAt: '2026-10-05' },
      { id: 'b3', title: 'Knowledge Explorer', icon: '🚀', description: 'Completed first AI Learning Path milestone', earnedAt: '2026-10-07' }
    ];

    await StudentGamification.create({
      studentId: studentFarhan.id,
      totalXp: 850,
      level: 4,
      streakDays: 7,
      badgesJson: JSON.stringify(sampleBadges),
      growthScore: 88,
      academicConsistency: 86,
      quizMastery: 92,
      attendanceDiscipline: 82,
      careerReadiness: 84
    });

    // 15. Create Campus Directory Entities (Section 36)
    await CampusEntity.bulkCreate([
      {
        name: 'Turing Advanced Artificial Intelligence & High-Performance Lab',
        type: 'Laboratory',
        block: 'Block B (Computing Center)',
        floor: '3rd Floor',
        roomNumber: 'B-302',
        capacity: 70,
        inCharge: 'Dr. Sarah Jenkins',
        contactEmail: 'turing.lab@campusai.edu',
        operatingHours: '8:00 AM - 8:00 PM',
        description: 'Equipped with 60 high-performance GPU workstations for Machine Learning, Computer Vision, and Deep Neural Network research.',
        tagsJson: JSON.stringify(['GPU', 'AI Lab', 'Machine Learning', 'CUDA', 'Workstations'])
      },
      {
        name: 'Central Digital Library & Research Commons',
        type: 'Library',
        block: 'Central Academic Block',
        floor: 'Ground & 1st Floor',
        roomNumber: 'LIB-101',
        capacity: 450,
        inCharge: 'Dr. M. S. Raghavan',
        contactEmail: 'library@campusai.edu',
        operatingHours: '7:30 AM - 10:30 PM',
        description: 'Over 85,000 physical volumes, IEEE Xplore digital terminals, quiet research carrels, and collaborative seminar rooms.',
        tagsJson: JSON.stringify(['Library', 'Quiet Study', 'IEEE', 'Digital Terminals', 'Books'])
      },
      {
        name: 'Sir C.V. Raman Multidisciplinary Research Auditorium',
        type: 'Auditorium',
        block: 'Auditorium Complex',
        floor: 'Ground Floor',
        roomNumber: 'AUD-01',
        capacity: 1200,
        inCharge: 'Prof. K. Venkatesh',
        contactEmail: 'events@campusai.edu',
        operatingHours: '8:30 AM - 9:00 PM',
        description: 'Air-conditioned main auditorium with Dolby Atmos acoustics, 4K projection, and international symposium staging.',
        tagsJson: JSON.stringify(['Auditorium', 'Events', 'Seminars', 'Conferences', 'Stage'])
      },
      {
        name: 'Campus AI Health Center & Emergency Clinic',
        type: 'Admin Office',
        block: 'Student Amenities Block',
        floor: 'Ground Floor',
        roomNumber: 'MED-101',
        capacity: 25,
        inCharge: 'Dr. R. Meenakshi, MBBS',
        contactEmail: 'healthcenter@campusai.edu',
        operatingHours: '24 Hours (Emergency Services)',
        description: 'Full-time medical officers, resident nurses, ambulance service, and pharmacy for students and faculty.',
        tagsJson: JSON.stringify(['Medical', 'Clinic', 'Emergency', 'Health', 'First Aid'])
      }
    ]);

    // 16. Create Departments & Department Staff (Section 45)
    const deptMaintenance = await Department.create({
      name: 'Campus Infrastructure & Maintenance',
      code: 'DEPT-MAINT',
      headOfDepartment: 'Eng. Rajesh Verma',
      email: 'maintenance@campusai.edu',
      phone: '+91 98990 11223',
      location: 'Facilities Workshop Block, Ground Floor',
      slaHours: 24,
      status: 'Active'
    });

    const deptIT = await Department.create({
      name: 'Information Technology & Networks',
      code: 'DEPT-ITNET',
      headOfDepartment: 'Eng. Arvind Swaminathan',
      email: 'itnet@campusai.edu',
      phone: '+91 98990 22334',
      location: 'Central Data Center, Block B, Room 105',
      slaHours: 12,
      status: 'Active'
    });

    const deptElectrical = await Department.create({
      name: 'Electrical & Power Infrastructure',
      code: 'DEPT-ELEC',
      headOfDepartment: 'Eng. Suresh Patil',
      email: 'electrical@campusai.edu',
      phone: '+91 98990 33445',
      location: 'Substation Control Room',
      slaHours: 8,
      status: 'Active'
    });

    const deptHostel = await Department.create({
      name: 'Hostel & Residential Administration',
      code: 'DEPT-HOSTEL',
      headOfDepartment: 'Chief Warden Col. R. K. Nair',
      email: 'hosteladmin@campusai.edu',
      phone: '+91 98990 44556',
      location: 'Hostel Administrative Office',
      slaHours: 24,
      status: 'Active'
    });

    await DepartmentStaff.bulkCreate([
      {
        departmentId: deptIT.id,
        name: 'Manoj Kumar',
        email: 'manoj.it@campusai.edu',
        role: 'Senior Network Engineer',
        specialization: 'Wi-Fi 6 APs, VLAN Routing, Firewall',
        contactNumber: '+91 98990 22335',
        isActive: true
      },
      {
        departmentId: deptElectrical.id,
        name: 'Ganesh Shinde',
        email: 'ganesh.elec@campusai.edu',
        role: 'Senior Electrical Technician',
        specialization: 'High-voltage circuits, UPS, classroom fixtures',
        contactNumber: '+91 98990 33446',
        isActive: true
      },
      {
        departmentId: deptMaintenance.id,
        name: 'Ramesh Babu',
        email: 'ramesh.maint@campusai.edu',
        role: 'Civil Infrastructure Supervisor',
        specialization: 'Plumbing, Carpenter, Furniture Repairs',
        contactNumber: '+91 98990 11224',
        isActive: true
      }
    ]);

    // 17. Create Campus Problems (Tickets) (Section 41-47)
    const prob1 = await CampusProblem.create({
      ticketNumber: 'TKT-2026-1001',
      studentId: studentFarhan.id,
      userId: studentUser.id,
      reporterName: 'Farhan Akhtar',
      reporterEmail: 'student@campusai.edu',
      title: 'High latency and intermittent Wi-Fi drops in Turing Lab B-302',
      description: 'During practical deep learning lab hours, the 5GHz access point keeps disconnecting students when model downloads start.',
      category: 'Network & IT',
      subcategory: 'Wi-Fi & Internet Connectivity',
      building: 'Block B (Computing Center)',
      block: 'B',
      floor: '3rd Floor',
      room: 'B-302',
      locationDescription: 'North-East corner near workstation racks 4-8',
      priority: 'High',
      status: 'In Progress',
      departmentId: deptIT.id,
      assignedStaffId: 1,
      attachmentUrlsJson: JSON.stringify([]),
      resolutionSummary: null
    });

    const prob2 = await CampusProblem.create({
      ticketNumber: 'TKT-2026-1002',
      studentId: studentFarhan.id,
      userId: studentUser.id,
      reporterName: 'Farhan Akhtar',
      reporterEmail: 'student@campusai.edu',
      title: 'Overhead ceiling fan making loud rattling noise in LH-102',
      description: 'The second fan in column 3 has a loose bearing making severe vibration noise during lecture hours.',
      category: 'Electrical',
      subcategory: 'Classroom Electrical Fixtures',
      building: 'Main Academic Block',
      block: 'A',
      floor: '1st Floor',
      room: 'LH-102',
      locationDescription: 'Ceiling mount column 3',
      priority: 'Medium',
      status: 'Resolved',
      departmentId: deptElectrical.id,
      assignedStaffId: 2,
      attachmentUrlsJson: JSON.stringify([]),
      resolutionSummary: 'Replaced defective ball bearing and tightened housing brackets. Tested at max speed with zero vibration.'
    });

    await ProblemComment.create({
      problemId: prob1.id,
      userId: facultyUser.id,
      authorName: 'Dr. Sarah Jenkins',
      authorRole: 'faculty',
      comment: 'Verified this during the 2:00 PM session. Lab students are unable to pull PyTorch datasets from the university cache.'
    });

    await ProblemStatusHistory.create({
      problemId: prob1.id,
      previousStatus: 'Open',
      newStatus: 'In Progress',
      changedByUserId: adminUser.id,
      changedByName: 'Admin Desk',
      notes: 'AI Auto-Routing dispatched ticket to IT & Networks. Network Engineer Manoj Kumar assigned.'
    });

    // 18. Create Class Schedules (Timetable) for Faculty
    await ClassSchedule.bulkCreate([
      {
        userId: facultyUser.id,
        subjectId: createdSubjects[4].id,
        subjectName: 'Data Structures',
        dayOfWeek: 'Monday',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        classroom: 'LH-102',
        department: 'CSE',
        year: 3,
        section: 'A',
        studentCount: 60
      },
      {
        userId: facultyUser.id,
        subjectId: createdSubjects[4].id,
        subjectName: 'Data Structures Lab',
        dayOfWeek: 'Monday',
        startTime: '10:30 AM',
        endTime: '12:30 PM',
        classroom: 'Lab B-302',
        department: 'CSE',
        year: 3,
        section: 'A',
        studentCount: 30
      },
      {
        userId: facultyUser.id,
        subjectId: createdSubjects[10].id,
        subjectName: 'Machine Learning',
        dayOfWeek: 'Tuesday',
        startTime: '11:00 AM',
        endTime: '12:00 PM',
        classroom: 'LH-104',
        department: 'CSE',
        year: 4,
        section: 'A',
        studentCount: 55
      },
      {
        userId: facultyUser.id,
        subjectId: createdSubjects[4].id,
        subjectName: 'Data Structures',
        dayOfWeek: 'Wednesday',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        classroom: 'LH-102',
        department: 'CSE',
        year: 3,
        section: 'A',
        studentCount: 60
      },
      {
        userId: facultyUser.id,
        subjectId: createdSubjects[10].id,
        subjectName: 'Machine Learning Lab',
        dayOfWeek: 'Thursday',
        startTime: '02:00 PM',
        endTime: '04:00 PM',
        classroom: 'Lab B-302',
        department: 'CSE',
        year: 4,
        section: 'A',
        studentCount: 55
      },
      {
        userId: facultyUser.id,
        subjectId: createdSubjects[11].id,
        subjectName: 'Artificial Intelligence',
        dayOfWeek: 'Friday',
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        classroom: 'LH-102',
        department: 'CSE',
        year: 4,
        section: 'B',
        studentCount: 58
      }
    ]);

    // 19. Create Smart Notifications
    await SmartNotification.bulkCreate([
      {
        studentId: studentFarhan.id,
        userId: studentUser.id,
        title: 'Attendance Discipline Milestone Achieved! 🎯',
        message: 'Your Data Structures attendance is in the healthy green zone at 87.5%. Keep maintaining consistency for semester eligibility.',
        category: 'attendance',
        priority: 'medium',
        isRead: false,
        actionUrl: '/ai/attendance-intelligence'
      },
      {
        studentId: studentFarhan.id,
        userId: studentUser.id,
        title: 'Pending Fee Reminder: Examination Board Registration',
        message: 'Invoice INV-2026-1044 (₹3,500) is due on 25-Oct-2026. Pay online to download your digital receipt.',
        category: 'fee',
        priority: 'high',
        isRead: false,
        actionUrl: '/fees'
      },
      {
        studentId: studentFarhan.id,
        userId: studentUser.id,
        title: 'New AI Quiz Generated: Graph Algorithms',
        message: 'Dr. Sarah Jenkins published an adaptive MCQ quiz. Earn +100 XP upon completion!',
        category: 'ai',
        priority: 'medium',
        isRead: false,
        actionUrl: '/ai/quiz'
      }
    ]);

    // 20. Create Campus Announcements
    await Announcement.bulkCreate([
      {
        authorId: adminUser.id,
        authorName: 'Dr. Arthur Vance (Dean)',
        title: 'Smart Campus AI Ecosystem Official Go-Live Notice',
        content: 'We are thrilled to inaugurate the integrated CAMPUS AI ecosystem across our campus. All academic records, AI attendance simulators, career navigation, and helpdesk triage are fully synchronized.',
        targetAudience: 'All',
        priority: 'High',
        expiryDate: '2026-11-30'
      },
      {
        authorId: facultyUser.id,
        authorName: 'Dr. Sarah Jenkins',
        title: 'Mid-Semester Practical Examination Guidelines & Code Repository Lock',
        content: 'All B.Tech CSE Semester 5 students must commit their laboratory assignments to the institutional Git repository before Friday midnight.',
        targetAudience: 'Students',
        priority: 'Normal',
        expiryDate: '2026-10-31'
      }
    ]);

    // 21. Create Initial AI Report
    await AIReport.create({
      generatedBy: adminUser.id,
      title: 'Institutional AI Comprehensive Performance & Governance Audit — Odd Semester 2026',
      summary: 'Comprehensive digital assessment of academic indicators, attendance discipline, campus infrastructure health, and predictive student success metrics across School of Computing & Engineering.',
      reportType: 'Institutional Comprehensive',
      department: 'School of Computing & Engineering',
      semester: 'Odd Semester 2026',
      metricsJson: JSON.stringify({
        totalActiveStudents: 1420,
        overallAttendanceRate: '81.6%',
        averageSgpa: 7.64,
        atRiskCount: 38,
        resolvedHelpdeskTickets: 312,
        feeCollectionEfficiency: '91.8%'
      }),
      insightsJson: JSON.stringify([
        'Positive correlation observed between 80%+ attendance and top-quartile performance in Data Structures and Algorithms.',
        'AI Helpdesk auto-routing reduced mean time to repair (MTTR) for classroom electrical and Wi-Fi issues from 48 hours to 8.2 hours.',
        'Early warning diagnostic triage flagged 38 students early in week 4, enabling faculty mentoring before mid-term assessments.'
      ]),
      recommendationsJson: JSON.stringify([
        'Implement structured remedial modules for students with sub-70% scores in Operating Systems.',
        'Accelerate campus network switch upgrades in Block C to preempt connectivity bottlenecks during practical exams.',
        'Sustain automated parent attendance SMS/Email dispatches for all students slipping below 75% limit.'
      ])
    });

    console.log('[CAMPUS AI] Database seeding completed successfully with all subjects, users, students, exams, fees, tickets, and AI records!');
  } catch (err) {
    console.error('[CAMPUS AI Seeding Error]:', err);
  }
}

module.exports = { seedDatabase };
