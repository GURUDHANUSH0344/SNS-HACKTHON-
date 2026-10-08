const http = require('http');

async function testUrl(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'TestRunner/1.0',
        ...headers
      }
    };

    if (body) {
      if (typeof body === 'object') {
        const jsonBody = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(jsonBody);
      }
    }

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
      req.write(typeof body === 'object' ? JSON.stringify(body) : body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- CAMPUS AI END-TO-END VERIFICATION ---');

  // 1. Check Login Page
  const loginPage = await testUrl('http://localhost:3000/auth/login');
  console.log('1. GET /auth/login -> HTTP', loginPage.statusCode, loginPage.data.includes('CAMPUS AI') ? '✓ Contains Branding' : '❌ Missing Branding');

  // 2. Admin Login
  const adminLogin = await testUrl('http://localhost:3000/auth/login', 'POST', {
    email: 'admin@campusai.edu',
    password: 'admin123'
  });
  console.log('2. POST /auth/login (Admin) -> HTTP', adminLogin.statusCode);
  const adminCookie = adminLogin.headers['set-cookie'] ? adminLogin.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') : '';

  // 3. Test Admin Protected Routes
  const adminRoutes = [
    '/',
    '/admissions',
    '/admissions/students',
    '/exams',
    '/fees',
    '/hostel',
    '/ai/early-warning',
    '/ai/admin-analytics',
    '/ai/reports',
    '/ai/hackathon-demo',
    '/problems',
    '/problems/analytics',
    '/problems/departments'
  ];

  for (const r of adminRoutes) {
    const res = await testUrl(`http://localhost:3000${r}`, 'GET', null, { Cookie: adminCookie });
    console.log(`   Admin Route: ${r.padEnd(25)} -> HTTP ${res.statusCode} ${res.statusCode === 200 ? '✓' : '❌'}`);
  }

  // 4. Faculty Login
  const facultyLogin = await testUrl('http://localhost:3000/auth/login', 'POST', {
    email: 'faculty@campusai.edu',
    password: 'faculty123'
  });
  console.log('4. POST /auth/login (Faculty) -> HTTP', facultyLogin.statusCode);
  const facultyCookie = facultyLogin.headers['set-cookie'] ? facultyLogin.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') : '';

  const facultyRoutes = [
    '/faculty/dashboard',
    '/faculty/timetable',
    '/faculty/attendance',
    '/faculty/students',
    '/faculty/assignments',
    '/faculty/exams',
    '/faculty/ai-analytics',
    '/faculty/ai-assistant',
    '/faculty/question-paper',
    '/faculty/announcements',
    '/faculty/profile'
  ];

  for (const r of facultyRoutes) {
    const res = await testUrl(`http://localhost:3000${r}`, 'GET', null, { Cookie: facultyCookie });
    console.log(`   Faculty Route: ${r.padEnd(25)} -> HTTP ${res.statusCode} ${res.statusCode === 200 ? '✓' : '❌'}`);
  }

  // 5. Student Login
  const studentLogin = await testUrl('http://localhost:3000/auth/login', 'POST', {
    email: 'student@campusai.edu',
    password: 'student123'
  });
  console.log('5. POST /auth/login (Student) -> HTTP', studentLogin.statusCode);
  const studentCookie = studentLogin.headers['set-cookie'] ? studentLogin.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') : '';

  const studentRoutes = [
    '/student/dashboard',
    '/student/profile',
    '/student/results',
    '/student/attendance',
    '/student/fees',
    '/student/hostel',
    '/student/assignments',
    '/ai/assistant',
    '/ai/performance-prediction',
    '/ai/learning-path',
    '/ai/quiz',
    '/ai/attendance-intelligence',
    '/ai/profile',
    '/ai/career',
    '/ai/gamification',
    '/ai/campus-info',
    '/ai/notifications',
    '/problems/new'
  ];

  for (const r of studentRoutes) {
    const res = await testUrl(`http://localhost:3000${r}`, 'GET', null, { Cookie: studentCookie });
    console.log(`   Student Route: ${r.padEnd(25)} -> HTTP ${res.statusCode} ${res.statusCode === 200 ? '✓' : '❌'}`);
  }

  // 6. Test AI Chat API
  const aiChatRes = await testUrl('http://localhost:3000/ai/chat', 'POST', {
    message: 'What is my current attendance and exam eligibility?'
  }, { Cookie: studentCookie });
  console.log('6. POST /ai/chat -> HTTP', aiChatRes.statusCode, JSON.parse(aiChatRes.data).success ? '✓ Responded' : '❌ Error');

  // 7. Test AI Problem Classifier
  const aiClassifyRes = await testUrl('http://localhost:3000/problems/ai-classify', 'POST', {
    title: 'AC unit in Lab 304 making loud noise and leaking water',
    description: 'Compressor rattling, water dripping onto workstation tables',
    location: 'Main Academic Block 3rd floor'
  }, { Cookie: studentCookie });
  console.log('7. POST /problems/ai-classify -> HTTP', aiClassifyRes.statusCode, JSON.parse(aiClassifyRes.data).success ? '✓ Classified' : '❌ Error');

  // 8. Test AI Code Lab View
  const codeLabView = await testUrl('http://localhost:3000/ai/code-lab', 'GET', null, { Cookie: studentCookie });
  console.log('8. GET /ai/code-lab -> HTTP', codeLabView.statusCode, codeLabView.statusCode === 200 ? '✓ Rendered' : '❌ Error');

  // 9. Test AI Code Lab Sandbox Execution
  const codeExecRes = await testUrl('http://localhost:3000/api/code-lab/execute', 'POST', {
    sourceCode: 'console.log("Hello from CampusAI Sandbox!"); const sum = (a, b) => a + b; console.log("Result:", sum(10, 25));',
    language: 'javascript'
  }, { Cookie: studentCookie });
  const execJson = JSON.parse(codeExecRes.data);
  console.log('9. POST /api/code-lab/execute -> HTTP', codeExecRes.statusCode, execJson.success && execJson.stdout.includes('Result: 35') ? '✓ Executed Successfully' : '❌ Error');

  // 10. Test AI Code Lab Analysis
  const codeAnalyzeRes = await testUrl('http://localhost:3000/api/code-lab/analyze', 'POST', {
    sourceCode: 'function binarySearch(arr, target) { let l = 0, r = arr.length - 1; while(l <= r) { let m = Math.floor((l+r)/2); if(arr[m]===target) return m; if(arr[m]<target) l = m + 1; else r = m - 1; } return -1; }',
    language: 'javascript',
    analysisType: 'complexity'
  }, { Cookie: studentCookie });
  const analyzeJson = JSON.parse(codeAnalyzeRes.data);
  console.log('10. POST /api/code-lab/analyze -> HTTP', codeAnalyzeRes.statusCode, analyzeJson.success ? '✓ Analyzed' : '❌ Error');

  console.log('\n--- ALL VERIFICATION TESTS COMPLETED ---');
}

runTests().catch(console.error);
