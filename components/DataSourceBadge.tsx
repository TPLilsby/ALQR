"use client";
import { DataSource } from "@/types/branch";

interface DataSourceBadgeProps {
  source: DataSource;
  domain?: string;
}

export default function DataSourceBadge({ source, domain }: DataSourceBadgeProps) {
  if (source === "fallback") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
        ⚠ Bruger forudindlæst data — live crawling fejlede
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-800 border border-green-200">
      ✓ Live data{domain ? ` fra ${domain}` : ""}
    </span>
  );
}
