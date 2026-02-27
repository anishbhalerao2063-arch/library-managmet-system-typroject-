const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

// Admin/Librarian: issue and return books
router.post('/issue', authenticate, authorize('admin', 'librarian'), recordController.issueBook);
router.post('/return/:id', authenticate, authorize('admin', 'librarian'), recordController.returnBook);

// Admin/Librarian: view all records and issued books
router.get('/', authenticate, authorize('admin', 'librarian'), recordController.getAllRecords);
router.get('/issued', authenticate, authorize('admin', 'librarian'), recordController.getIssuedBooks);

// Student: self-borrow
router.post('/borrow', authenticate, authorize('student'), recordController.borrowBook);
router.post('/borrow-cart', authenticate, authorize('student'), recordController.borrowCart);

// Student: self-return
router.post('/self-return/:id', authenticate, authorize('student'), recordController.selfReturnBook);

// Student: view own records and fines
router.get('/my', authenticate, recordController.getMyRecords);
router.get('/fines', authenticate, recordController.getMyFines);

module.exports = router;
