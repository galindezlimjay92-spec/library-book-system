# Library Book System

A web-based library management system built as a Progressive Web App (PWA). Students can browse books and request to borrow them, while librarians (admins) manage the book catalog, approve or reject borrow requests, and record returns.

**Course project:** WS102 / WS106 Final Project

## Live Demo

| What | Link |
| --- | --- |
| Frontend (Netlify, HTTPS) | https://frabjous-melba-38e0bc.netlify.app |
| Backend API (Render) | https://library-book-system.onrender.com |
| Health check | https://library-book-system.onrender.com/health |

> The backend runs on Render's free tier, so it sleeps when idle. The first request after a long pause can take up to a minute.

## Features

**Students**
- Sign in with Google or with email and password
- Browse, search, and filter books by category and availability
- Request to borrow a book
- View my requests, my borrowed books, and borrowing history

**Admins**
- Dashboard with library statistics
- Add, edit, and delete books (full CRUD)
- Approve or reject borrow requests and mark books as returned
- View lending records, reports, and registered students

**General**
- Installable PWA with a web app manifest, service worker, and offline banner
- Role-based access control on both the frontend and the backend
- Responsive layout (Bootstrap)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React (Vite), React Router, Bootstrap, Bootstrap Icons |
| Authentication | Firebase Authentication (Google and Email/Password) |
| Roles | Cloud Firestore (`users/{uid}.role`) |
| Backend | Node.js, Express, `mysql2`, `firebase-admin` |
| Database | MySQL-compatible cloud database on TiDB Cloud |
| Hosting | Netlify (frontend), Render (backend) |

## How It Works

```
Browser (React PWA on Netlify)
   |  1. User signs in with Firebase and receives an ID token
   |  2. Each request sends:  Authorization: Bearer <ID token>
   v
Express API (Render)
   |  3. firebase-admin verifies the token
   |  4. Reads the user's role from Firestore
   |  5. Runs the database query only if the role is allowed
   v
MySQL on TiDB Cloud (books, borrow_requests)
```

## Authentication and Roles

- Users sign in with **Google** or **email and password** through Firebase Authentication.
- Each user has a profile document in Firestore at `users/{uid}` with a `role` field: `student` or `admin`.
- New accounts are always created as `student`.
- To make someone an admin, open the Firebase Console, go to Firestore, open that user's document in the `users` collection, and set `role` to `admin`.
- The frontend hides pages and buttons based on the role, and the **backend enforces the role** on every protected endpoint.

## API Endpoints

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/` and `/health` | Public (health check) |
| GET | `/api/books` | Public |
| POST | `/api/books` | Admin |
| PUT | `/api/books/:id` | Admin |
| DELETE | `/api/books/:id` | Admin |
| GET | `/api/requests` | Logged in (admin sees all, student sees own) |
| POST | `/api/requests` | Student |
| PUT | `/api/requests/:id/approve` | Admin |
| PUT | `/api/requests/:id/reject` | Admin |
| PUT | `/api/requests/:id/return` | Admin |
| GET | `/api/students` | Admin |
| POST | `/api/login` | Public (records a sign-in in the server log) |

Approving a request and marking a book as returned use database transactions, so the number of available copies always stays correct.

## Database Schema

```sql
CREATE TABLE books (
  book_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  author VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  copies_available INT NOT NULL,
  date_added DATE NOT NULL,
  isbn VARCHAR(30) NOT NULL DEFAULT '',
  description TEXT DEFAULT NULL
);

CREATE TABLE borrow_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(100) NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  book_id INT NOT NULL,
  book_title VARCHAR(150) NOT NULL,
  request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  due_date DATETIME NULL,
  return_date DATETIME NULL
);
```

## Project Structure

```
library-book-system/
├── backend/            Express API (server.js, package.json)
├── public/             PWA files (manifest.json, sw.js, icons, _redirects)
├── src/
│   ├── components/     Shared UI components
│   ├── context/        DataContext (auth state, API calls)
│   ├── pages/          Login, Register, admin/ and student/ pages
│   └── firebase        Firebase web app configuration
├── netlify.toml        Netlify build and redirect settings
└── package.json        Frontend dependencies and scripts
```

## Running Locally

**Requirements:** Node.js 20.6 or newer, a Firebase project, and a MySQL-compatible database.

**Frontend**

```bash
git clone https://github.com/galindezlimjay92-spec/library-book-system.git
cd library-book-system
npm install
npm run dev
```

By default the frontend calls the deployed Render API. To use a local backend, change `BASE_URL` in `src/context/DataContext.jsx` to `http://localhost:8080/api`.

**Backend**

```bash
cd backend
npm install
node --env-file=.env server.js
```

Create `backend/.env` (it is excluded from Git) with the variables below.

### Backend environment variables

| Variable | Description |
| --- | --- |
| `DB_HOST` | Database host |
| `DB_PORT` | Database port (TiDB uses `4000`) |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name (`library_db`) |
| `DB_SSL` | `true` for TiDB Cloud |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON, on a single line |
| `CLIENT_ORIGIN` | Allowed frontend origin (the Netlify URL, no trailing slash) |
| `PORT` | Server port (set automatically by Render) |

## Deployment

1. **Database:** create a TiDB Cloud