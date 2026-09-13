export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Legal</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Privacy Policy</h1>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-300">
          <p>
            CID Store collects only the minimum information needed to demonstrate the user interface and form interactions in this demo environment.
          </p>
          <p>
            The project does not store real payment data, private keys, seed phrases, or blockchain wallet credentials. Any submitted information is treated as sample content for UI testing and should not be considered confidential or sensitive.
          </p>
          <p>
            We may process demo form submissions temporarily in the browser for interface validation, but no production-grade authentication, persistence, or payment systems are implemented as part of this version.
          </p>
        </div>
      </div>
    </div>
  );
}
