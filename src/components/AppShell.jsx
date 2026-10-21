import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function AppShell({ links, subtitle }) {
  const { session, logout } = useData();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false); // mobile drawer

  // close the mobile drawer whenever the page changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const logo = `${import.meta.env.BASE_URL}icon-192.png`;

  return (
    <div>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src={logo} alt="" className="sidebar-logo" />
          <div className="fw-bold">Library System</div>
          <div className="small text-white-50">{subtitle}</div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <i className={`bi ${link.icon}`}></i>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="d-flex align-items-center gap-2 px-2 mb-2">
            <span className="avatar">{session?.name?.[0]?.toUpperCase()}</span>
            <div className="lh-1" style={{ minWidth: 0 }}>
              <div className="small fw-semibold text-truncate">{session?.name}</div>
              <div className="text-white-50 text-capitalize" style={{ fontSize: '0.7rem' }}>
                {session?.role}
              </div>
            </div>
          </div>
          <button className="sidebar-link" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)}></div>}

      <div className="app-content">
        <header className="topbar">
          <button
            className="btn btn-light border"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <i className="bi bi-list fs-5"></i>
          </button>
          <span className="fw-bold">Library System</span>
        </header>

        <main className="p-3 p-md-4">
          <div key={pathname} className="page-wrap page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
