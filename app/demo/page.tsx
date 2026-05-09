"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DemoBanner from "@/components/DemoBanner";
import Map from "@/components/Map";
import BranchCard from "@/components/BranchCard";
import DataSourceBadge from "@/components/DataSourceBadge";
import QRCode from "@/components/QRCode";
import { Branch, CrawlResult, DataSource } from "@/types/branch";
import { findNearestBranch } from "@/lib/distance";

const COMPANIES = [
  { label: "GSV Materieludlejning", domain: "gsv.dk" },
  { label: "Kiloutou", domain: "kiloutou.fr" },
];

const MAP_CONFIG: Record<string, { center: [number, number]; zoom: number }> = {
  "gsv.dk": { center: [56.0, 10.5], zoom: 6 },
  "kiloutou.fr": { center: [50.0, 10.0], zoom: 4 },
};

export default function DemoPage() {
  return (
    <Suspense>
      <DemoContent />
    </Suspense>
  );
}

function DemoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialDomain = searchParams.get("domain") ?? "gsv.dk";
  const validInitial = COMPANIES.some((c) => c.domain === initialDomain)
    ? initialDomain
    : "gsv.dk";

  const [selectedDomain, setSelectedDomain] = useState(validInitial);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [crawlSource, setCrawlSource] = useState<DataSource | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clickedLat, setClickedLat] = useState<number | undefined>();
  const [clickedLng, setClickedLng] = useState<number | undefined>();
  const [nearest, setNearest] = useState<{ branch: Branch; distanceKm: number } | null>(null);

  const fetchBranches = useCallback(async (domain: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      if (!res.ok) throw new Error();
      const data: CrawlResult = await res.json();
      setBranches(data.branches);
      setCrawlSource(data.source);
    } catch {
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches(selectedDomain);
  }, [selectedDomain, fetchBranches]);

  function handleDomainChange(domain: string) {
    setSelectedDomain(domain);
    setClickedLat(undefined);
    setClickedLng(undefined);
    setNearest(null);
  }

  function handleLocationSelect(lat: number, lng: number) {
    setClickedLat(lat);
    setClickedLng(lng);
    const result = findNearestBranch(lat, lng, branches);
    setNearest(result);
  }

  const mapConfig = MAP_CONFIG[selectedDomain] ?? MAP_CONFIG["gsv.dk"];
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const qrUrl = `${origin}/scan?domain=${selectedDomain}`;
  const companyLabel = COMPANIES.find((c) => c.domain === selectedDomain)?.label ?? selectedDomain;

  return (
    <div className="flex flex-col min-h-screen">
      <DemoBanner />

      <main className="flex flex-col max-w-md mx-auto w-full px-4 py-8 gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Simulator</h1>
          <p className="text-sm text-gray-500 mt-1">
            Klik på kortet for at simulere en scanning fra en given position.
          </p>
        </div>

        {/* Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="company-select">
            Vælg virksomhed
          </label>
          <select
            id="company-select"
            value={selectedDomain}
            onChange={(e) => handleDomainChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 bg-white focus:outline-none"
          >
            {COMPANIES.map((c) => (
              <option key={c.domain} value={c.domain}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Kort */}
        <div className="flex flex-col gap-2">
          <Map
            mode="clickable"
            height="300px"
            initialCenter={mapConfig.center}
            initialZoom={mapConfig.zoom}
            flyToCenter={mapConfig.center}
            flyToZoom={mapConfig.zoom}
            onLocationSelect={handleLocationSelect}
            selectedLat={clickedLat}
            selectedLng={clickedLng}
          />
          {!clickedLat && (
            <p className="text-xs text-gray-400 text-center">
              Klik på kortet for at vælge din position
            </p>
          )}
        </div>

        {/* Resultat */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <div
              className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "#267D39", borderTopColor: "transparent" }}
            />
          </div>
        )}

        {!isLoading && nearest && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-700">Nærmeste afdeling:</p>
            <BranchCard branch={nearest.branch} distanceKm={nearest.distanceKm} showSourceBadge={false} />
            {crawlSource && <DataSourceBadge source={crawlSource} domain={selectedDomain} />}
          </div>
        )}

        {!isLoading && clickedLat && !nearest && (
          <p className="text-sm text-gray-500 text-center py-2">
            Ingen afdelinger fundet i nærheden.
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* QR preview */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-base font-semibold text-gray-900">QR-kode preview</p>
            <p className="text-sm text-gray-500 mt-1">
              Dette er QR-koden du printer ud. Scan den med telefonen for at prøve det rigtige flow.
            </p>
          </div>

          <div className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-xl p-6 gap-3">
            <QRCode url={qrUrl} companyName={companyLabel} displaySize={160} />
            <p className="text-xs text-gray-400">{qrUrl}</p>
          </div>

          <button
            onClick={() => router.push(`/scan?domain=${selectedDomain}`)}
            className="w-full font-semibold px-6 py-3 rounded-lg text-center transition-all active:scale-95"
            style={{ border: "2px solid #267D39", color: "#267D39" }}
          >
            Prøv som bruger
          </button>
        </div>
      </main>
    </div>
  );
}
