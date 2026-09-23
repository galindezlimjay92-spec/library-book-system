import { useData } from '../../context/DataContext';

export default function History() {
  const { requests, session } = useData();
  const history = requests
    .filter((r) => r.studentId === session.id && (r.status === 'Returned' || r.status === 'Rejected'))
    .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

  return (
    <div>
      <h4 className="fw-bold mb-3">Borrowing History</h4>
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Book Title</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Return Date</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-4">
                    No history yet.
                  </td>
                </tr>
              )}
              {history.map((r) => (
                <tr key={r.id}>
                  <td>{r.bookTitle}</td>
                  <td>{new Date(r.requestDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${r.status === 'Returned' ? 'text-bg-secondary' : 'text-bg-danger'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>{r.returnDate ? new Date(r.returnDate).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
