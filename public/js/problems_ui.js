/**
 * CAMPUS AI - Campus Problem Helpdesk UI Helpers & AI Auto-Classification
 */

async function triggerAIProblemClassification() {
  const title = document.getElementById('problemTitle')?.value || '';
  const description = document.getElementById('problemDesc')?.value || '';
  const building = document.getElementById('problemBuilding')?.value || '';
  const room = document.getElementById('problemRoom')?.value || '';

  if (!title && !description) {
    showToast('Please type a title or description first for the AI to classify.', 'warning');
    return;
  }

  const aiBtn = document.getElementById('btnAIClassify');
  if (aiBtn) {
    aiBtn.disabled = true;
    aiBtn.innerHTML = '🤖 Analyzing Issue with AI...';
  }

  try {
    const res = await fetch('/problems/ai-classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        location: `${building} Room ${room}`
      })
    });
    const data = await res.json();

    if (aiBtn) {
      aiBtn.disabled = false;
      aiBtn.innerHTML = '✨ Run AI Auto-Classify';
    }

    if (data.success) {
      const catField = document.getElementById('problemCategory');
      const subcatField = document.getElementById('problemSubcategory');
      const priorityField = document.getElementById('problemPriority');
      const box = document.getElementById('aiRoutingBox');

      if (catField && data.category) catField.value = data.category;
      if (subcatField && data.subcategory) subcatField.value = data.subcategory;
      if (priorityField && data.priority) priorityField.value = data.priority;

      if (box) {
        box.style.display = 'block';
        box.innerHTML = `
          <div style="background: var(--primary-light); border: 1px solid rgba(37, 99, 235, 0.3); border-radius: 8px; padding: 1rem; margin-top: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--primary); font-weight: 700;">
              <span>🤖 AI Auto-Routing Diagnostics</span>
            </div>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 0.35rem;">
              <strong>Target Department:</strong> ${data.department} • <strong>Priority:</strong> ${data.priority} (Target SLA: ${data.recommendedSlaHours}h)
            </p>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
              <em>${data.routingExplanation}</em>
            </p>
          </div>
        `;
      }
      showToast('AI successfully classified issue and assigned responsible department!', 'success');
    }
  } catch (err) {
    if (aiBtn) {
      aiBtn.disabled = false;
      aiBtn.innerHTML = '✨ Run AI Auto-Classify';
    }
    showToast('AI classification temporarily in local mode', 'info');
  }
}

window.triggerAIProblemClassification = triggerAIProblemClassification;
