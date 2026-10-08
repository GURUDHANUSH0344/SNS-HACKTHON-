/**
 * CAMPUS AI - Global Floating Chatbot & Conversational Assistant
 * Only active and displayed after user authentication
 */

document.addEventListener('DOMContentLoaded', () => {
  const fab = document.getElementById('aiChatFab');
  const drawer = document.getElementById('aiChatDrawer');
  const closeBtn = document.getElementById('aiChatClose');
  const clearBtn = document.getElementById('aiChatClear');
  const sendBtn = document.getElementById('aiChatSend');
  const input = document.getElementById('aiChatInput');
  const body = document.getElementById('aiChatBody');

  function toggleDrawer() {
    if (!drawer) return;
    drawer.classList.toggle('open');
    if (drawer.classList.contains('open')) {
      drawer.setAttribute('aria-hidden', 'false');
      if (input) setTimeout(() => input.focus(), 100);
    } else {
      drawer.setAttribute('aria-hidden', 'true');
    }
  }

  if (fab && drawer) {
    fab.addEventListener('click', toggleDrawer);
  }

  if (closeBtn && drawer) {
    closeBtn.addEventListener('click', () => {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    });
  }

  if (clearBtn && body) {
    clearBtn.addEventListener('click', () => {
      body.innerHTML = `
        <div class="chat-bubble bot">
          Chat history cleared. How can I assist you with your campus schedule, academic records, or policies?
        </div>
      `;
    });
  }

  // Global keyboard shortcut (Ctrl+/ or Cmd+/) to toggle AI assistant
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      toggleDrawer();
    }
  });

  function appendMessage(text, role = 'bot') {
    if (!body) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.innerHTML = formatMarkdown(text);
    body.appendChild(bubble);
    body.scrollTop = body.scrollHeight;
  }

  function formatMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  async function handleSend() {
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;

    appendMessage(msg, 'user');
    input.value = '';

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'chat-bubble bot';
    typing.id = 'aiTypingIndicator';
    typing.innerHTML = '<span class="pulse-dot" style="display:inline-block; margin-right: 6px;"></span><em>CampusAI is analyzing...</em>';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    try {
      const res = await fetch('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      const indicator = document.getElementById('aiTypingIndicator');
      if (indicator) indicator.remove();

      if (data && data.reply) {
        appendMessage(data.reply, 'bot');
      } else {
        appendMessage('I am here to assist with campus questions, attendance, exams, fees, and more.', 'bot');
      }
    } catch (e) {
      const indicator = document.getElementById('aiTypingIndicator');
      if (indicator) indicator.remove();
      appendMessage('Campus AI service is operating in local intelligence fallback mode.', 'bot');
    }
  }

  if (sendBtn) sendBtn.addEventListener('click', handleSend);
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  // Quick suggestion pills
  document.querySelectorAll('.suggestion-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      if (input) {
        input.value = pill.textContent.replace(/^[^\w\s]+/, '').trim();
        handleSend();
      }
    });
  });
});
