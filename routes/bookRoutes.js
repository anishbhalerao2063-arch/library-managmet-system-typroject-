const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

// All authenticated users can browse/search books
router.get('/', authenticate, bookController.getBooks);
router.get('/categories', authenticate, bookController.getCategories);
router.get('/:id', authenticate, bookController.getBook);

// Admin only: CRUD operations
router.post('/', authenticate, authorize('admin'), bookController.addBook);
router.put('/:id', authenticate, authorize('admin'), bookController.updateBook);
router.delete('/:id', authenticate, authorize('admin'), bookController.deleteBook);

module.exports = router;
