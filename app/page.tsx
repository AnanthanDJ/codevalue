import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">

        <h1 className="text-5xl font-bold mb-4 tracking-tight">
          Code<span className="text-violet-400">Value</span>
        </h1>
        <p className="text-gray-400 text-xl mb-4">
          Engineers don't apply for work.
        </p>
        <p className="text-gray-500 text-lg mb-12">
          They find broken things, fix them, and earn from the value they create — indefinitely.
        </p>

        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left">
            <div className="text-3xl mb-3">⚙️</div>
            <h2 className="text-lg font-semibold mb-2">For Engineers</h2>
            <p className="text-gray-400 text-sm">
              Scan real codebases, claim inefficiencies, get paid recurring revenue based on verified impact. No resume. No interviews.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left">
            <div className="text-3xl mb-3">🏢</div>
            <h2 className="text-lg font-semibold mb-2">For Organisations</h2>
            <p className="text-gray-400 text-sm">
              Connect your repo. AI surfaces hidden inefficiencies. Engineers fix them. You only pay for outcomes that deliver real value.
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-violet-600 hover:bg-violet-500 px-8 py-3 rounded-xl font-semibold transition"
          >
            Get Started
          </Link>
          <Link
            href="/go"
            className="bg-gray-800 hover:bg-gray-700 px-8 py-3 rounded-xl font-semibold transition"
          >
            Sign In
          </Link>
        </div>

      </div>
    </main>
  );
}
