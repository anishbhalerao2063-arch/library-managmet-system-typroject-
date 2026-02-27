const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'library.db');

let db = null;

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

async function initializeDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin','librarian','student')) DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      book_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      publisher TEXT DEFAULT '',
      edition TEXT DEFAULT '',
      category TEXT DEFAULT '',
      available_copies INTEGER DEFAULT 1,
      total_copies INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      record_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATETIME,
      return_date DATETIME,
      fine_amount REAL DEFAULT 0,
      status TEXT CHECK(status IN ('issued','returned')) DEFAULT 'issued',
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      FOREIGN KEY (book_id) REFERENCES books(book_id)
    )
  `);

  // Seed admin user if not exists
  const adminCheck = db.exec("SELECT user_id FROM users WHERE email = 'admin@library.com'");
  if (adminCheck.length === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ['Admin', 'admin@library.com', hashedPassword, 'admin']);
    console.log('✓ Admin user seeded (admin@library.com / admin123)');
  }

  // Seed librarian
  const libCheck = db.exec("SELECT user_id FROM users WHERE email = 'librarian@library.com'");
  if (libCheck.length === 0) {
    const hashedPassword = bcrypt.hashSync('lib123', 10);
    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ['Librarian', 'librarian@library.com', hashedPassword, 'librarian']);
    console.log('✓ Librarian user seeded (librarian@library.com / lib123)');
  }

  // Seed sample books
  const bookCheck = db.exec("SELECT COUNT(*) as count FROM books");
  const bookCount = bookCheck[0] ? bookCheck[0].values[0][0] : 0;
  if (bookCount === 0) {
    const sampleBooks = [
      ['Data Structures and Algorithms', 'Thomas H. Cormen', 'MIT Press', '3rd', 'Computer Science', 5, 5],
      ['Introduction to the Theory of Computation', 'Michael Sipser', 'Cengage', '3rd', 'Computer Science', 3, 3],
      ['Operating System Concepts', 'Abraham Silberschatz', 'Wiley', '10th', 'Computer Science', 4, 4],
      ['Database System Concepts', 'Abraham Silberschatz', 'McGraw Hill', '7th', 'Computer Science', 3, 3],
      ['Computer Networks', 'Andrew S. Tanenbaum', 'Pearson', '5th', 'Computer Science', 4, 4],
      ['Clean Code', 'Robert C. Martin', 'Prentice Hall', '1st', 'Software Engineering', 2, 2],
      ['Design Patterns', 'Erich Gamma', 'Addison-Wesley', '1st', 'Software Engineering', 2, 2],
      ['Artificial Intelligence: A Modern Approach', 'Stuart Russell', 'Pearson', '4th', 'Artificial Intelligence', 3, 3],
      ['Linear Algebra and Its Applications', 'David C. Lay', 'Pearson', '6th', 'Mathematics', 4, 4],
      ['Engineering Mathematics', 'B.S. Grewal', 'Khanna Publishers', '44th', 'Mathematics', 6, 6],
      ['Digital Logic and Computer Design', 'M. Morris Mano', 'Pearson', '5th', 'Electronics', 3, 3],
      ['The C Programming Language', 'Brian W. Kernighan', 'Prentice Hall', '2nd', 'Programming', 5, 5],
    ];

    for (const book of sampleBooks) {
      db.run("INSERT INTO books (title, author, publisher, edition, category, available_copies, total_copies) VALUES (?, ?, ?, ?, ?, ?, ?)", book);
    }
    console.log('✓ 12 sample books seeded');
  }

  saveDatabase();
  console.log('✓ Database initialized successfully');

  // Auto-save every 5 seconds
  setInterval(saveDatabase, 5000);
}

// Helper: convert sql.js result to array of objects
function queryAll(sql, params = []) {
  const result = db.exec(sql, params);
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

// Helper: get single row
function queryGet(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: run insert/update/delete and return changes info
function queryRun(sql, params = []) {
  db.run(sql, params);
  const lastId = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
  const changes = db.exec("SELECT changes()")[0].values[0][0];
  saveDatabase();
  return { lastInsertRowid: lastId, changes: changes };
}

module.exports = { initializeDatabase, queryAll, queryGet, queryRun, getDb: () => db };
