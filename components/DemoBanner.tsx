"use client";
import { AlertTriangle } from "lucide-react";

interface DemoBannerProps {
  message?: string;
}

const DEFAULT_MESSAGE =
  "Simuleret position. I det færdige produkt bruges din rigtige placering automatisk.";

export default function DemoBanner({ message = DEFAULT_MESSAGE }: DemoBannerProps) {
  return (
    <div className="bg-amber-100 border-b border-amber-300 text-amber-800 px-4 py-3 w-full flex items-start gap-2 text-sm">
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold">DEMO-TILSTAND</span>
        {" — "}
        <span>{message}</span>
      </div>
    </div>
  );
}
