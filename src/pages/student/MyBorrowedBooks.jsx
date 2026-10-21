import { useData } from '../../context/DataContext';
import PageHeader from '../../components/PageHeader';

export default function MyBorrowedBooks() {
  const { requests, session } = useData();
  const borrowed = requests
    .filter((r) => r.studentId === session.id && r.status === 'Approved')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  function daysLeft(dueDate) {
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  return (
    <div>
      <PageHeader title="My Borrowed Books" subtitle="Keep an eye on your due dates" />

      {borrowed.length === 0 ? (
        <div className="card">
          <div className="card-body text-center text-muted py-5">
            <i className="bi bi-book fs-1 d-block mb-2 opacity-50"></i>
            You have no borrowed books right now.
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {borrowed.map((r) => {
            const left = daysLeft(r.dueDate);
            const overdue = left < 0;
            return (
              <div className="col-sm-6 col-lg-4" key={r.id}>
                <div className={`card h-100 hover-lift ${overdue ? 'border-danger border' : ''}`}>
                  <div className="card-body">
                    <h6 className="fw-bold">{r.bookTitle}</h6>
                    <p className="small text-muted mb-1">
                      Borrowed: {new Date(r.requestDate).toLocaleDateString()}
                    </p>
                    <p className="small text-muted mb-2">
                      Due: {new Date(r.dueDate).toLocaleDateString()}
                    </p>
                    <span className={`badge ${overdue ? 'text-bg-danger' : 'text-bg-success'}`}>
                      {overdue ? `Overdue by ${Math.abs(left)} day(s)` : `${left} day(s) left`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
