import { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import EmptyRow from '../../components/EmptyRow';
import { useData } from '../../context/DataContext';

const emptyForm = { title: '', author: '', category: '', isbn: '', description: '', totalCopies: 1 };

export default function ManageBooks() {
  // Books now come from DataContext (Firestore), the same source the Student pages use.
  const { books, addBook, updateBook, deleteBook } = useData();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const visible = books.filter((b) =>
    `${b.title} ${b.author}`.toLowerCase().includes(search.toLowerCase())
  );

  // Step 1: only remember which book to delete and show the confirm box
  function handleDelete(book) {
    setDeleteTarget(book);
  }

  // Step 2: when Delete is pressed in the confirm box, remove it from Firestore
  async function confirmDelete() {
    const book = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteBook(book.id);
    } catch (err) {
      console.log('Delete error:', err);
    }
  }

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newTotal = Number(form.totalCopies);

    try {
      if (editingId) {
        // Keep "available" in step with the change in total copies
        const current = books.find((b) => b.id === editingId);
        const diff = newTotal - (current?.totalCopies ?? newTotal);
        const available = Math.max(0, (current?.availableCopies ?? newTotal) + diff);

        await updateBook(editingId, {
          ...form,
          totalCopies: newTotal,
          availableCopies: available,
        });
      } else {
        await addBook({ ...form, totalCopies: newTotal });
      }
    } catch (err) {
      console.log(err);
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
      isbn: book.isbn || '',
      description: book.description || '',
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
      <PageHeader title="Manage Books" subtitle={`${books.length} titles in the catalog`}>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          <i className="bi bi-plus-lg me-1"></i>
          {showForm ? 'Close Form' : 'Add Book'}
        </button>
      </PageHeader>

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

      <div className="card">
        <div className="card-body border-bottom py-3">
          <div className="input-group" style={{ maxWidth: 360 }}>
            <span className="input-group-text bg-white">
              <i className="bi bi-search"></i>
            </span>
            <input
              className="form-control"
              placeholder="Search title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Book</th>
                <th>Category</th>
                <th>Availability</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && <EmptyRow colSpan={4} icon="bi-journal-x" text="No books found." />}
              {visible.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div className="fw-semibold">{b.title}</div>
                    <div className="text-muted small">{b.author}</div>
                  </td>
                  <td>
                    <span className="badge text-bg-light border">{b.category}</span>
                  </td>
                  <td style={{ minWidth: 160 }}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>{b.availableCopies} available</span>
                      <span className="text-muted">of {b.totalCopies}</span>
                    </div>
                    <div className="progress" style={{ height: 6 }}>
                      <div
                        className={`progress-bar ${b.availableCopies === 0 ? 'bg-danger' : ''}`}
                        style={{
                          width: `${b.totalCopies ? (b.availableCopies / b.totalCopies) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </td>
                  <td className="text-end text-nowrap">
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      title="Edit"
                      onClick={() => startEdit(b)}
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      title="Delete"
                      onClick={() => handleDelete(b)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deleteTarget && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="card shadow" style={{ maxWidth: 400, width: '90%' }}>
            <div className="card-body">
              <h6 className="fw-bold">Delete book?</h6>
              <p className="mb-3">Delete "{deleteTarget.title}"? This can't be undone.</p>
              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-outline-secondary" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={confirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}