export default function EmptyRow({ colSpan, icon = 'bi-inbox', text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center text-muted py-5">
        <i className={`bi ${icon} fs-1 d-block mb-2 opacity-50`}></i>
        {text}
      </td>
    </tr>
  );
}
