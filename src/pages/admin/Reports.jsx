import { useData } from '../../context/DataContext';
import StatCard from '../../components/StatCard';
import PageHeader from '../../components/PageHeader';

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

  const STATUS_COLOR = { Pending: 'warning', Approved: 'success', Rejected: 'danger', Returned: 'secondary' };
  const totalReq = requests.length || 1; // avoid divide-by-zero

  const overdue = requests.filter(
    (r) => r.status === 'Approved' && new Date(r.dueDate) < new Date()
  );

  return (
    <div>
      <PageHeader title="Reports" subtitle="Library activity at a glance" />

      <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-4 mb-4">
        <StatCard label="Book Titles" value={books.length} icon="bi-journal-bookmark" color="primary" />
        <StatCard label="Registered Students" value={students.length} icon="bi-people" color="info" />
        <StatCard label="Copies Currently Out" value={totalBorrowed} icon="bi-box-arrow-up-right" color="warning" />
        <StatCard label="Overdue Books" value={overdue.length} icon="bi-exclamation-triangle" color="danger" />
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-header bg-white fw-semibold">Requests by Status</div>
            <div className="card-body">
              {byStatus.map((s) => (
                <div key={s.status} className="mb-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>{s.status}</span>
                    <strong>{s.count}</strong>
                  </div>
                  <div className="progress" style={{ height: 8 }}>
                    <div
                      className={`progress-bar bg-${STATUS_COLOR[s.status]}`}
                      style={{ width: `${(s.count / totalReq) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-header bg-white fw-semibold">Most Requested Books</div>
            <ul className="list-group list-group-flush">
              {mostRequested.length === 0 && (
                <li className="list-group-item text-muted">No data yet.</li>
              )}
              {mostRequested.map(([title, count], i) => (
                <li key={title} className="list-group-item d-flex justify-content-between">
                  <span>
                    <span className="badge text-bg-light me-2">{i + 1}</span>
                    {title}
                  </span>
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
