import { useData } from '../../context/DataContext';

export default function Reports() {
  const { books, students, requests } = useData();

  const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const totalAvailable = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const totalBorrowed = totalCopies - totalAvailable;

  const byStatus = ['Pending', 'Approved', 'Rejected', 'Returned'].map((status) => ({
    status,
    count: requests.filter((r) => r.status === status).length,
  }));

  const bookCounts = {};
  requests.forEach((r) => {
    bookCounts[r.bookTitle] = (bookCounts[r.bookTitle] || 0) + 1;
  });
  const mostRequested = Object.entries(bookCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const overdue = requests.filter(
    (r) => r.status === 'Approved' && new Date(r.dueDate) < new Date()
  );

  return (
    <div>
      <h4 className="fw-bold mb-3">Reports</h4>

      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm text-center p-3">
            <div className="fs-3 fw-bold">{books.length}</div>
            <div className="text-muted small">Book Titles</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm text-center p-3">
            <div className="fs-3 fw-bold">{students.length}</div>
            <div className="text-muted small">Registered Students</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm text-center p-3">
            <div className="fs-3 fw-bold">{totalBorrowed}</div>
            <div className="text-muted small">Copies Currently Out</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm text-center p-3">
            <div className="fs-3 fw-bold text-danger">{overdue.length}</div>
            <div className="text-muted small">Overdue Books</div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-semibold">Requests by Status</div>
            <ul className="list-group list-group-flush">
              {byStatus.map((s) => (
                <li key={s.status} className="list-group-item d-flex justify-content-between">
                  {s.status}
                  <span className="fw-bold">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-semibold">Most Requested Books</div>
            <ul className="list-group list-group-flush">
              {mostRequested.length === 0 && (
                <li className="list-group-item text-muted">No data yet.</li>
              )}
              {mostRequested.map(([title, count]) => (
                <li key={title} className="list-group-item d-flex justify-content-between">
                  {title}
                  <span className="fw-bold">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
