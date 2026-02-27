document.addEventListener('DOMContentLoaded', async () => {
  const user = initPage('dashboard.html');
  if (!user) return;

  const main = document.getElementById('mainContent');

  try {
    const data = await apiGet('/api/dashboard/stats');
    if (!data) return;

    const { stats, role } = data;

    let statsHTML = '';

    if (role === 'admin') {
      statsHTML = `
        <div class="stat-card">
          <div class="stat-icon purple">📚</div>
          <div class="stat-info"><h3>Total Books</h3><div class="stat-value">${stats.totalBooks}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">👥</div>
          <div class="stat-info"><h3>Total Users</h3><div class="stat-value">${stats.totalUsers}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon amber">📖</div>
          <div class="stat-info"><h3>Books Issued</h3><div class="stat-value">${stats.issuedBooks}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">💰</div>
          <div class="stat-info"><h3>Total Fines</h3><div class="stat-value">₹${stats.totalFines}</div></div>
        </div>
      `;
    } else if (role === 'librarian') {
      statsHTML = `
        <div class="stat-card">
          <div class="stat-icon purple">📚</div>
          <div class="stat-info"><h3>Total Books</h3><div class="stat-value">${stats.totalBooks}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">🎓</div>
          <div class="stat-info"><h3>Students</h3><div class="stat-value">${stats.totalStudents}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon amber">📖</div>
          <div class="stat-info"><h3>Books Issued</h3><div class="stat-value">${stats.issuedBooks}</div></div>
        </div>
      `;
    } else {
      statsHTML = `
        <div class="stat-card">
          <div class="stat-icon purple">📚</div>
          <div class="stat-info"><h3>Library Books</h3><div class="stat-value">${stats.totalBooks}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon amber">📖</div>
          <div class="stat-info"><h3>My Issued Books</h3><div class="stat-value">${stats.myIssuedBooks}</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">💰</div>
          <div class="stat-info"><h3>My Total Fines</h3><div class="stat-value">₹${stats.myTotalFines}</div></div>
        </div>
      `;
    }

    let actionsHTML = '';
    if (role === 'admin') {
      actionsHTML = `
        <div class="card mt-4">
          <div class="card-header"><h2>Quick Actions</h2></div>
          <div class="flex gap-3 flex-wrap">
            <a href="manage-books.html" class="btn btn-primary">📖 Manage Books</a>
            <a href="manage-users.html" class="btn btn-outline">👥 Manage Users</a>
            <a href="transactions.html" class="btn btn-outline">📋 Issue Book</a>
            <a href="books.html" class="btn btn-outline">🔍 Browse Books</a>
          </div>
        </div>
      `;
    } else if (role === 'librarian') {
      actionsHTML = `
        <div class="card mt-4">
          <div class="card-header"><h2>Quick Actions</h2></div>
          <div class="flex gap-3 flex-wrap">
            <a href="transactions.html" class="btn btn-primary">📋 Issue Book</a>
            <a href="return-book.html" class="btn btn-outline">↩️ Return Book</a>
            <a href="books.html" class="btn btn-outline">🔍 Browse Books</a>
          </div>
        </div>
      `;
    } else {
      actionsHTML = `
        <div class="card mt-4">
          <div class="card-header"><h2>Quick Actions</h2></div>
          <div class="flex gap-3 flex-wrap">
            <a href="books.html" class="btn btn-primary">🔍 Browse Books</a>
            <a href="transactions.html" class="btn btn-outline">📋 My Books & Fines</a>
          </div>
        </div>
      `;
    }

    main.innerHTML = `
      <div class="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, ${user.name}!</p>
      </div>
      <div class="stats-grid">${statsHTML}</div>
      ${actionsHTML}
    `;
  } catch (err) {
    main.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error loading dashboard</h3></div>';
  }
});
