import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { seedBooks } from '../../data/seedBooks';

const emptyForm = { title: '', author: '', category: '', isbn: '', description: '', totalCopies: 1 };

export default function ManageBooks() {
  const { books, addBook, updateBook, deleteBook, syncSeedBooks } = useData();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const existingIds = new Set(books.map((b) => b.id));
  const missingSeedCount = seedBooks.filter((b) => !existingIds.has(b.id)).length;

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (editingId) {
      const original = books.find((b) => b.id === editingId);
      const newTotal = Number(form.totalCopies);
      const diff = newTotal - original.totalCopies;
      updateBook(editingId, {
        ...form,
        totalCopies: newTotal,
        availableCopies: Math.max(0, original.availableCopies + diff),
      });
    } else {
      addBook(form);
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(book) {
    setForm({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      description: book.description,
      totalCopies: book.totalCopies,
    });
    setEditingId(book.id);
    setShowForm(true);
  }

  function cancelForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Manage Books</h4>
        <div className="d-flex gap-2">
          {missingSeedCount > 0 && (
            <button
              className="btn btn-outline-secondary"
              onClick={syncSeedBooks}
              title="Add any catalog books that aren't in this list yet"
            >
              <i className="bi bi-arrow-repeat me-1"></i>
              Add {missingSeedCount} missing catalog book{missingSeedCount === 1 ? '' : 's'}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
            <i className="bi bi-plus-lg me-1"></i>
            {showForm ? 'Close Form' : 'Add Book'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h6 className="fw-bold mb-3">{editingId ? 'Edit Book' : 'New Book'}</h6>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small">Title</label>
                  <input name="title" className="form-control" value={form.title} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Author</label>
                  <input name="author" className="form-control" value={form.author} onChange={handleChange} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Category</label>
                  <input name="category" className="form-control" value={form.category} onChange={handleChange} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">ISBN</label>
                  <input name="isbn" className="form-control" value={form.isbn} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Total Copies</label>
                  <input
                    type="number"
                    min="0"
                    name="totalCopies"
                    className="form-control"
                    value={form.totalCopies}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small">Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="2"
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="mt-3 d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Add Book'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={cancelForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Copies (avail/total)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id}>
                  <td>{b.title}</td>
                  <td>{b.author}</td>
                  <td>
                    <span className="badge text-bg-light border">{b.category}</span>
                  </td>
                  <td>
                    {b.availableCopies} / {b.totalCopies}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => startEdit(b)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteBook(b.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
