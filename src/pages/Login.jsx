import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import loginBg from '../assets/login-bg.jpg';

export default function Login() {
  const { session, authError } = useData();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // The role comes from Firestore via the listener in DataContext,
  // so redirect once the session shows up.
  useEffect(() => {
    if (session) navigate(session.role === 'admin' ? '/admin' : '/student');
  }, [session, navigate]);

  async function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
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
          Students and admins both sign in with Google. Your role is assigned
          by the library.
        </p>
      </div>
    </div>
  );
}