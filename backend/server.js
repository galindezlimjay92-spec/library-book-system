const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

// ROOT ROUTE - FIX CANNOT GET /
app.get('/', (req, res) => {
    res.send('Library Book System Backend is Running!');
});

// DATABASE CONNECTION
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'library_db',
    ssl: process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined
});

db.getConnection()
    .then((conn) => {
        console.log('Database Connected');
        conn.release();
    })
    .catch((err) => {
        console.error('Database connection failed:', err.message);
    });

function toBook(row) {
    return {
        id: row.book_id,
        title: row.title,
        author: row.author,
        category: row.category,
        isbn: row.isbn,
        description: row.description || '',
        totalCopies: row.copies_available
    };
}

// GET BOOKS
app.get('/api/books', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM books ORDER BY book_id'
        );
        res.json(rows.map(toBook));
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Failed to fetch books.'
        });
    }
});

// ADD BOOK
app.post('/api/books', async (req, res) => {
    const {
        title,
        author,
        category,
        isbn,
        description,
        totalCopies
    } = req.body;

    if (!title || !author) {
        return res.status(400).json({
            message: 'Title and author are required.'
        });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO books
            (title, author, category, isbn, description, copies_available, date_added)
            VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
            [
                title,
                author,
                category || '',
                isbn || '',
                description || '',
                Number(totalCopies) || 1
            ]
        );

        const [rows] = await db.query(
            'SELECT * FROM books WHERE book_id = ?',
            [result.insertId]
        );

        console.log(`Book added: ${title}`);

        res.status(201).json(toBook(rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Failed to add book.'
        });
    }
});

// UPDATE BOOK
app.put('/api/books/:id', async (req, res) => {
    try {
        const [found] = await db.query(
            'SELECT * FROM books WHERE book_id = ?',
            [req.params.id]
        );

        if (found.length === 0) {
            return res.status(404).json({
                message: 'Book not found.'
            });
        }

        const old = found[0];
        const b = req.body;

        await db.query(
            `UPDATE books
            SET title = ?, author = ?, category = ?,
            isbn = ?, description = ?, copies_available = ?
            WHERE book_id = ?`,
            [
                b.title ?? old.title,
                b.author ?? old.author,
                b.category ?? old.category,
                b.isbn ?? old.isbn,
                b.description ?? old.description,
                b.totalCopies !== undefined
                    ? Number(b.totalCopies)
                    : old.copies_available,
                req.params.id
            ]
        );

        const [rows] = await db.query(
            'SELECT * FROM books WHERE book_id = ?',
            [req.params.id]
        );

        console.log(`Book updated: ${rows[0].title}`);

        res.json(toBook(rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Failed to update book.'
        });
    }
});

// DELETE BOOK
app.delete('/api/books/:id', async (req, res) => {
    console.log(`DELETE request received, id: ${req.params.id}`);

    try {
        const [result] = await db.query(
            'DELETE FROM books WHERE book_id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Book not found.'
            });
        }

        console.log(`Book deleted: id ${req.params.id}`);

        res.json({
            message: 'Book deleted.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Failed to delete book.'
        });
    }
});

// LOGIN
app.post('/api/login', (req, res) => {
    const { name, email, role, provider } = req.body;

    console.log(
        `Login: ${name} (${email}) - ${role}${provider ? ' via ' + provider : ''}`
    );

    res.json({
        message: 'Login recorded.'
    });
});

// ===== BORROW REQUESTS =====

function toRequest(row) {
    return {
        id: row.id,
        studentId: row.student_id,
        studentName: row.student_name,
        bookId: row.book_id,
        bookTitle: row.book_title,
        requestDate: row.request_date,
        status: row.status,
        dueDate: row.due_date,
        returnDate: row.return_date
    };
}

async function getRequestById(id) {
    const [rows] = await db.query(
        'SELECT * FROM borrow_requests WHERE id = ?',
        [id]
    );
    return rows[0];
}

// GET ALL REQUESTS
app.get('/api/requests', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM borrow_requests ORDER BY id DESC'
        );
        res.json(rows.map(toRequest));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch requests.' });
    }
});

// CREATE REQUEST (student)
app.post('/api/requests', async (req, res) => {
    const { studentId, studentName, bookId } = req.body;

    if (!studentId || !bookId) {
        return res.status(400).json({
            message: 'studentId and bookId are required.'
        });
    }

    try {
        const [books] = await db.query(
            'SELECT * FROM books WHERE book_id = ?',
            [bookId]
        );

        if (books.length === 0 || books[0].copies_available < 1) {
            return res.status(400).json({
                message: 'This book is not available right now.'
            });
        }

        const [dupes] = await db.query(
            `SELECT id FROM borrow_requests
             WHERE student_id = ? AND book_id = ?
             AND status IN ('Pending', 'Approved')`,
            [String(studentId), bookId]
        );

        if (dupes.length > 0) {
            return res.status(400).json({
                message: 'You already have a request or an active borrow for this book.'
            });
        }

        const [result] = await db.query(
            `INSERT INTO borrow_requests
             (student_id, student_name, book_id, book_title)
             VALUES (?, ?, ?, ?)`,
            [String(studentId), studentName || '', bookId, books[0].title]
        );

        res.status(201).json(toRequest(await getRequestById(result.insertId)));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create request.' });
    }
});

