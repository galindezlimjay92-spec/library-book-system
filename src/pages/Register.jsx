import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function Register() {
  const { registerStudent } = useData();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', studentId: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    try {
      registerStudent({
        name: form.name,
        studentId: form.studentId,
        email: form.email,
        password: form.password,
      });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-4">
      <div className="card shadow border-0" style={{ maxWidth: 460, width: '100%' }}>
        <div className="card-body p-4">
          <h4 className="fw-bold text-center mb-1">Student Registration</h4>
          <p className="text-center text-muted small mb-4">
            Create a student account to browse and borrow books.
          </p>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          {success && <div className="alert alert-success py-2 small">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small">Full Name</label>
              <input name="name" className="form-control" value={form.name} onChange={handleChange} required />
            </div>

            <div className="mb-3">
              <label className="form-label small">Student ID</label>
              <input
                name="studentId"
                className="form-control"
                value={form.studentId}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label small">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label small">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Register
            </button>
          </form>

          <p className="text-center small mt-3 mb-0">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
          <p className="text-center small mt-1 mb-0 text-muted">
            Admin accounts are managed separately.
          </p>
        </div>
      </div>
    </div>
  );
}
