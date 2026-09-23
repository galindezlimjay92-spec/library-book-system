export default function BookCard({ book, onRequest, requestState }) {
  const isAvailable = book.availableCopies > 0;

  return (
    <div className="col-sm-6 col-lg-4 col-xl-3 mb-4">
      <div className="card h-100 shadow-sm border-0">
        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <span className="badge text-bg-light border">{book.category}</span>
            <span className={`badge ${isAvailable ? 'text-bg-success' : 'text-bg-secondary'}`}>
              {isAvailable ? `${book.availableCopies} available` : 'Unavailable'}
            </span>
          </div>
          <h6 className="card-title fw-bold mb-1">{book.title}</h6>
          <p className="text-muted small mb-2">by {book.author}</p>
          <p className="card-text small flex-grow-1">{book.description}</p>
          <button
            className="btn btn-primary btn-sm mt-2"
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
