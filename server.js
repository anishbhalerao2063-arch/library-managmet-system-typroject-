const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./config/database');

async function startServer() {
    // Initialize database (async for sql.js)
    await initializeDatabase();

    const app = express();
    const PORT = process.env.PORT || 3000;

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Serve static files
    app.use(express.static(path.join(__dirname, 'public')));

    // API Routes
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/books', require('./routes/bookRoutes'));
    app.use('/api/records', require('./routes/recordRoutes'));
    app.use('/api/users', require('./routes/userRoutes'));
    app.use('/api/dashboard', require('./routes/dashboardRoutes'));

    // DB Viewer (Admin only)
    const { authenticate } = require('./middleware/auth');
    const { authorize } = require('./middleware/roleAuth');
    const dbViewController = require('./controllers/dbViewController');
    app.get('/api/db/tables', authenticate, authorize('admin'), dbViewController.getTables);

    // Serve index.html for all non-API routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    app.listen(PORT, () => {
        console.log(`\n📚 Library Management System running at http://localhost:${PORT}\n`);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
