"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "@/components/StepIndicator";
import QRCode from "@/components/QRCode";
import DataSourceBadge from "@/components/DataSourceBadge";
import { CrawlResult } from "@/types/branch";

type Step = "input" | "loading" | "result" | "error";

const LOADING_MESSAGES = [
  "Finder afdelinger...",
  "Analyserer hjemmeside...",
  "Beregner koordinater...",
  "Færdiggør QR-kode...",
];

function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

export default function CreatePage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("input");
  const [domain, setDomain] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (step !== "loading") return;
    setLoadingMsgIdx(0);
    const interval = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [step]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = normalizeDomain(domain);
    if (!clean) return;
    setDomain(clean);
    setStep("loading");
    setResult(null);
    setErrorMsg("");

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: clean }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: CrawlResult = await res.json();

      if (data.branches.length === 0) {
        setErrorMsg(`Ingen afdelinger fundet for ${clean}. Kontrollér domænet og prøv igen.`);
        setStep("error");
        return;
      }

      setResult(data);
      setStep("result");
    } catch {
      setErrorMsg("Noget gik galt. Tjek domænet og prøv igen.");
      setStep("error");
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}/scan?domain=${domain}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const currentStep = step === "input" ? 1 : step === "loading" ? 2 : 3;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const qrUrl = `${origin}/scan?domain=${domain}`;

  return (
    <main className="flex flex-col min-h-screen max-w-md mx-auto px-4 py-10 gap-8">
      <StepIndicator currentStep={currentStep as 1 | 2 | 3} />

      {/* Step 1 — Input */}
      {step === "input" && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Opret QR-kode</h1>
            <p className="text-sm text-gray-500 mt-1">
              Én QR-kode der automatisk finder nærmeste afdeling.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="domain">
                Virksomhedens hjemmeside
              </label>
              <input
                id="domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="gsv.dk"
                required
                className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": "#267D39" } as React.CSSProperties}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="company">
                Virksomhedens navn <span className="text-gray-400 font-normal">(valgfrit)</span>
              </label>
              <input
                id="company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="GSV Materieludlejning"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
            Vi finder automatisk alle afdelinger og opretter én smart QR-kode. Ingen registrering nødvendig.
          </div>

          <button
            type="submit"
            className="w-full font-semibold px-6 py-3 rounded-lg text-white text-center transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "#267D39" }}
          >
            Opret QR-kode
          </button>
        </form>
      )}

      {/* Step 2 — Loading */}
      {step === "loading" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "#267D39", borderTopColor: "transparent" }}
          />
          <div className="text-center">
            <p className="text-base font-medium text-gray-900">
              {LOADING_MESSAGES[loadingMsgIdx]}
            </p>
            <p className="text-sm text-gray-400 mt-1">{domain}</p>
          </div>
        </div>
      )}

      {/* Step 3 — Resultat */}
      {step === "result" && result && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QR-kode klar</h1>
            <p className="text-sm text-gray-500 mt-1">
              {result.branches.length} afdelinger fundet for{" "}
              <span className="font-medium">{domain}</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-6">
            <QRCode url={qrUrl} companyName={companyName || domain} />
            <p className="text-xs text-gray-400">{qrUrl}</p>
          </div>

          <DataSourceBadge source={result.source} domain={domain} />

          <div className="flex flex-col gap-3">
            <button
              onClick={copyLink}
              className="w-full font-semibold px-6 py-3 rounded-lg text-center transition-all active:scale-95"
              style={{ border: "2px solid #267D39", color: copied ? "#ffffff" : "#267D39", backgroundColor: copied ? "#267D39" : "transparent" }}
            >
              {copied ? "Kopieret!" : "Kopier link"}
            </button>

            <button
              onClick={() => router.push(`/scan?domain=${domain}`)}
              className="w-full font-semibold px-6 py-3 rounded-lg text-center transition-all active:scale-95"
              style={{ border: "2px solid #267D39", color: "#267D39" }}
            >
              Prøv som bruger
            </button>

            <button
              onClick={() => router.push(`/demo?domain=${domain}`)}
              className="w-full font-medium px-6 py-3 rounded-lg text-center text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
            >
              Prøv i simulator
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            QR-koden er designet til fysisk print — f.eks. på køretøjer, maskiner, flyers eller skilte.
          </p>
        </div>
      )}

      {/* Error state */}
      {step === "error" && (
        <div className="flex flex-col gap-6">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-4 text-sm text-red-700">
            {errorMsg}
          </div>
          <button
            onClick={() => setStep("input")}
            className="w-full font-semibold px-6 py-3 rounded-lg text-white transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "#267D39" }}
          >
            Prøv igen
          </button>
        </div>
      )}
    </main>
  );
}
