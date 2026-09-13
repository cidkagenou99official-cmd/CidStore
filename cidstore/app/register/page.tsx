"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.fullName || !form.email || !form.password || !form.confirmPassword) {
      setError("Please fill in all fields to create your account.");
      setSuccess("");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setSuccess("");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setSuccess("");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/customer/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.fullName,
          email: form.email,
          password: form.password,
        }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Unable to create account.");
      }

      setSuccess("Account created successfully. You can now sign in and continue exploring CID Store.");
      setForm({ fullName: "", email: "", password: "", confirmPassword: "" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create account.");
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/80 shadow-2xl shadow-indigo-950/20 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-6 sm:p-8">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Create account</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Register with CID Store</h1>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2 text-sm text-slate-300">
              <span className="font-medium">Full name</span>
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                placeholder="Your full name"
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-300">
              <span className="font-medium">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                placeholder="you@example.com"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 text-sm text-slate-300">
                <span className="font-medium">Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                  placeholder="Create password"
                />
              </label>

              <label className="block space-y-2 text-sm text-slate-300">
                <span className="font-medium">Confirm password</span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                  placeholder="Repeat password"
                />
              </label>
            </div>

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
              {isLoading ? "Creating account..." : "Create Account"}
            </button>

            <p className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-cyan-300 transition hover:text-cyan-200">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/20 via-slate-900 to-cyan-500/20 p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),transparent_35%)]" />
          <div className="relative">
            <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Why join</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">Demo trading, premium feel</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="font-medium text-white">Secure demo flow</p>
                <p className="mt-2 text-slate-300">Test buys and sells without exposing real wallets, seed phrases, or private keys.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="font-medium text-white">Transparent pricing</p>
                <p className="mt-2 text-slate-300">Review mock fees and order summaries before confirming any demo trade.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
