"use client";
import { MapPin, Check } from "lucide-react";

interface ConsentBannerProps {
  companyName: string;
  onAllow: () => void;
  onManual: () => void;
}

const GDPR_BULLETS = [
  "Din placering gemmes ikke",
  "Deles ikke med tredjepart",
  "Behandles kun i din browser",
];

export default function ConsentBanner({
  companyName,
  onAllow,
  onManual,
}: ConsentBannerProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <MapPin size={32} className="text-green-brand" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 text-center">
          Brug din placering?
        </h2>
        <p className="text-sm text-gray-500 text-center mt-2">
          ALQR vil bruge din placering for at finde den nærmeste afdeling af{" "}
          {companyName}.
        </p>

        <div className="mt-4 space-y-2">
          {GDPR_BULLETS.map((text) => (
            <div key={text} className="flex items-center gap-2">
              <Check size={16} className="text-green-brand shrink-0" />
              <span className="text-sm text-gray-600">{text}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={onAllow}
            className="w-full bg-green-brand text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 active:scale-95 transition-all"
          >
            Tillad placering
          </button>
          <button
            onClick={onManual}
            className="w-full border border-green-brand text-green-brand font-semibold px-6 py-3 rounded-lg hover:bg-green-50 active:scale-95 transition-all"
          >
            Vælg manuelt i stedet
          </button>
        </div>
      </div>
    </div>
  );
}
