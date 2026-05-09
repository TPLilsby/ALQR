"use client";
import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Phone, Mail } from "lucide-react";
import ConsentBanner from "@/components/ConsentBanner";
import Map from "@/components/Map";
import BranchCard from "@/components/BranchCard";
import DataSourceBadge from "@/components/DataSourceBadge";
import { Branch, CrawlResult, DataSource } from "@/types/branch";
import { findNearestBranch } from "@/lib/distance";

type Step = "consent" | "locating" | "manual" | "fetching" | "result" | "error";

export default function ScanPage() {
  return (
    <Suspense>
      <ScanContent />
    </Suspense>
  );
}

function ScanContent() {
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") ?? "";

  const [step, setStep] = useState<Step>("consent");
  const [geoError, setGeoError] = useState(false);
  const [clickedLat, setClickedLat] = useState<number | undefined>();
  const [clickedLng, setClickedLng] = useState<number | undefined>();
  const [nearest, setNearest] = useState<{ branch: Branch; distanceKm: number } | null>(null);
  const [crawlSource, setCrawlSource] = useState<DataSource | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAndFind = useCallback(async (lat: number, lng: number) => {
    setStep("fetching");
    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      if (!res.ok) throw new Error();
      const data: CrawlResult = await res.json();
      const result = findNearestBranch(lat, lng, data.branches);
      if (!result) throw new Error("no-branches");
      setNearest(result);
      setCrawlSource(data.source);
      setStep("result");
    } catch (e) {
      const msg = e instanceof Error && e.message === "no-branches"
        ? "Ingen afdelinger fundet for dette domæne."
        : "Noget gik galt. Prøv igen.";
      setErrorMsg(msg);
      setStep("error");
    }
  }, [domain]);

  function handleAllow() {
    setStep("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchAndFind(pos.coords.latitude, pos.coords.longitude),
      () => {
        setGeoError(true);
        setStep("manual");
      },
      { timeout: 10000 }
    );
  }

  function handleManual() {
    setGeoError(false);
    setStep("manual");
  }

  function handleMapClick(lat: number, lng: number) {
    setClickedLat(lat);
    setClickedLng(lng);
    fetchAndFind(lat, lng);
  }

  // Loading spinner shared between "locating" and "fetching"
  const loadingMessage = step === "locating"
    ? "Henter din placering..."
    : "Finder nærmeste afdeling...";

  return (
    <main className="flex flex-col min-h-screen max-w-md mx-auto px-4">
      {/* Consent overlay */}
      {step === "consent" && (
        <ConsentBanner
          companyName={domain}
          onAllow={handleAllow}
          onManual={handleManual}
        />
      )}

      {/* Loading states */}
      {(step === "locating" || step === "fetching") && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "#267D39", borderTopColor: "transparent" }}
          />
          <p className="text-base font-medium text-gray-700">{loadingMessage}</p>
        </div>
      )}

      {/* Manual map picker */}
      {step === "manual" && (
        <div className="flex-1 flex flex-col py-8 gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Vælg din position</h1>
            {geoError && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                Browseren gav ikke adgang til din placering — vælg manuelt.
              </p>
            )}
          </div>
          <Map
            mode="clickable"
            height="340px"
            initialCenter={[56.0, 10.5]}
            initialZoom={6}
            onLocationSelect={handleMapClick}
            selectedLat={clickedLat}
            selectedLng={clickedLng}
          />
          <p className="text-xs text-gray-400 text-center">
            Klik på kortet for at vælge din position
          </p>
        </div>
      )}

      {/* Result */}
      {step === "result" && nearest && (
        <div className="flex-1 flex flex-col py-8 gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#267D39" }}
            >
              <CheckCircle size={36} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Nærmeste afdeling fundet</h1>
          </div>

          <BranchCard branch={nearest.branch} distanceKm={nearest.distanceKm} showSourceBadge={false} />

          <div className="flex flex-col gap-3">
            {nearest.branch.phone && (
              <a
                href={`tel:${nearest.branch.phone}`}
                className="flex items-center justify-center gap-2 w-full font-semibold px-6 py-3 rounded-lg text-white transition-opacity hover:opacity-90 active:scale-95"
                style={{ backgroundColor: "#267D39" }}
              >
                <Phone size={18} />
                Ring op
              </a>
            )}
            {nearest.branch.email && (
              <a
                href={`mailto:${nearest.branch.email}`}
                className="flex items-center justify-center gap-2 w-full font-semibold px-6 py-3 rounded-lg transition-all active:scale-95"
                style={{ border: "2px solid #267D39", color: "#267D39" }}
              >
                <Mail size={18} />
                Send email
              </a>
            )}
          </div>

          {crawlSource && <DataSourceBadge source={crawlSource} domain={domain} />}
        </div>
      )}

      {/* Error */}
      {step === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-4 text-sm text-red-700 w-full">
            {errorMsg}
          </div>
          <button
            onClick={() => { setStep("consent"); setErrorMsg(""); }}
            className="w-full font-semibold px-6 py-3 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#267D39" }}
          >
            Prøv igen
          </button>
        </div>
      )}

      {/* GDPR footer */}
      {step !== "consent" && (
        <footer className="py-4 text-center">
          <p className="text-xs text-gray-400">
            Din lokation bruges kun til at finde nærmeste afdeling og gemmes ikke.
          </p>
        </footer>
      )}
    </main>
  );
}
