import { motion } from "framer-motion";

export default function EmptyState({ title, subtitle, action }) {
  return (
    <div className="panel px-6 py-14 flex flex-col items-center text-center gap-3">
      <motion.svg
        width="88" height="88" viewBox="0 0 88 88" fill="none"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* package outline */}
        <rect x="20" y="30" width="36" height="34" rx="2" stroke="#D8DEE4" strokeWidth="2" />
        <path d="M20 40h36" stroke="#D8DEE4" strokeWidth="2" />
        <path d="M32 30v-6l6-4 6 4v6" stroke="#D8DEE4" strokeWidth="2" strokeLinejoin="round" />
        {/* magnifying glass, ink navy */}
        <circle cx="58" cy="52" r="14" stroke="#1B2A4A" strokeWidth="2.5" fill="#F5F7F8" />
        <path d="M68 62l10 10" stroke="#1B2A4A" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M52 52a6 6 0 016-6" stroke="#C08A2E" strokeWidth="2" strokeLinecap="round" />
      </motion.svg>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {subtitle && <p className="text-xs text-ink-muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
