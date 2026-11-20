const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS: only the Netlify site (and local dev) may call this API
const clientOrigin = (process.env.CLIENT_ORIGIN || '').trim().replace(/\/+$/, '');
const allowedOrigins = [clientOrigin, 'http://localhost:5173'].filter(Boolean);

app.use(express.json());
app.use(cors({ origin: allowedOrigins }));

// ===== FIREBASE ADMIN =====

try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin ready');
} catch (err) {
    console.error('Firebase Admin setup failed:', err.message);
}

// Role is stored in Firestore (users/{uid}.role). Cached for 1 minute
// so we do not read Firestore on every single request.
const roleCache = new Map();

async function getRole(uid) {
    const cached = roleCache.get(uid);

    if (cached && cached.expires > Date.now()) {
        return cached.role;
    }

    const snap = await admin.firestore().collection('users').doc(uid).get();
    const role = snap.exists ? snap.data().role || 'student' : 'student';

    roleCache.set(uid, { role, expires: Date.now() + 60 * 1000 });
    return role;
}

// Checks the "Authorization: Bearer <token>" header
async function verifyToken(req, res, next) {
    if (admin.apps.length === 0) {
        return res.status(500).json({
            message: 'Server login check is not set up.'
        });
    }

    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: 'Please log in first.' });
    }

    let decoded;

    try {
        decoded = await admin.auth().verifyIdToken(token);
    } catch (err) {
        console.error('Token check failed:', err.message);
        return res.status(401).json({
            message: 'Your login expired. Please log in again.'
        });
    }

    try {
        req.user = {
            uid: decoded.uid,
            email: decoded.email || '',
            name: decoded.name || decoded.email || '',
            role: await getRole(decoded.uid)
        };

        next();
    } catch (err) {
        console.error('Role check failed:', err.message);
        res.status(500).json({ message: 'Could not check your role.' });
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({
                message: 'You do not have permission to do this.'
            });
        }

        next();
    };
}

// ROOT ROUTE - FIX CANNOT GET /
app.get('/', (req, res) => {
    res.send('Library Book System Backend is Running!');
});

// HEALTH CHECK
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
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

// GET BOOKS (public, anyone can browse)
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

// ADD BOOK (admin only)
app.post('/api/books', verifyToken, requireRole('admin'), async (req, res) => {
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

// UPDATE BOOK (admin only)
app.put('/api/books/:id', verifyToken, requireRole('admin'), async (req, res) => {
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

// DELETE BOOK (admin only)
app.delete('/api/books/:id', verifyToken, requireRole('admin'), async (req, res) => {
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

// LOGIN LOG
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

// GET REQUESTS (admin sees all, a student sees only their own)
app.get('/api/requests', verifyToken, async (req, res) => {
    try {
        const [rows] =
            req.user.role === 'admin'
                ? await db.query(
                      'SELECT * FROM borrow_requests ORDER BY id DESC'
                  )
                : await db.query(
                      'SELECT * FROM borrow_requests WHERE student_id = ? ORDER BY id DESC',
                      [req.user.uid]
                  );

        res.json(rows.map(toRequest));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch requests.' });
    }
});

// CREATE REQUEST (student only). Name and ID come from the verified token.
app.post('/api/requests', verifyToken, requireRole('student'), async (req, res) => {
    const { bookId } = req.body;

    if (!bookId) {
        return res.status(400).json({
            message: 'bookId is required.'
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
            [req.user.uid, bookId]
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
            [req.user.uid, req.user.name, bookId, books[0].title]
        );

        res.status(201).json(toRequest(await getRequestById(result.insertId)));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create request.' });
    }
});

// APPROVE REQUEST (admin only)
app.put('/api/requests/:id/approve', verifyToken, requireRole('admin'), async (req, res) => {
    let conn;

    try {
        conn = await db.getConnection();
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
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).json({ message: 'Failed to approve request.' });
    } finally {
        if (conn) conn.release();
    }
});

// REJECT REQUEST (admin only)
app.put('/api/requests/:id/reject', verifyToken, requireRole('admin'), async (req, res) => {
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

// MARK RETURNED (admin only)
app.put('/api/requests/:id/return', verifyToken, requireRole('admin'), async (req, res) => {
    let conn;

    try {
        conn = await db.getConnection();
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
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).json({ message: 'Failed to mark as returned.' });
    } finally {
        if (conn) conn.release();
    }
});

// ===== STUDENTS (admin only) =====
// Students are the Google users saved in Firestore with role "student"

app.get('/api/students', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const snap = await admin
            .firestore()
            .collection('users')
            .where('role', '==', 'student')
            .get();

        const students = snap.docs.map((d) => {
            const u = d.data();

            return {
                id: d.id,
                name: u.displayName || u.email || '',
                studentId: `google-${d.id.slice(0, 6)}`,
                email: u.email || '',
                provider: 'google'
            };
        });

        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch students.' });
    }
});

// ===== ERROR HANDLING =====

// Unknown routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err);

    const status = err.status && err.status < 500 ? err.status : 500;

    res.status(status).json({
        message:
            status < 500 ? err.message : 'Something went wrong on the server.'
    });
});

// START SERVER
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});