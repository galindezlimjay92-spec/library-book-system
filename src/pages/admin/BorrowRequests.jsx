import { useState } from 'react';
import { useData } from '../../context/DataContext';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyRow from '../../components/EmptyRow';

const FILTERS = ['Pending', 'Approved', 'Rejected', 'Returned', 'All'];

export default function BorrowRequests() {
  const { requests, approveRequest, rejectRequest, markReturned } = useData();
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Pending');

  const countOf = (f) =>
    f === 'All' ? requests.length : requests.filter((r) => r.status === f).length;
  const isOverdue = (r) =>
    r.status === 'Approved' && r.dueDate && new Date(r.dueDate) < new Date();

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
      <PageHeader title="Borrow Requests" subtitle="Approve, reject, or mark books as returned" />

      <div className="d-flex flex-wrap gap-2 mb-3">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`btn btn-sm rounded-pill ${filter === f ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f} <span className="badge text-bg-light ms-1">{countOf(f)}</span>
          </button>
        ))}
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
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
              {filtered.length === 0 && <EmptyRow colSpan={6} text="No requests found." />}
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className="avatar avatar-soft">{r.studentName?.[0]?.toUpperCase()}</span>
                      {r.studentName}
                    </div>
                  </td>
                  <td>{r.bookTitle}</td>
                  <td>{new Date(r.requestDate).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className={isOverdue(r) ? 'text-danger fw-semibold' : ''}>
                    {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}
                    {isOverdue(r) && (
                      <i className="bi bi-exclamation-triangle-fill ms-1" title="Overdue"></i>
                    )}
                  </td>
                  <td>
                    {r.status === 'Pending' && (
                      <>
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => handleApprove(r.id)}
                        >
                          <i className="bi bi-check-lg me-1"></i>Approve
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => rejectRequest(r.id)}
                        >
                          <i className="bi bi-x-lg me-1"></i>Reject
                        </button>
                      </>
                    )}
                    {r.status === 'Approved' && (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => markReturned(r.id)}
                      >
                        <i className="bi bi-box-arrow-in-down me-1"></i>Mark as Returned
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
