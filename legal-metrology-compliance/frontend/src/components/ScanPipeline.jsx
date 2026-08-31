import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const STEPS = [
  { key: "quality", label: "Checking image quality" },
  { key: "ocr", label: "Reading label text (cloud OCR)" },
  { key: "rules", label: "Validating against Rule 6 / 7" },
  { key: "company", label: "Checking manufacturer history" },
];

// Steps advance on a timer to give visible progress while the real
// request is in flight -- the backend doesn't stream step-by-step
// status, so this reflects the pipeline's actual stage order, timed
// to roughly match typical processing time, and simply holds on the
// last step until the response actually arrives.
const STEP_INTERVAL_MS = 900;

export default function ScanPipeline({ done }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (done) {
      setActiveIndex(STEPS.length);
      return;
    }
    if (activeIndex >= STEPS.length - 1) return;
    const timer = setTimeout(() => setActiveIndex((i) => i + 1), STEP_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [activeIndex, done]);

  return (
    <div className="panel p-6">
      <span className="eyebrow">Processing scan</span>
      <div className="mt-4 space-y-3">
        {STEPS.map((step, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <div key={step.key} className="flex items-center gap-3">
              <motion.div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                animate={{
                  borderColor: isDone || isActive ? "#1B2A4A" : "#D8DEE4",
                  backgroundColor: isDone ? "#1B2A4A" : "transparent",
                }}
                transition={{ duration: 0.25 }}
              >
                {isDone && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    width="10" height="10" viewBox="0 0 10 10"
                  >
                    <path d="M1 5L4 8L9 2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                )}
                {isActive && !isDone && (
                  <motion.div
                    className="w-2 h-2 rounded-full bg-ink"
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  />
                )}
              </motion.div>
              <span className={`text-sm font-mono ${isDone || isActive ? "text-ink" : "text-ink-muted/50"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
