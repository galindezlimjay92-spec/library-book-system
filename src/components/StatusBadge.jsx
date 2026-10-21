const CONFIG = {
  Pending:  { cls: 'status-pending',  icon: 'bi-hourglass-split' },
  Approved: { cls: 'status-approved', icon: 'bi-check-circle-fill' },
  Rejected: { cls: 'status-rejected', icon: 'bi-x-circle-fill' },
  Returned: { cls: 'status-returned', icon: 'bi-arrow-return-left' },
};

export default function StatusBadge({ status }) {
  const c = CONFIG[status] || CONFIG.Returned;
  return (
    <span className={`status-pill ${c.cls}`}>
      <i className={`bi ${c.icon}`}></i>
      {status}
    </span>
  );
}
