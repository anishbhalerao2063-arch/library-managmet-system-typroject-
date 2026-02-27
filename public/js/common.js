// Shared utilities used by all pages
const API = '';

function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
}

function requireAuth() {
    if (!getToken()) {
        window.location.href = 'index.html';
        return null;
    }
    return getUser();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

async function apiGet(endpoint) {
    const res = await fetch(`${API}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (res.status === 401) { logout(); return null; }
    return res.json();
}

async function apiPost(endpoint, body) {
    const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
    });
    if (res.status === 401) { logout(); return null; }
    return { ok: res.ok, data: await res.json() };
}

async function apiPut(endpoint, body) {
    const res = await fetch(`${API}${endpoint}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
    });
    if (res.status === 401) { logout(); return null; }
    return { ok: res.ok, data: await res.json() };
}

async function apiDelete(endpoint) {
    const res = await fetch(`${API}${endpoint}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (res.status === 401) { logout(); return null; }
    return { ok: res.ok, data: await res.json() };
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(80px)';
        setTimeout(() => toast.remove(), 250);
    }, 3500);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderSidebar(activePage) {
    const user = getUser();
    if (!user) return '';

    const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
    const role = user.role;

    let navItems = '';

    navItems += navLink('dashboard.html', '📊', 'Dashboard', activePage);
    navItems += navLink('books.html', '📚', 'Books', activePage);

    if (role === 'admin') {
        navItems += navLink('manage-books.html', '📖', 'Manage Books', activePage);
        navItems += navLink('manage-users.html', '👥', 'Manage Users', activePage);
        navItems += navLink('transactions.html', '📋', 'Issue Book', activePage);
        navItems += navLink('return-book.html', '↩️', 'Return Book', activePage);
    }

    if (role === 'librarian') {
        navItems += navLink('transactions.html', '📋', 'Issue Book', activePage);
        navItems += navLink('return-book.html', '↩️', 'Return Book', activePage);
    }

    if (role === 'student') {
        navItems += navLink('transactions.html', '📋', 'My Books', activePage);
        navItems += navLink('cart.html', '🛒', 'Cart', activePage);
    }

    return `
    <div class="mobile-header">
      <button class="hamburger-btn" onclick="toggleSidebar()">☰</button>
      <span style="font-weight:600;color:#fff;">📚 Library Connect</span>
      <div></div>
    </div>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">📚</div>
          <div class="sidebar-brand-text">
            <h2>Library Connect</h2>
          </div>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${navItems}
      </nav>
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">${initial}</div>
          <div class="user-details">
            <div class="user-name">${user.name}</div>
            <div class="user-role">${user.role}</div>
          </div>
        </div>
        <button class="btn-logout" onclick="logout()">↪ Sign Out</button>
      </div>
    </aside>
  `;
}

function navLink(href, icon, label, activePage) {
    const isActive = activePage === href ? 'active' : '';
    return `<a href="${href}" class="nav-item ${isActive}"><span class="nav-icon">${icon}</span> ${label}</a>`;
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

function initPage(pageName) {
    const user = requireAuth();
    if (!user) return null;

    const sidebarHTML = renderSidebar(pageName);
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

    if (!document.getElementById('toastContainer')) {
        document.body.insertAdjacentHTML('beforeend', '<div class="toast-container" id="toastContainer"></div>');
    }

    return user;
}
