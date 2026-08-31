import { motion } from "framer-motion";

const STATUS_META = {
  pass: { label: "PASS", color: "pass" },
  potential_non_compliance: { label: "POTENTIAL NON-COMPLIANCE", color: "fail" },
  review_required: { label: "REVIEW REQUIRED", color: "flag" },
};

const COLOR_CLASSES = {
  pass: "border-pass text-pass",
  fail: "border-fail text-fail",
  flag: "border-flag text-flag",
};

const DOT_CLASSES = { pass: "bg-pass", fail: "bg-fail", flag: "bg-flag" };

/**
 * The report's signature element: a rubber-stamp verdict, animated
 * like it's being pressed down onto paper -- overshoots slightly then
 * settles, via a spring rather than an eased CSS keyframe, so it reads
 * as an "impact" rather than a fade-in.
 */
export default function ComplianceStamp({ status, calibrated }) {
  const meta = STATUS_META[status] || STATUS_META.review_required;
  const colorClasses = COLOR_CLASSES[meta.color];
  const dotClasses = DOT_CLASSES[meta.color];

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <motion.div
        key={status}
        initial={{ scale: 2.2, opacity: 0, rotate: -3 }}
        animate={{ scale: 1, opacity: 1, rotate: -3 }}
        transition={{ type: "spring", stiffness: 380, damping: 14 }}
        className={`inline-flex items-center gap-2 rounded border-[3px] px-4 py-2 font-display font-bold tracking-[0.06em] ${colorClasses}`}
      >
        <motion.span
          className={`h-2 w-2 rounded-full ${dotClasses}`}
          aria-hidden="true"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15 }}
        />
        {meta.label}
      </motion.div>
      {!calibrated && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="eyebrow text-flag"
        >
          No barcode detected — font-size checks not measured this scan
        </motion.span>
      )}
    </div>
  );
}
