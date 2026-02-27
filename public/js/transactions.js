document.addEventListener('DOMContentLoaded', async () => {
  const user = initPage('transactions.html');
  if (!user) return;

  const main = document.getElementById('mainContent');
  const role = user.role;

  if (role === 'student') {
    await renderStudentView(main);
  } else {
    await renderIssueBookView(main, role);
  }
});

// ============================== Student View ==============================
async function renderStudentView(main) {
  try {
    const [recordsData, finesData] = await Promise.all([
      apiGet('/api/records/my'),
      apiGet('/api/records/fines')
    ]);

    const records = recordsData?.records || [];
    const fines = finesData?.fines || [];
    const totalFine = finesData?.totalFine || 0;
    const issued = records.filter(r => r.status === 'issued');
    const returned = records.filter(r => r.status === 'returned');

    main.innerHTML = `
      <div class="page-header">
        <h1>My Books</h1>
        <p>View your issued books and fine details</p>
      </div>

      ${totalFine > 0 ? `
        <div class="card mb-4" style="border-left:4px solid var(--red);">
          <div class="flex-between">
            <div>
              <h3 style="color:var(--red);">⚠️ Outstanding Fines</h3>
              <p style="color:var(--text-secondary);font-size:0.85rem;">Please clear your fines at the library counter.</p>
            </div>
            <div class="stat-value fine-amount" style="font-size:1.5rem;">₹${totalFine}</div>
          </div>
        </div>
      ` : ''}

      <div class="card mb-4">
        <div class="card-header">
          <h2>Currently Issued (${issued.length})</h2>
          <a href="books.html" class="btn btn-primary btn-sm">+ Borrow More</a>
        </div>
        ${issued.length > 0 ? `
          <div class="table-wrapper"><table>
            <thead><tr><th>Book</th><th>Author</th><th>Issue Date</th><th>Due Date</th><th>Time Remaining</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${issued.map(r => {
      const now = new Date();
      const due = new Date(r.due_date);
      const diffMs = due - now;
      const isOverdue = diffMs < 0;
      const absDiffMs = Math.abs(diffMs);
      const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      let timeStr, timeColor, statusBadge;
      if (isOverdue) {
        timeStr = days > 0 ? days + 'd ' + hours + 'h overdue' : hours + 'h overdue';
        timeColor = 'var(--red)';
        statusBadge = '<span class="badge badge-issued">⚠️ Overdue</span>';
      } else if (days <= 2) {
        timeStr = days > 0 ? days + 'd ' + hours + 'h left' : hours + 'h left';
        timeColor = 'var(--amber)';
        statusBadge = '<span class="badge badge-issued">⏳ Due Soon</span>';
      } else {
        timeStr = days + 'd ' + hours + 'h left';
        timeColor = 'var(--green)';
        statusBadge = '<span class="badge badge-returned">✓ On Time</span>';
      }

      return `<tr>
                  <td><strong>${esc(r.book_title)}</strong></td>
                  <td>${esc(r.book_author)}</td>
                  <td>${formatDate(r.issue_date)}</td>
                  <td>${formatDate(r.due_date)}</td>
                  <td><strong style="color:${timeColor};font-size:0.85rem;">${timeStr}</strong></td>
                  <td>${statusBadge}</td>
                  <td><button class="btn btn-success btn-sm" onclick="studentReturnBook(${r.record_id})">Return</button></td>
                </tr>`;
    }).join('')}
            </tbody>
          </table></div>
        ` : '<div class="empty-state" style="padding:24px;"><div class="empty-icon">✅</div><h3>No books currently issued</h3><p><a href="books.html" style="color:var(--primary);">Browse and borrow books</a></p></div>'}
      </div>

      ${fines.length > 0 ? `
        <div class="card mb-4">
          <div class="card-header"><h2>Fine History</h2></div>
          <div class="table-wrapper"><table>
            <thead><tr><th>Book</th><th>Return Date</th><th>Fine</th></tr></thead>
            <tbody>${fines.map(f => `<tr>
              <td>${esc(f.book_title)}</td>
              <td>${formatDate(f.return_date)}</td>
              <td class="fine-amount">₹${f.fine_amount}</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
      ` : ''}

      ${returned.length > 0 ? `
        <div class="card">
          <div class="card-header"><h2>Return History</h2></div>
          <div class="table-wrapper"><table>
            <thead><tr><th>Book</th><th>Author</th><th>Issue Date</th><th>Return Date</th><th>Fine</th></tr></thead>
            <tbody>${returned.map(r => `<tr>
              <td>${esc(r.book_title)}</td>
              <td>${esc(r.book_author)}</td>
              <td>${formatDate(r.issue_date)}</td>
              <td>${formatDate(r.return_date)}</td>
              <td class="${r.fine_amount > 0 ? 'fine-amount' : 'fine-zero'}">${r.fine_amount > 0 ? '₹' + r.fine_amount : '₹0'}</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
      ` : ''}
    `;
  } catch (err) {
    main.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error loading records</h3></div>';
  }
}

// ============================== Issue Book View (two-column) ==============================
let allBooks = [];
let allStudents = [];
let selectedBookId = null;
let selectedStudentId = null;

async function renderIssueBookView(main, role) {
  try {
    const [bData, sData] = await Promise.all([
      apiGet('/api/books'),
      apiGet('/api/users/students')
    ]);
    allBooks = (bData?.books || []).filter(b => b.available_copies > 0);
    allStudents = sData?.students || [];

    main.innerHTML = `
      <div class="page-header">
        <h1>Issue Book</h1>
        <p>Issue books to students</p>
      </div>

      <div class="issue-columns">
        <!-- Select Book -->
        <div class="issue-col">
          <h3>📚 Select Book</h3>
          <p class="issue-subtitle">Choose a book to issue</p>
          <div class="issue-search-wrap">
            <span class="s-icon">🔍</span>
            <input type="text" class="issue-search" id="bookSearch" placeholder="Search books..." oninput="filterBooks()">
          </div>
          <div class="issue-list" id="bookList">
            ${renderBookList(allBooks)}
          </div>
        </div>

        <!-- Select Student -->
        <div class="issue-col">
          <h3>🎓 Select Student</h3>
          <p class="issue-subtitle">Choose a student to issue to</p>
          <div class="issue-search-wrap">
            <span class="s-icon">🔍</span>
            <input type="text" class="issue-search" id="studentSearch" placeholder="Search students..." oninput="filterStudents()">
          </div>
          <div class="issue-list" id="studentList">
            ${renderStudentList(allStudents)}
          </div>
        </div>
      </div>

      <div style="margin-top:20px;text-align:right;">
        <button class="btn btn-primary btn-lg" onclick="issueSelectedBook()" id="issueBtn" disabled>Issue Book</button>
      </div>

      <!-- Recent -->
      <div class="card mt-8" id="recentRecords"></div>
    `;

    loadRecentRecords();
  } catch (err) {
    main.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error loading data</h3></div>';
  }
}

function renderBookList(books) {
  if (books.length === 0) return '<div class="empty-state" style="padding:20px;"><p>No available books found</p></div>';
  return books.map(b => `
    <div class="issue-list-item ${selectedBookId === b.book_id ? 'selected' : ''}" onclick="selectBook(${b.book_id})">
      <h4>${esc(b.title)}</h4>
      <p>${esc(b.author)} · ${b.available_copies} available</p>
    </div>
  `).join('');
}

function renderStudentList(students) {
  if (students.length === 0) return '<div class="empty-state" style="padding:20px;"><p>No students found</p></div>';
  return students.map(s => `
    <div class="issue-list-item ${selectedStudentId === s.user_id ? 'selected' : ''}" onclick="selectStudent(${s.user_id})">
      <h4>${esc(s.name)}</h4>
      <p>${esc(s.email)}</p>
    </div>
  `).join('');
}

function selectBook(id) {
  selectedBookId = id;
  document.getElementById('bookList').innerHTML = renderBookList(getFilteredBooks());
  updateIssueBtn();
}

function selectStudent(id) {
  selectedStudentId = id;
  document.getElementById('studentList').innerHTML = renderStudentList(getFilteredStudents());
  updateIssueBtn();
}

function getFilteredBooks() {
  const q = (document.getElementById('bookSearch')?.value || '').toLowerCase();
  return allBooks.filter(b => !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
}

function getFilteredStudents() {
  const q = (document.getElementById('studentSearch')?.value || '').toLowerCase();
  return allStudents.filter(s => !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
}

function filterBooks() {
  document.getElementById('bookList').innerHTML = renderBookList(getFilteredBooks());
}

function filterStudents() {
  document.getElementById('studentList').innerHTML = renderStudentList(getFilteredStudents());
}

function updateIssueBtn() {
  const btn = document.getElementById('issueBtn');
  if (btn) btn.disabled = !(selectedBookId && selectedStudentId);
}

async function issueSelectedBook() {
  if (!selectedBookId || !selectedStudentId) return;
  const btn = document.getElementById('issueBtn');
  btn.disabled = true;
  btn.textContent = 'Issuing...';

  try {
    const result = await apiPost('/api/records/issue', { user_id: selectedStudentId, book_id: selectedBookId });
    if (!result) return;

    if (result.ok) {
      showToast(result.data.message, 'success');
      selectedBookId = null;
      selectedStudentId = null;
      // Reload data
      const bData = await apiGet('/api/books');
      allBooks = (bData?.books || []).filter(b => b.available_copies > 0);
      document.getElementById('bookList').innerHTML = renderBookList(allBooks);
      document.getElementById('studentList').innerHTML = renderStudentList(allStudents);
      loadRecentRecords();
    } else {
      showToast(result.data.error || 'Failed to issue book.', 'error');
    }
  } catch (err) {
    showToast('Network error.', 'error');
  } finally {
    btn.textContent = 'Issue Book';
    updateIssueBtn();
  }
}

async function loadRecentRecords() {
  try {
    const data = await apiGet('/api/records');
    if (!data) return;
    const records = data.records.slice(0, 10);
    const container = document.getElementById('recentRecords');
    if (!container) return;

    container.innerHTML = `
      <div class="card-header"><h2>Recent Transactions</h2></div>
      ${records.length > 0 ? `
        <div class="table-wrapper"><table>
          <thead><tr><th>ID</th><th>Book</th><th>Student</th><th>Issue Date</th><th>Status</th><th>Fine</th></tr></thead>
          <tbody>${records.map(r => `<tr>
            <td>#${r.record_id}</td>
            <td>${esc(r.book_title)}</td>
            <td>${esc(r.user_name)}</td>
            <td>${formatDate(r.issue_date)}</td>
            <td><span class="badge badge-${r.status}">${r.status === 'issued' ? 'Issued' : 'Returned'}</span></td>
            <td class="${r.fine_amount > 0 ? 'fine-amount' : ''}">${r.fine_amount > 0 ? '₹' + r.fine_amount : '—'}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      ` : '<div class="empty-state" style="padding:20px;"><p>No records yet</p></div>'}
    `;
  } catch (e) { }
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function studentReturnBook(recordId) {
  if (!confirm('Return this book? Fine will be calculated if overdue.')) return;

  try {
    const result = await apiPost(`/api/records/self-return/${recordId}`, {});
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
