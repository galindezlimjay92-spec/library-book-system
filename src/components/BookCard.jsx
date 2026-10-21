const COVERS = ['#3b5bdb', '#0ca678', '#f08c00', '#d6336c', '#7048e8', '#1098ad'];

// Same category -> same color, always (simple string hash)
function coverColor(text = '') {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COVERS[h % COVERS.length];
}

export default function BookCard({ book, onRequest, requestState }) {
  const isAvailable = book.availableCopies > 0;
  const color = coverColor(book.category);

  return (
    <div className="col-sm-6 col-lg-4 col-xl-3 mb-4">
      <div className="card h-100 hover-lift overflow-hidden">
        <div
          className="book-cover"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
        >
          <i className="bi bi-book-half"></i>
          <span className={`badge ${isAvailable ? 'text-bg-success' : 'text-bg-secondary'}`}>
            {isAvailable ? `${book.availableCopies} available` : 'Unavailable'}
          </span>
        </div>

        <div className="card-body d-flex flex-column">
          <span
            className="text-uppercase text-muted fw-semibold mb-1"
            style={{ fontSize: '0.7rem', letterSpacing: '0.06em' }}
          >
            {book.category}
          </span>
          <h6 className="fw-bold mb-1">{book.title}</h6>
          <p className="text-muted small mb-2">by {book.author}</p>
          <p className="small flex-grow-1 line-clamp-3">{book.description}</p>
          <button
            className="btn btn-primary w-100 mt-2"
            disabled={!isAvailable || requestState === 'pending'}
            onClick={() => onRequest(book.id)}
          >
            {requestState === 'pending'
              ? 'Requested'
              : requestState === 'approved'
              ? 'Borrowed'
              : isAvailable
              ? 'Request to Borrow'
              : 'Not Available'}
          </button>
        </div>
      </div>
    </div>
  );
}
