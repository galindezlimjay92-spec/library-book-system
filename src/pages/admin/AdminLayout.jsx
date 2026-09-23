import { Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/books', label: 'Manage Books' },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/requests', label: 'Borrow Requests' },
  { to: '/admin/records', label: 'Lending Records' },
  { to: '/admin/reports', label: 'Reports' },
];

export default function AdminLayout() {
  return (
    <div>
      <Navbar links={links} />
      <div className="container-fluid p-4">
        <Outlet />
      </div>
    </div>
  );
}
