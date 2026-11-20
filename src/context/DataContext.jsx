import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const DataContext = createContext(null);

const BASE_URL = 'https://library-book-system.onrender.com/api';
const API_URL = `${BASE_URL}/books`;
const LOGIN_URL = `${BASE_URL}/login`;
const REQUESTS_URL = `${BASE_URL}/requests`;
const REGISTER_URL = `${BASE_URL}/register`;
const AUTH_LOGIN_URL = `${BASE_URL}/auth/login`;
const STUDENTS_URL = `${BASE_URL}/students`;

const KEYS = {
  session: 'lbs_session',
};

// Old browser-only data (including plain-text passwords) that is no longer used
const OLD_KEYS = ['lbs_students', 'lbs_admins', 'lbs_requests'];

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Local storage error:', err);
  }
}

function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function backendOffline(err) {
  console.error('Backend sync error:', err);
}

// Calls the backend and throws an Error with the server's message if it fails
async function requestApi(url, options) {
  let res;

  try {
    res = await fetch(url, options);
  } catch {
    throw new Error('Cannot reach the server. Please try again in a moment.');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data;
}

function reportLogin(sess) {
  fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: sess.name,
      email: sess.email,
      role: sess.role,
      provider: sess.provider || 'email',
    }),
  }).catch(backendOffline);
}

export function DataProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [session, setSession] = useState(() => load(KEYS.session, null));

  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');

  // Admin accounts now live in the database (kept so older pages don't break)
  const admins = [];

  const isAdmin = session?.role === 'admin';

  // Remove old browser-only data that had plain-text passwords
  useEffect(() => {
    try {
      OLD_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch (err) {
      console.error('Local storage error:', err);
    }
  }, []);

  useEffect(() => {
    if (session) save(KEYS.session, session);
    else localStorage.removeItem(KEYS.session);
  }, [session]);

  // Load books from online Express API
  async function syncSeedBooks() {
    try {
      const res = await fetch(API_URL);

      if (!res.ok) {
        throw new Error(`Books API error: ${res.status}`);
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid books response from backend.');
      }

      setBooks(
        data.map((book) => ({
          ...book,
          totalCopies: Number(book.totalCopies ?? 0),
          availableCopies: Number(
            book.availableCopies ?? book.totalCopies ?? 0
          ),
        }))
      );

      return data;
    } catch (err) {
      backendOffline(err);
      return [];
    }
  }

  // Load borrow requests from online Express API
  async function syncRequests() {
    try {
      const res = await fetch(REQUESTS_URL);

      if (!res.ok) {
        throw new Error(`Requests API error: ${res.status}`);
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid requests response from backend.');
      }

      setRequests(data);
      return data;
    } catch (err) {
      backendOffline(err);
      return [];
    }
  }

  // Load registered students from online Express API (for the admin)
  async function syncStudents() {
    try {
      const res = await fetch(STUDENTS_URL);

      if (!res.ok) {
        throw new Error(`Students API error: ${res.status}`);
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid students response from backend.');
      }

      setStudents(data);
      return data;
    } catch (err) {
      backendOffline(err);
      return [];
    }
  }

  useEffect(() => {
    syncSeedBooks();
  }, []);

  // Load requests now, then refresh every 15 seconds so other devices stay in sync
  useEffect(() => {
    syncRequests();

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncRequests();
        syncSeedBooks();
      }
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  // Admins also load the student list, and keep it fresh
  useEffect(() => {
    if (!isAdmin) return;

    syncStudents();

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncStudents();
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [isAdmin]);

  // Firebase / Google Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setAuthChecking(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        let role;

        if (userSnap.exists()) {
          role = userSnap.data().role || 'student';
        } else {
          role = 'student';

          await setDoc(userRef, {
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            role,
            createdAt: serverTimestamp(),
          });
        }

        const sess = {
          role,
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email,
          email: currentUser.email,
          provider: 'google',
        };

        const previous = load(KEYS.session, null);

        if (!previous || previous.id !== sess.id) {
          reportLogin(sess);
        }

        setSession(sess);
        setAuthError('');
      } catch (err) {
        console.error('Failed to load/create Firestore user profile:', err);
        setAuthError(
          err.message || 'Failed to load your account. Please try again.'
        );
      }

      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // AUTH FUNCTIONS (accounts are saved in the online database)

  async function registerStudent({ name, studentId, email, password }) {
    const user = await requestApi(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'student',
        name,
        studentId,
        email,
        password,
      }),
    });

    return user;
  }

  async function registerAdmin({ name, email, password }) {
    const user = await requestApi(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'admin',
        name,
        email,
        password,
      }),
    });

    return user;
  }

  async function login({ email, password, role }) {
    const user = await requestApi(AUTH_LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });

    const sess = {
      role: user.role,
      id: user.id,
      name: user.name,
      email: user.email,
      provider: 'email',
    };

    setSession(sess);
    reportLogin(sess);
    return sess;
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase sign-out:', err);
    }

    setSession(null);
  }

  // BOOK FUNCTIONS

  function addBook(book) {
    const newBook = {
      ...book,
      id: book.id || genId('bk'),
      totalCopies: Number(book.totalCopies || 1),
      availableCopies: Number(book.totalCopies || 1),
    };

    setBooks((prev) => [...prev, newBook]);

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBook),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Add book failed: ${res.status}`);
        return res.json().catch(() => null);
      })
      .then(() => syncSeedBooks())
      .catch(backendOffline);

    return newBook;
  }

  function updateBook(id, updates) {
    setBooks((prev) =>
      prev.map((b) => (String(b.id) === String(id) ? { ...b, ...updates } : b))
    );

    fetch(`${API_URL}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Update book failed: ${res.status}`);
        return syncSeedBooks();
      })
      .catch(backendOffline);
  }

  function deleteBook(id) {
    setBooks((prev) => prev.filter((b) => String(b.id) !== String(id)));

    fetch(`${API_URL}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Delete book failed: ${res.status}`);
        return syncSeedBooks();
      })
      .catch(backendOffline);
  }

  // BORROW REQUEST FUNCTIONS (all saved in the online database)

  async function createBorrowRequest({ bookId }) {
    if (!session || session.role !== 'student') {
      throw new Error('Log in as a student first.');
    }

    const newRequest = await requestApi(REQUESTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: session.id,
        studentName: session.name,
        bookId,
      }),
    });

    await syncRequests();
    return newRequest;
  }

  async function approveRequest(requestId) {
    const updated = await requestApi(
      `${REQUESTS_URL}/${encodeURIComponent(requestId)}/approve`,
      { method: 'PUT' }
    );

    await Promise.all([syncRequests(), syncSeedBooks()]);
    return updated;
  }

  async function rejectRequest(requestId) {
    const updated = await requestApi(
      `${REQUESTS_URL}/${encodeURIComponent(requestId)}/reject`,
      { method: 'PUT' }
    );

    await syncRequests();
    return updated;
  }

  async function markReturned(requestId) {
    const updated = await requestApi(
      `${REQUESTS_URL}/${encodeURIComponent(requestId)}/return`,
      { method: 'PUT' }
    );

    await Promise.all([syncRequests(), syncSeedBooks()]);
    return updated;
  }

  // CONTEXT VALUES
  const value = {
    students,
    admins,
    books,
    requests,
    session,
    authChecking,
    authError,

    registerStudent,
    registerAdmin,
    login,
    logout,

    addBook,
    updateBook,
    deleteBook,
    syncSeedBooks,
    syncRequests,
    syncStudents,

    createBorrowRequest,
    approveRequest,
    rejectRequest,
    markReturned,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error('useData must be used inside a DataProvider');
  }

  return context;
}