import { useState } from 'react';
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

export default function BorrowRequests() {
  const { requests, approveRequest, rejectRequest, markReturned } = useData();
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Pending');

  const filtered = requests
    .filter((r) => filter === 'All' || r.status === filter)
    .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

  function handleApprove(id) {
    setError('');
    try {
      approveRequest(id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Borrow Requests</h4>
        <select className="form-select w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          {['Pending', 'Approved', 'Rejected', 'Returned', 'All'].map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Student</th>
                <th>Book</th>
                <th>Requested On</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No requests found.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.studentName}</td>
                  <td>{r.bookTitle}</td>
                  <td>{new Date(r.requestDate).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}</td>
                  <td>
                    {r.status === 'Pending' && (
                      <>
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => handleApprove(r.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => rejectRequest(r.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {r.status === 'Approved' && (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => markReturned(r.id)}
                      >
                        Mark as Returned
                      </button>
                    )}
                    {(r.status === 'Rejected' || r.status === 'Returned') && (
                      <span className="text-muted small">No actions</span>
                    )}
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
