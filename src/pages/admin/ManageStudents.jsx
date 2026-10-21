import { useData } from '../../context/DataContext';
import PageHeader from '../../components/PageHeader';
import EmptyRow from '../../components/EmptyRow';

export default function ManageStudents() {
  const { students, requests } = useData();

  function activeCount(studentId) {
    return requests.filter((r) => r.studentId === studentId && r.status === 'Approved').length;
  }

  return (
    <div>
      <PageHeader title="Registered Students" subtitle={`${students.length} student${students.length === 1 ? '' : 's'} registered`} />
      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Student ID</th>
                <th>Email</th>
                <th>Currently Borrowed</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <EmptyRow colSpan={4} icon="bi-people" text="No students registered yet." />
              )}
              {students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className="avatar avatar-soft">{s.name?.[0]?.toUpperCase()}</span>
                      <span className="fw-semibold">{s.name}</span>
                    </div>
                  </td>
                  <td>{s.studentId}</td>
                  <td>{s.email}</td>
                  <td>
                    <span className={`badge ${activeCount(s.id) > 0 ? 'text-bg-primary' : 'text-bg-light border'}`}>
                      {activeCount(s.id)}
                    </span>
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
