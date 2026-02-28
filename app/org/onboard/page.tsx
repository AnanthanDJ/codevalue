"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function OrgOnboardPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [orgName, setOrgName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate GitHub URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) throw new Error("Invalid GitHub URL");

      // Create org record
      const { data: org, error: orgError } = await supabase
        .from("orgs")
        .insert({
          user_id: user.id,
          name: orgName,
          repo_url: repoUrl,
          terms_accepted: true,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Trigger scan immediately
      const scanRes = await fetch("/api/scan-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, orgId: org.id }),
      });

      const scanData = await scanRes.json();
      if (scanData.error) throw new Error(scanData.error);

      window.location.href = "/org/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
    <Link href="/org/dashboard" className="text-violet-400 text-sm underline mb-6 inline-block">
  ← Back to Dashboard
</Link>
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Code<span className="text-violet-400">Value</span>
          </h1>
          <h2 className="text-xl text-gray-300">Connect your repository</h2>
          <p className="text-gray-500 text-sm mt-1">
            Our AI will scan your codebase and surface inefficiencies. Engineers
            can then claim and fix them — you only pay when value is delivered.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Organisation name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Inc."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">GitHub repository URL</label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/your-org/your-repo"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Terms */}
          <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-400 space-y-2 leading-relaxed">
            <p className="text-white font-medium">Platform Terms</p>
            <p>By connecting your repository, you agree that:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Engineers may scan and propose fixes for your codebase</li>
              <li>You will acknowledge engineer claims before full details are disclosed</li>
              <li>Compensation is outcome-based and agreed per claim</li>
              <li>You will not independently implement disclosed findings without compensation</li>
            </ul>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 accent-violet-500"
            />
            <span className="text-sm text-gray-300">
              I agree to the platform terms above
            </span>
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !repoUrl || !orgName || !agreed}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 rounded-xl text-sm font-semibold transition"
          >
            {loading ? "Scanning repository..." : "Connect & Scan"}
          </button>
        </div>
      </div>
    </main>
  );
}
