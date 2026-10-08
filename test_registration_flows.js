const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });
    req.on('error', err => reject(err));
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function postForm(path, formData, cookie = null) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  let payload = '';

  for (const [key, value] of Object.entries(formData)) {
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    payload += `${value}\r\n`;
  }
  payload += `--${boundary}--\r\n`;

  const headers = {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(payload)
  };
  if (cookie) headers['Cookie'] = cookie;

  return request({
    hostname: 'localhost',
    port: 3000,
    path,
    method: 'POST',
    headers
  }, payload);
}

function postUrlEncoded(path, formObj, cookie = null) {
  const params = new URLSearchParams(formObj);
  const payload = params.toString();
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(payload)
  };
  if (cookie) headers['Cookie'] = cookie;
  return request({
    hostname: 'localhost',
    port: 3000,
    path,
    method: 'POST',
    headers
  }, payload);
}

function postJson(path, jsonData) {
  const payload = JSON.stringify(jsonData);
  return request({
    hostname: 'localhost',
    port: 3000,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Accept': 'application/json'
    }
  }, payload);
}

function getUrl(path, cookie = null) {
  const headers = {};
  if (cookie) headers['Cookie'] = cookie;
  return request({
    hostname: 'localhost',
    port: 3000,
    path,
    method: 'GET',
    headers
  });
}

