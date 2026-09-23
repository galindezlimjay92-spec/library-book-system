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
        id: Date.now(),
        title: title,
        author: author,
        category: category || '',
        isbn: isbn || '',
        description: description || '',
        totalCopies: Number(totalCopies) || 1
    };

    books.push(newBook);

    console.log(`Title: ${title}`);
    console.log(`Author: ${author}`);

    res.status(201).json(newBook);
});

app.listen(8080, () => {
    console.log('Server running with 8080');
});