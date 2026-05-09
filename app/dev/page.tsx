"use client";
import { useState } from "react";
import BranchCard from "@/components/BranchCard";
import DataSourceBadge from "@/components/DataSourceBadge";
import DemoBanner from "@/components/DemoBanner";
import StepIndicator from "@/components/StepIndicator";
import ConsentBanner from "@/components/ConsentBanner";
import QRCode from "@/components/QRCode";
import Map from "@/components/Map";
import { gsvBranches } from "@/data/fallback-branches";

const testBranch = gsvBranches[2]; // GSV Greve — har phone, email, sourceUrl
const testBranchFallback = { ...gsvBranches[7], source: "fallback" as const }; // GSV København

export default function DevPage() {
  const [consentVisible, setConsentVisible] = useState(false);
  const [clickedPos, setClickedPos] = useState<{ lat: number; lng: number } | null>(
    null
  );

  return (
    <main className="max-w-md mx-auto py-8 space-y-10">
      <div className="px-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Dev — Komponent Isolation
        </h1>
        <p className="text-sm text-gray-500 mt-1">Kun synlig i development</p>
      </div>

      {/* DemoBanner — fuld bredde, ingen px-4 */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold px-4">DemoBanner</h2>
        <DemoBanner />
      </section>

      {/* DataSourceBadge */}
      <section className="px-4 space-y-2">
        <h2 className="text-lg font-semibold">DataSourceBadge</h2>
        <div className="flex flex-wrap gap-2">
          <DataSourceBadge source="crawled" domain="gsv.dk" />
          <DataSourceBadge source="cached" domain="gsv.dk" />
          <DataSourceBadge source="fallback" />
        </div>
      </section>

      {/* StepIndicator */}
      <section className="px-4 space-y-4">
        <h2 className="text-lg font-semibold">StepIndicator</h2>
        <StepIndicator currentStep={1} />
        <StepIndicator currentStep={2} />
        <StepIndicator currentStep={3} />
      </section>

      {/* BranchCard */}
      <section className="px-4 space-y-4">
        <h2 className="text-lg font-semibold">BranchCard</h2>
        <BranchCard
          branch={{ ...testBranch, source: "crawled" }}
          distanceKm={3.7}
        />
        <BranchCard branch={testBranchFallback} />
        <BranchCard
          branch={{ ...gsvBranches[0], source: "cached" }}
          distanceKm={18.8}
        />
      </section>

      {/* QRCode */}
      <section className="px-4">
        <h2 className="text-lg font-semibold mb-4">QRCode</h2>
        <QRCode
          url="https://alqr.dk/s?d=gsv.dk"
          companyName="GSV Materieludlejning"
        />
      </section>

      {/* Map — clickable */}
      <section className="px-4">
        <h2 className="text-lg font-semibold mb-2">Map (clickable)</h2>
        <Map
          mode="clickable"
          height="220px"
          onLocationSelect={(lat, lng) => setClickedPos({ lat, lng })}
          selectedLat={clickedPos?.lat}
          selectedLng={clickedPos?.lng}
        />
        {clickedPos ? (
          <p className="text-sm text-gray-500 mt-1">
            Klikket: {clickedPos.lat.toFixed(4)}, {clickedPos.lng.toFixed(4)}
          </p>
        ) : (
          <p className="text-sm text-gray-400 mt-1">Klik på kortet for at vælge position</p>
        )}
      </section>

      {/* Map — readonly */}
      <section className="px-4">
        <h2 className="text-lg font-semibold mb-2">Map (readonly)</h2>
        <Map
          mode="readonly"
          height="220px"
          branches={gsvBranches.slice(0, 6)}
          userLat={55.676}
          userLng={12.568}
        />
      </section>

      {/* ConsentBanner */}
      <section className="px-4 pb-8">
        <h2 className="text-lg font-semibold mb-2">ConsentBanner</h2>
        <button
          onClick={() => setConsentVisible(true)}
          className="w-full border border-green-brand text-green-brand font-semibold px-6 py-3 rounded-lg hover:bg-green-50 active:scale-95 transition-all"
        >
          Åbn ConsentBanner
        </button>
        {consentVisible && (
          <ConsentBanner
            companyName="GSV Materieludlejning"
            onAllow={() => {
              setConsentVisible(false);
            }}
            onManual={() => {
              setConsentVisible(false);
            }}
          />
        )}
      </section>
    </main>
  );
}