async function runTestSuite() {
  console.log('====================================================');
  console.log(' CAMPUSAI ROLE-AWARE REGISTRATION & AUTH TEST SUITE ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- 1. LOGIN UI TESTS ---
  console.log('\n--- 1. Testing Login Page UI & Dynamic Role Content ---');
  const loginRes = await getUrl('/auth/login');
  assert(loginRes.statusCode === 200, 'GET /auth/login returns HTTP 200');
  assert(loginRes.data.includes('Sign In as Student'), 'Initial login button displays "Sign In as Student"');
  assert(loginRes.data.includes("Don't have an institutional account?"), 'Initial registration prompt displays "Don\'t have an institutional account?"');
  assert(loginRes.data.includes('Create Student Account'), 'Initial registration link displays "Create Student Account"');
  assert(loginRes.data.includes('One-Click Demonstration Credentials'), 'Demo credentials section is preserved');
  assert(loginRes.data.includes('togglePasswordVisibility'), 'Password visibility toggle is implemented');

  const facultyLoginRes = await getUrl('/auth/login?role=faculty');
  assert(facultyLoginRes.statusCode === 200, 'GET /auth/login?role=faculty returns HTTP 200');
  assert(facultyLoginRes.data.includes('Sign In as Faculty'), 'Faculty login page renders "Sign In as Faculty"');
  assert(facultyLoginRes.data.includes("Don't have a faculty account?"), 'Faculty login page renders "Don\'t have a faculty account?"');
  assert(facultyLoginRes.data.includes('Create Faculty Account'), 'Faculty login page renders "Create Faculty Account"');

  const adminLoginRes = await getUrl('/auth/login?role=admin');
  assert(adminLoginRes.statusCode === 200, 'GET /auth/login?role=admin returns HTTP 200');
  assert(adminLoginRes.data.includes('Sign In as Admin'), 'Admin login page renders "Sign In as Admin"');
  assert(adminLoginRes.data.includes('Need an administrator account?'), 'Admin login page renders "Need an administrator account?"');
  assert(adminLoginRes.data.includes('Create Admin Account'), 'Admin login page renders "Create Admin Account"');

  // --- 2. ROUTE ALIASES & NAVIGATION TESTS ---
  console.log('\n--- 2. Testing Route Aliases & Navigation ---');
  const aliasLogin = await getUrl('/login?role=faculty');
  assert(aliasLogin.statusCode === 302 && aliasLogin.headers.location === '/auth/login?role=faculty', 'Top-level /login?role=faculty redirects to /auth/login?role=faculty');

  const aliasRegister = await getUrl('/register?role=admin');
  assert(aliasRegister.statusCode === 302 && aliasRegister.headers.location === '/auth/register?role=admin', 'Top-level /register?role=admin redirects to /auth/register?role=admin');

  const aliasRegisterSlash = await getUrl('/register/faculty');
  assert(aliasRegisterSlash.statusCode === 302 && aliasRegisterSlash.headers.location === '/auth/register?role=faculty', 'Route /register/faculty redirects to /auth/register?role=faculty');

  // --- 3. REGISTRATION UI TESTS ---
  console.log('\n--- 3. Testing Registration Page UI & Header for Each Role ---');
  const regStudent = await getUrl('/auth/register?role=student');
  assert(regStudent.statusCode === 200, 'GET /auth/register?role=student returns HTTP 200');
  assert(regStudent.data.includes('ROLE • Student'), 'Student registration displays "ROLE • Student" badge');
  assert(regStudent.data.includes('Create Student Account'), 'Student registration header displays "Create Student Account"');
  assert(regStudent.data.includes('Join CampusAI and access your academic portal.'), 'Student subtitle matches requirement');
  assert(regStudent.data.includes('Register Number'), 'Student registration form includes Register Number field');

  const regFaculty = await getUrl('/auth/register?role=faculty');
  assert(regFaculty.statusCode === 200, 'GET /auth/register?role=faculty returns HTTP 200');
  assert(regFaculty.data.includes('ROLE • Faculty'), 'Faculty registration displays "ROLE • Faculty" badge');
  assert(regFaculty.data.includes('Create Faculty Account'), 'Faculty registration header displays "Create Faculty Account"');
  assert(regFaculty.data.includes('Create your institutional faculty account.'), 'Faculty subtitle matches requirement');
  assert(regFaculty.data.includes('Employee ID'), 'Faculty registration form includes Employee ID field');

  const regAdmin = await getUrl('/auth/register?role=admin');
  assert(regAdmin.statusCode === 200, 'GET /auth/register?role=admin returns HTTP 200');
  assert(regAdmin.data.includes('ROLE • Administrator'), 'Admin registration displays "ROLE • Administrator" badge');
  assert(regAdmin.data.includes('Create Administrator Account'), 'Admin registration header displays "Create Administrator Account"');
  assert(regAdmin.data.includes('Register an authorized CampusAI administrator account.'), 'Admin subtitle matches requirement');
  assert(regAdmin.data.includes('Administrator accounts require institutional verification.'), 'Admin verification notice is present');
  assert(regAdmin.data.includes('Administrator Registration Code'), 'Admin registration form includes Administrator Registration Code field');

  // --- 4. STUDENT REGISTRATION FLOW & LOGIN ---
  console.log('\n--- 4. Testing Student Registration Flow ---');
  const uniqueNum = Date.now().toString().slice(-4);
  const testStudentData = {
    name: 'Gurudhanush S',
    registerNumber: `23AID${uniqueNum}`,
    email: `student_${uniqueNum}@campusai.edu`,
    studentDepartment: 'Artificial Intelligence and Data Science',
    year: '2nd Year',
    section: 'A',
    phone: '+91 98451 00001',
    password: 'Password123',
    confirmPassword: 'Password123',
    role: 'student'
  };

  const regStudentRes = await postForm('/auth/register', testStudentData);
  assert(regStudentRes.statusCode === 200, 'Student registration POST returns HTTP 200');
  assert(regStudentRes.data.includes('Account created successfully.'), 'Success confirmation displays "Account created successfully."');
  assert(regStudentRes.data.includes('Your CampusAI account is ready.'), 'Success confirmation displays "Your CampusAI account is ready."');

  // Log in with newly registered student
  const studentLoginAttempt = await postUrlEncoded('/auth/login', {
    email: testStudentData.email,
    password: testStudentData.password,
    role: 'student'
  });
  assert(studentLoginAttempt.statusCode === 302 && studentLoginAttempt.headers.location === '/student/dashboard', 'New student logs in successfully and is redirected to /student/dashboard');

  // --- 5. FACULTY REGISTRATION FLOW & LOGIN ---
  console.log('\n--- 5. Testing Faculty Registration Flow ---');
  const testFacultyData = {
    name: 'Dr. Arun Kumar',
    employeeId: `FAC${uniqueNum}`,
    email: `faculty_${uniqueNum}@campusai.edu`,
    facultyDepartment: 'Artificial Intelligence and Data Science',
    facultyDesignation: 'Professor',
    phone: '+91 98765 00002',
    password: 'Password123',
    confirmPassword: 'Password123',
    role: 'faculty'
  };

  const regFacultyRes = await postForm('/auth/register', testFacultyData);
  assert(regFacultyRes.statusCode === 200, 'Faculty registration POST returns HTTP 200');
  assert(regFacultyRes.data.includes('Account created successfully.'), 'Faculty success message displayed');

  // Log in with newly registered faculty
  const facultyLoginAttempt = await postUrlEncoded('/auth/login', {
    email: testFacultyData.email,
    password: testFacultyData.password,
    role: 'faculty'
  });
  assert(facultyLoginAttempt.statusCode === 302 && facultyLoginAttempt.headers.location === '/faculty/dashboard', 'New faculty logs in successfully and is redirected to /faculty/dashboard');

  // --- 6. ADMIN REGISTRATION & VERIFICATION FLOW ---
  console.log('\n--- 6. Testing Admin Registration & Security Verification ---');
  const testAdminData = {
    name: 'Campus Admin Officer',
    adminId: `ADM${uniqueNum}`,
    email: `admin_${uniqueNum}@campusai.edu`,
    adminDepartment: 'Academic Administration',
    adminDesignation: 'System Administrator',
    phone: '+91 98000 00003',
    adminCode: 'INVALID_CODE',
    password: 'Password123',
    confirmPassword: 'Password123',
    role: 'admin'
  };

  // Rejection with invalid code
  const regAdminInvalid = await postForm('/auth/register', testAdminData);
  assert(regAdminInvalid.statusCode === 400, 'Admin registration with invalid authorization code returns HTTP 400');
  assert(regAdminInvalid.data.includes('Invalid Administrator Registration Code'), 'Rejection error specifies invalid authorization code');

  // Successful creation with valid code
  testAdminData.adminCode = 'CAMPUS_ADMIN_2026';
  const regAdminValid = await postForm('/auth/register', testAdminData);
  assert(regAdminValid.statusCode === 200, 'Admin registration with valid authorization code returns HTTP 200');
  assert(regAdminValid.data.includes('Account created successfully.'), 'Admin success confirmation displayed');

  // Log in with newly registered admin
  const adminLoginAttempt = await postUrlEncoded('/auth/login', {
    email: testAdminData.email,
    password: testAdminData.password,
    role: 'admin'
  });
  assert(adminLoginAttempt.statusCode === 302 && adminLoginAttempt.headers.location === '/admin/dashboard', 'New admin logs in successfully and is redirected to /admin/dashboard');

  // --- 7. VALIDATION TESTS ---
  console.log('\n--- 7. Testing Validation & Duplicate Prevention ---');
  // Duplicate email check
  const dupEmailRes = await postForm('/auth/register', {
    ...testStudentData,
    registerNumber: `NEW${uniqueNum}`
  });
  assert(dupEmailRes.statusCode === 400 && dupEmailRes.data.includes('already exists'), 'Duplicate email registration is rejected with clear error');

  // Duplicate register number check
  const dupRegNoRes = await postForm('/auth/register', {
    ...testStudentData,
    email: `different_${uniqueNum}@campusai.edu`
  });
  assert(dupRegNoRes.statusCode === 400 && dupRegNoRes.data.includes('Register Number is already registered'), 'Duplicate Register Number is rejected');

  // Duplicate employee ID check
  const dupEmpIdRes = await postForm('/auth/register', {
    ...testFacultyData,
    email: `diff_fac_${uniqueNum}@campusai.edu`
  });
  assert(dupEmpIdRes.statusCode === 400 && dupEmpIdRes.data.includes('Employee ID is already registered'), 'Duplicate Employee ID is rejected');

  // Password length validation (< 8 chars)
  const shortPassRes = await postForm('/auth/register', {
    name: 'Short Pass User',
    email: `shortpass_${uniqueNum}@campusai.edu`,
    phone: '+91 99999 11111',
    password: 'Short1',
    confirmPassword: 'Short1',
    role: 'student',
    registerNumber: `SH${uniqueNum}`
  });
  assert(shortPassRes.statusCode === 400 && shortPassRes.data.includes('at least 8 characters'), 'Short password rejected');

  // Password missing uppercase
  const noUpperPassRes = await postForm('/auth/register', {
    name: 'No Upper User',
    email: `noupper_${uniqueNum}@campusai.edu`,
    phone: '+91 99999 11111',
    password: 'password123',
    confirmPassword: 'password123',
    role: 'student',
    registerNumber: `NU${uniqueNum}`
  });
  assert(noUpperPassRes.statusCode === 400 && noUpperPassRes.data.includes('uppercase letter'), 'Password missing uppercase rejected');

  // Password missing number
  const noNumPassRes = await postForm('/auth/register', {
    name: 'No Number User',
    email: `nonum_${uniqueNum}@campusai.edu`,
    phone: '+91 99999 11111',
    password: 'PasswordOnly',
    confirmPassword: 'PasswordOnly',
    role: 'student',
    registerNumber: `NN${uniqueNum}`
  });
  assert(noNumPassRes.statusCode === 400 && noNumPassRes.data.includes('numeric digit'), 'Password missing number rejected');

  // Confirm password mismatch
  const mismatchPassRes = await postForm('/auth/register', {
    name: 'Mismatch User',
    email: `mismatch_${uniqueNum}@campusai.edu`,
    phone: '+91 99999 11111',
    password: 'Password123',
    confirmPassword: 'Different123',
    role: 'student',
    registerNumber: `MM${uniqueNum}`
  });
  assert(mismatchPassRes.statusCode === 400 && mismatchPassRes.data.includes('do not match'), 'Mismatched confirm password rejected');

  // --- 8. DEMO ACCOUNTS PRESERVATION ---
  console.log('\n--- 8. Testing Existing Demo Accounts Preservation ---');
  const demoStudent = await postUrlEncoded('/auth/login', {
    email: 'student@campusai.edu',
    password: 'student123',
    role: 'student'
  });
  assert(demoStudent.statusCode === 302 && demoStudent.headers.location === '/student/dashboard', 'Demo student login works: student@campusai.edu -> /student/dashboard');

  const demoFaculty = await postUrlEncoded('/auth/login', {
    email: 'faculty@campusai.edu',
    password: 'faculty123',
    role: 'faculty'
  });
  assert(demoFaculty.statusCode === 302 && demoFaculty.headers.location === '/faculty/dashboard', 'Demo faculty login works: faculty@campusai.edu -> /faculty/dashboard');

  const demoAdmin = await postUrlEncoded('/auth/login', {
    email: 'admin@campusai.edu',
    password: 'admin123',
    role: 'admin'
  });
  assert(demoAdmin.statusCode === 302 && demoAdmin.headers.location === '/admin/dashboard', 'Demo admin login works: admin@campusai.edu -> /admin/dashboard');

  console.log('\n====================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
