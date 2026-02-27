const User = require('../models/User');
const Book = require('../models/Book');
const Record = require('../models/Record');

exports.getStats = (req, res) => {
    try {
        const role = req.user.role;
        const stats = {};

        if (role === 'admin') {
            stats.totalBooks = Book.getCount();
            stats.totalUsers = User.getCount();
            stats.totalStudents = User.getCountByRole('student');
            stats.totalLibrarians = User.getCountByRole('librarian');
            stats.issuedBooks = Record.getIssuedCount();
            stats.totalFines = Record.getTotalFines();
        } else if (role === 'librarian') {
            stats.totalBooks = Book.getCount();
            stats.totalStudents = User.getCountByRole('student');
            stats.issuedBooks = Record.getIssuedCount();
        } else {
            // student
            stats.totalBooks = Book.getCount();
            stats.myIssuedBooks = Record.getUserIssuedCount(req.user.user_id);
            stats.myTotalFines = Record.getUserFineTotal(req.user.user_id);
        }

        res.json({ stats, role });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
    }
};
