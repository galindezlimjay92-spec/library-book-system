import { useData } from '../../context/DataContext';

export default function LendingRecords() {
  const { requests } = useData();
  const records = [...requests].sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

  return (
    <div>
      <h4 className="fw-bold mb-3">Lending Records</h4>
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Student</th>
                <th>Book</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Return Date</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No records yet.
                  </td>
                </tr>
              )}
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.studentName}</td>
                  <td>{r.bookTitle}</td>
                  <td>{new Date(r.requestDate).toLocaleDateString()}</td>
                  <td>{r.status}</td>
                  <td>{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}</td>
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
