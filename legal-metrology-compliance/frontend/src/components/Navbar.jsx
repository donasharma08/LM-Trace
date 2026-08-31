import { NavLink } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const linkClass = ({ isActive }) =>
  `px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
    isActive ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"
  }`;

export default function Navbar({ session }) {
  return (
    <header className="border-b border-grid bg-panel">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-display font-semibold text-lg text-ink">
            Metrology<span className="text-fail">.</span>Console
          </span>
          <span className="eyebrow hidden sm:inline">Inspection Officer — LM(PC) Rules, 2011</span>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/scan/new" className={linkClass}>New Scan</NavLink>
          {session && (
            <button
              onClick={() => supabase.auth.signOut()}
              className="ml-3 px-3 py-1.5 text-sm font-mono text-ink-muted hover:text-fail transition-colors"
            >
              Sign out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
