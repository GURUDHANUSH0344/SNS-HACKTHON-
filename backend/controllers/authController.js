const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Student, FacultyProfile } = require('../models');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
  sanitizeDbError
} = require('../config/supabase');

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
    let authUser = null;
    let authAccessToken = null;
    let userRole = null;
    let userName = null;
    let userId = null;
    let userDepartment = null;

    // 1. Try Supabase Auth first when configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sbAuth, error: sbAuthErr } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

        if (!sbAuthErr && sbAuth?.session?.access_token) {
          authAccessToken = sbAuth.session.access_token;

          // Retrieve application-level profile from Supabase PostgreSQL
          const { data: profile, error: profErr } = await supabaseAdmin
            .from('profiles')
            .select(`
              *,
              students:students(*),
              faculty_profiles:faculty_profiles(*)
            `)
            .eq('auth_user_id', sbAuth.user.id)
            .single();

          if (profile) {
            if (profile.status === 'pending') {
              return res.render('login', {
                pageTitle: 'Sign In — CampusAI University Portal',
                error: 'Your account registration is currently pending administrator approval.',
                success: null,
                tab: role || 'student',
                prefillEmail: normalizedEmail
              });
            }
            if (profile.status === 'rejected' || profile.status === 'suspended') {
              return res.render('login', {
                pageTitle: 'Sign In — CampusAI University Portal',
                error: 'Your account application was not approved or has been suspended. Please contact campus admin.',
                success: null,
                tab: role || 'student',
                prefillEmail: normalizedEmail
              });
            }

            authUser = {
              id: profile.id,
              authUserId: sbAuth.user.id,
              email: profile.email,
              name: profile.full_name,
              role: profile.role,
              department: profile.department_name,
              status: profile.status,
              profilePhoto: profile.profile_photo_url,
              studentProfile: profile.students?.[0] || null,
              facultyProfile: profile.faculty_profiles?.[0] || null
            };
            userRole = profile.role;
            userName = profile.full_name;
            userId = profile.id;
            userDepartment = profile.department_name;
          }
        }
      } catch (sbErr) {
        console.warn('[Supabase Auth Login Note]:', sbErr.message);
      }
    }

    // 2. Fallback to SQLite if Supabase Auth is unconfigured or credentials weren't in Supabase
    if (!authUser) {
      const localUser = await User.findOne({
        where: { email: normalizedEmail },
        include: [
          { model: Student, as: 'studentProfile' },
          { model: FacultyProfile, as: 'facultyProfile' }
        ]
      });

      if (!localUser) {
        return res.render('login', {
          pageTitle: 'Sign In — CampusAI University Portal',
          error: 'No account found with this email address.',
          success: null,
          tab: role || 'student',
          prefillEmail: normalizedEmail
        });
      }

      if (localUser.status === 'pending') {
        return res.render('login', {
          pageTitle: 'Sign In — CampusAI University Portal',
          error: 'Your account registration is currently pending administrator approval.',
          success: null,
          tab: role || 'student',
          prefillEmail: normalizedEmail
        });
      }

      if (localUser.status === 'rejected') {
        return res.render('login', {
          pageTitle: 'Sign In — CampusAI University Portal',
          error: 'Your account application was not approved. Please contact campus admin.',
          success: null,
          tab: role || 'student',
          prefillEmail: normalizedEmail
        });
      }

      const isMatch = await bcrypt.compare(password, localUser.password);
      if (!isMatch) {
        return res.render('login', {
          pageTitle: 'Sign In — CampusAI University Portal',
          error: 'Invalid password. Please check your credentials.',
          success: null,
          tab: role || 'student',
          prefillEmail: normalizedEmail
        });
      }

      const userData = localUser.toJSON();
      delete userData.password;
      authUser = userData;
      userRole = userData.role;
      userName = userData.name;
      userId = userData.id;
      userDepartment = userData.department;
    }

    // 3. Tab Role Verification (if role specified on login form)
    if (role && role !== userRole) {
      const isRoleMatching = (role === 'faculty' && (userRole === 'teacher' || userRole === 'faculty')) ||
                             (role === 'teacher' && (userRole === 'teacher' || userRole === 'faculty')) ||
                             (role === userRole) ||
                             (userRole === 'admin'); // admin has overarching portal access

      if (!isRoleMatching) {
        return res.render('login', {
          pageTitle: 'Sign In — CampusAI University Portal',
          error: `Account role mismatch: this email is registered as ${userRole === 'teacher' ? 'faculty' : userRole}, not ${role}.`,
          success: null,
          tab: role,
          prefillEmail: normalizedEmail
        });
      }
    }

    // 4. Issue Tokens & Cookies
    // If Supabase provided an access token, use it; otherwise create standard JWT
    const fallbackToken = jwt.sign(
      { id: userId, email: authUser.email, role: userRole, name: userName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const tokenToSet = authAccessToken || fallbackToken;

    res.cookie('token', tokenToSet, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    if (authAccessToken) {
      res.cookie('sb-access-token', authAccessToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      });
    }

    // Sync local SQLite user cache for dual-mode persistence compatibility
    try {
      const existingLocal = await User.findOne({ where: { email: normalizedEmail } });
      if (!existingLocal) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
          name: userName,
          email: normalizedEmail,
          password: hashedPassword,
          role: userRole === 'faculty' ? 'teacher' : userRole,
          status: 'active',
          department: userDepartment || 'Academic Administration'
        });
      }
    } catch (cacheErr) {
      // non-fatal
    }

    req.session.user = authUser;

    // 5. Redirect to appropriate role dashboard
    if (userRole === 'admin') {
      return res.redirect('/admin/dashboard');
    } else if (userRole === 'teacher' || userRole === 'faculty') {
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

  const renderError = (errMsg, statusCode = 400) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(statusCode).json({ success: false, error: errMsg });
    }
    return res.status(statusCode).render('register', {
      pageTitle: 'Institutional Registration — CampusAI University Portal',
      currentRole: rawRole,
      error: errMsg,
      successState: false,
      formData: {
        name: req.body.name || '',
        email: req.body.email || '',
        phone: req.body.phone || '',
        registerNumber: req.body.registerNumber || '',
        year: req.body.year || '',
        section: req.body.section || '',
        studentDepartment: req.body.studentDepartment || req.body.department || '',
        employeeId: req.body.employeeId || '',
        facultyDepartment: req.body.facultyDepartment || req.body.department || '',
        facultyDesignation: req.body.facultyDesignation || req.body.designation || '',
        adminId: req.body.adminId || '',
        adminDepartment: req.body.adminDepartment || req.body.department || '',
        adminDesignation: req.body.adminDesignation || req.body.designation || ''
        // Passwords and admin verification codes are deliberately excluded
      }
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

    // 3. Strict Admin Security Authorization Enforcement
    // Never trust a public form field `role=admin` without trusted verification
    if (rawRole === 'admin') {
      const adminCode = (req.body.adminCode || '').trim();
      const expectedAdminCode = (process.env.ADMIN_INVITE_CODE || 'CAMPUS_ADMIN_2026').trim();
      const isAuthorizedAdmin = (adminCode && adminCode === expectedAdminCode) || (req.user && req.user.role === 'admin');

      if (!isAuthorizedAdmin) {
        console.warn(`[Security Alert] Unauthorized admin registration attempt rejected for email: ${normalizedEmail}`);
        return renderError('Access denied: Unauthorized attempt to create an administrator account. Valid institutional administrator authorization required.', 403);
      }
    }

    // 4. Unique Email Check across SQLite and Supabase
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return renderError('An account with this institutional email address already exists. Please sign in instead.');
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingProfile) {
        return renderError('An account with this institutional email address already exists. Please sign in instead.');
      }

      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      if ((userList?.users || []).some(u => u.email === normalizedEmail)) {
        return renderError('An account with this institutional email address already exists. Please sign in instead.');
      }
    }

    // 5. Role-Specific Identifiers & Validation
    let assignedRole = 'student';
    let assignedIdentifier = '';
    let departmentName = '';
    let designationName = '';
    let parsedYear = 1;
    let semester = 1;
    let section = 'A';

    if (rawRole === 'student') {
      assignedRole = 'student';
      const registerNumber = (req.body.registerNumber || '').trim().toUpperCase();
      departmentName = (req.body.studentDepartment || req.body.department || 'Artificial Intelligence and Data Science').trim();
      const yearStr = req.body.year || '2nd Year';
      section = (req.body.section || 'A').trim().toUpperCase();
      parsedYear = parseInt(yearStr.replace(/\D/g, '')) || 2;
      semester = (parsedYear * 2) - 1;

      if (!registerNumber) {
        return renderError('Register Number is required for student registration.');
      }

      const existingStudent = await Student.findOne({ where: { studentId: registerNumber } });
      if (existingStudent) {
        return renderError('This Register Number is already registered in the academic system.');
      }

      assignedIdentifier = registerNumber;

    } else if (rawRole === 'faculty') {
      assignedRole = 'teacher';
      const employeeId = (req.body.employeeId || '').trim().toUpperCase();
      departmentName = (req.body.facultyDepartment || req.body.department || 'Artificial Intelligence and Data Science').trim();
      designationName = (req.body.facultyDesignation || req.body.designation || 'Associate Professor').trim();

      if (!employeeId) {
        return renderError('Employee ID is required for faculty registration.');
      }

      const existingFaculty = await FacultyProfile.findOne({ where: { employeeId: employeeId } });
      if (existingFaculty) {
        return renderError('This Employee ID is already registered in the faculty system.');
      }

      assignedIdentifier = employeeId;

    } else if (rawRole === 'admin') {
      assignedRole = 'admin';
      const adminId = (req.body.adminId || '').trim().toUpperCase();
      departmentName = (req.body.adminDepartment || req.body.department || 'Academic Administration').trim();
      designationName = (req.body.adminDesignation || req.body.designation || 'Administrator').trim();

      if (!adminId) {
        return renderError('Administrator ID is required.');
      }

      const existingAdmin = await User.findOne({ where: { adminId: adminId } });
      if (existingAdmin) {
        return renderError('This Administrator ID is already in use.');
      }

      assignedIdentifier = adminId;
    }

    // 6. Supabase Auth & Profile Provisioning with Atomic Rollback Protection
    let createdAuthUserId = null;
    let createdProfileId = null;

    if (isSupabaseConfigured && supabaseAdmin) {
      // Step A: Create Supabase Auth user
      const { data: newAuthData, error: createAuthErr } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          role: assignedRole === 'teacher' ? 'faculty' : assignedRole,
          name: name.trim(),
          identifier: assignedIdentifier
        }
      });

      if (createAuthErr) {
        console.error('[Registration Error - Supabase Auth]:', createAuthErr.message);
        if (createAuthErr.message?.includes('already registered')) {
          return renderError('An account with this institutional email address already exists. Please sign in instead.');
        }
        return renderError('Authentication service error: ' + sanitizeDbError(createAuthErr));
      }

      createdAuthUserId = newAuthData.user.id;

      // Step B: Resolve department from Supabase departments table
      try {
        const { data: depts } = await supabaseAdmin.from('departments').select('id, code, name');
        let resolvedDeptId = null;

        if (depts && depts.length > 0) {
          if (assignedRole === 'admin') {
            const adminDept = depts.find(d => d.code === 'ADMIN' || d.name.toLowerCase() === departmentName.toLowerCase());
            resolvedDeptId = adminDept ? adminDept.id : depts.find(d => d.code === 'ADMIN')?.id || null;
          } else {
            const matchedDept = depts.find(d => 
              d.name.toLowerCase() === departmentName.toLowerCase() ||
              d.code.toLowerCase() === departmentName.toLowerCase()
            );
            if (matchedDept) {
              resolvedDeptId = matchedDept.id;
            } else {
              const aidsDept = depts.find(d => d.code === 'AIDS');
              if (aidsDept) resolvedDeptId = aidsDept.id;
            }
          }
        }

        // Step C: Insert into Supabase profiles table
        const { data: profileRecord, error: profileInsertErr } = await supabaseAdmin
          .from('profiles')
          .insert({
            auth_user_id: createdAuthUserId,
            full_name: name.trim(),
            email: normalizedEmail,
            role: assignedRole === 'teacher' ? 'faculty' : assignedRole,
            department_id: resolvedDeptId || null,
            department_name: departmentName,
            designation: designationName || (assignedRole === 'student' ? 'Student' : (assignedRole === 'admin' ? 'Administrator' : 'Faculty')),
            phone: phone.trim(),
            status: 'active'
          })
          .select()
          .single();

        if (profileInsertErr) {
          throw profileInsertErr;
        }

        createdProfileId = profileRecord.id;

        // Step D: Role-specific Supabase child tables
        if (assignedRole === 'student') {
          const { error: studentErr } = await supabaseAdmin.from('students').insert({
            profile_id: createdProfileId,
            student_id: assignedIdentifier,
            name: name.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            department_id: resolvedDeptId || null,
            course: departmentName,
            year: parsedYear,
            semester: semester,
            section: section,
            cgpa: 8.0,
            attendance_rate: 85.0,
            risk_level: 'Low',
            status: 'Active'
          });
          if (studentErr) throw studentErr;

        } else if (assignedRole === 'teacher' || assignedRole === 'faculty') {
          const { error: facultyErr } = await supabaseAdmin.from('faculty_profiles').insert({
            profile_id: createdProfileId,
            employee_id: assignedIdentifier,
            name: name.trim(),
            email: normalizedEmail,
            department_id: resolvedDeptId || null,
            department: departmentName,
            designation: designationName,
            phone: phone.trim()
          });
          if (facultyErr) throw facultyErr;
        }

      } catch (sbInsertErr) {
        console.error('[Registration Rollback Triggered]:', sbInsertErr);
        // ATOMIC ROLLBACK: Remove created Supabase records to prevent orphaned auth users
        if (createdProfileId) {
          try {
            await supabaseAdmin.from('students').delete().eq('profile_id', createdProfileId);
            await supabaseAdmin.from('faculty_profiles').delete().eq('profile_id', createdProfileId);
            await supabaseAdmin.from('profiles').delete().eq('id', createdProfileId);
          } catch (cleanErr) {
            console.error('[Rollback Cleanup Error]:', cleanErr);
          }
        }
        if (createdAuthUserId) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
          } catch (authDelErr) {
            console.error('[Rollback Auth Delete Error]:', authDelErr);
          }
        }
        return renderError('Profile synchronization error: ' + sanitizeDbError(sbInsertErr));
      }
    }

    // 7. Local SQLite Database Persistence (with Rollback Safety)
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const avatarPath = req.file ? '/uploads/' + req.file.filename : `/images/avatar-${rawRole === 'faculty' ? 'faculty' : (rawRole === 'admin' ? 'admin' : 'student')}.png`;

      const userFields = {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: assignedRole,
        status: 'active',
        department: departmentName,
        phone: phone.trim(),
        avatar: avatarPath
      };

      if (rawRole === 'admin') {
        userFields.adminId = assignedIdentifier;
        userFields.designation = designationName;
      } else if (rawRole === 'faculty') {
        userFields.designation = designationName;
      }

      const newUser = await User.create(userFields);

      if (rawRole === 'student') {
        await Student.create({
          studentId: assignedIdentifier,
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
        await FacultyProfile.create({
          userId: newUser.id,
          employeeId: assignedIdentifier,
          name: newUser.name,
          department: departmentName,
          designation: designationName,
          phone: phone.trim(),
          qualification: designationName.includes('Professor') ? 'Ph.D. / Master of Engineering' : 'Master of Engineering',
          specialization: departmentName
        });
      }
    } catch (localErr) {
      console.error('[Registration Local Sync Error]:', localErr);
      // Clean up Supabase records if local persistence fails
      if (isSupabaseConfigured && createdAuthUserId) {
        if (createdProfileId) {
          try {
            await supabaseAdmin.from('students').delete().eq('profile_id', createdProfileId);
            await supabaseAdmin.from('faculty_profiles').delete().eq('profile_id', createdProfileId);
            await supabaseAdmin.from('profiles').delete().eq('id', createdProfileId);
          } catch (e) {}
        }
        try {
          await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
        } catch (e) {}
      }
      return renderError('Local data synchronization error occurred during registration.');
    }

    // 8. Successful Registration Output
    const registeredUser = {
      name: name.trim(),
      email: normalizedEmail,
      role: assignedRole === 'teacher' ? 'faculty' : assignedRole,
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
  res.clearCookie('sb-access-token');
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

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });
    res.clearCookie('sb-access-token');

    const userData = targetUser.toJSON();
    delete userData.password;
    if (req.session) {
      req.session.user = userData;
    }

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
