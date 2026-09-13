interface ToastProps {
  message: string;
  variant: "success" | "error";
}

export function Toast({ message, variant }: ToastProps) {
  const isSuccess = variant === "success";

  return (
    <div
      className={`pointer-events-none fixed right-4 top-24 z-[60] max-w-sm rounded-2xl border px-4 py-3 text-sm shadow-xl transition ${
        isSuccess
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-red-500/30 bg-red-500/10 text-red-100"
      }`}
    >
      {message}
    </div>
  );
}
