# Library Book System

React + Vite + Bootstrap 5 na Library Book Borrowing System with separate
Student and Admin interfaces, plus offline-ready PWA support.

## Paano patakbuhin

```bash
npm install
npm run dev
```

Buksan ang localhost address na lalabas sa terminal (usually http://localhost:5173).

## Paano gumagana

- **Student side:** kailangang mag-Register muna (Student only — walang
  pre-made account). May Dashboard, Browse Available Books (may search +
  category filter), My Requests, My Borrowed Books, History.
- **Admin side:** hindi open-registration — iisa lang at fixed ang admin
  account (hindi pwedeng gumawa ng bagong admin sa Register page):
  - Email: `admin@library.com`
  - Password: `admin123`

  Puwede mo itong palitan sa `src/context/DataContext.jsx` (hanapin
  `DEFAULT_ADMIN`).
- Pag nag-**Request to Borrow** ang student, automatic itong lalabas sa
  Admin → Borrow Requests bilang **Pending**.
- Pag **Approve** ng admin, automatic na:
  - Bumabawas ang available copies ng libro
  - May due date na ginagawa (7 days from approval)
  - Makikita agad ng student ang "Approved" status sa My Requests / My
    Borrowed Books
- May **Mark as Returned** button ang admin para ibalik yung available copy at
  ma-log sa Lending Records / Reports.

## Data storage

Frontend/demo data pa ito — gumagamit ng **localStorage** ng browser bilang
"database" (walang backend/server na kailangan i-setup). Lahat ng accounts,
books, at borrow requests ay naka-save sa browser storage. Kung gusto mo
i-connect sa totoong backend/database (hal. Firebase o Node + MySQL), pwede
nating palitan yung `src/context/DataContext.jsx` na hindi na kailangang
galawin yung ibang components.

## PWA / Offline

May `public/manifest.json` at `public/sw.js` (service worker) na
nagca-cache ng app shell para gumana kahit offline/limited connection ang
user pagkatapos ng unang load. Automatic itong nagre-register sa
`src/main.jsx`.
