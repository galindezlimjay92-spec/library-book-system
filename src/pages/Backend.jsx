import { useState, useEffect } from 'react'

export default function Backend() {
    const [books, setBooks] = useState([]);
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [editingId, setEditingId] = useState(null); // null = Add mode, may id = Edit mode

    const api_url = 'http://localhost:8080/api/books'

    function loadBooks() {
        fetch(api_url)
            .then((response) => response.json())
            .then((data) => {
                setBooks(data)
                console.log(data)
            })
            .catch((err) => console.log(err));
    }
E
    useEffect(() => {
        loadBooks();
    }, []);

    
    async function formSubmit(e) {
        e.preventDefault(); 
        try {
            if (editingId) {
               
                await fetch(`${api_url}/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: title, author: author })
                });
            } else {
               
                await fetch(api_url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: title, author: author })
                });
            }
            cancelEdit();
            loadBooks();
        }
        catch (err) {
            console.log(err);
        }
    }

    
    function startEdit(book) {
        setEditingId(book.id);
        setTitle(book.title);
        setAuthor(book.author);
    }

    function cancelEdit() {
        setEditingId(null);
        setTitle('');
        setAuthor('');
    }

    
    async function deleteBook(id) {
        if (!window.confirm('Delete this book?')) return;

        try {
            await fetch(`${api_url}/${id}`, { method: 'DELETE' });
            if (editingId === id) cancelEdit();
            loadBooks();
        }
        catch (err) {
            console.log(err);
        }
    }

    return (
        <div>
            <h1>Welcome to Backend</h1>

            <form onSubmit={formSubmit}>
                <label htmlFor="title">Title</label>
                <input type="text" id='title' value={title} onChange={(event) => setTitle(event.target.value)} />

                <label htmlFor="author">Author</label>
                <input type="text" id='author' value={author} onChange={(event) => setAuthor(event.target.value)} />

                <input type="submit" value={editingId ? 'Update' : 'Submit'} />
                {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
            </form>

            <table>
                <tbody>
                    <tr>
                        <td>Title</td>
                        <td>Author</td>
                        <td>Actions</td>
                    </tr>
                    {
                        books.map((book) => (
                            <tr key={book.id}>
                                <td>{book.title}</td>
                                <td>{book.author}</td>
                                <td>
                                    <button onClick={() => startEdit(book)}>Edit</button>
                                    <button onClick={() => deleteBook(book.id)}>Delete</button>
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    );
}
