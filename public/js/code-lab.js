/**
 * CAMPUS AI — AI Code Lab Interactive Engine
 * 
 * Manages Monaco IDE initialization, sandboxed execution,
 * AI code generation, test runners, debugging diffs, and cloud sync.
 */

(function () {
  'use strict';

  // Global State
  let editorInstance = null;
  let currentLanguage = 'python';
  let currentDifficulty = 'beginner';
  let currentMode = 'learn';
  let currentSessionId = window.__INITIAL_SESSION_ID || '';
  let isExecuting = false;
  let isDirty = false;
  let lastGeneratedCode = '';

  const STARTER_TEMPLATES = window.__STARTER_TEMPLATES || {
    python: `# Python 3 Starter\n# Write, Run, Learn, Improve.\n\nn = int(input())\nprint(f"Square of {n} is: {n * n}")\n`,
    c: `#include <stdio.h>\n\nint main() {\n    printf("Hello from CampusAI C Sandbox!\\n");\n    return 0;\n}\n`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from CampusAI C++ Sandbox!" << endl;\n    return 0;\n}\n`,
    java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from CampusAI Java Sandbox!");\n    }\n}\n`,
    javascript: `// JavaScript (Node.js VM Sandbox)\n\nfunction findTwoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}\n\nconst nums = [2, 7, 11, 15];\nconsole.log("Two Sum indices:", findTwoSum(nums, 9));\n`
  };

  document.addEventListener('DOMContentLoaded', initCodeLab);

  function initCodeLab() {
    initEditor();
    bindEvents();
    switchTab('output');
  }

  /**
   * 1. Initialize Monaco Editor (with fallback textarea)
   */
  function initEditor() {
    const mountPoint = document.getElementById('monacoEditorMount');
    const fallbackTextarea = document.getElementById('fallbackCodeEditor');
    const langSelect = document.getElementById('codeLanguageSelect');
    if (langSelect) currentLanguage = langSelect.value || 'python';

    if (window.monaco) {
      createMonacoInstance();
    } else if (window.require && typeof window.require === 'function') {
      try {
        window.require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
        window.require(['vs/editor/editor.main'], function () {
          createMonacoInstance();
        });
      } catch (e) {
        useFallbackEditor();
      }
    } else {
      useFallbackEditor();
    }

    function createMonacoInstance() {
      if (!mountPoint) return;
      mountPoint.style.display = 'block';
      if (fallbackTextarea) fallbackTextarea.style.display = 'none';

      const initialValue = fallbackTextarea ? fallbackTextarea.value : (STARTER_TEMPLATES[currentLanguage] || '');

      editorInstance = monaco.editor.create(mountPoint, {
        value: initialValue,
        language: mapMonacoLanguage(currentLanguage),
        theme: 'vs-dark',
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        automaticLayout: true,
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        bracketPairColorization: { enabled: true },
        padding: { top: 12, bottom: 12 }
      });

      editorInstance.onDidChangeModelContent(() => {
        isDirty = true;
      });
    }

    function useFallbackEditor() {
      if (mountPoint) mountPoint.style.display = 'none';
      if (fallbackTextarea) {
        fallbackTextarea.style.display = 'block';
        if (!fallbackTextarea.value.trim()) {
          fallbackTextarea.value = STARTER_TEMPLATES[currentLanguage] || '';
        }
        fallbackTextarea.addEventListener('input', () => { isDirty = true; });
      }
    }
  }

  function getEditorCode() {
    if (editorInstance) return editorInstance.getValue();
    const fallback = document.getElementById('fallbackCodeEditor');
    return fallback ? fallback.value : '';
  }

  function setEditorCode(code) {
    if (editorInstance) {
      editorInstance.setValue(code);
    } else {
      const fallback = document.getElementById('fallbackCodeEditor');
      if (fallback) fallback.value = code;
    }
    isDirty = false;
  }

  function insertEditorCodeAtEnd(code) {
    const current = getEditorCode();
    setEditorCode(current + '\n\n' + code);
  }

  function mapMonacoLanguage(lang) {
    const l = (lang || '').toLowerCase();
    if (l === 'c' || l === 'cpp') return 'cpp';
    if (l === 'python' || l === 'py') return 'python';
    if (l === 'javascript' || l === 'js') return 'javascript';
    if (l === 'typescript' || l === 'ts') return 'typescript';
    if (l === 'java') return 'java';
    if (l === 'sql') return 'sql';
    if (l === 'html') return 'html';
    if (l === 'css') return 'css';
    return 'plaintext';
  }

  /**
   * 2. Event Listeners
   */
  function bindEvents() {
    // Language Switcher
    const langSelect = document.getElementById('codeLanguageSelect');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        const newLang = e.target.value;
        if (isDirty && getEditorCode().trim()) {
          if (!confirm(`Switching language to ${newLang.toUpperCase()} will load starter code. Replace current draft?`)) {
            e.target.value = currentLanguage;
            return;
          }
        }
        currentLanguage = newLang;
        setEditorCode(STARTER_TEMPLATES[currentLanguage] || `// Starter code for ${currentLanguage}`);
        if (editorInstance && window.monaco) {
          monaco.editor.setModelLanguage(editorInstance.getModel(), mapMonacoLanguage(currentLanguage));
        }
      });
    }

    // Run Button
    const runBtn = document.getElementById('runCodeBtn');
    if (runBtn) runBtn.addEventListener('click', executeCode);

    // Stop Button
    const stopBtn = document.getElementById('stopCodeBtn');
    if (stopBtn) stopBtn.addEventListener('click', stopExecution);

    // Save Button
    const saveBtn = document.getElementById('saveSessionBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveSession);

    // Reset Button
    const resetBtn = document.getElementById('resetCodeBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      if (confirm('Reset editor to clean starter template?')) {
        setEditorCode(STARTER_TEMPLATES[currentLanguage] || '');
      }
    });

    // Download Button
    const downloadBtn = document.getElementById('downloadCodeBtn');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadCodeFile);

    // Natural Language Generator Button
    const genBtn = document.getElementById('aiGenerateCodeBtn');
    if (genBtn) genBtn.addEventListener('click', triggerCodeGeneration);

    const searchInput = document.getElementById('aiSearchInput');
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') triggerCodeGeneration();
      });
    }

    // Mode Selector (Learn Mode vs Direct Solution)
    const modeBtns = document.querySelectorAll('.codelab-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode || 'learn';
      });
    });

    // AI Action Buttons
    const aiExplainBtn = document.getElementById('aiExplainBtn');
    if (aiExplainBtn) aiExplainBtn.addEventListener('click', () => triggerAiAction('explain'));

    const aiDebugBtn = document.getElementById('aiDebugBtn');
    if (aiDebugBtn) aiDebugBtn.addEventListener('click', () => triggerAiAction('debug'));

    const aiOptimizeBtn = document.getElementById('aiOptimizeBtn');
    if (aiOptimizeBtn) aiOptimizeBtn.addEventListener('click', () => triggerAiAction('optimize'));

    const aiTestsBtn = document.getElementById('aiTestsBtn');
    if (aiTestsBtn) aiTestsBtn.addEventListener('click', generateTestSuite);

    const aiHintBtn = document.getElementById('aiHintBtn');
    if (aiHintBtn) aiHintBtn.addEventListener('click', showHintsModal);

    const aiConvertBtn = document.getElementById('aiConvertBtn');
    if (aiConvertBtn) aiConvertBtn.addEventListener('click', showConvertModal);

    // Tutor Chat Input
    const tutorInput = document.getElementById('tutorFollowUpInput');
    if (tutorInput) {
      tutorInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleTutorQuestion();
      });
    }
  }

  /**
   * 3. Real Code Execution
   */
  async function executeCode() {
    if (isExecuting) return;

    const sourceCode = getEditorCode();
    const stdinInput = document.getElementById('stdinTextarea');
    const stdin = stdinInput ? stdinInput.value : '';

    if (!sourceCode.trim()) {
      showToast('Please write or generate code before running.', 'warning');
      return;
    }

    const runBtn = document.getElementById('runCodeBtn');
    const banner = document.getElementById('terminalStatusBanner');
    const terminal = document.getElementById('terminalOutputConsole');
    const timeBadge = document.getElementById('terminalTimeBadge');

    isExecuting = true;
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.innerHTML = '<span>⏳ Running...</span>';
    }

    switchTab('output');
    if (banner) {
      banner.className = 'codelab-status-banner running';
      banner.innerHTML = '<span>⚡ Executing code in isolated sandbox...</span>';
    }
    if (terminal) terminal.textContent = 'Executing... Please wait.\n';

    try {
      const res = await fetch('/api/code-lab/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCode,
          language: currentLanguage,
          stdin,
          sessionId: currentSessionId || null
        })
      });

      const data = await res.json();

      if (data.success) {
        if (timeBadge) timeBadge.textContent = (data.executionTimeMs || 0) + ' ms';

        if (data.status === 'completed') {
          if (banner) {
            banner.className = 'codelab-status-banner success';
            banner.innerHTML = `<span>✓ Execution Successful (Exit code: ${data.exitCode})</span>`;
          }
          if (terminal) terminal.textContent = data.stdout || '(Program completed with no console output)';
        } else if (data.status === 'timeout') {
          if (banner) {
            banner.className = 'codelab-status-banner error';
            banner.innerHTML = '<span>⚠️ Execution Timed Out (5s Limit)</span>';
          }
          if (terminal) terminal.textContent = data.stderr || 'Execution terminated: timeout exceeded.';
        } else if (data.status === 'unavailable') {
          if (banner) {
            banner.className = 'codelab-status-banner running';
            banner.innerHTML = '<span>ℹ️ Execution Environment Unavailable</span>';
          }
          if (terminal) terminal.textContent = data.stderr || 'Execution unavailable for this language.';
        } else {
          // Runtime or Compilation error
          if (banner) {
            banner.className = 'codelab-status-banner error';
            banner.innerHTML = `<span>❌ Error Occurred (Exit code: ${data.exitCode})</span>`;
          }
          const fullErr = (data.stdout ? data.stdout + '\n' : '') + (data.stderr || 'Runtime error');
          if (terminal) terminal.textContent = fullErr;

          // Populate Errors Tab with "Ask AI to Fix"
          populateErrorTab(fullErr);
        }
      } else {
        if (banner) {
          banner.className = 'codelab-status-banner error';
          banner.innerHTML = '<span>❌ Execution Failed</span>';
        }
        if (terminal) terminal.textContent = 'Error: ' + (data.error || 'Server error.');
      }
    } catch (err) {
      if (banner) {
        banner.className = 'codelab-status-banner error';
        banner.innerHTML = '<span>❌ Network Error</span>';
      }
      if (terminal) terminal.textContent = 'Network error contacting sandbox: ' + err.message;
    } finally {
      isExecuting = false;
      if (runBtn) {
        runBtn.disabled = false;
        runBtn.innerHTML = '<span>▶ Run</span>';
      }
    }
  }

  function stopExecution() {
    isExecuting = false;
    const runBtn = document.getElementById('runCodeBtn');
    if (runBtn) {
      runBtn.disabled = false;
      runBtn.innerHTML = '<span>▶ Run</span>';
    }
    const banner = document.getElementById('terminalStatusBanner');
    if (banner) {
      banner.className = 'codelab-status-banner running';
      banner.innerHTML = '<span>■ Execution stopped by user.</span>';
    }
  }

  function populateErrorTab(errMsg) {
    const errorContainer = document.getElementById('errorOutputContainer');
    if (!errorContainer) return;

    errorContainer.innerHTML = `
      <div style="background: #FEE2E2; border-left: 4px solid #DC2626; padding: 0.85rem 1rem; border-radius: 6px; margin-bottom: 0.75rem;">
        <div style="font-weight: 700; color: #991B1B; font-size: 0.85rem; margin-bottom: 0.35rem;">Runtime / Compilation Output:</div>
        <pre style="margin: 0; font-family: monospace; font-size: 0.8rem; color: #7F1D1D; white-space: pre-wrap;">${escapeHtml(errMsg)}</pre>
      </div>
      <button class="btn btn-sm btn-outline-danger" onclick="window.__triggerAiDebugWithError('${encodeURIComponent(errMsg)}')" style="display: flex; align-items: center; gap: 0.4rem;">
        <span>🤖 Ask CampusAI to Fix this Error</span>
      </button>
    `;
  }

  window.__triggerAiDebugWithError = function (encodedErr) {
    const err = decodeURIComponent(encodedErr);
    triggerAiAction('debug', err);
  };

  /**
   * 4. AI Code Search & Generator
   */
  async function triggerCodeGeneration() {
    const searchInput = document.getElementById('aiSearchInput');
    const query = searchInput ? searchInput.value.trim() : '';

    if (!query) {
      showToast('Please enter what you want to code (e.g. "Find second largest element")', 'warning');
      return;
    }

    const genBtn = document.getElementById('aiGenerateCodeBtn');
    if (genBtn) {
      genBtn.disabled = true;
      genBtn.innerHTML = '<span>⏳ Generating...</span>';
    }

    try {
      const res = await fetch('/api/code-lab/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          language: currentLanguage,
          difficulty: currentDifficulty,
          mode: currentMode
        })
      });

      const data = await res.json();
      if (data.success && data.code) {
        lastGeneratedCode = data.code;
        renderGeneratedSolutionModal(data);
      } else {
        showToast(data.error || 'Could not generate code.', 'error');
      }
    } catch (err) {
      showToast('Error connecting to AI code generator: ' + err.message, 'error');
    } finally {
      if (genBtn) {
        genBtn.disabled = false;
        genBtn.innerHTML = '<span>⚡ Generate Code</span>';
      }
    }
  }

  function renderGeneratedSolutionModal(data) {
    const modal = document.getElementById('solutionResultModal');
    if (!modal) return;

    document.getElementById('solModalLangBadge').textContent = data.language.toUpperCase();
    document.getElementById('solModalModeBadge').textContent = (data.mode || 'learn').toUpperCase() + ' MODE';
    document.getElementById('solModalCodeBlock').textContent = data.code;
    document.getElementById('solModalExplanation').textContent = data.explanation;
    document.getElementById('solModalApproach').textContent = data.approach;
    document.getElementById('solModalComplexity').textContent = `Time: ${data.time_complexity} | Space: ${data.space_complexity}`;
    document.getElementById('solModalExampleInput').textContent = data.example_input;
    document.getElementById('solModalExampleOutput').textContent = data.example_output;

    const edgeList = document.getElementById('solModalEdgeCases');
    if (edgeList) {
      edgeList.innerHTML = (data.edge_cases || []).map(e => `<li>${escapeHtml(e)}</li>`).join('');
    }

    modal.style.display = 'flex';
  }

  window.closeSolutionModal = function () {
    const modal = document.getElementById('solutionResultModal');
    if (modal) modal.style.display = 'none';
  };

  /**
   * Safe Insertion into Editor with Unsaved Changes Guard
   */
  window.insertGeneratedCode = function () {
    if (!lastGeneratedCode) return;
    const existing = getEditorCode().trim();

    if (existing && isDirty) {
      showInsertConflictModal(lastGeneratedCode);
    } else {
      setEditorCode(lastGeneratedCode);
      window.closeSolutionModal();
      showToast('Generated code inserted into editor.', 'success');
    }
  };

  function showInsertConflictModal(codeToInsert) {
    const modal = document.getElementById('insertConflictModal');
    if (!modal) {
      // Fallback prompt
      if (confirm('Your current editor has unsaved changes. Click OK to Replace existing code, or Cancel to append below.')) {
        setEditorCode(codeToInsert);
      } else {
        insertEditorCodeAtEnd(codeToInsert);
      }
      window.closeSolutionModal();
      return;
    }

    modal.style.display = 'flex';

    document.getElementById('btnConflictReplace').onclick = () => {
      setEditorCode(codeToInsert);
      modal.style.display = 'none';
      window.closeSolutionModal();
      showToast('Code replaced with generated solution.', 'success');
    };

    document.getElementById('btnConflictAppend').onclick = () => {
      insertEditorCodeAtEnd(codeToInsert);
      modal.style.display = 'none';
      window.closeSolutionModal();
      showToast('Generated solution inserted below current code.', 'success');
    };

    document.getElementById('btnConflictCancel').onclick = () => {
      modal.style.display = 'none';
    };
  }

  /**
   * 5. AI Coding Assistant Actions (Explain, Debug, Optimize)
   */
  async function triggerAiAction(actionType, extraError = '') {
    const sourceCode = getEditorCode();
    if (!sourceCode.trim()) {
      showToast('Editor is empty. Write or generate code first.', 'warning');
      return;
    }

    const aiOutput = document.getElementById('aiAssistantOutput');
    if (aiOutput) aiOutput.textContent = `🧠 Analyzing with CampusAI (${actionType.toUpperCase()})... Please wait...`;

    try {
      const payload = {
        sourceCode,
        language: currentLanguage,
        sessionId: currentSessionId || null
      };

      if (actionType === 'debug') {
        const stdin = document.getElementById('stdinTextarea')?.value || '';
        payload.stdin = stdin;
        payload.errorOutput = extraError || document.getElementById('terminalOutputConsole')?.textContent || '';
      }

      const res = await fetch(`/api/code-lab/${actionType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        if (actionType === 'explain') {
          if (aiOutput) aiOutput.textContent = data.explanation;
        } else if (actionType === 'debug') {
          renderDebugDiffModal(data);
          if (aiOutput) {
            aiOutput.textContent = `### Diagnosis: ${data.what_failed}\n\n**Cause:** ${data.why_it_failed}\n**Location:** ${data.where_it_failed}\n**Fix:** ${data.how_to_fix}`;
          }
        } else if (actionType === 'optimize') {
          renderOptimizationModal(data);
          if (aiOutput) {
            aiOutput.textContent = `### Big-O Improvement\n- Current: ${data.current_time_complexity} Time | ${data.current_space_complexity} Space\n- Optimized: ${data.optimized_time_complexity} Time | ${data.optimized_space_complexity} Space\n\n${data.justification}`;
          }
        }
      } else {
        if (aiOutput) aiOutput.textContent = 'AI Analysis Error: ' + (data.error || 'Server error.');
      }
    } catch (err) {
      if (aiOutput) aiOutput.textContent = 'Error contacting AI Tutor: ' + err.message;
    }
  }

  function renderDebugDiffModal(data) {
    const modal = document.getElementById('debugDiffModal');
    if (!modal) return;

    document.getElementById('debugWhatFailed').textContent = data.what_failed;
    document.getElementById('debugWhyFailed').textContent = data.why_it_failed;
    document.getElementById('debugWhereFailed').textContent = data.where_it_failed;
    document.getElementById('debugHowToFix').textContent = data.how_to_fix;
    document.getElementById('debugSuggestedCode').textContent = data.suggested_fix;

    modal.style.display = 'flex';

    document.getElementById('btnApplyDebugFix').onclick = () => {
      setEditorCode(data.suggested_fix);
      modal.style.display = 'none';
      showToast('AI proposed fix applied to editor.', 'success');
    };
  }

  window.closeDebugModal = function () {
    const modal = document.getElementById('debugDiffModal');
    if (modal) modal.style.display = 'none';
  };

  function renderOptimizationModal(data) {
    const modal = document.getElementById('optimizeDiffModal');
    if (!modal) return;

    document.getElementById('optComplexityBadge').textContent = `${data.current_time_complexity} ➔ ${data.optimized_time_complexity}`;
    document.getElementById('optJustification').textContent = data.justification;
    document.getElementById('optCodeBlock').textContent = data.optimized_code;

    modal.style.display = 'flex';

    document.getElementById('btnApplyOptimizedCode').onclick = () => {
      setEditorCode(data.optimized_code);
      modal.style.display = 'none';
      showToast('Optimized algorithm loaded into editor.', 'success');
    };
  }

  window.closeOptimizeModal = function () {
    const modal = document.getElementById('optimizeDiffModal');
    if (modal) modal.style.display = 'none';
  };

  /**
   * 6. Automated Test Suites Runner
   */
  let activeTestCases = [];

  async function generateTestSuite() {
    const sourceCode = getEditorCode();
    if (!sourceCode.trim()) {
      showToast('Write or generate code first before generating tests.', 'warning');
      return;
    }

    switchTab('tests');
    const tableBody = document.getElementById('testCasesTableBody');
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748B;">⏳ Generating test cases with AI...</td></tr>';

    try {
      const res = await fetch('/api/code-lab/tests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCode,
          language: currentLanguage,
          sessionId: currentSessionId || null
        })
      });

      const data = await res.json();
      if (data.success && data.test_cases) {
        activeTestCases = data.test_cases;
        renderTestTable(activeTestCases);
      }
    } catch (e) {
      if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" style="color: #DC2626;">Failed to generate tests.</td></tr>';
    }
  }

  function renderTestTable(testCases) {
    const tableBody = document.getElementById('testCasesTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = testCases.map((tc, idx) => `
      <tr>
        <td><strong>#${idx + 1}</strong></td>
        <td><code>${escapeHtml(tc.input || '(empty)')}</code></td>
        <td><code>${escapeHtml(tc.expected_output || tc.expected || '')}</code></td>
        <td id="testActual_${idx}"><code>--</code></td>
        <td id="testStatus_${idx}"><span class="badge" style="background: #E2E8F0; color: #475569;">Ready</span></td>
      </tr>
    `).join('');
  }

  window.runAllTests = async function () {
    if (!activeTestCases || activeTestCases.length === 0) {
      showToast('Please generate or create test cases first.', 'warning');
      return;
    }

    const sourceCode = getEditorCode();
    const btn = document.getElementById('btnRunAllTests');
    const summaryBadge = document.getElementById('testsSummaryBadge');

    if (btn) btn.disabled = true;
    if (summaryBadge) {
      summaryBadge.style.display = 'inline-block';
      summaryBadge.textContent = 'Running tests...';
    }

    try {
      const res = await fetch('/api/code-lab/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCode,
          language: currentLanguage,
          testCases: activeTestCases,
          sessionId: currentSessionId || null
        })
      });

      const data = await res.json();
      if (data.success && data.testResults) {
        const results = data.testResults.results;
        results.forEach((r, idx) => {
          const actualCell = document.getElementById(`testActual_${idx}`);
          const statusCell = document.getElementById(`testStatus_${idx}`);
          if (actualCell) actualCell.innerHTML = `<code>${escapeHtml(r.actual || '')}</code>`;
          if (statusCell) {
            statusCell.innerHTML = r.passed
              ? '<span class="codelab-badge-pass">✓ PASS</span>'
              : '<span class="codelab-badge-fail">❌ FAIL</span>';
          }
        });

        if (summaryBadge) {
          summaryBadge.textContent = data.testResults.summary;
          summaryBadge.style.background = data.testResults.allPassed ? '#DCFCE7' : '#FEE2E2';
          summaryBadge.style.color = data.testResults.allPassed ? '#166534' : '#991B1B';
        }
      }
    } catch (e) {
      showToast('Test execution error: ' + e.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  /**
   * 7. Progressive Hints
   */
  let currentHintLevel = 1;
  async function showHintsModal() {
    const modal = document.getElementById('hintsModal');
    if (!modal) return;
    modal.style.display = 'flex';
    fetchHintForLevel(1);
  }

  window.fetchHintForLevel = async function (level) {
    currentHintLevel = level;
    const body = document.getElementById('hintsModalBody');
    if (body) body.innerHTML = `<div style="color: #64748B;">Fetching Hint Level ${level}...</div>`;

    try {
      const res = await fetch('/api/code-lab/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCode: getEditorCode(),
          language: currentLanguage,
          level
        })
      });
      const data = await res.json();
      if (data.success && body) {
        body.innerHTML = `
          <div style="background: #F8FAFC; border-left: 4px solid #1E4E8C; padding: 1rem; border-radius: 6px;">
            <div style="font-weight: 700; color: #0F2747; margin-bottom: 0.4rem;">💡 Hint ${level} / 3:</div>
            <div style="color: #334155; line-height: 1.5; font-size: 0.875rem;">${escapeHtml(data.hint)}</div>
          </div>
        `;
      }
    } catch (e) {
      if (body) body.textContent = 'Hint unavailable.';
    }
  };

  window.closeHintsModal = function () {
    const modal = document.getElementById('hintsModal');
    if (modal) modal.style.display = 'none';
  };

  /**
   * 8. Language Conversion
   */
  function showConvertModal() {
    const modal = document.getElementById('convertModal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.getElementById('convertSourceLang').textContent = currentLanguage.toUpperCase();
  }

  window.executeLanguageConversion = async function () {
    const targetLang = document.getElementById('convertTargetSelect').value;
    const previewBlock = document.getElementById('convertPreviewBlock');
    const applyBtn = document.getElementById('btnApplyConversion');

    previewBlock.textContent = `Translating to ${targetLang}... Please wait...`;

    try {
      const res = await fetch('/api/code-lab/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCode: getEditorCode(),
          sourceLanguage: currentLanguage,
          targetLanguage: targetLang
        })
      });

      const data = await res.json();
      if (data.success && data.converted_code) {
        previewBlock.textContent = data.converted_code;
        applyBtn.style.display = 'inline-block';
        applyBtn.onclick = () => {
          document.getElementById('codeLanguageSelect').value = targetLang;
          currentLanguage = targetLang;
          setEditorCode(data.converted_code);
          if (editorInstance && window.monaco) {
            monaco.editor.setModelLanguage(editorInstance.getModel(), mapMonacoLanguage(targetLang));
          }
          window.closeConvertModal();
          showToast(`Converted code to ${targetLang.toUpperCase()} and loaded into editor.`, 'success');
        };
      }
    } catch (e) {
      previewBlock.textContent = 'Conversion failed.';
    }
  };

  window.closeConvertModal = function () {
    const modal = document.getElementById('convertModal');
    if (modal) modal.style.display = 'none';
  };

  /**
   * 9. Follow-Up Interactive Tutor Chat
   */
  async function handleTutorQuestion() {
    const input = document.getElementById('tutorFollowUpInput');
    const question = input ? input.value.trim() : '';
    if (!question) return;

    input.value = '';
    const aiOutput = document.getElementById('aiAssistantOutput');
    if (aiOutput) aiOutput.textContent = `🧠 Thinking about "${question}"...`;

    try {
      const res = await fetch('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Code Lab Context (${currentLanguage}):\n\`\`\`${currentLanguage}\n${getEditorCode()}\n\`\`\`\n\nStudent Question: ${question}`
        })
      });
      const data = await res.json();
      if (data.success && aiOutput) {
        aiOutput.textContent = data.reply;
      }
    } catch (e) {
      if (aiOutput) aiOutput.textContent = 'Tutor unavailable.';
    }
  }

  /**
   * 10. Save Session
   */
  async function saveSession() {
    const titleInput = document.getElementById('codelabSessionTitle');
    const title = titleInput ? titleInput.value.trim() : 'Algorithm';
    const sourceCode = getEditorCode();
    const stdin = document.getElementById('stdinTextarea')?.value || '';
    const saveBtn = document.getElementById('saveSessionBtn');

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      let res;
      if (currentSessionId) {
        res = await fetch(`/api/code-lab/sessions/${currentSessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, language: currentLanguage, source_code: sourceCode, stdin })
        });
      } else {
        res = await fetch('/api/code-lab/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, language: currentLanguage, source_code: sourceCode, stdin })
        });
      }

      const data = await res.json();
      if (data.success && data.session) {
        currentSessionId = data.session.id;
        isDirty = false;
        showToast('Coding session saved to cloud.', 'success');
      }
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Save';
      }
    }
  }

  /**
   * 11. Download Code File
   */
  function downloadCodeFile() {
    const code = getEditorCode();
    const titleInput = document.getElementById('codelabSessionTitle');
    const filename = titleInput ? titleInput.value.trim() : 'solution';

    const url = `/api/code-lab/download?language=${encodeURIComponent(currentLanguage)}&filename=${encodeURIComponent(filename)}&sourceCode=${encodeURIComponent(code)}`;
    window.location.href = url;
  }

  /**
   * Tab Switching Helper
   */
  window.switchTab = function (tabName) {
    document.querySelectorAll('.codelab-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.codelab-tab-pane').forEach(pane => {
      pane.style.display = pane.id === `tabPane_${tabName}` ? 'block' : 'none';
    });
  };

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(msg, type = 'info') {
    if (window.showToast) {
      window.showToast(msg, type);
    } else {
      alert(msg);
    }
  }

})();