// APPROVE REQUEST (admin)
app.put('/api/requests/:id/approve', async (req, res) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [found] = await conn.query(
            'SELECT * FROM borrow_requests WHERE id = ? FOR UPDATE',
            [req.params.id]
        );

        if (found.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Borrow request not found.' });
        }

        if (found[0].status !== 'Pending') {
            await conn.rollback();
            return res.status(400).json({ message: 'This request is no longer pending.' });
        }

        const [dec] = await conn.query(
            `UPDATE books SET copies_available = copies_available - 1
             WHERE book_id = ? AND copies_available > 0`,
            [found[0].book_id]
        );

        if (dec.affectedRows === 0) {
            await conn.rollback();
            return res.status(400).json({ message: 'No available copies for this book.' });
        }

        await conn.query(
            `UPDATE borrow_requests
             SET status = 'Approved', due_date = DATE_ADD(NOW(), INTERVAL 7 DAY)
             WHERE id = ?`,
            [req.params.id]
        );

        await conn.commit();
        res.json(toRequest(await getRequestById(req.params.id)));
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ message: 'Failed to approve request.' });
    } finally {
        conn.release();
    }
});

// REJECT REQUEST (admin)
app.put('/api/requests/:id/reject', async (req, res) => {
    try {
        const [result] = await db.query(
            `UPDATE borrow_requests SET status = 'Rejected'
             WHERE id = ? AND status = 'Pending'`,
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: 'Request not found or no longer pending.'
            });
        }

        res.json(toRequest(await getRequestById(req.params.id)));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to reject request.' });
    }
});

// MARK RETURNED (admin)
app.put('/api/requests/:id/return', async (req, res) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [found] = await conn.query(
            'SELECT * FROM borrow_requests WHERE id = ? FOR UPDATE',
            [req.params.id]
        );

        if (found.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Borrow record not found.' });
        }

        if (found[0].status !== 'Approved') {
            await conn.rollback();
            return res.status(400).json({ message: 'This book is not currently borrowed.' });
        }

        await conn.query(
            `UPDATE borrow_requests
             SET status = 'Returned', return_date = NOW()
             WHERE id = ?`,
            [req.params.id]
        );

        await conn.query(
            'UPDATE books SET copies_available = copies_available + 1 WHERE book_id = ?',
            [found[0].book_id]
        );

        await conn.commit();
        res.json(toRequest(await getRequestById(req.params.id)));
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ message: 'Failed to mark as returned.' });
    } finally {
        conn.release();
    }
});

// ===== ACCOUNTS =====

function toUser(row) {
    return {
        id: String(row.id), // text, para tugma sa studentId ng requests
        role: row.role,
        name: row.name,
        studentId: row.student_id,
        email: row.email,
        provider: 'email'
    };
}

// Gumagawa ng default admin sa unang takbo ng server
async function seedDefaultAdmin() {
    try {
        const [rows] = await db.query(
            "SELECT id FROM users WHERE role = 'admin' AND email = ?",
            ['admin@library.com']
        );

        if (rows.length === 0) {
            const hash = await bcrypt.hash('admin123', 10);

            await db.query(
                `INSERT INTO users (role, name, email, password_hash)
                 VALUES ('admin', 'Library Admin', 'admin@library.com', ?)`,
                [hash]
            );

            console.log('Default admin created');
        }
    } catch (err) {
        console.error('Could not create default admin:', err.message);
    }
}

seedDefaultAdmin();

// REGISTER (student or admin)
app.post('/api/register', async (req, res) => {
    const { role, name, studentId, email, password } = req.body;

    if (!['student', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role.' });
    }

    if (!name || !email || !password) {
        return res.status(400).json({
            message: 'Name, email and password are required.'
        });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    try {
        const [dupes] = await db.query(
            'SELECT id FROM users WHERE role = ? AND email = ?',
            [role, cleanEmail]
        );

        if (dupes.length > 0) {
            return res.status(400).json({
                message: 'Email is already registered.'
            });
        }

        const hash = await bcrypt.hash(String(password), 10);

        const [result] = await db.query(
            `INSERT INTO users (role, name, student_id, email, password_hash)
             VALUES (?, ?, ?, ?, ?)`,
            [role, name, studentId || null, cleanEmail, hash]
        );

        const [rows] = await db.query(
            'SELECT * FROM users WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(toUser(rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to register.' });
    }
});

// LOGIN (email + password)
app.post('/api/auth/login', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({
            message: 'Email, password and role are required.'
        });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE role = ? AND email = ?',
            [role, String(email).trim().toLowerCase()]
        );

        const ok =
            rows.length > 0 &&
            (await bcrypt.compare(String(password), rows[0].password_hash));

        if (!ok) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        res.json(toUser(rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to log in.' });
    }
});

// LIST STUDENTS (for the admin's Manage Students page)
app.get('/api/students', async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE role = 'student' ORDER BY id DESC"
        );
        res.json(rows.map(toUser));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch students.' });
    }
});

// START SERVER
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});