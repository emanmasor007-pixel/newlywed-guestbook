"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { ADMIN_EMAIL } from "@/lib/config";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session?.user.email?.toLowerCase() === ADMIN_EMAIL) router.replace("/admin/dashboard");
      });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const sb = getSupabase();
    const { data, error: err } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (err || !data.user) {
      setBusy(false);
      setError("Incorrect email or password.");
      return;
    }
    if (data.user.email?.toLowerCase() !== ADMIN_EMAIL) {
      await sb.auth.signOut();
      setBusy(false);
      setError("This account is not allowed to access the dashboard.");
      return;
    }
    router.replace("/admin/dashboard");
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-5">
      <form onSubmit={onSubmit} className="paper w-full max-w-sm rounded-2xl p-7 shadow-paper">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/25 text-gold-dark">
          <Lock size={20} />
        </div>
        <h1 className="mt-4 text-center font-display text-2xl">Admin sign in</h1>
        <p className="mt-1 text-center font-serif italic text-cocoa/60">Private area for the couple</p>

        <label className="label mt-6" htmlFor="email">Email</label>
        <input id="email" type="email" className="field" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label className="label mt-4" htmlFor="pw">Password</label>
        <input id="pw" type="password" className="field" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p role="alert" className="mt-4 text-sm text-rose-deep">{error}</p>}

        <button type="submit" className="btn-gold mt-6 w-full" disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : null} Sign in
        </button>
      </form>
    </main>
  );
}
