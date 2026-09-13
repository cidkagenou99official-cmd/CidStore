"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { MessageCircle, Send } from "lucide-react";
import { TELEGRAM_BOT_URL, TELEGRAM_CS_URL } from "@/app/lib/telegram";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Exchange", href: "/exchange" },
  { label: "Market", href: "/#market" },
  { label: "Orders", href: "/orders" },
  { label: "Support", href: "/support" },
];

export function SiteShell({
  children,
  isCustomerLoggedIn,
}: {
  children: ReactNode;
  isCustomerLoggedIn: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/#market") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/customer/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to log out.");
      }

      setMobileMenuOpen(false);
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-3" aria-label="CID Store home">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/25">
                C
              </div>
              <div>
                <div className="text-sm font-semibold tracking-[0.25em] text-white/80">
                  CID STORE
                </div>
                <div className="text-[10px] uppercase tracking-[0.38em] text-slate-400">
                  Crypto Exchange
                </div>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 p-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <a
                href={TELEGRAM_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:border-cyan-400/60 hover:bg-cyan-500/20 hover:text-white"
              >
                <Send className="h-4 w-4" />
                Bot
              </a>
              <a
                href={TELEGRAM_CS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-200 transition hover:border-indigo-400/60 hover:bg-indigo-500/20 hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
                CS
              </a>
              {isCustomerLoggedIn ? (
                <>
                  <div className="flex items-center gap-3 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" aria-hidden="true" />
                    <div className="flex flex-col leading-none text-left">
                      <span className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/80">Account</span>
                      <span className="mt-1 text-sm font-semibold text-cyan-50">Account</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-rose-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/60 hover:text-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:scale-[1.02]"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-900/80 text-slate-100 md:hidden"
              aria-label="Toggle navigation"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <span className="sr-only">Open menu</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="space-y-2 border-t border-white/10 py-4 md:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive(item.href)
                      ? "bg-cyan-500/10 text-cyan-300"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {isCustomerLoggedIn ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/80">Account</p>
                    <p className="mt-2 text-sm font-semibold text-cyan-50">Account</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full rounded-full border border-white/10 bg-slate-900/70 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-rose-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex gap-3">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-full border border-white/10 px-4 py-3 text-center text-sm font-medium text-slate-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-3 text-center text-sm font-semibold text-slate-950"
                  >
                    Register
                  </Link>
                </div>
              )}
            </nav>
          )}
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 rounded-[28px] border border-cyan-400/20 bg-gradient-to-r from-slate-900/80 to-slate-900/60 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
                Demo exchange
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                Ready to trade smarter?
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/exchange"
                className="rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20"
              >
                Start Exchange
              </Link>
              <Link
                href="/support"
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400/60 hover:text-white"
              >
                Contact Support
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
            <p>© 2026 CID Store. Demo crypto exchange experience.</p>
            <div className="flex flex-wrap gap-5">
              <Link href="/terms" className="transition hover:text-white">
                Terms
              </Link>
              <Link href="/privacy" className="transition hover:text-white">
                Privacy
              </Link>
              <Link href="/support" className="transition hover:text-white">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
