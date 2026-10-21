const express = require('express'); 
const cors = require('cors'); 
const app = express();

app.use(express.json());
app.use(cors());

let books = [
    {
        id: 1,
        title: 'Java Programming',
        author: 'James Gosling',
        category: 'Programming',
        isbn: '',
        description: '',
        totalCopies: 1
    },
    {
        id: 2,
        title: 'Database Systems',
        author: 'Raghu Ramakrishnan',
        category: 'Database',
        isbn: '',
        description: '',
        totalCopies: 1
    },
];

app.get('/api/books', (req, res) => {
    res.json(books);
});

app.post('/api/books', (req, res) => {
    const {
        id,
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

    const newBook = {
        id: id || Date.now(),
        title: title,
        author: author,
        category: category || '',
        isbn: isbn || '',
        description: description || '',
        totalCopies: Number(totalCopies) || 1
    };

    books.push(newBook);

    console.log('--- Book added ---');
    console.log(`Title: ${title}`);
    console.log(`Author: ${author}`);

    res.status(201).json(newBook);
});

app.put('/api/books/:id', (req, res) => {
    const { title, author, category, isbn, description, totalCopies } = req.body;
    const index = books.findIndex((b) => String(b.id) === req.params.id);

    if (index === -1) {
        // The website's own catalog books (e.g. bk-001) were never sent to this
        // server, so the first edit adds them here instead of failing.
        if (!title || !author) {
            return res.status(404).json({ message: 'Book not found.' });
        }
        const created = {
            id: req.params.id,
            title: title,
            author: author,
            category: category || '',
            isbn: isbn || '',
            description: description || '',
            totalCopies: Number(totalCopies) || 1
        };
        books.push(created);

        console.log('--- Book updated ---');
        console.log(`Title: ${created.title}`);
        console.log(`Author: ${created.author}`);
        return res.json(created);
    }

    books[index] = {
        ...books[index],
        title: title ?? books[index].title,
        author: author ?? books[index].author,
        category: category ?? books[index].category,
        isbn: isbn ?? books[index].isbn,
        description: description ?? books[index].description,
        totalCopies: totalCopies !== undefined ? Number(totalCopies) : books[index].totalCopies
    };

    console.log('--- Book updated ---');
    console.log(`Title: ${books[index].title}`);
    console.log(`Author: ${books[index].author}`);

    res.json(books[index]);
});

app.delete('/api/books/:id', (req, res) => {
    const before = books.length;
    const removed = books.find((b) => String(b.id) === req.params.id);
    books = books.filter((b) => String(b.id) !== req.params.id);

    if (books.length === before) {
        return res.status(404).json({ message: 'Book not found.' });
    }

    console.log('--- Book deleted ---');
    console.log(`Title: ${removed.title}`);

    res.json({ message: 'Book deleted.' });
});

app.post('/api/login', (req, res) => {
    const { name, email, role, provider } = req.body;

    console.log('--- Login ---');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Role: ${role}${provider ? ' (' + provider + ')' : ''}`);

    res.json({ message: 'Login recorded.' });
});

app.listen(8080, () => {
    console.log('Server running with 8080');
});