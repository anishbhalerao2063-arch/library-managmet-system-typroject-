const { queryAll, queryGet, queryRun } = require('../config/database');

class User {
    static findByEmail(email) {
        return queryGet('SELECT * FROM users WHERE email = ?', [email]);
    }

    static findById(id) {
        return queryGet('SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ?', [id]);
    }

    static create({ name, email, password, role = 'student' }) {
        const result = queryRun(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
        );
        return { user_id: result.lastInsertRowid, name, email, role };
    }

    static getAll() {
        return queryAll('SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    }

    static getStudents() {
        return queryAll('SELECT user_id, name, email, created_at FROM users WHERE role = ? ORDER BY name', ['student']);
    }

    static update(id, { name, email, role }) {
        return queryRun(
            'UPDATE users SET name = ?, email = ?, role = ? WHERE user_id = ?',
            [name, email, role, id]
        );
    }

    static delete(id) {
        return queryRun('DELETE FROM users WHERE user_id = ?', [id]);
    }

    static getCount() {
        const row = queryGet('SELECT COUNT(*) as count FROM users');
        return row ? row.count : 0;
    }

    static getCountByRole(role) {
        const row = queryGet('SELECT COUNT(*) as count FROM users WHERE role = ?', [role]);
        return row ? row.count : 0;
    }
}

module.exports = User;
