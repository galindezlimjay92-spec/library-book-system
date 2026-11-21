import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

function friendlyError(err) {
  switch (err.code) {
    case 'auth/email-already-in-use':
      return 'Email is already registered.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email sign-up is not enabled in Firebase yet.';
    default:
      return err.message;
  }
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', studentId: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      await updateProfile(cred.user, { displayName: form.name.trim() });

      // Save the profile and role in Firestore (every new account is a student)
      await setDoc(
        doc(db, 'users', cred.user.uid),
        {
          displayName: form.name.trim(),
          email: cred.user.email,
          photoURL: null,
          role: 'student',
          studentId: form.studentId.trim(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Sign out so the person logs in fresh and their name and role load properly
      await signOut(auth);

      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg min-vh-100 d-flex align-items-center justify-content-center p-3">
      <div className="card shadow-lg" style={{ maxWidth: 460, width: '100%' }}>
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
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
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