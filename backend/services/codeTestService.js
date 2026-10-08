/**
 * CAMPUS AI — AI Code Lab Automated Test Runner Service
 * 
 * Runs algorithm source code across structured test suites,
 * compares actual vs expected outputs, and records status in Supabase.
 */

const { runCode } = require('./codeExecutionService');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

/**
 * Execute code against a series of test cases
 * @param {string} sourceCode 
 * @param {string} language 
 * @param {Array<{input: string, expected_output: string}>} testCases 
 * @param {string} sessionId 
 * @returns {Promise<object>}
 */
async function runTestSuite(sourceCode, language = 'javascript', testCases = [], sessionId = null) {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      allPassed: true,
      results: []
    };
  }

  const results = [];
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const inputStr = tc.input || '';
    const expectedStr = (tc.expected_output || tc.expected || '').trim();

    const runResult = await runCode(sourceCode, language, inputStr);
    const actualStr = (runResult.stdout || '').trim();
    const isPassed = runResult.exitCode === 0 && actualStr === expectedStr;

    if (isPassed) passedCount++;

    const caseResult = {
      testCaseIndex: i + 1,
      input: inputStr,
      expected: expectedStr,
      actual: actualStr,
      passed: isPassed,
      status: isPassed ? 'passed' : (runResult.exitCode !== 0 ? 'error' : 'failed'),
      stderr: runResult.stderr,
      executionTimeMs: runResult.executionTimeMs
    };

    results.push(caseResult);

    // Update Supabase test case if ID present
    if (isSupabaseConfigured && supabaseAdmin && tc.id) {
      try {
        await supabaseAdmin.from('code_test_cases').update({
          actual_output: actualStr,
          status: caseResult.status
        }).eq('id', tc.id);
      } catch (err) {
        // Continue
      }
    }
  }

  return {
    total: testCases.length,
    passed: passedCount,
    failed: testCases.length - passedCount,
    allPassed: passedCount === testCases.length,
    results
  };
}

module.exports = {
  runTestSuite
};
