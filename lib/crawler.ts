import * as cheerio from "cheerio";
import { CrawlResult, Branch, DataSource } from "@/types/branch";
import { extractBranchesFromHTML, trimHTML } from "./ai-extract";
import { fallbackBranches } from "@/data/fallback-branches";

// Plural patterns = oversigts-sider (højere prioritet end singular)
const OVERVIEW_PATTERNS = [
  /afdelinger/i,
  /\blocations\b/i,
  /\bbranches\b/i,
  /find-us/i,
  /\bsektioner\b/i,
];

const BRANCH_PATTERNS = [
  /\bafdeling\b/i,
  /\bkontakt\b/i,
  /find-os/i,
  /\blokation/i,
  /\bbranch\b/i,
  /store-locator/i,
];

// Direkte probe-paths — forsøges selv hvis ikke linket fra forsiden
const PROBE_PATHS = ["afdelinger", "kontakt", "find-os", "locations"];

const TLD_COUNTRY: Record<string, string> = {
  dk: "DK", fr: "FR", de: "DE", es: "ES",
  it: "IT", pl: "PL", uk: "GB", nl: "NL",
  se: "SE", no: "NO", com: "FR",
};

function guessCountry(domain: string): string {
  const tld = domain.split(".").pop()?.toLowerCase() ?? "";
  return TLD_COUNTRY[tld] ?? "DK";
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ALQR/1.0 (tl@veng.it)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function findCandidateUrls(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const overview: string[] = [];
  const secondary: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!href || /^(mailto:|tel:|#|javascript:)/.test(href)) return;
    try {
      const url = new URL(href, baseUrl).href;
      if (!url.startsWith(baseUrl)) return;
      if (OVERVIEW_PATTERNS.some((p) => p.test(href))) {
        overview.push(url);
      } else if (BRANCH_PATTERNS.some((p) => p.test(href))) {
        secondary.push(url);
      }
    } catch {
      // ugyldig URL
    }
  });

  // Probe-paths tilføjes direkte (filtreres ved fetch-fejl)
  const probed = PROBE_PATHS.map((p) => `${baseUrl}/${p}/`);

  // Oversigts-sider først, derefter sekundære, derefter probe
  const candidates = [...new Set([...overview, ...secondary, ...probed])];
  return candidates.slice(0, 5);
}

function makeFallbackResult(domain: string): CrawlResult {
  const branches = (fallbackBranches[domain] ?? []).map((b) => ({
    ...b,
    source: "fallback" as DataSource,
  }));
  return {
    branches,
    source: "fallback",
    crawledAt: new Date().toISOString(),
    domain,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

async function doCrawl(domain: string): Promise<CrawlResult> {
  const baseUrl = `https://${domain}`;

  const homepageHtml = await fetchPage(baseUrl);
  if (!homepageHtml) throw new Error("Homepage unreachable");

  const candidateUrls = findCandidateUrls(homepageHtml, baseUrl);

  // Hent alle kandidatsider parallelt — inkl. oversigts-sider som gsv.dk/gsv-afdelinger/
  const pages = await Promise.all(candidateUrls.map((url) => fetchPage(url)));
  const validPages = pages.filter((p): p is string => p !== null);

  // Kombiner forside + alle fundne sider — Gemini ser det hele
  const combinedHtml = [homepageHtml, ...validPages].join("\n");
  const trimmed = trimHTML(combinedHtml);

  const $ = cheerio.load(homepageHtml);
  const company =
    $("meta[property='og:site_name']").attr("content") ||
    $("title").text().split(/[|\-–]/)[0].trim() ||
    domain;

  const country = guessCountry(domain);
  const partial = await extractBranchesFromHTML(trimmed, company, country, domain);

  // lat/lng sættes til 0 — geocoding og merge med fallback-koordinater håndteres i Sprint 4
  const branches: Branch[] = partial.map((b) => ({
    ...b,
    lat: 0,
    lng: 0,
    source: "crawled" as DataSource,
  }));

  return {
    branches,
    source: "crawled",
    crawledAt: new Date().toISOString(),
    domain,
  };
}

export async function crawlDomain(domain: string): Promise<CrawlResult> {
  try {
    return await withTimeout(doCrawl(domain), 8_000);
  } catch {
    return makeFallbackResult(domain);
  }
}
