/**
 * CAMPUS AI — Core SaaS Frontend Interactive Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Sidebar Backdrop Handler
  const sidebar = document.getElementById('appSidebar');

  // Create mobile backdrop if not present
  let mobileBackdrop = document.querySelector('.mobile-sidebar-backdrop');
  if (!mobileBackdrop) {
    mobileBackdrop = document.createElement('div');
    mobileBackdrop.className = 'mobile-sidebar-backdrop';
    document.body.appendChild(mobileBackdrop);
  }

  if (mobileBackdrop && sidebar) {
    mobileBackdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      mobileBackdrop.classList.remove('active');
    });
  }

  // 2. Close User Profile Dropdown on Outside Click
  document.addEventListener('click', (e) => {
    const userDropdown = document.getElementById('userDropdownMenu');
    const userTrigger = document.getElementById('userProfileTrigger');
    if (userDropdown && (userDropdown.classList.contains('active') || userDropdown.classList.contains('show'))) {
      if (!userDropdown.contains(e.target) && !userTrigger.contains(e.target)) {
        userDropdown.classList.remove('active', 'show');
        if (userTrigger) {
          userTrigger.classList.remove('active');
          userTrigger.setAttribute('aria-expanded', 'false');
        }
      }
    }
  });

  // 3. Global Keyboard Shortcuts (Ctrl+K, Cmd+K, Escape)
  document.addEventListener('keydown', (e) => {
    // Ctrl+K or Cmd+K: Open Search Palette
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      openSearchPalette();
    }
    // Escape: Close active overlays
    if (e.key === 'Escape') {
      closeSearchPalette();
      closeAllModals();
      const userDropdown = document.getElementById('userDropdownMenu');
      const userTrigger = document.getElementById('userProfileTrigger');
      if (userDropdown) userDropdown.classList.remove('active', 'show');
      if (userTrigger) {
        userTrigger.classList.remove('active');
        userTrigger.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // 4. Live Filter in Search Command Palette
  const searchInput = document.getElementById('searchPaletteInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const items = document.querySelectorAll('.search-result-item');
      let visibleCount = 0;

      items.forEach(item => {
        const title = item.querySelector('.result-title').textContent.toLowerCase();
        const sub = item.querySelector('.result-sub').textContent.toLowerCase();
        const keywords = item.getAttribute('data-keywords') || '';

        if (!query || title.includes(query) || sub.includes(query) || keywords.includes(query)) {
          item.style.display = 'flex';
          visibleCount++;
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

  // 5. Close Modals & Command Palette on Backdrop Click or Close Button
  document.querySelectorAll('.modal-overlay, .search-palette-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  document.querySelectorAll('.modal-close, [data-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });

  // 6. Theme Settings Radio Button Initial State
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const radio = document.querySelector(`input[name="appTheme"][value="${currentTheme}"]`);
  if (radio) radio.checked = true;

  // 7. Auto-Display URL Query Parameter Toasts
  const urlParams = new URLSearchParams(window.location.search);
  const successMsg = urlParams.get('success');
  const errorMsg = urlParams.get('error');

  if (successMsg) showToast(decodeURIComponent(successMsg), 'success');
  if (errorMsg) showToast(decodeURIComponent(errorMsg), 'error');

  // 8. Restore Saved Nav Group States (Active group always open)
  document.querySelectorAll('.nav-group').forEach(group => {
    const hasActiveChild = group.querySelector('.nav-item.active');
    if (hasActiveChild) {
      group.classList.add('open');
      return;
    }
    const groupId = group.getAttribute('data-group-id');
    if (groupId) {
      const savedState = localStorage.getItem('campus_ai_nav_' + groupId);
      if (savedState === 'open') group.classList.add('open');
      else if (savedState === 'closed') group.classList.remove('open');
    }
  });
});

// --------------------------------------------------------------------------
// THEME ENGINE (Institutional Blue & White Standard)
// --------------------------------------------------------------------------
function toggleTheme() {
  setTheme('light');
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', 'light');
  localStorage.setItem('campus_ai_theme', 'light');
}

// --------------------------------------------------------------------------
// SIDEBAR COLLAPSE ENGINE
// --------------------------------------------------------------------------
function toggleSidebarCollapse() {
  const isCollapsed = document.documentElement.classList.toggle('sidebar-is-collapsed');
  localStorage.setItem('campus_ai_sidebar_collapsed', isCollapsed ? 'true' : 'false');
  const btn = document.querySelector('.sidebar-collapse-trigger');
  if (btn) {
    btn.setAttribute('title', isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar');
  }
}

function setSidebarCollapsed(collapse) {
  if (collapse) {
    document.documentElement.classList.add('sidebar-is-collapsed');
    localStorage.setItem('campus_ai_sidebar_collapsed', 'true');
  } else {
    document.documentElement.classList.remove('sidebar-is-collapsed');
    localStorage.setItem('campus_ai_sidebar_collapsed', 'false');
  }
  const btn = document.querySelector('.sidebar-collapse-trigger');
  if (btn) {
    btn.setAttribute('title', collapse ? 'Expand Sidebar' : 'Collapse Sidebar');
  }
}


// --------------------------------------------------------------------------
// SIDEBAR COLLAPSIBLE CATEGORY ENGINE
// --------------------------------------------------------------------------
function toggleNavGroup(btn) {
  const group = btn.closest('.nav-group');
  if (group) {
    group.classList.toggle('open');
    const groupId = group.getAttribute('data-group-id');
    if (groupId) {
      localStorage.setItem('campus_ai_nav_' + groupId, group.classList.contains('open') ? 'open' : 'closed');
    }
  }
}

// --------------------------------------------------------------------------
// USER PROFILE DROPDOWN
// --------------------------------------------------------------------------
function toggleUserDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('userDropdownMenu');
  const trigger = document.getElementById('userProfileTrigger');
  if (dropdown) {
    const isOpen = !dropdown.classList.contains('active') && !dropdown.classList.contains('show');
    dropdown.classList.toggle('active', isOpen);
    dropdown.classList.toggle('show', isOpen);
    if (trigger) {
      trigger.classList.toggle('active', isOpen);
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }
}

// --------------------------------------------------------------------------
// COMMAND PALETTE SEARCH ENGINE
// --------------------------------------------------------------------------
function openSearchPalette() {
  const overlay = document.getElementById('searchPaletteOverlay');
  const input = document.getElementById('searchPaletteInput');
  if (overlay) {
    overlay.classList.add('active');
    if (input) {
      input.value = '';
      input.focus();
      // Reset items visibility
      document.querySelectorAll('.search-result-item').forEach(it => it.style.display = 'flex');
    }
  }
}

function closeSearchPalette() {
  const overlay = document.getElementById('searchPaletteOverlay');
  if (overlay) overlay.classList.remove('active');
}

// --------------------------------------------------------------------------
// GLOBAL MODAL HELPERS
// --------------------------------------------------------------------------
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
}

// --------------------------------------------------------------------------
// GLOBAL TOAST NOTIFICATIONS
// --------------------------------------------------------------------------
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span style="font-weight: 800; font-size: 1.1rem;">${icons[type] || 'ℹ'}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Expose globals for inline event handlers
window.toggleTheme = toggleTheme;
window.setTheme = setTheme;
window.toggleSidebarCollapse = toggleSidebarCollapse;
window.setSidebarCollapsed = setSidebarCollapsed;
window.toggleUserDropdown = toggleUserDropdown;
window.openSearchPalette = openSearchPalette;
window.closeSearchPalette = closeSearchPalette;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.toggleNavGroup = toggleNavGroup;
