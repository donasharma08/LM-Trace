const STATUS_META = {
  pass: { label: "PASS", color: "pass" },
  potential_non_compliance: { label: "POTENTIAL NON-COMPLIANCE", color: "fail" },
  review_required: { label: "REVIEW REQUIRED", color: "flag" },
};

/**
 * The report's signature element: a rubber-stamp verdict. Three
 * states, not two -- REVIEW REQUIRED exists specifically so "not
 * detected in this photo" is never silently rendered as a violation.
 */
export default function ComplianceStamp({ status, calibrated }) {
  const meta = STATUS_META[status] || STATUS_META.review_required;
  const colorClasses = {
    pass: "border-pass text-pass",
    fail: "border-fail text-fail",
    flag: "border-flag text-flag",
  }[meta.color];
  const dotClasses = { pass: "bg-pass", fail: "bg-fail", flag: "bg-flag" }[meta.color];

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div
        key={status}
        className={`animate-stamp-down -rotate-3 inline-flex items-center gap-2 rounded border-[3px] px-4 py-2 font-display font-bold tracking-[0.06em] ${colorClasses}`}
      >
        <span className={`h-2 w-2 rounded-full ${dotClasses}`} aria-hidden="true" />
        {meta.label}
      </div>
      {!calibrated && (
        <span className="eyebrow text-flag">
          No barcode detected — font-size checks not measured this scan
        </span>
      )}
    </div>
  );
}
