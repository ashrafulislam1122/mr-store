"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createBrowserClient(supabaseUrl, supabaseKey);

export default function SellerLoginPage() {
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
        setMessage(
          "Login failed. Please check your email and password."
        );
        return;
      }

      const response = await fetch("/api/auth/access", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setMessage(
          "Login successful, but access verification failed. Please try again."
        );
        return;
      }

      const access = await response.json();

      if (access.isAdmin === true) {
        router.replace("/admin/dashboard");
      } else if (access.isSeller === true) {
        router.replace("/seller/dashboard");
      } else {
        await supabase.auth.signOut();
        setMessage(
          "Your account is not authorized for seller or admin access."
        );
        return;
      }

      router.refresh();
    } catch {
      setMessage(
        "Something went wrong. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <Link
          href="/"
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Store
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
          MR Store
        </p>

        <h1 className="mt-3 text-3xl font-bold">Sign In</h1>

        <p className="mt-2 text-sm text-slate-400">
          Sign in to access your authorized account.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none transition focus:border-emerald-400"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none transition focus:border-emerald-400"
            />
          </div>

          {message && (
            <p
              role="alert"
              className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verifying access..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-xs leading-5 text-slate-500">
          Authorized seller and administrator access only.
        </p>
      </section>
    </main>
  );
}