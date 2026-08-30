import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductTable from "../components/ProductTable";
import { api } from "../lib/api";

function StatCard({ label, value, tone = "ink" }) {
  return (
    <div className="panel p-4">
      <div className="eyebrow">{label}</div>
      <div className={`font-display text-3xl font-semibold mt-1 text-${tone}`}>{value}</div>
    </div>
  );
}

const FILTERS = [
  { key: "all", label: "ALL" },
  { key: "pass", label: "PASS" },
  { key: "potential_non_compliance", label: "NON-COMPLIANT" },
  { key: "review_required", label: "REVIEW" },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [offenders, setOffenders] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes, offendersRes] = await Promise.all([
        api.getDashboardStats(),
        api.listProducts({ search: search || undefined, status: filter }),
        api.getRepeatOffenders(),
      ]);
      setStats(statsRes.data);
      setProducts(productsRes.data);
      setOffenders(offendersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Inspection dashboard</h1>
          <p className="eyebrow mt-1">Compliance status across all scanned products</p>
        </div>
        <Link
          to="/scan/new"
          className="bg-ink text-white text-sm font-medium px-4 py-2 rounded-sm hover:bg-ink/90 transition-colors"
        >
          + New scan
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <StatCard label="Products scanned" value={stats.total_products} />
          <StatCard label="Total scans" value={stats.total_scans} />
          <StatCard label="Pass" value={stats.pass_count} tone="pass" />
          <StatCard label="Non-compliant" value={stats.potential_non_compliance_count} tone="fail" />
          <StatCard label="Review required" value={stats.review_required_count} tone="flag" />
        </div>
      )}

      {offenders.length > 0 && (
        <div className="panel border-l-[3px] border-l-flag p-4">
          <span className="eyebrow text-flag">Repeat non-compliance — companies</span>
          <div className="mt-2 space-y-1">
            {offenders.map((c) => (
              <div key={c.id} className="text-sm flex justify-between">
                <span className="text-ink">{c.name_raw}</span>
                <span className="font-mono text-fail text-xs">
                  {c.non_compliant_count} non-compliant / {c.total_scans} scans
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search products…"
          className="border border-grid rounded-sm px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-ink/20"
        />
        <button onClick={load} className="text-sm font-medium text-ink underline underline-offset-2">
          Search
        </button>
        <div className="ml-auto flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-mono px-3 py-1.5 rounded-sm border ${
                filter === f.key ? "bg-ink text-white border-ink" : "border-grid text-ink-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="panel px-6 py-10 text-center text-ink-muted text-sm">Loading…</div>
      ) : (
        <ProductTable products={products} />
      )}
    </div>
  );
}
