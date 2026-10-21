import AppShell from '../../components/AppShell';

const links = [
  { to: '/student', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
  { to: '/student/books', label: 'Browse Books', icon: 'bi-journal-bookmark' },
  { to: '/student/requests', label: 'My Requests', icon: 'bi-inbox' },
  { to: '/student/borrowed', label: 'My Borrowed Books', icon: 'bi-book' },
  { to: '/student/history', label: 'History', icon: 'bi-clock-history' },
];

export default function StudentLayout() {
  return <AppShell links={links} subtitle="Student Portal" />;
}
