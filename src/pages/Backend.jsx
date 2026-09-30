import { useState, useEffect } from 'react'

export default function Backend() {
    const [books, setBooks] = useState([]);
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');

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

    useEffect(() => {
        loadBooks();
    }, []);

    async function formSubmit(e) {
        e.preventDefault(); //prevent yung refresh

        try {
            await fetch(api_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    author: author,
                })
            })
            setTitle('');
            setAuthor('');
            loadBooks(); // i-refresh yung table pagkatapos mag-submit
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

                <input type="submit" value="Submit" />
            </form>

            <table>
                <tbody>
                    <tr>
                        <td>Title</td>
                        <td>Author</td>
                    </tr>
                    {
                        books.map((book) => (
                            <tr key={book.id}>
                                <td>{book.title}</td>
                                <td>{book.author}</td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    );
}
