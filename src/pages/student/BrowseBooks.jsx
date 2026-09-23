import { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import BookCard from '../../components/BookCard';

export default function BrowseBooks() {
  const { books, requests, session, createBorrowRequest } = useData();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [message, setMessage] = useState(null);

  const categories = useMemo(
    () => ['All', ...new Set(books.map((b) => b.category))],
    [books]
  );

  const myRequestStateByBook = useMemo(() => {
    const map = {};
    requests
      .filter((r) => r.studentId === session.id)
      .forEach((r) => {
        if (r.status === 'Pending') map[r.bookId] = 'pending';
        if (r.status === 'Approved') map[r.bookId] = 'approved';
      });
    return map;
  }, [requests, session.id]);

  const filtered = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || b.category === category;
    const matchesAvailability = !availableOnly || b.availableCopies > 0;
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  function handleRequest(bookId) {
    setMessage(null);
    try {
      createBorrowRequest({ bookId });
      setMessage({ type: 'success', text: 'Borrow request submitted! Check "My Requests" for status.' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.message });
    }
  }

  return (
    <div>
      <h4 className="fw-bold mb-3">Browse Available Books</h4>

      {message && <div className={`alert alert-${message.type} py-2 small`}>{message.text}</div>}

      <div className="row g-2 mb-4">
        <div className="col-md-5">
          <input
            className="form-control"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4 d-flex align-items-center">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="availOnly"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            <label className="form-check-label small" htmlFor="availOnly">
              Available only
            </label>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted">No books match your search.</p>
      ) : (
        <div className="row">
          {filtered.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onRequest={handleRequest}
              requestState={myRequestStateByBook[book.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
