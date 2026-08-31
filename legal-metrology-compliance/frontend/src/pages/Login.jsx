import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

function BrandSeal({ authority }) {
  return (
    <motion.svg
      key={authority ? "authority" : "officer"}
      width="120" height="120" viewBox="0 0 120 120" fill="none"
      initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
      animate={{ scale: 1, opacity: 1, rotate: -6 }}
      transition={{ type: "spring", stiffness: 200, damping: 16 }}
    >
      <circle cx="60" cy="60" r="52" stroke="#F5F7F8" strokeWidth="2" strokeDasharray="4 5" />
      <circle cx="60" cy="60" r="40" stroke="#F5F7F8" strokeWidth="2.5" />
      {authority ? (
        <path d="M60 34l22 10v14c0 15-9 26-22 30-13-4-22-15-22-30V44l22-10z" stroke="#F5F7F8" strokeWidth="3" strokeLinejoin="round" />
      ) : (
        <path d="M40 62l12 12L82 46" stroke="#F5F7F8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </motion.svg>
  );
}

const TABS = [
  { key: "officer", label: "Inspection Officer" },
  { key: "authority", label: "Government Authority" },
];

export default function Login() {
  const [tab, setTab] = useState("officer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isAuthority = tab === "authority";

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isAuthority) return; // present, not wired -- future scope
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <motion.div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden text-white"
        animate={{ backgroundColor: isAuthority ? "#4A3A1B" : "#1B2A4A" }}
        transition={{ duration: 0.35 }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative">
          <span className="font-display font-semibold text-lg">Metrology<span className="text-flag">.</span>Console</span>
        </div>

        <div className="relative flex flex-col items-start gap-6">
          <BrandSeal authority={isAuthority} />
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {isAuthority ? (
                <>
                  <h1 className="font-display text-3xl font-semibold leading-tight max-w-sm">
                    Jurisdiction-wide compliance oversight, in one view.
                  </h1>
                  <p className="text-white/60 text-sm mt-3 max-w-sm">
                    Cross-officer analytics, priority enforcement queues, and repeat-offender
                    tracking across regions.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="font-display text-3xl font-semibold leading-tight max-w-sm">
                    Screen packaged-commodity labels in seconds, not minutes.
                  </h1>
                  <p className="text-white/60 text-sm mt-3 max-w-sm">
                    Barcode-calibrated font checks, evidence-linked findings, and searchable
                    inspection history — built for the Legal Metrology (Packaged Commodities)
                    Rules, 2011.
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="relative eyebrow text-white/40">SIH 2026 · Problem Statement 26034</p>
      </motion.div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-6">
            <span className="font-display font-semibold text-lg text-ink">Metrology<span className="text-fail">.</span>Console</span>
          </div>

          {/* Tab switcher */}
          <div className="relative flex border-b border-grid mb-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-3 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.key ? "text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                {t.label}
                {tab === t.key && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-ink"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={tab}
              onSubmit={handleLogin}
              className="space-y-5"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div>
                <h2 className="font-display font-semibold text-xl text-ink">
                  {isAuthority ? "Authority sign-in" : "Officer sign-in"}
                </h2>
                <p className="eyebrow mt-1">
                  {isAuthority ? "Jurisdiction oversight — coming soon" : "Inspection Officer — LM(PC) Rules, 2011"}
                </p>
              </div>

              {isAuthority && (
                <div className="text-xs bg-flag/10 text-flag border border-flag/30 rounded-sm px-3 py-2">
                  Government Authority access is not yet available in this MVP. This panel is
                  shown for demonstration — sign-in is disabled.
                </div>
              )}

              <div>
                <label className="eyebrow block mb-1">Email</label>
                <input
                  type="email"
                  required={!isAuthority}
                  disabled={isAuthority}
                  value={isAuthority ? "" : email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-grid rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:bg-paper disabled:text-ink-muted/50"
                />
              </div>

              <div>
                <label className="eyebrow block mb-1">Password</label>
                <input
                  type="password"
                  required={!isAuthority}
                  disabled={isAuthority}
                  value={isAuthority ? "" : password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-grid rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:bg-paper disabled:text-ink-muted/50"
                />
              </div>

              {error && <p className="text-xs font-mono text-fail">{error}</p>}

              <motion.button
                type="submit"
                disabled={loading || isAuthority}
                whileHover={{ scale: loading || isAuthority ? 1 : 1.01 }}
                whileTap={{ scale: loading || isAuthority ? 1 : 0.98 }}
                className="w-full bg-ink text-white font-medium text-sm py-2.5 rounded-sm hover:bg-ink/90 transition-colors disabled:opacity-40"
              >
                {isAuthority ? "Coming soon" : loading ? "Signing in…" : "Sign in"}
              </motion.button>

              {!isAuthority && (
                <p className="text-xs text-ink-muted">
                  Accounts are provisioned by an admin via the Supabase dashboard — there is no
                  self-service signup for this tool.
                </p>
              )}
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
