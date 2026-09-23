import { Navigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function ProtectedRoute({ role, children }) {
  const { session } = useData();

  if (!session) return <Navigate to="/login" replace />;
  if (role && session.role !== role) {
    return <Navigate to={session.role === 'admin' ? '/admin' : '/student'} replace />;
  }
  return children;
}
