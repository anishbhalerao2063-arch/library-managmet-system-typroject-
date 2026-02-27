const Book = require('../models/Book');

// Get all books or search
exports.getBooks = (req, res) => {
    try {
        const { q, category, author } = req.query;

        let books;
        if (q || category || author) {
            books = Book.search({ q, category, author });
        } else {
            books = Book.getAll();
        }

        res.json({ books });
    } catch (err) {
        console.error('Get books error:', err);
        res.status(500).json({ error: 'Failed to fetch books.' });
    }
};

// Get single book
exports.getBook = (req, res) => {
    try {
        const book = Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found.' });
        }
        res.json({ book });
    } catch (err) {
        console.error('Get book error:', err);
        res.status(500).json({ error: 'Failed to fetch book.' });
    }
};

// Add new book (Admin only)
exports.addBook = (req, res) => {
    try {
        const { title, author, publisher, edition, category, total_copies } = req.body;

        if (!title || !author) {
            return res.status(400).json({ error: 'Title and author are required.' });
        }

        if (!category) {
            return res.status(400).json({ error: 'Category is required.' });
        }

        const copies = parseInt(total_copies);
        if (isNaN(copies) || copies < 1) {
            return res.status(400).json({ error: 'Total copies must be at least 1.' });
        }

        const book = Book.create({ title, author, publisher, edition, category, total_copies: copies });
        res.status(201).json({ message: 'Book added successfully!', book });
    } catch (err) {
        console.error('Add book error:', err);
        res.status(500).json({ error: 'Failed to add book.' });
    }
};

// Update book (Admin only)
exports.updateBook = (req, res) => {
    try {
        const { title, author, publisher, edition, category, total_copies } = req.body;

        if (!title || !author) {
            return res.status(400).json({ error: 'Title and author are required.' });
        }

        const existing = Book.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Book not found.' });
        }

        Book.update(req.params.id, { title, author, publisher, edition, category, total_copies: parseInt(total_copies) || existing.total_copies });
        res.json({ message: 'Book updated successfully!' });
    } catch (err) {
        console.error('Update book error:', err);
        res.status(500).json({ error: 'Failed to update book.' });
    }
};

// Delete book (Admin only)
exports.deleteBook = (req, res) => {
    try {
        const existing = Book.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Book not found.' });
        }

        Book.delete(req.params.id);
        res.json({ message: 'Book deleted successfully!' });
    } catch (err) {
        console.error('Delete book error:', err);
        res.status(500).json({ error: 'Failed to delete book.' });
    }
};

// Get categories
exports.getCategories = (req, res) => {
    try {
        const categories = Book.getCategories();
        res.json({ categories });
    } catch (err) {
        console.error('Get categories error:', err);
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
};
