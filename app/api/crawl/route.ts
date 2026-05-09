import { NextRequest, NextResponse } from "next/server";
import { crawlDomain } from "@/lib/crawler";
import { get as cacheGet, set as cacheSet } from "@/lib/cache";
import { mergeCoordinates } from "@/lib/merge-coords";
import { fallbackBranches } from "@/data/fallback-branches";
import { DataSource } from "@/types/branch";

function normalizeDomain(raw: string): string | null {
  const domain = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];

  if (!domain.includes(".")) return null;
  if (domain.length > 253) return null;
  if (!/^[a-z0-9][a-z0-9\-.]*[a-z0-9]$/.test(domain)) return null;

  return domain;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("domain" in body)) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  const rawDomain = (body as Record<string, unknown>).domain;
  if (typeof rawDomain !== "string") {
    return NextResponse.json({ error: "domain must be a string" }, { status: 400 });
  }

  // 2. Normaliser og valider
  const domain = normalizeDomain(rawDomain);
  if (!domain) {
    return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
  }

  // 3. Cache-check
  const cached = cacheGet(domain);
  if (cached) {
    return NextResponse.json(cached);
  }

  // 4. Crawl (returnerer altid CrawlResult — aldrig throw)
  let result = await crawlDomain(domain);

  // 5. Fallback-override: crawl fandt 0 branches men vi har fallback-data
  const knownBranches = fallbackBranches[domain];
  if (result.branches.length === 0 && knownBranches !== undefined) {
    result = {
      branches: knownBranches.map((b) => ({
        ...b,
        source: "fallback" as DataSource,
      })),
      source: "fallback",
      crawledAt: new Date().toISOString(),
      domain,
    };
  }

  // 6. Merge koordinater for crawlede resultater fra kendte domæner
  if (result.source === "crawled" && knownBranches !== undefined) {
    result = {
      ...result,
      branches: mergeCoordinates(result.branches, knownBranches),
    };
  }

  // 7. Gem i cache — source bevares ("crawled" / "fallback")
  cacheSet(domain, result);

  // 8. Returner
  return NextResponse.json(result);
}
