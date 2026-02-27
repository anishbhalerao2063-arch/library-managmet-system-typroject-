document.addEventListener('DOMContentLoaded', async () => {
  const user = initPage('books.html');
  if (!user) return;

  const main = document.getElementById('mainContent');
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get('id');

  if (!bookId) {
    main.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><h3>No book selected</h3><p><a href="books.html" style="color:var(--primary);">Browse Books</a></p></div>';
    return;
  }

  try {
    const data = await apiGet(`/api/books/${bookId}`);
    if (!data || !data.book) {
      main.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><h3>Book not found</h3></div>';
      return;
    }

    const book = data.book;
    const role = user.role;

    let actionHTML = '';

    if (role === 'admin' || role === 'librarian') {
      let studentsOptions = '<option value="">Select a student...</option>';
      try {
        const sData = await apiGet('/api/users/students');
        if (sData && sData.students) {
          studentsOptions += sData.students.map(s =>
            `<option value="${s.user_id}">${esc(s.name)} (${esc(s.email)})</option>`
          ).join('');
        }
      } catch (e) { }

      actionHTML = `
        <div class="book-actions">
          <h2>Issue This Book</h2>
          ${book.available_copies > 0 ? `
            <div class="form-group">
              <label>Select Student</label>
              <select id="studentSelect" class="form-control">${studentsOptions}</select>
            </div>
            <button class="btn btn-primary btn-block" onclick="issueBook(${book.book_id})" id="issueBtn">Issue Book</button>
          ` : '<div class="empty-state" style="padding:16px;"><p style="color:var(--red);">No copies available.</p></div>'}
        </div>
      `;
    } else {
      actionHTML = `
        <div class="book-actions">
          <h2>Book Status</h2>
          <div style="text-align:center;padding:20px 0;">
            <span class="availability-badge ${book.available_copies > 0 ? 'available' : 'unavailable'}" style="font-size:0.95rem;padding:8px 18px;">
              ${book.available_copies > 0 ? `${book.available_copies} copies available` : 'Currently unavailable'}
            </span>
            <p style="margin-top:14px;color:var(--text-secondary);font-size:0.85rem;">
              ${book.available_copies > 0 ? 'Contact the librarian to issue this book.' : 'Check back later.'}
            </p>
          </div>
        </div>
      `;
    }

    main.innerHTML = `
      <div class="page-header" style="margin-bottom:12px;">
        <a href="books.html" style="color:var(--primary);font-size:0.85rem;">← Back to Books</a>
      </div>
      <div class="book-detail">
        <div class="book-detail-info">
          <div class="book-detail-cover">📖</div>
          ${book.category ? `<span class="book-card-category">${esc(book.category)}</span>` : ''}
          <h1>${esc(book.title)}</h1>
          <p class="detail-author">by ${esc(book.author)}</p>
          <div class="detail-meta-grid">
            <div class="detail-meta-item"><label>Publisher</label><span>${esc(book.publisher || 'N/A')}</span></div>
            <div class="detail-meta-item"><label>Edition</label><span>${esc(book.edition || 'N/A')}</span></div>
            <div class="detail-meta-item"><label>Available</label><span style="color:${book.available_copies > 0 ? 'var(--green)' : 'var(--red)'}">${book.available_copies}</span></div>
            <div class="detail-meta-item"><label>Total Copies</label><span>${book.total_copies}</span></div>
          </div>
        </div>
        ${actionHTML}
      </div>
    `;
  } catch (err) {
    main.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error loading book</h3></div>';
  }
});

async function issueBook(bookId) {
  const studentId = document.getElementById('studentSelect').value;
  if (!studentId) { showToast('Please select a student.', 'error'); return; }

  const btn = document.getElementById('issueBtn');
  btn.disabled = true;
  btn.textContent = 'Issuing...';

  try {
    const result = await apiPost('/api/records/issue', { user_id: parseInt(studentId), book_id: bookId });
    if (!result) return;

    if (result.ok) {
      showToast(result.data.message, 'success');
      setTimeout(() => location.reload(), 800);
    } else {
      showToast(result.data.error || 'Failed to issue book.', 'error');
    }
  } catch (err) {
    showToast('Network error.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Issue Book';
  }
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
