document.addEventListener('DOMContentLoaded', async () => {
    const user = initPage('return-book.html');
    if (!user) return;

    if (user.role === 'student') {
        window.location.href = 'transactions.html';
        return;
    }

    const main = document.getElementById('mainContent');
    await loadIssuedBooks(main);
});

async function loadIssuedBooks(main) {
    try {
        const data = await apiGet('/api/records/issued');
        if (!data) return;
        const records = data.records || [];

        main.innerHTML = `
      <div class="page-header">
        <h1>Return Book</h1>
        <p>Accept book returns from students</p>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Currently Issued Books (${records.length})</h2>
        </div>
        ${records.length > 0 ? `
          <div class="table-wrapper"><table>
            <thead>
              <tr>
                <th>Book</th>
                <th>Student</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${records.map(r => `<tr>
                <td><strong>${esc(r.book_title)}</strong><br><small style="color:var(--text-muted);">${esc(r.book_author)}</small></td>
                <td>${esc(r.user_name)}<br><small style="color:var(--text-muted);">${esc(r.user_email)}</small></td>
                <td>${formatDate(r.issue_date)}</td>
                <td>${formatDate(r.due_date)}</td>
                <td>${new Date(r.due_date) < new Date()
                ? '<span class="badge badge-issued">⚠️ Overdue</span>'
                : '<span class="badge badge-issued">Issued</span>'}</td>
                <td><button class="btn btn-success btn-sm" onclick="returnBook(${r.record_id})">Return</button></td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        ` : '<div class="empty-state" style="padding:30px;"><div class="empty-icon">✅</div><h3>No books currently issued</h3><p>All books have been returned.</p></div>'}
      </div>
    `;
    } catch (err) {
        main.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error loading records</h3></div>';
    }
}

async function returnBook(recordId) {
    if (!confirm('Confirm return? Fine will be calculated automatically if overdue.')) return;

    try {
        const result = await apiPost(`/api/records/return/${recordId}`, {});
        if (!result) return;

        if (result.ok) {
            showToast(result.data.message, 'success');
            setTimeout(() => location.reload(), 600);
        } else {
            showToast(result.data.error || 'Failed to return book.', 'error');
        }
    } catch (err) {
        showToast('Network error.', 'error');
    }
}

function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
