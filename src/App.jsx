import { Navigate, Route, Routes } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import BrowseBooks from './pages/student/BrowseBooks';
import MyRequests from './pages/student/MyRequests';
import MyBorrowedBooks from './pages/student/MyBorrowedBooks';
import History from './pages/student/History';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageBooks from './pages/admin/ManageBooks';
import ManageStudents from './pages/admin/ManageStudents';
import BorrowRequests from './pages/admin/BorrowRequests';
import LendingRecords from './pages/admin/LendingRecords';
import Reports from './pages/admin/Reports';

function RootRedirect() {
  const { session } = useData();
  if (!session) return <Landing />;
  return <Navigate to={session.role === 'admin' ? '/admin' : '/student'} replace />;
}

function AppRoutes() {
  const { authChecking } = useData();

  // Firebase checks (on refresh) whether a Google session is already
  // active before we know which page to show — avoid flashing Login/Landing
  // for a signed-in user while that check is in flight.
  if (authChecking) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="books" element={<BrowseBooks />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="borrowed" element={<MyBorrowedBooks />} />
        <Route path="history" element={<History />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="books" element={<ManageBooks />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="requests" element={<BorrowRequests />} />
        <Route path="records" element={<LendingRecords />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppRoutes />
    </DataProvider>
  );
}
