import { NavLink, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function Navbar({ links }) {
  const { session, logout } = useData();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: '#20336b' }}>
      <div className="container-fluid">
        <span className="navbar-brand fw-bold">
          <i className="bi bi-book-half me-2"></i>Library Book System
        </span>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {links.map((link) => (
              <li className="nav-item" key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    'nav-link' + (isActive ? ' active fw-semibold text-white' : ' text-white-50')
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <span className="navbar-text text-white-50 me-3 small">
            {session?.name} ({session?.role})
          </span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
