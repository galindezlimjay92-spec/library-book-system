import { Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const links = [
  { to: '/student', label: 'Dashboard', end: true },
  { to: '/student/books', label: 'Browse Books' },
  { to: '/student/requests', label: 'My Requests' },
  { to: '/student/borrowed', label: 'My Borrowed Books' },
  { to: '/student/history', label: 'History' },
];

export default function StudentLayout() {
  return (
    <div>
      <Navbar links={links} />
      <div className="container-fluid p-4">
        <Outlet />
      </div>
    </div>
  );
}
