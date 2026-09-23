import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import loginBg from '../assets/login-bg.jpg';

export default function Login() {
  const { login, session, authError } = useData();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // A Google sign-in resolves asynchronously (role comes from Firestore via
  // the listener in DataContext), so redirect once that session shows up.
  useEffect(() => {
    if (session) navigate(session.role === 'admin' ? '/admin' : '/student');
  }, [session, navigate]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const sess = login({ ...form, role });
      navigate(sess.role === 'admin' ? '/admin' : '/student');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // Session + role are picked up by the onAuthStateChanged listener in
      // DataContext (from Firestore), and the effect above redirects once
      // it lands.
    } catch (err) {
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center justify-content-lg-end"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(6,10,20,0.15) 0%, rgba(6,10,20,0.55) 60%, rgba(6,10,20,0.75) 100%), url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        className="p-4"
        style={{
          maxWidth: 360,
          width: '100%',
          marginRight: 'clamp(16px, 3vw, 48px)',
          background: 'rgba(10, 16, 32, 0.72)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
          color: '#fff',
        }}
      >
        <i className="bi bi-journal-bookmark-fill fs-3 text-primary"></i>
        <h4 className="fw-bold mt-2 mb-1">Welcome Back!</h4>
        <p className="text-white-50 small mb-4">Sign in to your Library Book System account</p>

        <div className="btn-group w-100 mb-3" role="group">
          <button
            type="button"
            className={`btn btn-sm ${role === 'student' ? 'btn-primary' : 'btn-outline-light'}`}
            onClick={() => setRole('student')}
          >
            Student
          </button>
          <button
            type="button"
            className={`btn btn-sm ${role === 'admin' ? 'btn-primary' : 'btn-outline-light'}`}
            onClick={() => setRole('admin')}
          >
            Admin
          </button>
        </div>

        {(error || authError) && (
          <div className="alert alert-danger py-2 small">{error || authError}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-secondary text-white-50">
                <i className="bi bi-person"></i>
              </span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="form-control bg-transparent border-secondary text-white"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-secondary text-white-50">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="form-control bg-transparent border-secondary text-white"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3 small">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label className="form-check-label text-white-50" htmlFor="remember">
                Remember me
              </label>
            </div>
            <a href="#" className="text-primary text-decoration-none">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn btn-primary w-100 fw-semibold">
            Login <i className="bi bi-arrow-right ms-1"></i>
          </button>
        </form>

        <div className="d-flex align-items-center my-3">
          <hr className="flex-grow-1 border-secondary opacity-50" />
          <span className="px-2 small text-white-50">or</span>
          <hr className="flex-grow-1 border-secondary opacity-50" />
        </div>

        <button
          type="button"
          className="btn btn-light w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            width={18}
            height={18}
          />
          {googleLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <p className="text-center small mt-3 mb-0 text-white-50">
          No account yet?{' '}
          <Link to="/register" className="text-primary text-decoration-none">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
