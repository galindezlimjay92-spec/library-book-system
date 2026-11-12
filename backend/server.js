const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'library_db'
});

db.getConnection()
    .then((conn) => {
        console.log('Database Connected');
        conn.release();
    })
    .catch((err) => console.error('Database connection failed:', err.message));

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

app.get('/api/books', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM books ORDER BY book_id');
        res.json(rows.map(toBook));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch books.' });
    }
});

app.post('/api/books', async (req, res) => {
    const { title, author, category, isbn, description, totalCopies } = req.body;

    if (!title || !author) {
        return res.status(400).json({ message: 'Title and author are required.' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO books (title, author, category, isbn, description, copies_available, date_added)
             VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
            [title, author, category || '', isbn || '', description || '', Number(totalCopies) || 1]
        );
        const [rows] = await db.query('SELECT * FROM books WHERE book_id = ?', [result.insertId]);
        console.log(`Book added: ${title}`);
        res.status(201).json(toBook(rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to add book.' });
    }
});

app.put('/api/books/:id', async (req, res) => {
    try {
        const [found] = await db.query('SELECT * FROM books WHERE book_id = ?', [req.params.id]);
        if (found.length === 0) {
            return res.status(404).json({ message: 'Book not found.' });
        }

        const old = found[0];
        const b = req.body;

        await db.query(
            `UPDATE books
             SET title = ?, author = ?, category = ?, isbn = ?, description = ?, copies_available = ?
             WHERE book_id = ?`,
            [
                b.title ?? old.title,
                b.author ?? old.author,
                b.category ?? old.category,
                b.isbn ?? old.isbn,
                b.description ?? old.description,
                b.totalCopies !== undefined ? Number(b.totalCopies) : old.copies_available,
                req.params.id
            ]
        );

        const [rows] = await db.query('SELECT * FROM books WHERE book_id = ?', [req.params.id]);
        console.log(`Book updated: ${rows[0].title}`);
        res.json(toBook(rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update book.' });
    }
});

app.delete('/api/books/:id', async (req, res) => {
    console.log(`DELETE request received, id: ${req.params.id}`);
    try {
        const [result] = await db.query('DELETE FROM books WHERE book_id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            console.log(`Book not found, id: ${req.params.id}`);
            return res.status(404).json({ message: 'Book not found.' });
        }
        console.log(`Book deleted: id ${req.params.id}`);
        res.json({ message: 'Book deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete book.' });
    }
});

// Hindi ginalaw: ginagamit ito ng DataContext.jsx
app.post('/api/login', (req, res) => {
    const { name, email, role, provider } = req.body;
    console.log(`Login: ${name} (${email}) - ${role}${provider ? ' via ' + provider : ''}`);
    res.json({ message: 'Login recorded.' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});