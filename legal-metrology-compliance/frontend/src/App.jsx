import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import { supabase } from "./lib/supabaseClient";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ProductDetail from "./pages/ProductDetail";
import ScanNew from "./pages/ScanNew";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still checking

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-ink-muted text-sm">Loading…</div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="min-h-screen">
      <Navbar session={session} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scan/new" element={<ScanNew />} />
        <Route path="/products/:scanId" element={<ProductDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
