export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Legal</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Terms of Service</h1>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-300">
          <p>
            CID Store is a demo crypto exchange website created for testing, demonstration, and user interface evaluation.
            This project does not offer real cryptocurrency trading, real payment processing, or actual fund movement.
          </p>
          <p>
            All displayed prices, exchange rates, orders, and payment methods are mock values intended to showcase the product experience.
            No blockchain transaction, wallet authorization, private key handling, or seed phrase collection is performed by this website.
          </p>
          <p>
            By using this demo interface, you agree that any information submitted is for testing purposes only and should not be treated as real financial or identity verification data.
          </p>
        </div>
      </div>
    </div>
  );
}
