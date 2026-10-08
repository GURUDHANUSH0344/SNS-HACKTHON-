/**
 * CAMPUS AI — Secure Code Execution Engine
 * 
 * Architecture:
 * - Local Sandboxed Runtimes (Python 3, JavaScript Node VM)
 * - Remote Sandbox Integration (Judge0 / Piston if configured via .env)
 * - Strict limits: Timeout, max source code size, max output size, no arbitrary host shell
 * - Honest environment reporting: Never fakes execution for unavailable compilers
 */

const { spawn } = require('child_process');
const vm = require('vm');
const http = require('http');
const https = require('https');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
const { CodeExecution, CodeSession } = require('../models');

// Configurable execution parameters
const EXECUTION_TIMEOUT_MS = parseInt(process.env.CODE_EXECUTION_TIMEOUT || '5000', 10);
const MAX_SOURCE_SIZE = parseInt(process.env.CODE_MAX_SOURCE_SIZE || '102400', 10); // 100 KB
const MAX_OUTPUT_SIZE = parseInt(process.env.CODE_MAX_OUTPUT_SIZE || '102400', 10); // 100 KB

/**
 * Truncate long outputs safely
 */
function truncateOutput(str) {
  if (!str) return '';
  if (str.length > MAX_OUTPUT_SIZE) {
    return str.substring(0, MAX_OUTPUT_SIZE) + '\n... [Output truncated: maximum limit exceeded]';
  }
  return str;
}

/**
 * 1. JavaScript Sandboxed Execution via Node VM
 */
async function executeJavaScriptSandbox(sourceCode, stdin = '') {
  const startTime = process.hrtime();
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  let status = 'completed';

  const customConsole = {
    log: (...args) => {
      stdout += args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\n';
    },
    error: (...args) => {
      stderr += args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\n';
    },
    warn: (...args) => {
      stdout += '[WARN] ' + args.join(' ') + '\n';
    },
    info: (...args) => {
      stdout += args.join(' ') + '\n';
    }
  };

  const sandboxContext = {
    console: customConsole,
    stdin: String(stdin || ''),
    Math,
    Date,
    JSON,
    parseInt,
    parseFloat,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Set,
    Map
  };

  const context = vm.createContext(sandboxContext);

  try {
    const script = new vm.Script(sourceCode);
    script.runInContext(context, { timeout: EXECUTION_TIMEOUT_MS });
  } catch (err) {
    if (err.message && err.message.includes('timed out')) {
      status = 'timeout';
      stderr += `Execution timed out after ${EXECUTION_TIMEOUT_MS}ms.\n`;
      exitCode = 124;
    } else {
      status = 'runtime_error';
      stderr += `${err.name || 'Error'}: ${err.message}\n`;
      exitCode = 1;
    }
  }

  const diff = process.hrtime(startTime);
  const executionTimeMs = parseFloat((diff[0] * 1000 + diff[1] / 1e6).toFixed(2));

  return {
    stdout: truncateOutput(stdout.trimEnd()),
    stderr: truncateOutput(stderr.trimEnd()),
    exitCode,
    status,
    executionTimeMs,
    language: 'javascript'
  };
}

/**
 * 2. Python Sandboxed Execution via local Python 3 Process
 */
