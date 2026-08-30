import { Link } from "react-router-dom";

const STATUS_STYLES = {
  pass: "bg-pass/10 text-pass",
  potential_non_compliance: "bg-fail/10 text-fail",
  review_required: "bg-flag/10 text-flag",
};

const STATUS_LABELS = {
  pass: "PASS",
  potential_non_compliance: "NON-COMPLIANT",
  review_required: "REVIEW",
};

export default function ProductTable({ products }) {
  if (!products.length) {
    return (
      <div className="panel px-6 py-10 text-center text-ink-muted text-sm">
        No scans yet. Run a new scan to start building the repository.
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-paper/60 text-left eyebrow">
            <th className="px-5 py-3 font-medium">Product</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Total scans</th>
            <th className="px-5 py-3 font-medium">Last scanned</th>
            <th className="px-5 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-grid">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-paper/40 transition-colors">
              <td className="px-5 py-3 font-medium text-ink">{p.name}</td>
              <td className="px-5 py-3">
                <span className={`font-mono text-xs px-2 py-0.5 rounded ${STATUS_STYLES[p.last_scan_status]}`}>
                  {STATUS_LABELS[p.last_scan_status]}
                </span>
              </td>
              <td className="px-5 py-3 font-mono text-ink-muted">{p.total_scans}</td>
              <td className="px-5 py-3 font-mono text-ink-muted text-xs">
                {p.last_scanned_at ? new Date(p.last_scanned_at).toLocaleString() : "—"}
              </td>
              <td className="px-5 py-3 text-right">
                <Link
                  to={`/products/${p.last_scan_id}`}
                  className="text-xs font-medium text-ink hover:text-fail underline underline-offset-2"
                >
                  View report
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
