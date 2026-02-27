let allBooks = [];
let searchTimeout = null;
let cart = JSON.parse(localStorage.getItem('bookCart') || '[]');
let userRole = '';

document.addEventListener('DOMContentLoaded', async () => {
  const user = initPage('books.html');
  if (!user) return;
  userRole = user.role;

  // Load categories
  try {
    const catData = await apiGet('/api/books/categories');
    if (catData && catData.categories) {
      const select = document.getElementById('categoryFilter');
      catData.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
      });
    }
  } catch (e) { }

  updateCartBadge();
  loadBooks();
});

async function loadBooks(query = '', category = '') {
  const container = document.getElementById('booksContainer');
  container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

  try {
    let url = '/api/books?';
    if (query) url += `q=${encodeURIComponent(query)}&`;
    if (category) url += `category=${encodeURIComponent(category)}&`;

    const data = await apiGet(url);
    if (!data) return;
    allBooks = data.books;
    renderBooks(allBooks);
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error loading books</h3></div>';
  }
}

function renderBooks(books) {
  const container = document.getElementById('booksContainer');

  if (!books || books.length === 0) {
    container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">📭</div><h3>No books found</h3><p>Try adjusting your search.</p></div>';
    return;
  }

  container.innerHTML = books.map(book => {
    const inCart = cart.includes(book.book_id);
    const isAvailable = book.available_copies > 0;

    let actionBtns = '';
    if (userRole === 'student' && isAvailable) {
      actionBtns = `
        <div class="book-card-actions">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); borrowNow(${book.book_id})">Borrow Now</button>
          <button class="btn ${inCart ? 'btn-outline cart-added' : 'btn-outline'} btn-sm" onclick="event.stopPropagation(); toggleCart(${book.book_id})" id="cartBtn${book.book_id}">
            ${inCart ? '✓ In Cart' : '+ Add to Cart'}
          </button>
        </div>
      `;
    }

    return `
      <div class="book-card" onclick="viewBook(${book.book_id})">
        ${book.category ? `<span class="book-card-category">${esc(book.category)}</span>` : ''}
        <h3>${esc(book.title)}</h3>
        <p class="book-author">by ${esc(book.author)}</p>
        <div class="book-meta">
          ${book.publisher ? `<span>📝 ${esc(book.publisher)}</span>` : ''}
          ${book.edition ? `<span>📄 ${book.edition} Ed.</span>` : ''}
        </div>
        <div class="book-availability">
          <span class="availability-badge ${isAvailable ? 'available' : 'unavailable'}">
            ${isAvailable ? `${book.available_copies} available` : 'Unavailable'}
          </span>
          <span style="font-size:0.75rem;color:var(--text-muted);">Total: ${book.total_copies}</span>
        </div>
        ${actionBtns}
      </div>
    `;
  }).join('');
}

// ---- Borrow Now ----
async function borrowNow(bookId) {
  if (!confirm('Borrow this book? You must return it within 14 days.')) return;

  try {
    const result = await apiPost('/api/records/borrow', { book_id: bookId });
    if (!result) return;

    if (result.ok) {
      showToast(result.data.message, 'success');
      // Remove from cart if it was there
      cart = cart.filter(id => id !== bookId);
      saveCart();
      loadBooks(
        document.getElementById('searchInput')?.value || '',
        document.getElementById('categoryFilter')?.value || ''
      );
    } else {
      showToast(result.data.error || 'Failed to borrow.', 'error');
    }
  } catch (err) {
    showToast('Network error.', 'error');
  }
}

// ---- Cart ----
function toggleCart(bookId) {
  if (cart.includes(bookId)) {
    cart = cart.filter(id => id !== bookId);
    showToast('Removed from cart.', 'info');
  } else {
    if (cart.length >= 5) {
      showToast('Cart is full. Max 5 books.', 'error');
      return;
    }
    cart.push(bookId);
    showToast('Added to cart!', 'success');
  }
  saveCart();
  updateCartBadge();

  // Update button state
  const btn = document.getElementById(`cartBtn${bookId}`);
  if (btn) {
    const inCart = cart.includes(bookId);
    btn.textContent = inCart ? '✓ In Cart' : '+ Add to Cart';
    btn.className = `btn ${inCart ? 'btn-outline cart-added' : 'btn-outline'} btn-sm`;
  }
}

function saveCart() {
  localStorage.setItem('bookCart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.textContent = cart.length;
    badge.style.display = cart.length > 0 ? 'flex' : 'none';
  }
}

function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const query = document.getElementById('searchInput').value.trim();
    const category = document.getElementById('categoryFilter').value;
    loadBooks(query, category);
  }, 300);
}

function viewBook(id) {
  window.location.href = `book-detail.html?id=${id}`;
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
