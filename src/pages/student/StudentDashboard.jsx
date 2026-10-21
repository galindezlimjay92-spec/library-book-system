import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import StatCard from '../../components/StatCard';

export default function StudentDashboard() {
  const { books, requests, session } = useData();

  const myRequests = requests.filter((r) => r.studentId === session.id);
  const totalAvailable = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const pending = myRequests.filter((r) => r.status === 'Pending').length;
  const approved = myRequests.filter((r) => r.status === 'Approved').length;

  const stats = [
    { label: 'Total Available Books', value: totalAvailable, icon: 'bi-journal-bookmark', color: 'primary' },
    { label: 'My Borrowed Books', value: approved, icon: 'bi-book', color: 'success' },
    { label: 'Pending Requests', value: pending, icon: 'bi-hourglass-split', color: 'warning' },
    { label: 'Total Requests Made', value: myRequests.length, icon: 'bi-list-check', color: 'secondary' },
  ];

  return (
    <div>
      <h4 className="fw-bold mb-1">Welcome, {session.name} 👋</h4>
      <p className="text-muted mb-4">Here's what's happening with your library account.</p>

      <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-4 mb-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-5">
          <i className="bi bi-search fs-1 text-primary"></i>
          <h5 className="fw-bold mt-3">Looking for something to read?</h5>
          <p className="text-muted">Browse the full catalog of available books.</p>
          <Link to="/student/books" className="btn btn-primary">
            Browse Available Books
          </Link>
        </div>
      </div>
    </div>
  );
}
