const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users (Admin)
exports.getUsers = (req, res) => {
    try {
        const users = User.getAll();
        res.json({ users });
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
};

// Get single user (Admin)
exports.getUser = (req, res) => {
    try {
        const user = User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json({ user });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Failed to fetch user.' });
    }
};

// Update user (Admin)
exports.updateUser = (req, res) => {
    try {
        const { name, email, role } = req.body;

        if (!name || !email || !role) {
            return res.status(400).json({ error: 'Name, email, and role are required.' });
        }

        const existing = User.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'User not found.' });
        }

        User.update(req.params.id, { name, email, role });
        res.json({ message: 'User updated successfully!' });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Failed to update user.' });
    }
};

// Delete user (Admin)
exports.deleteUser = (req, res) => {
    try {
        const existing = User.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Prevent deleting self
        if (existing.user_id === req.user.user_id) {
            return res.status(400).json({ error: 'Cannot delete your own account.' });
        }

        User.delete(req.params.id);
        res.json({ message: 'User deleted successfully!' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Failed to delete user.' });
    }
};

// Get students list (Admin/Librarian - for issue book dropdown)
exports.getStudents = (req, res) => {
    try {
        const students = User.getStudents();
        res.json({ students });
    } catch (err) {
        console.error('Get students error:', err);
        res.status(500).json({ error: 'Failed to fetch students.' });
    }
};
