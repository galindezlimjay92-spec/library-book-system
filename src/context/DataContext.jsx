import { createContext, useContext, useEffect, useState } from 'react';
import { seedBooks } from '../data/seedBooks';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const DataContext = createContext(null);

const KEYS = {
  students: 'lbs_students',
  admins: 'lbs_admins',
  books: 'lbs_books',
  requests: 'lbs_requests',
  session: 'lbs_session',
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
  localStorage.setItem(key, JSON.stringify(value));
}

function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

const DEFAULT_ADMIN = {
  id: 'adm-default',
  name: 'Library Admin',
  email: 'admin@library.com',
  password: 'admin123',
};

export function DataProvider({ children }) {
  const [students, setStudents] = useState(() => load(KEYS.students, []));
  const [admins, setAdmins] = useState(() => {
    const stored = load(KEYS.admins, [DEFAULT_ADMIN]);
    // Make sure the default admin always exists, even if this browser
    // already had an (older, admin-less) copy of the data saved.
    const hasDefault = stored.some((a) => a.email.toLowerCase() === DEFAULT_ADMIN.email);
    return hasDefault ? stored : [DEFAULT_ADMIN, ...stored];
  });
  const [books, setBooks] = useState(() => load(KEYS.books, seedBooks));
  const [requests, setRequests] = useState(() => load(KEYS.requests, []));
  const [session, setSession] = useState(() => load(KEYS.session, null));
  // True until we've checked whether a Google/Firebase session is already
  // active (e.g. after a page refresh). Gates the initial render in App.jsx
  // so we don't flash the Login page before restoring that session.
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => save(KEYS.students, students), [students]);
  useEffect(() => save(KEYS.admins, admins), [admins]);
  useEffect(() => save(KEYS.books, books), [books]);
  useEffect(() => save(KEYS.requests, requests), [requests]);
  useEffect(() => {
    if (session) save(KEYS.session, session);
    else localStorage.removeItem(KEYS.session);
  }, [session]);

  // Watch Firebase Auth for Google sign-ins/sign-outs and keep `session` in
  // sync with each user's role, which now lives in Firestore (users/{uid})
  // instead of being picked from a UI toggle. New Google users default to
  // 'student'; to make someone an admin, set role: 'admin' on their
  // users/{uid} document in the Firestore console.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // No Firebase user — leave any local (email/password) session as-is.
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
        setSession(sess);
        setAuthError('');

        // Keep the student roster (used by Manage Students / borrow requests)
        // in sync so a Google-signed-in student shows up there too.
        if (role === 'student') {
          setStudents((prev) =>
            prev.some((s) => s.email.toLowerCase() === currentUser.email.toLowerCase())
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
        // Most commonly a Firestore rules issue (e.g. permission-denied).
        // Surface it instead of failing silently, so Login.jsx can show it.
        console.error('Failed to load/create Firestore user profile:', err);
        setAuthError(err.message || 'Failed to load your account. Please try again.');
      }

      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // ---------- Auth ----------
  function registerStudent({ name, studentId, email, password }) {
    if (students.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email is already registered.');
    }
    const newStudent = { id: genId('stu'), name, studentId, email, password };
    setStudents((prev) => [...prev, newStudent]);
    return newStudent;
  }

  function registerAdmin({ name, email, password }) {
    // Admin accounts are provisioned by the system, not self-registered.
    // Kept here only in case a future authorized admin-management screen needs it.
    if (admins.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email is already registered.');
    }
    const newAdmin = { id: genId('adm'), name, email, password };
    setAdmins((prev) => [...prev, newAdmin]);
    return newAdmin;
  }

  function login({ email, password, role }) {
    const list = role === 'admin' ? admins : students;
    const user = list.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) throw new Error('Invalid email or password.');
    const sess = { role, id: user.id, name: user.name, email: user.email };
    setSession(sess);
    return sess;
  }

  async function logout() {
    // Sign out of Firebase too, in case this was a Google session — safe
    // to call even for local email/password sessions (no-op if no Firebase
    // user is signed in).
    try {
      await signOut(auth);
    } catch {
      // ignore — falls through to clearing local session regardless
    }
    setSession(null);
  }

  // Google Sign-In (Firebase Auth) — just opens the popup. Role/session are
  // then set automatically by the onAuthStateChanged listener above, which
  // reads (or creates) the user's role from Firestore.

  // ---------- Books ----------
  function addBook(book) {
    const newBook = {
      id: genId('bk'),
      availableCopies: Number(book.totalCopies),
      ...book,
      totalCopies: Number(book.totalCopies),
    };
    setBooks((prev) => [...prev, newBook]);

    // Also send it to the Express server (port 8080) so it shows up there
    // too. This is optional/best-effort — if the server isn't running,
    // the book still gets added to the app normally above.
    fetch('http://localhost:8080/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book),
    }).catch((err) => {
      console.error('Could not sync to backend server (is node server.js running?):', err);
    });
  }

  function updateBook(id, updates) {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  }

  function deleteBook(id) {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  // Adds any books from the seed catalog (src/data/seedBooks.js) that
  // aren't in the current list yet, matched by id. Existing books (and any
  // edits made to them) are left untouched — this only fills in new ones.
  function syncSeedBooks() {
    setBooks((prev) => {
      const existingIds = new Set(prev.map((b) => b.id));
      const missing = seedBooks.filter((b) => !existingIds.has(b.id));
      return [...prev, ...missing];
    });
  }

  // ---------- Borrow Requests ----------
  function createBorrowRequest({ bookId }) {
    if (!session || session.role !== 'student') throw new Error('Log in as a student first.');
    const book = books.find((b) => b.id === bookId);
    if (!book || book.availableCopies < 1) throw new Error('This book is not available right now.');

    const alreadyPending = requests.some(
      (r) => r.studentId === session.id && r.bookId === bookId && (r.status === 'Pending' || r.status === 'Approved')
    );
    if (alreadyPending) throw new Error('You already have a request or an active borrow for this book.');

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
    setRequests((prev) => [newRequest, ...prev]);
  }

  function approveRequest(requestId) {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const book = books.find((b) => b.id === req.bookId);
    if (!book || book.availableCopies < 1) throw new Error('No available copies left.');

    updateBook(book.id, { availableCopies: book.availableCopies - 1 });

    const due = new Date();
    due.setDate(due.getDate() + 7);

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'Approved', dueDate: due.toISOString() } : r
      )
    );
  }

  function rejectRequest(requestId) {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'Rejected' } : r))
    );
  }

  function markReturned(requestId) {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const book = books.find((b) => b.id === req.bookId);
    if (book) {
      updateBook(book.id, {
        availableCopies: Math.min(book.totalCopies, book.availableCopies + 1),
      });
    }
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'Returned', returnDate: new Date().toISOString() } : r
      )
    );
  }

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

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
