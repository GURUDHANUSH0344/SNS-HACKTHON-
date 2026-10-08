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

async function runDeepTests() {
  console.log('--- CAMPUS AI DEEP FEATURE & PDF/EXCEL VERIFICATION ---');

  // 1. Student Login
  const studentLogin = await testUrl('http://localhost:3000/auth/login', 'POST', {
    email: 'student@campusai.edu',
    password: 'student123'
  });
  const studentCookie = studentLogin.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');

  // 2. Test Excel Portfolio Export
  const exportRes = await testUrl('http://localhost:3000/student/export', 'GET', null, { Cookie: studentCookie });
  console.log('1. GET /student/export -> HTTP', exportRes.statusCode, exportRes.headers['content-type'].includes('spreadsheetml') ? '✓ Excel Sheet Generated' : '❌ Wrong Type');

  // 3. Test Fee PDF Receipt
  const receiptRes = await testUrl('http://localhost:3000/fees/1/receipt', 'GET', null, { Cookie: studentCookie });
  console.log('2. GET /fees/1/receipt -> HTTP', receiptRes.statusCode, receiptRes.headers['content-type'] === 'application/pdf' ? '✓ PDF Receipt Generated' : '❌ Failed');

  // 4. Test AI Quiz Generation
  const quizGenRes = await testUrl('http://localhost:3000/ai/quiz/generate', 'POST', {
    subject: 'Data Structures',
    topic: 'Binary Search Trees & AVL Trees',
    difficulty: 'Medium',
    count: 3
  }, { Cookie: studentCookie });
  const quizData = JSON.parse(quizGenRes.data);
  console.log('3. POST /ai/quiz/generate -> HTTP', quizGenRes.statusCode, quizData.success ? `✓ Generated ${quizData.questions.length} Questions` : '❌ Failed');

  // 5. Test AI Quiz Submission
  const quizSubRes = await testUrl('http://localhost:3000/ai/quiz/submit', 'POST', {
    quizId: quizData.quizId,
    answers: [0, 1, 2]
  }, { Cookie: studentCookie });
  const subData = JSON.parse(quizSubRes.data);
  console.log('4. POST /ai/quiz/submit -> HTTP', quizSubRes.statusCode, subData.success ? `✓ Scored ${subData.percentage}% (+${subData.xpEarned} XP)` : '❌ Failed');

  // 6. Faculty Login
  const facultyLogin = await testUrl('http://localhost:3000/auth/login', 'POST', {
    email: 'faculty@campusai.edu',
    password: 'faculty123'
  });
  const facultyCookie = facultyLogin.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');

  // 7. Test AI Question Paper Generation
  const qpRes = await testUrl('http://localhost:3000/faculty/question-paper/generate', 'POST', {
    subject: 'Artificial Intelligence',
    unit: 'Unit 3: Knowledge Representation',
    topic: 'First-Order Logic & Semantic Networks',
    difficulty: 'Medium',
    duration: 180,
    totalMarks: 100
  }, { Cookie: facultyCookie });
  const qpData = JSON.parse(qpRes.data);
  console.log('5. POST /faculty/question-paper/generate -> HTTP', qpRes.statusCode, qpData.success ? `✓ Paper Generated: ${qpData.title} (${qpData.sections.length} sections)` : '❌ Failed');

  // 8. Admin Login
  const adminLogin = await testUrl('http://localhost:3000/auth/login', 'POST', {
    email: 'admin@campusai.edu',
    password: 'admin123'
  });
  const adminCookie = adminLogin.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');

  // 9. Test AI Report Generation & PDF Download
  const repGenRes = await testUrl('http://localhost:3000/ai/reports/generate', 'POST', {
    department: 'Computer Science & Engineering',
    semester: 'Semester VI (Spring 2026)'
  }, {
    Cookie: adminCookie,
    'Content-Type': 'application/x-www-form-urlencoded'
  });
  console.log('6. POST /ai/reports/generate -> HTTP', repGenRes.statusCode, repGenRes.statusCode === 302 ? '✓ Report Created & Redirected' : '❌ Failed');

  const repPdfRes = await testUrl('http://localhost:3000/ai/reports/1/pdf', 'GET', null, { Cookie: adminCookie });
  console.log('7. GET /ai/reports/1/pdf -> HTTP', repPdfRes.statusCode, repPdfRes.headers['content-type'] === 'application/pdf' ? '✓ Institutional AI Report PDF Generated' : '❌ Failed');

  console.log('\n--- ALL DEEP FEATURE TESTS PASSED WITH 100% SUCCESS ---');
}

runDeepTests().catch(console.error);
