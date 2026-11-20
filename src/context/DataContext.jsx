
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const DataContext = createContext(null);

const API_URL = 'https://library-book-system.onrender.com/api/books';
const LOGIN_URL = 'https://library-book-system.onrender.com/api/login';

const KEYS = {
  students: 'lbs_students',
  admins: 'lbs_admins',
  requests: 'lbs_requests',
  session: 'lbs_session',
};

const DEFAULT_ADMIN = {
  id: 'adm-default',
  name: 'Library Admin',
  email: 'admin@library.com',
  password: 'admin123',
};

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
  const [students, setStudents] = useState(() => load(KEYS.students, []));

  const [admins, setAdmins] = useState(() => {
    const stored = load(KEYS.admins, [DEFAULT_ADMIN]);

    const hasDefault = stored.some(
      (a) => a.email?.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase()
    );

    return hasDefault ? stored : [DEFAULT_ADMIN, ...stored];
  });

  const [books, setBooks] = useState([]);
  const [requests, setRequests] = useState(() => load(KEYS.requests, []));
  const [session, setSession] = useState(() => load(KEYS.session, null));

  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');

  // Save local data
  useEffect(() => save(KEYS.students, students), [students]);
  useEffect(() => save(KEYS.admins, admins), [admins]);
  useEffect(() => save(KEYS.requests, requests), [requests]);

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

  useEffect(() => {
    syncSeedBooks();
  }, []);

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

        if (role === 'student') {
          setStudents((prev) =>
            prev.some(
              (s) =>
                s.email &&
                s.email.toLowerCase() === currentUser.email?.toLowerCase()
            )
              ? prev
              : [
                  ...prev,
                  {
                    id: currentUser.uid,
                    name: currentUser.displayName || currentUser.email,
                    studentId: `google-${currentUser.uid.slice(0, 6)}`,
                    email: currentUser.email,
                    password: null,
                    provider: 'google',
                  },
                ]
          );
        }
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

  // AUTH FUNCTIONS

  function registerStudent({ name, studentId, email, password }) {
    if (
      students.some(
        (s) => s.email?.toLowerCase() === email.toLowerCase()
      )
    ) {
      throw new Error('Email is already registered.');
    }

    const newStudent = {
      id: genId('stu'),
      name,
      studentId,
      email,
      password,
      provider: 'email',
    };

    setStudents((prev) => [...prev, newStudent]);
    return newStudent;
  }

  function registerAdmin({ name, email, password }) {
    if (
      admins.some(
        (a) => a.email?.toLowerCase() === email.toLowerCase()
      )
    ) {
      throw new Error('Email is already registered.');
    }

    const newAdmin = {
      id: genId('adm'),
      name,
      email,
      password,
    };

    setAdmins((prev) => [...prev, newAdmin]);
    return newAdmin;
  }

  function login({ email, password, role }) {
    const list = role === 'admin' ? admins : students;

    const user = list.find(
      (u) =>
        u.email?.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const sess = {
      role,
      id: user.id,
      name: user.name,
      email: user.email,
      provider: user.provider || 'email',
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

  // BORROW REQUEST FUNCTIONS

  function createBorrowRequest({ bookId }) {
    if (!session || session.role !== 'student') {
      throw new Error('Log in as a student first.');
    }

    const book = books.find((b) => String(b.id) === String(bookId));

    if (!book || Number(book.availableCopies) < 1) {
      throw new Error('This book is not available right now.');
    }

    const alreadyPending = requests.some(
      (r) =>
        String(r.studentId) === String(session.id) &&
        String(r.bookId) === String(bookId) &&
        (r.status === 'Pending' || r.status === 'Approved')
    );

    if (alreadyPending) {
      throw new Error(
        'You already have a request or an active borrow for this book.'
      );
    }

    const newRequest = {
      id: genId('req'),
      studentId: session.id,
      studentName: session.name,
      bookId: book.id,
      bookTitle: book.title,
      requestDate: new Date().toISOString(),
      status: 'Pending',
      dueDate: null,
      returnDate: null,
    };

    setRequests((prev) => [...prev, newRequest]);
    return newRequest;
  }

  function approveRequest(requestId) {
    const request = requests.find((r) => r.id === requestId);

    if (!request) throw new Error('Borrow request not found.');
    if (request.status !== 'Pending') {
      throw new Error('This request is no longer pending.');
    }

    const book = books.find((b) => String(b.id) === String(request.bookId));

    if (!book || Number(book.availableCopies) < 1) {
      throw new Error('No available copies for this book.');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'Approved',
              dueDate: dueDate.toISOString(),
            }
          : r
      )
    );

    setBooks((prev) =>
      prev.map((b) =>
        String(b.id) === String(request.bookId)
          ? { ...b, availableCopies: Math.max(0, Number(b.availableCopies) - 1) }
          : b
      )
    );

    return request;
  }

  function rejectRequest(requestId) {
    const request = requests.find((r) => r.id === requestId);

    if (!request) throw new Error('Borrow request not found.');

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: 'Rejected' }
          : r
      )
    );

    return request;
  }

  function markReturned(requestId) {
    const request = requests.find((r) => r.id === requestId);

    if (!request) throw new Error('Borrow record not found.');
    if (request.status !== 'Approved') {
      throw new Error('This book is not currently borrowed.');
    }

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'Returned',
              returnDate: new Date().toISOString(),
            }
          : r
      )
    );

    setBooks((prev) =>
      prev.map((b) =>
        String(b.id) === String(request.bookId)
          ? { ...b, availableCopies: Number(b.availableCopies) + 1 }
          : b
      )
    );

    return request;
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
