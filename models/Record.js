const { queryAll, queryGet, queryRun } = require('../config/database');

const FINE_RATE_PER_DAY = 2; // ₹2 per day
const LOAN_PERIOD_DAYS = 14; // 14 days loan period

class Record {
    static issueBook(userId, bookId) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);

        const result = queryRun(
            'INSERT INTO records (user_id, book_id, issue_date, due_date, status) VALUES (?, ?, datetime("now"), ?, "issued")',
            [userId, bookId, dueDate.toISOString()]
        );

        return { record_id: result.lastInsertRowid };
    }

    static returnBook(recordId) {
        const record = queryGet('SELECT * FROM records WHERE record_id = ?', [recordId]);
        if (!record) return null;

        const now = new Date();
        const dueDate = new Date(record.due_date);
        let fine = 0;

        if (now > dueDate) {
            const diffTime = Math.abs(now - dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            fine = diffDays * FINE_RATE_PER_DAY;
        }

        queryRun(
            'UPDATE records SET return_date = datetime("now"), fine_amount = ?, status = "returned" WHERE record_id = ?',
            [fine, recordId]
        );

        return { record_id: recordId, fine_amount: fine, book_id: record.book_id };
    }

    static getAll() {
        return queryAll(`
      SELECT r.*, u.name as user_name, u.email as user_email, b.title as book_title, b.author as book_author
      FROM records r
      JOIN users u ON r.user_id = u.user_id
      JOIN books b ON r.book_id = b.book_id
      ORDER BY r.issue_date DESC
    `);
    }

    static getByUser(userId) {
        return queryAll(`
      SELECT r.*, b.title as book_title, b.author as book_author
      FROM records r
      JOIN books b ON r.book_id = b.book_id
      WHERE r.user_id = ?
      ORDER BY r.issue_date DESC
    `, [userId]);
    }

    static getFinesByUser(userId) {
        return queryAll(`
      SELECT r.*, b.title as book_title, b.author as book_author
      FROM records r
      JOIN books b ON r.book_id = b.book_id
      WHERE r.user_id = ? AND r.fine_amount > 0
      ORDER BY r.return_date DESC
    `, [userId]);
    }

    static getIssuedBooks() {
        return queryAll(`
      SELECT r.*, u.name as user_name, u.email as user_email, b.title as book_title, b.author as book_author
      FROM records r
      JOIN users u ON r.user_id = u.user_id
      JOIN books b ON r.book_id = b.book_id
      WHERE r.status = 'issued'
      ORDER BY r.issue_date DESC
    `);
    }

    static getActiveIssueForUser(userId, bookId) {
        return queryGet(
            'SELECT * FROM records WHERE user_id = ? AND book_id = ? AND status = "issued"',
            [userId, bookId]
        );
    }

    static getIssuedCount() {
        const row = queryGet('SELECT COUNT(*) as count FROM records WHERE status = "issued"');
        return row ? row.count : 0;
    }

    static getTotalFines() {
        const row = queryGet('SELECT COALESCE(SUM(fine_amount), 0) as total FROM records');
        return row ? row.total : 0;
    }

    static getUserFineTotal(userId) {
        const row = queryGet('SELECT COALESCE(SUM(fine_amount), 0) as total FROM records WHERE user_id = ?', [userId]);
        return row ? row.total : 0;
    }

    static getUserIssuedCount(userId) {
        const row = queryGet('SELECT COUNT(*) as count FROM records WHERE user_id = ? AND status = "issued"', [userId]);
        return row ? row.count : 0;
    }
}

module.exports = Record;
