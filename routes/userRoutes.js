const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

// Admin only: full user management
router.get('/', authenticate, authorize('admin'), userController.getUsers);
router.get('/students', authenticate, authorize('admin', 'librarian'), userController.getStudents);
router.get('/:id', authenticate, authorize('admin'), userController.getUser);
router.put('/:id', authenticate, authorize('admin'), userController.updateUser);
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

module.exports = router;
