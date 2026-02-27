const { queryAll, queryGet, queryRun } = require('../config/database');

class Book {
    static getAll() {
        return queryAll('SELECT * FROM books ORDER BY title');
    }

    static search({ q, category, author }) {
        let sql = 'SELECT * FROM books WHERE 1=1';
        const params = [];

        if (q) {
            sql += ' AND (title LIKE ? OR author LIKE ? OR category LIKE ?)';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }
        if (author) {
            sql += ' AND author LIKE ?';
            params.push(`%${author}%`);
        }

        sql += ' ORDER BY title';
        return queryAll(sql, params);
    }

    static findById(id) {
        return queryGet('SELECT * FROM books WHERE book_id = ?', [id]);
    }

    static create({ title, author, publisher, edition, category, total_copies }) {
        const copies = total_copies || 1;
        const result = queryRun(
            'INSERT INTO books (title, author, publisher, edition, category, available_copies, total_copies) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, author, publisher || '', edition || '', category || '', copies, copies]
        );
        return { book_id: result.lastInsertRowid, title, author };
    }

    static update(id, { title, author, publisher, edition, category, total_copies }) {
        const current = queryGet('SELECT * FROM books WHERE book_id = ?', [id]);
        if (!current) return null;

        const issuedCopies = current.total_copies - current.available_copies;
        const newTotal = total_copies || current.total_copies;
        const newAvailable = Math.max(0, newTotal - issuedCopies);

        return queryRun(
            'UPDATE books SET title = ?, author = ?, publisher = ?, edition = ?, category = ?, total_copies = ?, available_copies = ? WHERE book_id = ?',
            [title, author, publisher || '', edition || '', category || '', newTotal, newAvailable, id]
        );
    }

    static delete(id) {
        return queryRun('DELETE FROM books WHERE book_id = ?', [id]);
    }

    static decrementCopies(id) {
        return queryRun('UPDATE books SET available_copies = available_copies - 1 WHERE book_id = ? AND available_copies > 0', [id]);
    }

    static incrementCopies(id) {
        return queryRun('UPDATE books SET available_copies = available_copies + 1 WHERE book_id = ? AND available_copies < total_copies', [id]);
    }

    static getCount() {
        const row = queryGet('SELECT COUNT(*) as count FROM books');
        return row ? row.count : 0;
    }

    static getCategories() {
        return queryAll('SELECT DISTINCT category FROM books WHERE category != "" ORDER BY category').map(r => r.category);
    }
}

module.exports = Book;
