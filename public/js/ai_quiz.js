/**
 * CAMPUS AI - Dynamic AI Quiz Generator Client Runner
 */

let currentQuizQuestions = [];
let currentQuizId = null;
let userAnswers = {};

async function handleGenerateQuiz(e) {
  if (e) e.preventDefault();
  const form = document.getElementById('quizGenForm');
  const subject = form.subject.value;
  const topic = form.topic.value;
  const difficulty = form.difficulty.value;
  const count = form.count.value;

  const btn = document.getElementById('genQuizBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Generating AI Quiz...';

  try {
    const res = await fetch('/ai/quiz/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, topic, difficulty, count })
    });
    const data = await res.json();
    btn.disabled = false;
    btn.innerHTML = '⚡ Generate Quiz';

    if (data.success && data.questions) {
      currentQuizQuestions = data.questions;
      currentQuizId = data.quizId;
      userAnswers = {};
      renderActiveQuiz(data.title, data.questions);
    } else {
      showToast('Failed to generate quiz. Please check parameters.', 'error');
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '⚡ Generate Quiz';
    showToast('Network error while generating quiz', 'error');
  }
}

function renderActiveQuiz(title, questions) {
  const container = document.getElementById('quizArena');
  if (!container) return;
  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });

  let html = `
    <div class="card" style="border: 2px solid var(--primary); margin-top: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${title}</h3>
          <p style="font-size: 0.8125rem; color: var(--text-muted);">${questions.length} Questions • Adaptive Scoring • +25 XP per correct answer</p>
        </div>
        <span class="status-pill status-inprogress">Active Evaluation</span>
      </div>
      <form id="activeQuizForm" onsubmit="submitActiveQuiz(event)">
  `;

  questions.forEach((q, qIdx) => {
    html += `
      <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
        <p style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.85rem;">
          <span style="color: var(--primary); font-weight: 800;">Q${qIdx + 1}.</span> ${q.question}
        </p>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
    `;

    q.options.forEach((opt, optIdx) => {
      html += `
        <label style="display: flex; align-items: center; gap: 0.65rem; background: #fff; border: 1px solid var(--border); padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.15s;">
          <input type="radio" name="q_${qIdx}" value="${optIdx}" onchange="selectAnswer(${qIdx}, ${optIdx})" required />
          <span style="font-size: 0.875rem;">${opt}</span>
        </label>
      `;
    });

    html += `
        </div>
        <div id="feedback_${qIdx}" style="display: none; margin-top: 0.75rem; padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.8125rem;"></div>
      </div>
    `;
  });

  html += `
        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
          <button type="submit" id="submitQuizBtn" class="btn btn-primary" style="padding: 0.65rem 1.5rem; font-size: 1rem;">
            🎯 Submit Quiz & Calculate Growth Score
          </button>
        </div>
      </form>
    </div>
  `;

  container.innerHTML = html;
}

function selectAnswer(qIdx, optIdx) {
  userAnswers[qIdx] = optIdx;
}

async function submitActiveQuiz(e) {
  e.preventDefault();
  const btn = document.getElementById('submitQuizBtn');
  btn.disabled = true;
  btn.innerHTML = 'Evaluating Answers...';

  try {
    const res = await fetch('/ai/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId: currentQuizId,
        answers: userAnswers
      })
    });
    const data = await res.json();
    btn.style.display = 'none';

    if (data.success) {
      showToast(`Quiz completed! You scored ${data.percentage}% and earned +${data.xpEarned} XP!`, 'success');
      // Highlight answers
      currentQuizQuestions.forEach((q, qIdx) => {
        const fb = document.getElementById(`feedback_${qIdx}`);
        if (fb) {
          fb.style.display = 'block';
          const isCorrect = userAnswers[qIdx] == q.correctIndex;
          if (isCorrect) {
            fb.style.background = 'var(--success-light)';
            fb.style.color = '#065f46';
            fb.innerHTML = `<strong>✓ Correct!</strong> ${q.explanation}`;
          } else {
            fb.style.background = 'var(--danger-light)';
            fb.style.color = '#991b1b';
            fb.innerHTML = `<strong>✗ Incorrect.</strong> Correct answer: <em>${q.options[q.correctIndex]}</em><br/>${q.explanation}`;
          }
        }
      });
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = 'Submit Quiz';
    showToast('Failed to evaluate quiz', 'error');
  }
}

window.handleGenerateQuiz = handleGenerateQuiz;
window.submitActiveQuiz = submitActiveQuiz;
window.selectAnswer = selectAnswer;
