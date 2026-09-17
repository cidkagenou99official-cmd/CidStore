"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TelegramBinding from "@/app/components/account/telegram-binding";

type UserProfile = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  telegramUsername: string | null;
  language: string;
  createdAt: string;
};

export default function AccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [language, setLanguage] = useState("id");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/customer/profile", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load account.");
        }

        const profile = data.user as UserProfile;

        setUser(profile);
        setName(profile.name ?? "");
        setPhone(profile.phone ?? "");
        setTelegramUsername(profile.telegramUsername ?? "");
        setLanguage(profile.language ?? "id");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load account.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  async function saveProfile() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          telegramUsername,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save account.");
      }

      const updatedUser = data.user as UserProfile;

      setUser(updatedUser);
      setName(updatedUser.name ?? "");
      setPhone(updatedUser.phone ?? "");
      setTelegramUsername(updatedUser.telegramUsername ?? "");
      setLanguage(updatedUser.language ?? "id");

      setMessage("Account updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save account.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    setMessage("");
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch("/api/customer/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to change password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage("Password changed successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change password.",
      );
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center text-slate-400">
            Loading account...
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-red-400/20 bg-red-500/5 p-8 text-center">
            <h1 className="text-2xl font-bold">
              Account Login Required
            </h1>

            <p className="mt-2 text-slate-400">
              Silakan login terlebih dahulu untuk membuka Account.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 font-semibold text-slate-950"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-400">
            Account
          </p>

          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            Account Settings
          </h1>

          <p className="mt-3 text-slate-400">
            Kelola profile, kontak, Telegram, keamanan, dan preferensi
            akun kamu.
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 text-xl font-bold text-cyan-300">
                {(name || user.email || "U")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  {name || "CID Store User"}
                </h2>

                <p className="text-sm text-slate-400">
                  {user.email || "No email"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold">Profile</h2>

            <div className="mt-5 space-y-5">
              <div>
                <label className="text-sm text-slate-300">
                  Email
                </label>

                <input
                  value={user.email ?? ""}
                  disabled
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-slate-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  Name
                </label>

                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  Phone Number
                </label>

                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  Telegram Username
                </label>

                <div className="mt-2 flex">
                  <span className="flex items-center rounded-l-2xl border border-r-0 border-white/10 bg-slate-950/90 px-4 text-slate-500">
                    @
                  </span>

                  <input
                    value={telegramUsername}
                    onChange={(event) =>
                      setTelegramUsername(
                        event.target.value.replace(/^@/, ""),
                      )
                    }
                    className="w-full rounded-r-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    placeholder="username"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-red-400/20 bg-red-500/5 p-6">
            <h2 className="text-xl font-semibold">
              Change Password
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Gunakan password baru minimal 8 karakter.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm text-slate-300">
                  Current Password
                </label>

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-red-400"
                  placeholder="Current password"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  New Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-red-400"
                  placeholder="New password"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  Confirm New Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-red-400"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="button"
                onClick={changePassword}
                disabled={changingPassword}
                className="w-full rounded-full border border-red-400/30 bg-red-500/10 px-6 py-3 font-semibold text-red-200 transition hover:border-red-400/60 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {changingPassword
                  ? "Changing Password..."
                  : "Change Password"}
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold">Language</h2>

            <p className="mt-1 text-sm text-slate-400">
              Pilih bahasa yang akan digunakan oleh interface CID Store.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setLanguage("id")}
                className={`rounded-2xl border p-4 text-left transition ${
                  language === "id"
                    ? "border-cyan-400/50 bg-cyan-500/10"
                    : "border-white/10 bg-slate-950/50"
                }`}
              >
                <p className="font-semibold">🇮🇩 Indonesia</p>
                <p className="mt-1 text-sm text-slate-400">
                  Bahasa Indonesia
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`rounded-2xl border p-4 text-left transition ${
                  language === "en"
                    ? "border-cyan-400/50 bg-cyan-500/10"
                    : "border-white/10 bg-slate-950/50"
                }`}
              >
                <p className="font-semibold">🇬🇧 English</p>
                <p className="mt-1 text-sm text-slate-400">
                  English
                </p>
              </button>
            </div>
          </section>

          <TelegramBinding telegramUsername={telegramUsername || null} />

          {message && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-4 font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Account Settings"}
          </button>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/asset"
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-center font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:text-white"
            >
              My Assets
            </Link>

            <Link
              href="/trade"
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-center font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:text-white"
            >
              Trade Crypto
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
