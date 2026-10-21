import { useData } from '../../context/DataContext';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyRow from '../../components/EmptyRow';

export default function LendingRecords() {
  const { requests } = useData();
  const records = [...requests].sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

  return (
    <div>
      <PageHeader title="Lending Records" subtitle="Full history of every borrow request" />
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
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
              {records.length === 0 && <EmptyRow colSpan={6} text="No records yet." />}
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.studentName}</td>
                  <td>{r.bookTitle}</td>
                  <td>{new Date(r.requestDate).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
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
