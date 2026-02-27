document.addEventListener('DOMContentLoaded', async () => {
  const user = initPage('manage-books.html');
  if (!user || user.role !== 'admin') {
    window.location.href = 'dashboard.html';
    return;
  }
  loadBooksList();
});

async function loadBooksList() {
  const main = document.getElementById('mainContent');

  try {
    const data = await apiGet('/api/books');
    if (!data) return;
    const books = data.books;

    main.innerHTML = `
      <div class="page-header">
        <h1>Books</h1>
        <p>Manage library book collection</p>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Book Catalog</h2>
          <div class="flex gap-3">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input type="text" class="form-control" id="bookSearchInput" style="padding-left:38px;" placeholder="Search books..." oninput="filterTable()">
            </div>
            <button class="btn btn-primary" onclick="openAddModal()">+ Add Book</button>
          </div>
        </div>

        ${books.length > 0 ? `
          <div class="table-wrapper"><table id="booksTable">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Edition</th>
                <th>Available</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${books.map(b => `<tr data-search="${esc(b.title + ' ' + b.author + ' ' + b.category).toLowerCase()}">
                <td><strong>${esc(b.title)}</strong></td>
                <td>${esc(b.author)}</td>
                <td>${b.category ? `<span class="badge badge-student">${esc(b.category)}</span>` : '—'}</td>
                <td>${b.edition || '—'}</td>
                <td>${b.available_copies} / ${b.total_copies}</td>
                <td><span class="availability-badge ${b.available_copies > 0 ? 'available' : 'unavailable'}">${b.available_copies > 0 ? 'Available' : 'Unavailable'}</span></td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn-icon" onclick='openEditModal(${JSON.stringify(b)})' title="Edit">✏️</button>
                    <button class="btn-icon danger" onclick="deleteBook(${b.book_id}, '${esc(b.title).replace(/'/g, "\\'")}')" title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        ` : '<div class="empty-state"><div class="empty-icon">📭</div><h3>No books yet</h3><p>Add your first book to get started.</p></div>'}
      </div>
    `;
  } catch (err) {
    main.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error loading books</h3></div>';
  }
}

function filterTable() {
  const q = document.getElementById('bookSearchInput').value.toLowerCase();
  const rows = document.querySelectorAll('#booksTable tbody tr');
  rows.forEach(row => {
    const text = row.getAttribute('data-search') || '';
    row.style.display = text.includes(q) ? '' : 'none';
  });
}

function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Add New Book';
  document.getElementById('editBookId').value = '';
  document.getElementById('bookForm').reset();
  document.getElementById('bookCopies').value = 1;
  document.getElementById('bookModal').classList.remove('hidden');
}

function openEditModal(book) {
  document.getElementById('modalTitle').textContent = 'Edit Book';
  document.getElementById('editBookId').value = book.book_id;
  document.getElementById('bookTitle').value = book.title;
  document.getElementById('bookAuthor').value = book.author;
  document.getElementById('bookPublisher').value = book.publisher || '';
  document.getElementById('bookEdition').value = book.edition || '';
  document.getElementById('bookCategory').value = book.category || '';
  document.getElementById('bookCopies').value = book.total_copies;
  document.getElementById('bookModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('bookModal').classList.add('hidden');
}

async function saveBook(e) {
  e.preventDefault();
  const btn = document.getElementById('saveBookBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const bookId = document.getElementById('editBookId').value;
  const body = {
    title: document.getElementById('bookTitle').value.trim(),
    author: document.getElementById('bookAuthor').value.trim(),
    publisher: document.getElementById('bookPublisher').value.trim(),
    edition: document.getElementById('bookEdition').value.trim(),
    category: document.getElementById('bookCategory').value.trim(),
    total_copies: parseInt(document.getElementById('bookCopies').value) || 1
  };

  try {
    let result;
    if (bookId) {
      result = await apiPut(`/api/books/${bookId}`, body);
    } else {
      result = await apiPost('/api/books', body);
    }
    if (!result) return;

    if (result.ok) {
      showToast(result.data.message, 'success');
      closeModal();
      loadBooksList();
    } else {
      showToast(result.data.error || 'Failed to save book.', 'error');
    }
  } catch (err) {
    showToast('Network error.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Book';
  }
}

async function deleteBook(id, title) {
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  try {
    const result = await apiDelete(`/api/books/${id}`);
    if (!result) return;
    if (result.ok) {
      showToast(result.data.message, 'success');
      loadBooksList();
    } else {
      showToast(result.data.error || 'Failed to delete.', 'error');
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
