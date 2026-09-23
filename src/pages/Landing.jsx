import { Link } from 'react-router-dom';
import loginBg from '../assets/login-bg.jpg';

const FEATURES = [
  {
    icon: 'bi-search',
    title: 'Browse & Search',
    text: 'Explore the full catalog, filter by category, and check real-time copy availability.',
  },
  {
    icon: 'bi-journal-check',
    title: 'Request to Borrow',
    text: 'Send a borrow request in one click and track its status from Pending to Approved.',
  },
  {
    icon: 'bi-clock-history',
    title: 'Stay on Track',
    text: 'See due dates, borrowed books, and your full borrowing history in one dashboard.',
  },
  {
    icon: 'bi-speedometer2',
    title: 'Admin Control',
    text: 'Librarians manage books, students, requests, and lending records from a single panel.',
  },
];

export default function Landing() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Hero */}
      <div
        className="d-flex align-items-center"
        style={{
          minHeight: '78vh',
          backgroundImage: `linear-gradient(90deg, rgba(6,10,20,0.35) 0%, rgba(6,10,20,0.65) 55%, rgba(6,10,20,0.85) 100%), url(${loginBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container py-5">
          <div className="row">
            <div className="col-lg-7 col-xl-6 text-white">
              <div className="d-inline-flex align-items-center gap-2 mb-3 px-3 py-2 rounded-pill" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <i className="bi bi-journal-bookmark-fill text-primary"></i>
                <span className="small fw-semibold">Library Book System</span>
              </div>
              <h1 className="fw-bold display-5 mb-3">
                Borrow smarter. Manage easier.
              </h1>
              <p className="text-white-50 fs-5 mb-4">
                A simple online platform for browsing books, requesting to borrow,
                and tracking due dates — with a dedicated dashboard for librarians
                to manage it all.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/login" className="btn btn-primary btn-lg px-4 fw-semibold">
                  Login <i className="bi bi-arrow-right ms-1"></i>
                </Link>
                <Link to="/register" className="btn btn-outline-light btn-lg px-4 fw-semibold">
                  Create an Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container py-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold">Everything you need, in one place</h2>
          <p className="text-muted">Built for students and administrators alike.</p>
        </div>
        <div className="row g-4">
          {FEATURES.map((f) => (
            <div className="col-6 col-lg-3" key={f.title}>
              <div className="p-4 h-100 text-center border rounded-4 bg-white">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mb-3"
                  style={{ width: 56, height: 56 }}
                >
                  <i className={`bi ${f.icon} fs-4 text-primary`}></i>
                </div>
                <h6 className="fw-bold mb-2">{f.title}</h6>
                <p className="text-muted small mb-0">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-dark text-white py-4 mt-auto">
        <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3">
          <span className="text-white-50 small">
            &copy; {new Date().getFullYear()} Library Book System. All rights reserved.
          </span>
          <div className="d-flex gap-2">
            <Link to="/login" className="btn btn-sm btn-primary">Login</Link>
            <Link to="/register" className="btn btn-sm btn-outline-light">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
