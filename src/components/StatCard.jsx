export default function StatCard({ label, value, icon, color }) {
  return (
    <div className="col">
      <div className={`card stat-card stat-${color} h-100 hover-lift`}>
        <div className="card-body d-flex align-items-center gap-3">
          <div className="stat-icon">
            <i className={`bi ${icon}`}></i>
          </div>
          <div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
