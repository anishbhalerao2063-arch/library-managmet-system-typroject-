let cartBooks = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = initPage('books.html'); // highlight books in nav
    if (!user || user.role !== 'student') {
        window.location.href = 'books.html';
        return;
    }

    loadCart();
});

async function loadCart() {
    const main = document.getElementById('mainContent');
    const cart = JSON.parse(localStorage.getItem('bookCart') || '[]');

    if (cart.length === 0) {
        main.innerHTML = `
      <div class="page-header">
        <h1>My Cart</h1>
        <p>Books you've selected to borrow</p>
      </div>
      <div class="card">
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Browse books and add them to your cart to borrow.</p>
          <a href="books.html" class="btn btn-primary" style="margin-top:16px;">Browse Books</a>
        </div>
      </div>
    `;
        return;
    }

    // Fetch book details
    try {
        const data = await apiGet('/api/books');
        if (!data) return;

        const allBooks = data.books;
        cartBooks = cart.map(id => allBooks.find(b => b.book_id === id)).filter(Boolean);

        renderCart(cartBooks);
    } catch (err) {
        main.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error loading cart</h3></div>';
    }
}

function renderCart(books) {
    const main = document.getElementById('mainContent');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const dueDateStr = dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    main.innerHTML = `
    <div class="page-header">
      <div class="flex-between">
        <div>
          <h1>My Cart</h1>
          <p>Books you've selected to borrow</p>
        </div>
        <a href="books.html" class="btn btn-outline">← Back to Books</a>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>Cart Items (${books.length}/5)</h2>
        <button class="btn btn-outline btn-sm" onclick="clearCart()" style="color:var(--red);">Clear Cart</button>
      </div>

      ${books.length > 0 ? books.map(book => `
        <div class="cart-item">
          <div class="cart-item-info">
            <h4>${esc(book.title)}</h4>
            <p>by ${esc(book.author)} · ${book.category || 'General'} · ${book.available_copies > 0 ? `${book.available_copies} available` : '<span style="color:var(--red);">Unavailable</span>'}</p>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart(${book.book_id})">Remove</button>
        </div>
      `).join('') : ''}

      <div class="cart-summary">
        <div class="cart-summary-left">
          <strong>${books.length} book(s)</strong> selected · Return by <strong>${dueDateStr}</strong> (14 days)
        </div>
        <button class="btn btn-primary btn-lg" onclick="borrowAll()" id="borrowAllBtn" ${books.length === 0 ? 'disabled' : ''}>
          🛒 Borrow All (${books.length})
        </button>
      </div>
    </div>
  `;
}

function removeFromCart(bookId) {
    let cart = JSON.parse(localStorage.getItem('bookCart') || '[]');
    cart = cart.filter(id => id !== bookId);
    localStorage.setItem('bookCart', JSON.stringify(cart));
    cartBooks = cartBooks.filter(b => b.book_id !== bookId);
    renderCart(cartBooks);
    showToast('Removed from cart.', 'info');
}

function clearCart() {
    if (!confirm('Clear all books from your cart?')) return;
    localStorage.setItem('bookCart', '[]');
    cartBooks = [];
    renderCart([]);
    showToast('Cart cleared.', 'info');
}

async function borrowAll() {
    const cart = JSON.parse(localStorage.getItem('bookCart') || '[]');
    if (cart.length === 0) return;

    if (!confirm(`Borrow ${cart.length} book(s)? You must return them within 14 days.`)) return;

    const btn = document.getElementById('borrowAllBtn');
    btn.disabled = true;
    btn.textContent = 'Borrowing...';

    try {
        const result = await apiPost('/api/records/borrow-cart', { book_ids: cart });
        if (!result) return;

        if (result.ok) {
            showToast(result.data.message, 'success');
            if (result.data.errors && result.data.errors.length > 0) {
                result.data.errors.forEach(e => showToast(e, 'error'));
            }
            localStorage.setItem('bookCart', '[]');
            setTimeout(() => { window.location.href = 'transactions.html'; }, 1200);
        } else {
            showToast(result.data.error || 'Failed to borrow.', 'error');
            btn.disabled = false;
            btn.textContent = `🛒 Borrow All (${cart.length})`;
        }
    } catch (err) {
        showToast('Network error.', 'error');
        btn.disabled = false;
        btn.textContent = `🛒 Borrow All (${cart.length})`;
    }
}

function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
