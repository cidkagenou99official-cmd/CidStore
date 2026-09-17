"use client";

import { useState } from "react";
import { MessageCircle, Send, ShieldCheck, Unlink } from "lucide-react";

const TELEGRAM_BOT_URL = "https://t.me/CidCrypto_Store_bot";

type Props = {
  telegramUsername: string | null;
};

export default function TelegramBinding({ telegramUsername }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const isConnected = Boolean(telegramUsername);

  async function connectTelegram() {
    setLoading(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/customer/telegram/link", {
        method: "POST",
      });

      const data = (await response.json()) as {
        token?: string;
        error?: string;
      };

      if (!response.ok || !data.token) {
        throw new Error(data.error || "Unable to create Telegram link.");
      }

      const telegramUrl = `${TELEGRAM_BOT_URL}?start=${encodeURIComponent(data.token)}`;

      setStatus(
        "Token berhasil dibuat. Buka bot CID Store untuk menyelesaikan verifikasi.",
      );

      window.open(telegramUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect Telegram.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-purple-500/10 p-3 text-purple-300">
            <MessageCircle className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              Telegram
            </h2>

            <p className="mt-1 text-sm text-white/50">
              Hubungkan akun Telegram untuk verifikasi dan keamanan akun.
            </p>
          </div>
        </div>

        {isConnected && (
          <span className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Connected
          </span>
        )}
      </div>

      {isConnected ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wider text-white/40">
            Connected account
          </p>

          <p className="mt-1 text-sm font-medium text-white">
            @{telegramUsername}
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            Telegram sudah terhubung dengan akun CID Store.
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
            <Unlink className="h-4 w-4" />
            Untuk mengganti akun Telegram, hubungi CS CID Store.
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-xl border border-purple-400/10 bg-purple-500/[0.04] p-4">
            <div className="flex gap-3">
              <Send className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" />

              <div className="text-sm text-white/60">
                <p className="font-medium text-white">
                  Binding aman melalui bot
                </p>

                <p className="mt-1 leading-6">
                  CID Store akan membuat token verifikasi sementara.
                  Setelah itu lu akan diarahkan ke bot resmi CID Store
                  untuk menyelesaikan proses binding.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={connectTelegram}
            disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {loading ? "Preparing Telegram..." : "Bind Telegram"}
          </button>
        </>
      )}

      {status && (
        <p className="mt-3 text-sm text-emerald-300">
          {status}
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
