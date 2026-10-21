import AppShell from '../../components/AppShell';

const links = [
  { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
  { to: '/admin/books', label: 'Manage Books', icon: 'bi-journal-bookmark' },
  { to: '/admin/students', label: 'Students', icon: 'bi-people' },
  { to: '/admin/requests', label: 'Borrow Requests', icon: 'bi-arrow-left-right' },
  { to: '/admin/records', label: 'Lending Records', icon: 'bi-card-list' },
  { to: '/admin/reports', label: 'Reports', icon: 'bi-bar-chart-line' },
];

export default function AdminLayout() {
  return <AppShell links={links} subtitle="Admin Panel" />;
}
