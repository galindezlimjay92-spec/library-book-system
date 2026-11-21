import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import loginBg from '../assets/login-bg.jpg';

function friendlyError(err) {
  switch (err.code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/operation-not-allowed':
      return 'Email sign-in is not enabled in Firebase yet.';
    default:
      return err.message;
  }
}

export default function Login() {
  const { session, authError } = useData();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // The role comes from Firestore via the listener in DataContext,
  // so redirect once the session shows up.
  useEffect(() => {
    if (session) navigate(session.role === 'admin' ? '/admin' : '/student');
  }, [session, navigate]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      // The listener in DataContext picks up the session and role
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundImage: `linear-gradient(rgba(6,10,20,0.35), rgba(6,10,20,0.6)), url(${loginBg})`,
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
        <p className="text-white-50 small mb-4">
          Sign in to your Library Book System account
        </p>

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

          <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={loading}>
            {loading ? (
              'Logging in...'
            ) : (
              <>
                Login <i className="bi bi-arrow-right ms-1"></i>
              </>
            )}
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