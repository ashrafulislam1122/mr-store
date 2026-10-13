"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage("Login failed. Check your email and password.");
        return;
      }

      const response = await fetch("/api/auth/access", {
        cache: "no-store",
      });

      const access = response.ok ? await response.json() : null;

      if (!response.ok || access?.isAdmin !== true) {
        await supabase.auth.signOut();
        setMessage("Unauthorized. Admin access only.");
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#10110d] px-4 py-10 text-[#f4f0e6]">
      <section className="w-full max-w-md rounded-3xl border border-lime-300/20 bg-white/[0.04] p-8 shadow-2xl shadow-black/40">
        <Link href="/" className="text-sm text-white/60 transition hover:text-lime-300">
          ← Back to Store
        </Link>

        <p className="mt-8 text-sm font-bold uppercase tracking-[0.35em] text-lime-300">
          MR STORE
        </p>

        <h1 className="mt-4 text-3xl font-bold">Admin Sign In</h1>
        <p className="mt-2 text-sm leading-6 text-white/55">
          Authorized administrators only. Sign in to manage your store.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-medium">
              Email address
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Admin email"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-lime-300"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-lime-300"
            />
          </div>

          {message && (
            <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-lime-300 px-4 py-3 font-bold text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verifying admin access..." : "Sign In as Admin"}
          </button>
        </form>

        <p className="mt-6 text-xs leading-5 text-white/35">
          Access is restricted to emails authorized in the server configuration.
        </p>
      </section>
    </main>
  );
}