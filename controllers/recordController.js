const Record = require('../models/Record');
const Book = require('../models/Book');
const User = require('../models/User');

// Issue book (Admin/Librarian)
exports.issueBook = (req, res) => {
    try {
        const { user_id, book_id } = req.body;

        if (!user_id || !book_id) {
            return res.status(400).json({ error: 'Student ID and Book ID are required.' });
        }

        // Verify student exists
        const student = User.findById(user_id);
        if (!student || student.role !== 'student') {
            return res.status(400).json({ error: 'Invalid student.' });
        }

        // Verify book exists and has copies
        const book = Book.findById(book_id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found.' });
        }
        if (book.available_copies <= 0) {
            return res.status(400).json({ error: 'No copies available for this book.' });
        }

        // Check if student already has this book issued
        const activeIssue = Record.getActiveIssueForUser(user_id, book_id);
        if (activeIssue) {
            return res.status(400).json({ error: 'This book is already issued to this student.' });
        }

        // Issue the book
        const record = Record.issueBook(user_id, book_id);
        Book.decrementCopies(book_id);

        res.status(201).json({
            message: `"${book.title}" issued to ${student.name} successfully!`,
            record
        });
    } catch (err) {
        console.error('Issue book error:', err);
        res.status(500).json({ error: 'Failed to issue book.' });
    }
};

// Return book (Admin/Librarian)
exports.returnBook = (req, res) => {
    try {
        const recordId = req.params.id;

        const result = Record.returnBook(recordId);
        if (!result) {
            return res.status(404).json({ error: 'Record not found.' });
        }

        // Increment available copies
        Book.incrementCopies(result.book_id);

        let message = 'Book returned successfully!';
        if (result.fine_amount > 0) {
            message += ` Late return fine: ₹${result.fine_amount}`;
        }

        res.json({ message, fine_amount: result.fine_amount });
    } catch (err) {
        console.error('Return book error:', err);
        res.status(500).json({ error: 'Failed to return book.' });
    }
};

// Student self-return (can only return own books)
exports.selfReturnBook = (req, res) => {
    try {
        const recordId = req.params.id;
        const userId = req.user.user_id;

        // Verify this record belongs to the student
        const records = Record.getByUser(userId);
        const record = records.find(r => r.record_id == recordId && r.status === 'issued');
        if (!record) {
            return res.status(403).json({ error: 'Record not found or not yours.' });
        }

        const result = Record.returnBook(recordId);
        if (!result) {
            return res.status(404).json({ error: 'Record not found.' });
        }

        Book.incrementCopies(result.book_id);

        let message = 'Book returned successfully!';
        if (result.fine_amount > 0) {
            message += ` Late return fine: ₹${result.fine_amount}`;
        }

        res.json({ message, fine_amount: result.fine_amount });
    } catch (err) {
        console.error('Self-return error:', err);
        res.status(500).json({ error: 'Failed to return book.' });
    }
};

// Get all records (Admin/Librarian)
exports.getAllRecords = (req, res) => {
    try {
        const records = Record.getAll();
        res.json({ records });
    } catch (err) {
        console.error('Get records error:', err);
        res.status(500).json({ error: 'Failed to fetch records.' });
    }
};

// Get issued books (Admin/Librarian)
exports.getIssuedBooks = (req, res) => {
    try {
        const records = Record.getIssuedBooks();
        res.json({ records });
    } catch (err) {
        console.error('Get issued books error:', err);
        res.status(500).json({ error: 'Failed to fetch issued books.' });
    }
};

// Get my records (Student)
exports.getMyRecords = (req, res) => {
    try {
        const records = Record.getByUser(req.user.user_id);
        res.json({ records });
    } catch (err) {
        console.error('Get my records error:', err);
        res.status(500).json({ error: 'Failed to fetch your records.' });
    }
};

// Get my fines (Student)
exports.getMyFines = (req, res) => {
    try {
        const fines = Record.getFinesByUser(req.user.user_id);
        const totalFine = Record.getUserFineTotal(req.user.user_id);
        res.json({ fines, totalFine });
    } catch (err) {
        console.error('Get my fines error:', err);
        res.status(500).json({ error: 'Failed to fetch your fines.' });
    }
};

// Student self-borrow a single book
exports.borrowBook = (req, res) => {
    try {
        const userId = req.user.user_id;
        const { book_id } = req.body;

        if (!book_id) {
            return res.status(400).json({ error: 'Book ID is required.' });
        }

        const book = Book.findById(book_id);
        if (!book) return res.status(404).json({ error: 'Book not found.' });
        if (book.available_copies <= 0) return res.status(400).json({ error: 'No copies available.' });

        const activeIssue = Record.getActiveIssueForUser(userId, book_id);
        if (activeIssue) return res.status(400).json({ error: 'You already have this book issued.' });

        const record = Record.issueBook(userId, book_id);
        Book.decrementCopies(book_id);

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        res.status(201).json({
            message: `"${book.title}" borrowed successfully! Return by ${dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.`,
            record,
            due_date: dueDate.toISOString()
        });
    } catch (err) {
        console.error('Borrow book error:', err);
        res.status(500).json({ error: 'Failed to borrow book.' });
    }
};

// Student bulk-borrow from cart
exports.borrowCart = (req, res) => {
    try {
        const userId = req.user.user_id;
        const { book_ids } = req.body;

        if (!book_ids || !Array.isArray(book_ids) || book_ids.length === 0) {
            return res.status(400).json({ error: 'No books in cart.' });
        }

        if (book_ids.length > 5) {
            return res.status(400).json({ error: 'Maximum 5 books can be borrowed at once.' });
        }

        const results = [];
        const errors = [];

        for (const bookId of book_ids) {
            const book = Book.findById(bookId);
            if (!book) { errors.push(`Book #${bookId} not found.`); continue; }
            if (book.available_copies <= 0) { errors.push(`"${book.title}" has no copies available.`); continue; }

            const activeIssue = Record.getActiveIssueForUser(userId, bookId);
            if (activeIssue) { errors.push(`"${book.title}" is already issued to you.`); continue; }

            const record = Record.issueBook(userId, bookId);
            Book.decrementCopies(bookId);
            results.push({ book_id: bookId, title: book.title, record_id: record.record_id });
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        res.status(201).json({
            message: `${results.length} book(s) borrowed successfully!`,
            borrowed: results,
            errors,
            due_date: dueDate.toISOString()
        });
    } catch (err) {
        console.error('Borrow cart error:', err);
        res.status(500).json({ error: 'Failed to borrow books.' });
    }
};
