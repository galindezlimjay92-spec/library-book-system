import { useData } from '../../context/DataContext';

function StatusBadge({ status }) {
  const map = {
    Pending: 'text-bg-warning',
    Approved: 'text-bg-success',
    Rejected: 'text-bg-danger',
    Returned: 'text-bg-secondary',
  };
  return <span className={`badge ${map[status] || 'text-bg-light'}`}>{status}</span>;
}

export default function MyRequests() {
  const { requests, session } = useData();
  const myRequests = requests
    .filter((r) => r.studentId === session.id)
    .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

  return (
    <div>
      <h4 className="fw-bold mb-3">My Requests</h4>
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Book Title</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-4">
                    No requests yet. Go browse available books!
                  </td>
                </tr>
              )}
              {myRequests.map((r) => (
                <tr key={r.id}>
                  <td>{r.bookTitle}</td>
                  <td>{new Date(r.requestDate).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
