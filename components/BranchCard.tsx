"use client";
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react";
import { Branch } from "@/types/branch";
import DataSourceBadge from "./DataSourceBadge";

interface BranchCardProps {
  branch: Branch;
  distanceKm?: number;
  showSourceBadge?: boolean;
  className?: string;
}

function formatDistance(km: number): string {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export default function BranchCard({
  branch,
  distanceKm,
  showSourceBadge = true,
  className,
}: BranchCardProps) {
  const displayDomain = branch.sourceUrl ? extractDomain(branch.sourceUrl) : null;

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
        {distanceKm !== undefined && (
          <span className="shrink-0 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
            {formatDistance(distanceKm)}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500 mt-0.5">{branch.company}</p>

      <div className="mt-3 space-y-2">
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
          <span className="text-sm text-gray-600">{branch.address}</span>
        </div>

        {branch.phone && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400 shrink-0" />
            <a
              href={`tel:${branch.phone}`}
              className="text-sm text-green-brand hover:underline"
            >
              {branch.phone}
            </a>
          </div>
        )}

        {branch.email && (
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-gray-400 shrink-0" />
            <a
              href={`mailto:${branch.email}`}
              className="text-sm text-green-brand hover:underline"
            >
              {branch.email}
            </a>
          </div>
        )}
      </div>

      {(showSourceBadge && branch.source || displayDomain) && (
        <div className="mt-3 flex items-center flex-wrap gap-2">
          {showSourceBadge && branch.source && (
            <DataSourceBadge source={branch.source} domain={displayDomain ?? undefined} />
          )}
          {displayDomain && (
            <a
              href={branch.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-green-brand hover:underline ml-auto"
            >
              Se på {displayDomain}
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
