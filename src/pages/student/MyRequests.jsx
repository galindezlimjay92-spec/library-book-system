import { useData } from '../../context/DataContext';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyRow from '../../components/EmptyRow';

export default function MyRequests() {
  const { requests, session } = useData();
  const myRequests = requests
    .filter((r) => r.studentId === session.id)
    .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

  return (
    <div>
      <PageHeader title="My Requests" subtitle="Track the status of your borrow requests" />
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.length === 0 && (
                <EmptyRow colSpan={4} text="No requests yet. Go browse available books!" />
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
