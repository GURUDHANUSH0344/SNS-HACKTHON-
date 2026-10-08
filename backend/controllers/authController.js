const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Student, FacultyProfile } = require('../models');
const { JWT_SECRET } = require('../middleware/authMiddleware');

exports.getLogin = (req, res) => {
  if (req.user) {
    if (req.user.role === 'admin') return res.redirect('/admin/dashboard');
    if (req.user.role === 'teacher' || req.user.role === 'faculty') return res.redirect('/faculty/dashboard');
    return res.redirect('/student/dashboard');
  }

  const roleParam = (req.query.role || req.query.tab || 'student').toLowerCase();
  const normalizedRole = (roleParam === 'teacher' || roleParam === 'faculty') ? 'faculty' : (roleParam === 'admin' ? 'admin' : 'student');

  res.render('login', {
    pageTitle: 'Sign In — CampusAI University Portal',
    error: req.query.error || null,
    success: req.query.success || (req.query.registered ? 'Account created successfully. Your CampusAI account is ready. Please sign in below.' : null),
    tab: normalizedRole,
    prefillEmail: req.query.email || ''
  });
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.render('login', {
        pageTitle: 'Sign In — CampusAI University Portal',
        error: 'Please enter both email and password.',
        success: null,
        tab: role || 'student',
        prefillEmail: email || ''
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      where: { email: normalizedEmail },
      include: [
        { model: Student, as: 'studentProfile' },
        { model: FacultyProfile, as: 'facultyProfile' }
      ]
    });

    if (!user) {
      return res.render('login', {
        pageTitle: 'Sign In — CampusAI University Portal',
        error: 'No account found with this email address.',
        success: null,
        tab: role || 'student',
        prefillEmail: email || ''
      });
    }

    if (user.status === 'pending') {
      return res.render('login', {
        pageTitle: 'Sign In — CampusAI University Portal',
        error: 'Your account registration is currently pending administrator approval.',
        success: null,
        tab: role || 'student',
        prefillEmail: email || ''
      });
    }

    if (user.status === 'rejected') {
      return res.render('login', {
        pageTitle: 'Sign In — CampusAI University Portal',
        error: 'Your account application was not approved. Please contact campus admin.',
        success: null,
        tab: role || 'student',
        prefillEmail: email || ''
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', {
        pageTitle: 'Sign In — CampusAI University Portal',
        error: 'Invalid password. Please check your credentials.',
        success: null,
        tab: role || 'student',
        prefillEmail: email || ''
      });
    }

    // Role check if tab role is specified
    if (role && role !== user.role) {
      const isRoleMatching = (role === 'faculty' && user.role === 'teacher') ||
                             (role === 'teacher' && user.role === 'faculty') ||
                             (role === user.role);
      if (!isRoleMatching && user.role !== 'admin') {
        return res.render('login', {
          pageTitle: 'Sign In — CampusAI University Portal',
          error: `Account role mismatch: this email is registered as ${user.role === 'teacher' ? 'faculty' : user.role}, not ${role}.`,
          success: null,
          tab: role,
          prefillEmail: email || ''
        });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure cookie & session
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    const userData = user.toJSON();
    delete userData.password;
    req.session.user = userData;

    // Redirect to appropriate dashboard
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else if (user.role === 'teacher' || user.role === 'faculty') {
      return res.redirect('/faculty/dashboard');
    } else {
      return res.redirect('/student/dashboard');
    }
  } catch (err) {
    console.error('[Login Error]:', err);
    res.render('login', {
      pageTitle: 'Sign In — CampusAI University Portal',
      error: 'An unexpected system error occurred during authentication.',
      success: null,
      tab: 'student',
      prefillEmail: ''
    });
  }
};

exports.getRegister = (req, res) => {
  if (req.user) {
    if (req.user.role === 'admin') return res.redirect('/admin/dashboard');
    if (req.user.role === 'teacher' || req.user.role === 'faculty') return res.redirect('/faculty/dashboard');
    return res.redirect('/student/dashboard');
  }

  const roleParam = (req.params.role || req.query.role || req.query.tab || 'student').toLowerCase();
  const normalizedRole = (roleParam === 'teacher' || roleParam === 'faculty') ? 'faculty' : (roleParam === 'admin' ? 'admin' : 'student');

  res.render('register', {
    pageTitle: 'Institutional Registration — CampusAI University Portal',
    currentRole: normalizedRole,
    error: req.query.error || null,
    success: req.query.success || null,
    successState: false,
    formData: {}
  });
};

exports.postRegister = async (req, res) => {
  let rawRole = (req.body.role || 'student').toLowerCase().trim();
  if (rawRole === 'teacher') rawRole = 'faculty';
  if (!['student', 'faculty', 'admin'].includes(rawRole)) {
    rawRole = 'student';
  }

  const renderError = (errMsg) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, error: errMsg });
    }
    return res.status(400).render('register', {
      pageTitle: 'Institutional Registration — CampusAI University Portal',
      currentRole: rawRole,
      error: errMsg,
      successState: false,
      formData: { ...req.body }
    });
  };

  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    // 1. Basic Field Validation
    if (!name || name.trim().length < 2) {
      return renderError('Please provide your full name.');
    }

    if (!phone || phone.trim().length < 6) {
      return renderError('Please provide a valid contact phone number.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return renderError('Please enter a valid institutional email address.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check optional institutional email domain from environment
    if (process.env.INSTITUTIONAL_EMAIL_DOMAIN) {
      const allowedDomain = process.env.INSTITUTIONAL_EMAIL_DOMAIN.replace(/^@/, '');
      if (!normalizedEmail.endsWith('@' + allowedDomain)) {
        return renderError(`Institutional email must belong to domain @${allowedDomain}.`);
      }
    }

    // 2. Password Strength Validation
    if (!password || password.length < 8) {
      return renderError('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      return renderError('Password must contain at least one uppercase letter (A-Z).');
    }
    if (!/[a-z]/.test(password)) {
      return renderError('Password must contain at least one lowercase letter (a-z).');
    }
    if (!/[0-9]/.test(password)) {
      return renderError('Password must contain at least one numeric digit (0-9).');
    }
    if (password !== confirmPassword) {
      return renderError('Passwords do not match. Please verify both password fields.');
    }

    // 3. Unique Email Check
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return renderError('An account with this institutional email address already exists. Please sign in instead.');
    }

    // 4. Role-Specific Validation & Creation
    let assignedRole = 'student';
    let assignedIdentifier = '';
    let departmentName = '';
    let designationName = '';

    if (rawRole === 'student') {
      assignedRole = 'student';
      const registerNumber = (req.body.registerNumber || '').trim().toUpperCase();
      departmentName = (req.body.studentDepartment || req.body.department || 'Artificial Intelligence and Data Science').trim();
      const yearStr = req.body.year || '2nd Year';
      const section = (req.body.section || 'A').trim().toUpperCase();

      if (!registerNumber) {
        return renderError('Register Number is required for student registration.');
      }

      // Check unique Register Number
      const existingStudent = await Student.findOne({ where: { studentId: registerNumber } });
      if (existingStudent) {
        return renderError('This Register Number is already registered in the academic system.');
      }

      const existingStudentEmail = await Student.findOne({ where: { email: normalizedEmail } });
      if (existingStudentEmail) {
        return renderError('This email is already linked to an existing student profile.');
      }

      assignedIdentifier = registerNumber;

      const hashedPassword = await bcrypt.hash(password, 10);
      const avatarPath = req.file ? '/uploads/' + req.file.filename : '/images/avatar-student.png';

      const newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'student',
        status: 'active',
        department: departmentName,
        phone: phone.trim(),
        avatar: avatarPath
      });

      const parsedYear = parseInt(yearStr.replace(/\D/g, '')) || 2;
      const semester = (parsedYear * 2) - 1;

      await Student.create({
        studentId: registerNumber,
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: phone.trim(),
        course: departmentName,
        year: parsedYear,
        semester: semester,
        section: section,
        status: 'Active',
        enrollmentDate: new Date()
      });

    } else if (rawRole === 'faculty') {
      assignedRole = 'teacher';
      const employeeId = (req.body.employeeId || '').trim().toUpperCase();
      departmentName = (req.body.facultyDepartment || req.body.department || 'Artificial Intelligence and Data Science').trim();
      designationName = (req.body.facultyDesignation || req.body.designation || 'Associate Professor').trim();

      if (!employeeId) {
        return renderError('Employee ID is required for faculty registration.');
      }

      // Check unique Employee ID
      const existingFaculty = await FacultyProfile.findOne({ where: { employeeId: employeeId } });
      if (existingFaculty) {
        return renderError('This Employee ID is already registered in the faculty system.');
      }

      assignedIdentifier = employeeId;

      const hashedPassword = await bcrypt.hash(password, 10);
      const avatarPath = req.file ? '/uploads/' + req.file.filename : '/images/avatar-faculty.png';

      const newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'teacher',
        status: 'active',
        department: departmentName,
        phone: phone.trim(),
        designation: designationName,
        avatar: avatarPath
      });

      await FacultyProfile.create({
        userId: newUser.id,
        employeeId: employeeId,
        name: newUser.name,
        department: departmentName,
        designation: designationName,
        phone: phone.trim(),
        qualification: designationName.includes('Professor') ? 'Ph.D. / Master of Engineering' : 'Master of Engineering',
        specialization: departmentName
      });

    } else if (rawRole === 'admin') {
      assignedRole = 'admin';
      const adminId = (req.body.adminId || '').trim().toUpperCase();
      departmentName = (req.body.adminDepartment || req.body.department || 'Academic Administration').trim();
      designationName = (req.body.adminDesignation || req.body.designation || 'Administrator').trim();
      const adminCode = (req.body.adminCode || '').trim();

      if (!adminId) {
        return renderError('Administrator ID is required.');
      }

      // Check unique Admin ID
      const existingAdmin = await User.findOne({ where: { adminId: adminId } });
      if (existingAdmin) {
        return renderError('This Administrator ID is already in use.');
      }

      // Administrator Authorization Code Verification
      const expectedAdminCode = (process.env.ADMIN_INVITE_CODE || 'CAMPUS_ADMIN_2026').trim();
      if (!adminCode || adminCode !== expectedAdminCode) {
        return renderError('Invalid Administrator Registration Code. Administrator accounts require institutional verification.');
      }

      assignedIdentifier = adminId;

      const hashedPassword = await bcrypt.hash(password, 10);
      const avatarPath = req.file ? '/uploads/' + req.file.filename : '/images/avatar-admin.png';

      await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        department: departmentName,
        phone: phone.trim(),
        designation: designationName,
        adminId: adminId,
        avatar: avatarPath
      });
    }

    // 5. Successful Registration Flow
    const registeredUser = {
      name: name.trim(),
      email: normalizedEmail,
      role: assignedRole,
      identifier: assignedIdentifier,
      department: departmentName
    };

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        message: 'Account created successfully. Your CampusAI account is ready.',
        user: registeredUser,
        redirectUrl: `/auth/login?role=${rawRole}&email=${encodeURIComponent(normalizedEmail)}&registered=true`
      });
    }

    return res.render('register', {
      pageTitle: 'Account Created — CampusAI University Portal',
      currentRole: rawRole,
      successState: true,
      registeredUser,
      error: null,
      formData: {}
    });

  } catch (err) {
    console.error('[Registration Error]:', err);
    return renderError('An unexpected server error occurred during registration. Please check all fields.');
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  if (req.session) {
    req.session.destroy(() => {
      res.redirect('/auth/login');
    });
  } else {
    res.redirect('/auth/login');
  }
};

