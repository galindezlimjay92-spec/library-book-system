export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
      <div>
        <h4 className="fw-bold mb-0">{title}</h4>
        {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
      </div>
      {children && <div className="d-flex gap-2 flex-wrap">{children}</div>}
    </div>
  );
}
