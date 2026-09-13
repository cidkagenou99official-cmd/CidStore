"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password.");
      setSuccess("");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/customer/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Unable to login.");
      }

      setSuccess("Login successful. You can continue exploring CID Store.");
      setEmail("");
      setPassword("");
      router.push("/orders");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to login.");
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/80 shadow-2xl shadow-cyan-950/20 lg:grid-cols-[1fr_1.05fr]">
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/20 via-slate-900 to-indigo-500/20 p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.22),transparent_35%)]" />
          <div className="relative">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Welcome back</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Log in to CID Store</h1>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
              Access the demo trading dashboard, review mock orders, and continue testing the exchange flow.
            </p>

            <div className="mt-8 space-y-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Demo note</p>
                <p className="mt-2">This login is for interface testing only and does not connect to real accounts or blockchain data.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Account access</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Sign in</h2>
            </div>

            <label className="block space-y-2 text-sm text-slate-300">
              <span className="font-medium">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                placeholder="you@example.com"
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-300">
              <span className="font-medium">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                placeholder="Enter demo password"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>

            <p className="text-center text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-cyan-300 transition hover:text-cyan-200">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
