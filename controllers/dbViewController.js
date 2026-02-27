const { queryAll } = require('../config/database');

// Get all table data for DB viewer (Admin only)
exports.getTables = (req, res) => {
    try {
        const users = queryAll('SELECT user_id, name, email, role, created_at FROM users ORDER BY user_id');
        const books = queryAll('SELECT * FROM books ORDER BY book_id');
        const records = queryAll(`
            SELECT r.record_id, r.user_id, r.book_id, 
                   u.name as user_name, u.email as user_email,
                   b.title as book_title,
                   r.issue_date, r.due_date, r.return_date, 
                   r.fine_amount, r.status
            FROM records r
            JOIN users u ON r.user_id = u.user_id
            JOIN books b ON r.book_id = b.book_id
            ORDER BY r.record_id
        `);

        res.json({
            tables: {
                users: { rows: users, count: users.length },
                books: { rows: books, count: books.length },
                records: { rows: records, count: records.length }
            }
        });
    } catch (err) {
        console.error('DB viewer error:', err);
        res.status(500).json({ error: 'Failed to load database.' });
    }
};
