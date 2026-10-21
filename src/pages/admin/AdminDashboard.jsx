import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import StatCard from '../../components/StatCard';

export default function AdminDashboard() {
  const { books, students, requests, session } = useData();

  const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const pending = requests.filter((r) => r.status === 'Pending');
  const activeBorrows = requests.filter((r) => r.status === 'Approved').length;

  const stats = [
    { label: 'Total Books (titles)', value: books.length, icon: 'bi-journal-bookmark', color: 'primary' },
    { label: 'Total Copies', value: totalCopies, icon: 'bi-stack', color: 'info' },
    { label: 'Registered Students', value: students.length, icon: 'bi-people', color: 'secondary' },
    { label: 'Pending Requests', value: pending.length, icon: 'bi-hourglass-split', color: 'warning' },
    { label: 'Active Borrows', value: activeBorrows, icon: 'bi-book', color: 'success' },
  ];

  return (
    <div>
      <h4 className="fw-bold mb-1">Welcome, {session.name} 👋</h4>
      <p className="text-muted mb-4">Library overview and quick actions.</p>

      <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-5 mb-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white fw-semibold d-flex justify-content-between align-items-center">
          Pending Borrow Requests
          <Link to="/admin/requests" className="btn btn-sm btn-outline-primary">
            View All
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Student</th>
                <th>Book</th>
                <th>Requested On</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center text-muted py-4">
                    No pending requests.
                  </td>
                </tr>
              )}
              {pending.slice(0, 5).map((r) => (
                <tr key={r.id}>
                  <td>{r.studentName}</td>
                  <td>{r.bookTitle}</td>
                  <td>{new Date(r.requestDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