exports.switchRole = async (req, res) => {
  try {
    const rawRole = (req.params.role || req.body.role || '').toLowerCase().trim();
    let targetRole;
    let targetEmail;
    let redirectUrl;

    if (rawRole === 'admin') {
      targetRole = 'admin';
      targetEmail = 'admin@campusai.edu';
      redirectUrl = '/admin/dashboard';
    } else if (rawRole === 'faculty' || rawRole === 'teacher') {
      targetRole = 'teacher';
      targetEmail = 'faculty@campusai.edu';
      redirectUrl = '/faculty/dashboard';
    } else if (rawRole === 'student') {
      targetRole = 'student';
      targetEmail = 'student@campusai.edu';
      redirectUrl = '/student/dashboard';
    } else {
      return res.redirect('/student/dashboard');
    }

    // Try finding by canonical seed email first, then fallback to any active user with that role
    let targetUser = await User.findOne({
      where: { email: targetEmail, status: 'active' },
      include: [
        { model: Student, as: 'studentProfile' },
        { model: FacultyProfile, as: 'facultyProfile' }
      ]
    });

    if (!targetUser) {
      targetUser = await User.findOne({
        where: { role: targetRole, status: 'active' },
        include: [
          { model: Student, as: 'studentProfile' },
          { model: FacultyProfile, as: 'facultyProfile' }
        ]
      });
    }

    // Fallback if role is faculty/teacher interchangeable
    if (!targetUser && (targetRole === 'teacher' || targetRole === 'faculty')) {
      targetUser = await User.findOne({
        where: { role: 'faculty', status: 'active' },
        include: [
          { model: Student, as: 'studentProfile' },
          { model: FacultyProfile, as: 'facultyProfile' }
        ]
      });
    }

    if (!targetUser) {
      console.warn(`[Role Switch Warning]: No active user found for role: ${rawRole}`);
      return res.redirect(req.headers.referer || '/auth/login');
    }

    // Generate fresh JWT
    const token = jwt.sign(
      { id: targetUser.id, email: targetUser.email, role: targetUser.role, name: targetUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    // Update session
    const userData = targetUser.toJSON();
    delete userData.password;
    if (req.session) {
      req.session.user = userData;
    }

    // If client requested via AJAX/fetch, return JSON
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        message: `Switched to ${targetUser.role} role successfully`,
        redirectUrl,
        user: userData
      });
    }

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error('[Role Switch Error]:', err);
    return res.redirect(req.headers.referer || '/auth/login');
  }
};

