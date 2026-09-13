"use client";

import { FormEvent, useState } from "react";

export default function SupportPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name || !form.email || !form.subject || !form.message) {
      setError("Please complete all fields so our demo support team can review your request.");
      setStatus("error");
      return;
    }

    setError("");
    setStatus("loading");

    await new Promise((resolve) => setTimeout(resolve, 900));

    setStatus("success");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Support</p>
        <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
          We are here to help
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-5">
          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5">
            <h2 className="text-xl font-semibold text-white">Contact channels</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</p>
                <p className="mt-2 font-medium text-white">support@cidstore.demo</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">WhatsApp</p>
                <p className="mt-2 font-medium text-white">+62 812 0000 1234</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Office</p>
                <p className="mt-2 font-medium text-white">Jakarta, Indonesia</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-4 sm:p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 text-sm text-slate-300">
                <span className="font-medium">Full name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                  placeholder="Your name"
                />
              </label>

              <label className="block space-y-2 text-sm text-slate-300">
                <span className="font-medium">Email address</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm text-slate-300">
              <span className="font-medium">Subject</span>
              <input
                type="text"
                value={form.subject}
                onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                placeholder="How can we help?"
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-300">
              <span className="font-medium">Message</span>
              <textarea
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                placeholder="Tell us about your issue or question"
              />
            </label>

            {status === "error" && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {status === "success" && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Message sent. Our demo support team will get back to you soon.
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Sending request..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
