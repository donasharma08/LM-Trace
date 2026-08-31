import { motion } from "framer-motion";

const STATUS_STYLES = {
  pass: "bg-pass/10 text-pass",
  potential_non_compliance: "bg-fail/10 text-fail",
  review_required: "bg-flag/10 text-flag",
};

const STATUS_LABELS = {
  pass: "OK",
  potential_non_compliance: "ISSUE",
  review_required: "REVIEW",
};

export default function ViolationList({ declarations, structuralFlags, activeId, onHover }) {
  return (
    <div className="panel divide-y divide-grid">
      <div className="px-5 py-3 bg-paper/60">
        <span className="eyebrow">Declaration checklist</span>
      </div>
      {declarations.map((d) => (
        <motion.div
          key={d.id}
          onMouseEnter={() => d.bbox_px && onHover?.(d.id)}
          onMouseLeave={() => onHover?.(null)}
          animate={{ backgroundColor: activeId === d.id ? "rgba(27,42,74,0.04)" : "rgba(0,0,0,0)" }}
          transition={{ duration: 0.15 }}
          className={`px-5 py-3 flex items-start justify-between gap-4 ${d.bbox_px ? "cursor-pointer" : ""}`}
        >
          <div>
            <div className="text-sm font-medium text-ink">{d.label}</div>
            <div className="text-[10px] font-mono text-ink-muted/70 mt-0.5">
              {d.rule_source} {d.rule_version && `(v${d.rule_version})`}
            </div>
            {d.notes?.length > 0 ? (
              <ul className="mt-1 space-y-0.5">
                {d.notes.map((n, i) => (
                  <li key={i} className="text-xs font-mono text-ink-muted">{n}</li>
                ))}
              </ul>
            ) : (
              <div className="text-xs font-mono text-ink-muted mt-1">
                {d.found ? "Present" : "Not required"}
                {d.measured_height_mm != null &&
                  ` — ${d.measured_height_mm}mm (min ${d.min_required_height_mm}mm)`}
              </div>
            )}
          </div>
          <span className={`shrink-0 text-xs font-mono px-2 py-0.5 rounded ${STATUS_STYLES[d.status]}`}>
            {STATUS_LABELS[d.status]}
          </span>
        </motion.div>
      ))}

      {structuralFlags?.length > 0 && (
        <div className="px-5 py-3">
          <span className="eyebrow text-flag">Flagged for manual review</span>
          <ul className="mt-2 space-y-1">
            {structuralFlags.map((f, i) => (
              <li key={i} className="text-xs text-flag">
                {f.description}{" "}
                <span className="font-mono text-ink-muted">(confidence: {f.confidence})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
