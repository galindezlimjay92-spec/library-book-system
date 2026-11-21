import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const DataContext = createContext(null);

const BASE_URL = 'https://library-book-system.onrender.com/api';
const API_URL = `${BASE_URL}/books`;
const LOGIN_URL = `${BASE_URL}/login`;
const REQUESTS_URL = `${BASE_URL}/requests`;
const STUDENTS_URL = `${BASE_URL}/students`;

const KEYS = {
  session: 'lbs_session',
};

// Old browser-only data from earlier versions (accounts with plain-text passwords)
const OLD_KEYS = ['lbs_students', 'lbs_admins', 'lbs_requests'];

// Admin accounts now live in Firestore (kept so older pages don't break)
const NO_ADMINS = [];

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

// Waits until Firebase knows who is logged in
function getCurrentUser() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// Adds the Firebase ID token so the backend can verify who is calling
async function authHeader() {
  const user = await getCurrentUser();

  if (!user) return {};

  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

// Calls the backend and throws an Error with the server's message if it fails
async function requestApi(url, options = {}) {
  const headers = { ...(options.headers || {}), ...(await authHeader()) };

  let res;

  try {
    res = await fetch(url, { ...options, headers });
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
      provider: sess.provider || 'google',
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

  // Books are public, so no token is needed
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

  // Requests need a logged-in user (admin gets all, student gets their own)
  async function syncRequests() {
    try {
      const data = await requestApi(REQUESTS_URL);

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

  // Student list is for admins only
  async function syncStudents() {
    try {
      const data = await requestApi(STUDENTS_URL);

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

  // When someone is logged in, load their requests and refresh every 15 seconds
  useEffect(() => {
    if (!session) {
      setRequests([]);
      return;
    }

    syncRequests();

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncRequests();
        syncSeedBooks();
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [session?.id]);

  // Admins also load the student list
  useEffect(() => {
    if (!isAdmin) {
      setStudents([]);
      return;
    }

    syncStudents();

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncStudents();
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [isAdmin, session?.id]);

  // Firebase Authentication Listener (Google and Email/Password)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setSession(null);
        setAuthChecking(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        // The person may have signed out while we were waiting
        if (auth.currentUser?.uid !== currentUser.uid) return;

        const saved = userSnap.exists() ? userSnap.data() : null;
        const role = saved?.role || 'student';

        if (!saved) {
          // First sign-in: create the profile (merge, so nothing saved elsewhere is lost)
          await setDoc(
            userRef,
            {
              ...(currentUser.displayName
                ? { displayName: currentUser.displayName }
                : {}),
              email: currentUser.email,
              photoURL: currentUser.photoURL || null,
              role: 'student',
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        if (auth.currentUser?.uid !== currentUser.uid) return;

        const isEmailAccount =
          currentUser.providerData?.[0]?.providerId === 'password';

        const sess = {
          role,
          id: currentUser.uid,
          name: saved?.displayName || currentUser.displayName || currentUser.email,
          email: currentUser.email,
          provider: isEmailAccount ? 'email' : 'google',
        };

        const previous = load(KEYS.session, null);

        if (!previous || previous.id !== sess.id) {
          reportLogin(sess);
        }

        setSession(sess);
        setAuthError('');
      } catch (err) {
        if (auth.currentUser?.uid !== currentUser.uid) return;

        console.error('Failed to load/create Firestore user profile:', err);
        setAuthError(
          err.message || 'Failed to load your account. Please try again.'
        );
      }

      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  async function logout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase sign-out:', err);
    }

    setSession(null);
  }

  // BOOK FUNCTIONS (adding, editing and deleting are admin-only on the server)

  function addBook(book) {
    const newBook = {
      ...book,
      id: book.id || genId('bk'),
      totalCopies: Number(book.totalCopies || 1),
      availableCopies: Number(book.totalCopies || 1),
    };

    setBooks((prev) => [...prev, newBook]);

    requestApi(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBook),
    })
      .then(() => syncSeedBooks())
      .catch((err) => {
        backendOffline(err);
        syncSeedBooks();
      });

    return newBook;
  }

  function updateBook(id, updates) {
    setBooks((prev) =>
      prev.map((b) => (String(b.id) === String(id) ? { ...b, ...updates } : b))
    );

    requestApi(`${API_URL}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
      .then(() => syncSeedBooks())
      .catch((err) => {
        backendOffline(err);
        syncSeedBooks();
      });
  }

  function deleteBook(id) {
    setBooks((prev) => prev.filter((b) => String(b.id) !== String(id)));

    requestApi(`${API_URL}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
      .then(() => syncSeedBooks())
      .catch((err) => {
        backendOffline(err);
        syncSeedBooks();
      });
  }

  // BORROW REQUEST FUNCTIONS (all saved in the online database)

  async function createBorrowRequest({ bookId }) {
    if (!session || session.role !== 'student') {
      throw new Error('Log in as a student first.');
    }

    const newRequest = await requestApi(REQUESTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId }),
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
    admins: NO_ADMINS,
    books,
    requests,
    session,
    authChecking,
    authError,

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