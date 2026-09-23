import { useData } from '../../context/DataContext';

export default function ManageStudents() {
  const { students, requests } = useData();

  function activeCount(studentId) {
    return requests.filter((r) => r.studentId === studentId && r.status === 'Approved').length;
  }

  return (
    <div>
      <h4 className="fw-bold mb-3">Registered Students</h4>
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Student ID</th>
                <th>Email</th>
                <th>Currently Borrowed</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-4">
                    No students registered yet.
                  </td>
                </tr>
              )}
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.studentId}</td>
                  <td>{s.email}</td>
                  <td>{activeCount(s.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
