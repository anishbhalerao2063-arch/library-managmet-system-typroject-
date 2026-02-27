# 📚 Library Connect - Library Management System

A complete Library Management System with role-based access for **Admin**, **Librarian**, and **Student**.

## Features
- 🔐 Role-based login & registration (Admin, Librarian, Student)
- 📖 Browse, search & filter books by category
- 🛒 Add to Cart & Borrow Now (Students)
- ↩️ Return books with auto fine calculation (₹2/day after 14 days)
- ⏱️ Time remaining countdown for issued books
- 📊 Dashboard with role-specific stats
- 🗄️ Supabase-style Database Viewer (Admin)
- 📱 Responsive design

## How to Run

### Prerequisites
- **Node.js** (v16 or above) — Download from https://nodejs.org

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/anishbhalerao2063-arch/library-managmet-system-typroject-.git

# 2. Go into the project folder
cd library-managmet-system-typroject-

# 3. Install dependencies
npm install

# 4. Start the server
node server.js

# 5. Open in browser
# Go to http://localhost:3000
```

### Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@library.com | admin123 |
| Librarian | librarian@library.com | lib123 |
| Student | *Register a new account* | — |

You can also create new accounts using the **Sign Up** page.

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: SQLite (sql.js)
- **Auth**: JWT (JSON Web Tokens)
- **Frontend**: HTML, CSS, JavaScript

## Project Structure
```
├── server.js              # Express server entry point
├── config/database.js     # SQLite database setup & seeding
├── controllers/           # API logic (auth, books, records, users)
├── models/                # Database models (User, Book, Record)
├── middleware/             # Auth & role-based middleware
├── routes/                # API route definitions
└── public/                # Frontend (HTML, CSS, JS)
    ├── css/style.css      # Library Connect theme
    ├── js/                # Page-specific JavaScript
    └── *.html             # All pages
```
