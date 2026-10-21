import { useData } from '../../context/DataContext';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyRow from '../../components/EmptyRow';

export default function History() {
  const { requests, session } = useData();
  const history = requests
    .filter((r) => r.studentId === session.id && (r.status === 'Returned' || r.status === 'Rejected'))
    .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

  return (
    <div>
      <PageHeader title="Borrowing History" subtitle="Books you have returned or were rejected" />
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Return Date</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && <EmptyRow colSpan={4} icon="bi-clock-history" text="No history yet." />}
              {history.map((r) => (
                <tr key={r.id}>
                  <td>{r.bookTitle}</td>
                  <td>{new Date(r.requestDate).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge status={r.status} />
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
