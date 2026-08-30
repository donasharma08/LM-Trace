import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="panel w-full max-w-sm p-8 space-y-5">
        <div>
          <h1 className="font-display font-semibold text-xl text-ink">Metrology Console</h1>
          <p className="eyebrow mt-1">Enforcement officer sign-in</p>
        </div>

        <div>
          <label className="eyebrow block mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-grid rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
        </div>

        <div>
          <label className="eyebrow block mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-grid rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
        </div>

        {error && <p className="text-xs font-mono text-fail">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white font-medium text-sm py-2.5 rounded-sm hover:bg-ink/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-xs text-ink-muted">
          Accounts are provisioned by an admin via the Supabase dashboard — there is no
          self-service signup for this tool.
        </p>
      </form>
    </div>
  );
}
