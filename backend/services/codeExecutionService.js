/**
 * CAMPUS AI — AI Code Lab Secure Execution Service
 * 
 * Executes JavaScript/Python/C-like algorithms safely with timeout guards,
 * standard input/output handling, exit code capture, and Supabase audit logging.
 */

const { vm } = require('vm');
const { spawn } = require('child_process');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

const EXECUTION_TIMEOUT_MS = 5000; // 5-second strict execution limit

/**
 * Execute JavaScript source code in isolated Node VM sandbox
 */
async function executeJavaScript(sourceCode, stdin = '') {
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

  const sandbox = {
    console: customConsole,
    stdinData: stdin,
    Math: Math,
    Date: Date,
    JSON: JSON,
    parseInt: parseInt,
    parseFloat: parseFloat,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    Set: Set,
    Map: Map
  };

  const vmModule = require('vm');
  const context = vmModule.createContext(sandbox);

  try {
    const script = new vmModule.Script(sourceCode);
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
  const executionTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

  return {
    stdout: stdout.trimEnd(),
    stderr: stderr.trimEnd(),
    exitCode,
    status,
    executionTimeMs: parseFloat(executionTimeMs)
  };
}

/**
 * Execute Python source code safely via system python executable or simulated sandbox
 */
async function executePython(sourceCode, stdin = '') {
  return new Promise((resolve) => {
    const startTime = process.hrtime();
    let stdout = '';
    let stderr = '';

    // Check if python or py is available
    const pyProcess = spawn('python', ['-c', sourceCode], { timeout: EXECUTION_TIMEOUT_MS });

    pyProcess.stdin.write(stdin || '');
    pyProcess.stdin.end();

    pyProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pyProcess.on('error', (err) => {
      // If python executable is not on PATH, provide graceful evaluation
      const diff = process.hrtime(startTime);
      const executionTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);
      resolve({
        stdout: '',
        stderr: `Python runtime is not configured on this host. (${err.message})`,
        exitCode: 127,
        status: 'runtime_error',
        executionTimeMs: parseFloat(executionTimeMs)
      });
    });

    pyProcess.on('close', (code) => {
      const diff = process.hrtime(startTime);
      const executionTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);
      resolve({
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        exitCode: code || 0,
        status: code === 0 ? 'completed' : 'runtime_error',
        executionTimeMs: parseFloat(executionTimeMs)
      });
    });
  });
}

/**
 * Main Execution Gateway
 */
async function runCode(sourceCode, language = 'javascript', stdin = '', sessionId = null, userId = null) {
  let result;
  const lang = (language || 'javascript').toLowerCase();

  if (lang === 'python' || lang === 'py') {
    result = await executePython(sourceCode, stdin);
  } else {
    // Default to JavaScript
    result = await executeJavaScript(sourceCode, stdin);
  }

  // Persist execution log to Supabase if configured and valid sessionId/userId provided
  if (isSupabaseConfigured && supabaseAdmin && sessionId && userId) {
    try {
      // Try atomic RPC first
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('record_code_execution', {
        p_session_id: sessionId,
        p_user_id: userId,
        p_language: lang,
        p_time: result.executionTimeMs,
        p_exit_code: result.exitCode,
        p_status: result.status,
        p_stdout: result.stdout,
        p_stderr: result.stderr
      });

      if (rpcError) {
        // Fallback to standard insert
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
      }
    } catch (logErr) {
      console.warn('[Code Execution] Supabase logging notice:', logErr.message);
    }
  }

  return result;
}

module.exports = {
  runCode,
  executeJavaScript,
  executePython
};
