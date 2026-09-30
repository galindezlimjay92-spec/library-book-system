# Library Book System

React + Vite + Bootstrap 5 Library Book Borrowing System with separate Student and Admin interfaces, plus offline-ready PWA support.

## How to Run

```bash
npm install
npm run dev
```

Open the localhost address shown in the terminal (usually http://localhost:5173).

## How It Works

* **Student side:** Students must register first (Student only — there is no pre-made account). It includes a Dashboard, Browse Available Books (with search + category filter), My Requests, My Borrowed Books, and History.

* **Admin side:** Registration is not open — there is only one fixed admin account (a new admin account cannot be created through the Register page):

  * Email: `admin@library.com`
  * Password: `admin123`

  You can change these credentials in `src/context/DataContext.jsx` (look for `DEFAULT_ADMIN`).

* When a student clicks **Request to Borrow**, the request automatically appears under **Admin → Borrow Requests** with a **Pending** status.

* When the admin **Approves** the request, the system automatically:

  * Decreases the available copies of the book
  * Generates a due date (7 days from the approval date)
  * Immediately shows the **Approved** status to the student in My Requests / My Borrowed Books

* The admin has a **Mark as Returned** button to return the available copy and log the transaction in Lending Records / Reports.

## Data Storage

This is currently frontend/demo data — it uses the browser's **localStorage** as the "database" (no backend/server setup is required). All accounts, books, and borrow requests are saved in browser storage.

If you want to connect it to a real backend/database (such as Firebase or Node + MySQL), you can replace the logic in `src/context/DataContext.jsx` without needing to modify the other components.

## PWA / Offline

The project includes `public/manifest.json` and `public/sw.js` (service worker) that cache the app shell so it can work even when the user is offline or has a limited connection after the initial load.

The service worker is automatically registered in `src/main.jsx`.
