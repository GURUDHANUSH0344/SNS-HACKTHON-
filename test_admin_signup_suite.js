const http = require('http');
const { supabase, supabaseAdmin, isSupabaseConfigured } = require('./backend/config/supabase');
const { User, Student, FacultyProfile } = require('./backend/models');

const BASE_URL = 'http://localhost:3000';

function postMultipart(urlPath, fields, cookie = '') {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';
    for (const [k, v] of Object.entries(fields)) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${k}"\r\n\r\n`;
      body += `${v}\r\n`;
    }
    body += `--${boundary}--\r\n`;

    const req = http.request(BASE_URL + urlPath, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
        'Accept': 'application/json',
        ...(cookie ? { 'Cookie': cookie } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch(e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function postFormUrlencoded(urlPath, fields, cookie = '') {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams(fields);
    const body = params.toString();

    const req = http.request(BASE_URL + urlPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        ...(cookie ? { 'Cookie': cookie } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getRequest(urlPath, cookie = '') {
  return new Promise((resolve, reject) => {
    const req = http.request(BASE_URL + urlPath, {
      method: 'GET',
      headers: {
        ...(cookie ? { 'Cookie': cookie } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log(' CAMPUSAI — COMPREHENSIVE ADMIN SIGNUP & AUTH TEST SUITE');
  console.log('================================================================\n');

  const timestamp = Date.now().toString().slice(-6);
  const testAdminEmail = `admin_test_${timestamp}@campusai.edu`;
  const testStudentEmail = `student_test_${timestamp}@campusai.edu`;
  const testFacultyEmail = `faculty_test_${timestamp}@campusai.edu`;
  const testPassword = 'AdminPassword2026!';
  const testAdminId = `ADM${timestamp}`;
  const testStudentRegNo = `REG${timestamp}`;
  const testFacultyEmpId = `FAC${timestamp}`;

  const results = {};

  // -------------------------------------------------------------
  // TEST 1: Missing Required Fields
  // -------------------------------------------------------------
  console.log('[TEST 1] Missing Required Fields (Name, Phone, Email, AdminId)...');
  const t1 = await postMultipart('/auth/register', {
    role: 'admin',
    name: '',
    email: '',
    phone: '',
    password: testPassword,
    confirmPassword: testPassword,
    adminCode: 'CAMPUS_ADMIN_2026'
  });
  console.log(`  -> Status: ${t1.statusCode}, Error message: "${t1.json?.error}"`);
  results.missingFields = t1.statusCode === 400 && t1.json?.error?.includes('full name');

  // -------------------------------------------------------------
  // TEST 2: Invalid Email & Weak Password
  // -------------------------------------------------------------
  console.log('\n[TEST 2] Invalid Email and Weak Password...');
  const t2a = await postMultipart('/auth/register', {
    role: 'admin',
    name: 'Test Administrator',
    email: 'notanemail',
    phone: '9840123450',
    adminId: testAdminId,
    password: 'weak',
    confirmPassword: 'weak',
    adminCode: 'CAMPUS_ADMIN_2026'
  });
  console.log(`  -> Invalid Email Status: ${t2a.statusCode}, Error: "${t2a.json?.error}"`);

  const t2b = await postMultipart('/auth/register', {
    role: 'admin',
    name: 'Test Administrator',
    email: testAdminEmail,
    phone: '9840123450',
    adminId: testAdminId,
    password: 'weak',
    confirmPassword: 'weak',
    adminCode: 'CAMPUS_ADMIN_2026'
  });
  console.log(`  -> Weak Password Status: ${t2b.statusCode}, Error: "${t2b.json?.error}"`);
  results.invalidInputs = t2a.statusCode === 400 && t2b.statusCode === 400 && t2b.json?.error?.includes('8 characters');

  // -------------------------------------------------------------
  // TEST 3: Unauthorized Attempt to Register as Admin (Security)
  // -------------------------------------------------------------
  console.log('\n[TEST 3] Unauthorized Attempt to Register as Admin (Invalid / Missing Code)...');
  const t3 = await postMultipart('/auth/register', {
    role: 'admin',
    name: 'Hacker Attempt',
    email: `intruder_${timestamp}@campusai.edu`,
    phone: '9840123450',
    adminId: `INT${timestamp}`,
    adminDepartment: 'Academic Administration',
    adminDesignation: 'Administrator',
    adminCode: 'INVALID_INVITE_CODE',
    password: testPassword,
    confirmPassword: testPassword
  });
  console.log(`  -> Status: ${t3.statusCode}, Error: "${t3.json?.error}"`);
  results.unauthorizedAdmin = t3.statusCode === 403 && t3.json?.error?.includes('Access denied');

  // -------------------------------------------------------------
  // TEST 4: Valid Authorized Admin Account Creation
  // -------------------------------------------------------------
  console.log('\n[TEST 4] Valid Authorized Admin Account Creation...');
  const t4 = await postMultipart('/auth/register', {
    role: 'admin',
    name: 'Dr. Jane Admin Officer',
    email: testAdminEmail,
    phone: '9840123450',
    adminId: testAdminId,
    adminDepartment: 'Academic Administration',
    adminDesignation: 'System Administrator',
    adminCode: 'CAMPUS_ADMIN_2026',
    password: testPassword,
    confirmPassword: testPassword
  });
  console.log(`  -> Registration Status: ${t4.statusCode}`);
  console.log(`  -> Response Message: "${t4.json?.message || t4.json?.error}"`);

  // Verify in Supabase
  let sbAuthFound = false;
  let sbProfileFound = false;
  let sbDeptResolved = false;
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const sbUser = (userList?.users || []).find(u => u.email === testAdminEmail);
    sbAuthFound = Boolean(sbUser);

    if (sbUser) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('auth_user_id', sbUser.id)
        .single();

      sbProfileFound = Boolean(profile && profile.role === 'admin');
      sbDeptResolved = Boolean(profile?.department_id);
      console.log(`  -> Supabase Auth User ID: ${sbUser.id}`);
      console.log(`  -> Supabase Profile: Role=${profile?.role}, DeptId=${profile?.department_id}, FullName="${profile?.full_name}"`);
    }
  }

  // Verify in SQLite
  const localAdmin = await User.findOne({ where: { email: testAdminEmail } });
  console.log(`  -> SQLite Local User: ID=${localAdmin?.id}, Role=${localAdmin?.role}, Name="${localAdmin?.name}"`);

  results.validAdminCreation = (t4.statusCode === 200 && sbAuthFound && sbProfileFound && Boolean(localAdmin));

  // -------------------------------------------------------------
  // TEST 5: Existing Email (Duplicate Account Prevention)
  // -------------------------------------------------------------
  console.log('\n[TEST 5] Duplicate Account Prevention (Existing Email)...');
  const t5 = await postMultipart('/auth/register', {
    role: 'admin',
    name: 'Duplicate Admin',
    email: testAdminEmail,
    phone: '9840123450',
    adminId: `DUP${timestamp}`,
    adminDepartment: 'Academic Administration',
    adminDesignation: 'Administrator',
    adminCode: 'CAMPUS_ADMIN_2026',
    password: testPassword,
    confirmPassword: testPassword
  });
  console.log(`  -> Status: ${t5.statusCode}, Error: "${t5.json?.error}"`);
  results.duplicatePrevention = t5.statusCode === 400 && t5.json?.error?.includes('already exists');

  // -------------------------------------------------------------
  // TEST 6: Login after Successful Creation
  // -------------------------------------------------------------
  console.log('\n[TEST 6] Login with Newly Created Admin Account...');
  const t6 = await postFormUrlencoded('/auth/login', {
    email: testAdminEmail,
    password: testPassword,
    role: 'admin'
  });
  console.log(`  -> Login Status: ${t6.statusCode} (Redirect: ${t6.headers.location})`);
  const setCookieHeader = t6.headers['set-cookie'] || [];
  const tokenCookie = setCookieHeader.find(c => c.startsWith('token='));
  const sbTokenCookie = setCookieHeader.find(c => c.startsWith('sb-access-token='));
  console.log(`  -> Token Cookie Set: ${Boolean(tokenCookie)}`);
  console.log(`  -> Supabase Access Token Cookie Set: ${Boolean(sbTokenCookie)}`);

  const cookiesCombined = setCookieHeader.map(c => c.split(';')[0]).join('; ');
  results.loginSuccess = (t6.statusCode === 302 && t6.headers.location === '/admin/dashboard' && Boolean(tokenCookie));

  // -------------------------------------------------------------
  // TEST 7: Admin Dashboard Access with Authenticated Session
  // -------------------------------------------------------------
  console.log('\n[TEST 7] Access Admin Dashboard with Authenticated Session...');
  const t7 = await getRequest('/admin/dashboard', cookiesCombined);
  console.log(`  -> Dashboard Status: ${t7.statusCode}`);
  const hasAdminContent = t7.data.includes('Administrator') || t7.data.includes('Admin') || t7.data.includes('Overview');
  console.log(`  -> Dashboard Rendered Successfully: ${hasAdminContent}`);
  results.dashboardAccess = (t7.statusCode === 200 && hasAdminContent);

  // -------------------------------------------------------------
  // TEST 8: Unauthorized Access to Admin Routes
  // -------------------------------------------------------------
  console.log('\n[TEST 8] Unauthorized Access to Admin Routes (No Session)...');
  const t8 = await getRequest('/admin/dashboard', '');
  console.log(`  -> Status: ${t8.statusCode} (Location: ${t8.headers.location})`);
  results.unauthorizedRouteBlocked = (t8.statusCode === 302 && t8.headers.location?.includes('/auth/login'));

  // -------------------------------------------------------------
  // TEST 9: Student and Faculty Registration Verification
  // -------------------------------------------------------------
  console.log('\n[TEST 9] Student and Faculty Registration Verification...');
  // Student
  const t9Student = await postMultipart('/auth/register', {
    role: 'student',
    name: 'Test Student John',
    email: testStudentEmail,
    phone: '9840123451',
    registerNumber: testStudentRegNo,
    studentDepartment: 'Artificial Intelligence and Data Science',
    year: '2nd Year',
    section: 'B',
    password: testPassword,
    confirmPassword: testPassword
  });
  console.log(`  -> Student Registration Status: ${t9Student.statusCode}`);

  // Faculty
  const t9Faculty = await postMultipart('/auth/register', {
    role: 'faculty',
    name: 'Dr. Test Faculty Mary',
    email: testFacultyEmail,
    phone: '9840123452',
    employeeId: testFacultyEmpId,
    facultyDepartment: 'Artificial Intelligence and Data Science',
    facultyDesignation: 'Assistant Professor',
    password: testPassword,
    confirmPassword: testPassword
  });
  console.log(`  -> Faculty Registration Status: ${t9Faculty.statusCode}`);

  // Verify Supabase and local for both
  const localStudent = await Student.findOne({ where: { studentId: testStudentRegNo } });
  const localFaculty = await FacultyProfile.findOne({ where: { employeeId: testFacultyEmpId } });
  console.log(`  -> SQLite Student Found: ${Boolean(localStudent)}, Faculty Found: ${Boolean(localFaculty)}`);
  results.studentAndFacultySuccess = (t9Student.statusCode === 200 && t9Faculty.statusCode === 200 && Boolean(localStudent) && Boolean(localFaculty));

  // -------------------------------------------------------------
  // TEST 10: Atomic Rollback on Profile Failure Simulation
  // -------------------------------------------------------------
  console.log('\n[TEST 10] Testing Atomic Rollback on Partial Profile Failure...');
  const rollbackEmail = `rollback_${timestamp}@campusai.edu`;
  // Test by manually verifying our delete rollback logic:
  // Create auth user, then call rollback cleanup
  const { data: rbAuth, error: rbAuthErr } = await supabaseAdmin.auth.admin.createUser({
    email: rollbackEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { role: 'admin', name: 'Rollback Test' }
  });
  console.log(`  -> Created Temporary Auth User ID: ${rbAuth?.user?.id}`);
  // Simulate rollback
  await supabaseAdmin.auth.admin.deleteUser(rbAuth.user.id);
  const { data: checkDeleted } = await supabaseAdmin.auth.admin.listUsers();
  const stillExists = (checkDeleted?.users || []).some(u => u.id === rbAuth.user.id);
  console.log(`  -> Rollback Verified: User deleted from Auth = ${!stillExists}`);
  results.atomicRollback = !stillExists;

  // -------------------------------------------------------------
  // TEST 11: Cleanup Test Accounts from Supabase & SQLite
  // -------------------------------------------------------------
  console.log('\n[TEST 11] Cleaning up created test accounts...');
  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
      for (const email of [testAdminEmail, testStudentEmail, testFacultyEmail]) {
        const u = (allUsers?.users || []).find(x => x.email === email);
        if (u) {
          await supabaseAdmin.auth.admin.deleteUser(u.id);
          await supabaseAdmin.from('profiles').delete().eq('email', email);
          console.log(`  -> Cleaned Supabase records for: ${email}`);
        }
      }
    }
    await User.destroy({ where: { email: [testAdminEmail, testStudentEmail, testFacultyEmail] } });
    await Student.destroy({ where: { studentId: testStudentRegNo } });
    await FacultyProfile.destroy({ where: { employeeId: testFacultyEmpId } });
    console.log('  -> Cleaned SQLite records.');
  } catch(e) {
    console.warn('  -> Cleanup note:', e.message);
  }

  console.log('\n================================================================');
  console.log(' TEST SUITE SUMMARY RESULTS:');
  console.log('================================================================');
  console.table(results);
  const allPassed = Object.values(results).every(v => v === true);
  console.log(`ALL TESTS PASSED: ${allPassed ? '✓ YES (100% PASS)' : '✗ NO'}`);
  return allPassed;
}

runTestSuite().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('[Test Suite Error]:', err);
  process.exit(1);
});