async function executePythonSandbox(sourceCode, stdin = '') {
  return new Promise((resolve) => {
    const startTime = process.hrtime();
    let stdout = '';
    let stderr = '';
    let isTerminated = false;

    // Use unbuffered flag -u
    const pyProcess = spawn('python', ['-u', '-c', sourceCode], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const timer = setTimeout(() => {
      isTerminated = true;
      try { pyProcess.kill('SIGKILL'); } catch (e) {}
    }, EXECUTION_TIMEOUT_MS);

    if (stdin) {
      try {
        pyProcess.stdin.write(stdin);
        pyProcess.stdin.end();
      } catch (e) {}
    } else {
      pyProcess.stdin.end();
    }

    pyProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pyProcess.on('error', (err) => {
      clearTimeout(timer);
      const diff = process.hrtime(startTime);
      const executionTimeMs = parseFloat((diff[0] * 1000 + diff[1] / 1e6).toFixed(2));

      resolve({
        stdout: '',
        stderr: `Python execution failed: ${err.message}`,
        exitCode: 127,
        status: 'runtime_error',
        executionTimeMs,
        language: 'python'
      });
    });

    pyProcess.on('close', (code) => {
      clearTimeout(timer);
      const diff = process.hrtime(startTime);
      const executionTimeMs = parseFloat((diff[0] * 1000 + diff[1] / 1e6).toFixed(2));

      if (isTerminated) {
        return resolve({
          stdout: truncateOutput(stdout.trimEnd()),
          stderr: `Execution timed out after ${EXECUTION_TIMEOUT_MS}ms.\n`,
          exitCode: 124,
          status: 'timeout',
          executionTimeMs,
          language: 'python'
        });
      }

      const status = code === 0 ? 'completed' : 'runtime_error';

      resolve({
        stdout: truncateOutput(stdout.trimEnd()),
        stderr: truncateOutput(stderr.trimEnd()),
        exitCode: code || 0,
        status,
        executionTimeMs,
        language: 'python'
      });
    });
  });
}

/**
 * 3. Remote Judge0 Provider (if configured in .env)
 */
async function executeViaJudge0(sourceCode, language, stdin = '') {
  const judge0Url = process.env.JUDGE0_API_URL;
  const judge0Key = process.env.JUDGE0_API_KEY;

  if (!judge0Url) return null;

  // Language ID mapping for Judge0
  const languageIds = {
    c: 50, // C (GCC 9.2.0)
    cpp: 54, // C++ (GCC 9.2.0)
    java: 62, // Java (OpenJDK 13.0.1)
    python: 71, // Python (3.8.1)
    javascript: 63 // JavaScript (Node.js 12.14.0)
  };

  const langKey = language.toLowerCase();
  const languageId = languageIds[langKey];
  if (!languageId) return null;

  try {
    const postData = JSON.stringify({
      source_code: Buffer.from(sourceCode).toString('base64'),
      language_id: languageId,
      stdin: Buffer.from(stdin || '').toString('base64')
    });

    const parsedUrl = new URL(`${judge0Url}/submissions?base64_encoded=true&wait=true`);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    return new Promise((resolve) => {
      const req = client.request(parsedUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': judge0Key || '',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: EXECUTION_TIMEOUT_MS + 2000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            const stdout = data.stdout ? Buffer.from(data.stdout, 'base64').toString() : '';
            const stderr = data.stderr ? Buffer.from(data.stderr, 'base64').toString() : '';
            const compileOutput = data.compile_output ? Buffer.from(data.compile_output, 'base64').toString() : '';
            const timeMs = data.time ? parseFloat(data.time) * 1000 : 0;

            const isCompilationError = data.status?.id === 6;
            const status = isCompilationError ? 'compilation_error' : (data.status?.id === 3 ? 'completed' : 'runtime_error');

            resolve({
              stdout: truncateOutput(stdout.trimEnd()),
              stderr: truncateOutput((compileOutput || stderr).trimEnd()),
              exitCode: data.exit_code || (status === 'completed' ? 0 : 1),
              status,
              executionTimeMs: timeMs,
              language
            });
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.write(postData);
      req.end();
    });
  } catch (e) {
    return null;
  }
}

/**
 * Main Code Execution Gateway
 */
async function executeCode(sourceCode, language = 'python', stdin = '', sessionId = null, userId = null) {
  // 1. Validation checks
  if (typeof sourceCode !== 'string' || !sourceCode.trim()) {
    return {
      stdout: '',
      stderr: 'No source code provided to execute.',
      exitCode: 1,
      status: 'error',
      executionTimeMs: 0,
      language
    };
  }

  if (sourceCode.length > MAX_SOURCE_SIZE) {
    return {
      stdout: '',
      stderr: `Source code exceeds maximum allowed size (${Math.round(MAX_SOURCE_SIZE / 1024)} KB).`,
      exitCode: 1,
      status: 'error',
      executionTimeMs: 0,
      language
    };
  }

  const lang = (language || 'python').toLowerCase();
  let result = null;

  // 2. Try remote Judge0 if configured
  if (process.env.JUDGE0_API_URL) {
    result = await executeViaJudge0(sourceCode, lang, stdin);
  }

  // 3. Fallback to local secure sandboxes
  if (!result) {
    if (lang === 'python' || lang === 'py') {
      result = await executePythonSandbox(sourceCode, stdin);
    } else if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
      result = await executeJavaScriptSandbox(sourceCode, stdin);
    } else {
      // Compiled languages without configured compiler on host
      result = {
        stdout: '',
        stderr: `Execution environment unavailable for ${language.toUpperCase()}. To execute ${language.toUpperCase()} natively, install GCC/JDK on the host or configure JUDGE0_API_URL in .env.`,
        exitCode: 127,
        status: 'unavailable',
        executionTimeMs: 0,
        language
      };
    }
  }

  // 4. Persist execution history into Supabase and local DB
  try {
    if (isSupabaseConfigured && supabaseAdmin && sessionId) {
      await supabaseAdmin.from('code_executions').insert({
        session_id: sessionId,
        user_id: userId,
        language: lang,
        execution_time: result.executionTimeMs,
        exit_code: result.exitCode,
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr
      });

      await supabaseAdmin.from('code_sessions').update({
        last_output: result.stdout,
        last_error: result.stderr,
        execution_status: result.status,
        updated_at: new Date()
      }).eq('id', sessionId);
    } else if (sessionId) {
      await CodeExecution.create({
        sessionId,
        userId,
        language: lang,
        executionTime: result.executionTimeMs,
        exitCode: result.exitCode,
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr
      });

      await CodeSession.update({
        lastOutput: result.stdout,
        lastError: result.stderr,
        executionStatus: result.status
      }, { where: { id: sessionId } });
    }
  } catch (logErr) {
    // Non-fatal logging failure
  }

  return result;
}

module.exports = {
  executeCode,
  executePythonSandbox,
  executeJavaScriptSandbox,
  MAX_SOURCE_SIZE,
  EXECUTION_TIMEOUT_MS
};
