import * as cheerio from "cheerio";
import { CrawlResult, Branch, DataSource } from "@/types/branch";
import { extractBranchesFromHTML, trimHTML } from "./ai-extract";
import { fallbackBranches } from "@/data/fallback-branches";

const LINK_PATTERN = /(afdeling|location|branch|kontakt|find)/i;

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
  const found: string[] = [];
  const baseDomain = new URL(baseUrl).hostname.replace(/^www\./, "");

  const allHrefs: string[] = [];
  $("a[href]").each((_, el) => { allHrefs.push($(el).attr("href") ?? ""); });
  console.log("CRAWLER: Total links on page:", allHrefs.length);
  console.log("CRAWLER: First 20 hrefs:", allHrefs.slice(0, 20));
  console.log("CRAWLER: Pattern matches:", allHrefs.filter(h => LINK_PATTERN.test(h)).slice(0, 10));

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!href || /^(mailto:|tel:|#|javascript:)/.test(href)) return;
    if (!LINK_PATTERN.test(href)) return;
    try {
      const url = new URL(href, baseUrl).href;
      const urlDomain = new URL(url).hostname.replace(/^www\./, "");
      if (urlDomain !== baseDomain) return;
      found.push(url);
    } catch {
      // ugyldig URL
    }
  });

  return [...new Set(found)].slice(0, 5);
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
  console.log("CRAWLER: Fetching URLs:", candidateUrls);

  // Hent kandidatsider parallelt
  const pages = await Promise.all(candidateUrls.map((url) => fetchPage(url)));
  const validPages = pages.filter((p): p is string => p !== null);

  // Send kun kandidatsidernes HTML til Gemini — forsiden har ikke afdelingsdata
  // Fallback til forsiden hvis ingen kandidater blev hentet
  const htmlToSend = validPages.length > 0 ? validPages.join("\n") : homepageHtml;
  const trimmed = trimHTML(htmlToSend);

  const $ = cheerio.load(homepageHtml);
  const company =
    $("meta[property='og:site_name']").attr("content") ||
    $("title").text().split(/[|\-–]/)[0].trim() ||
    domain;

  const country = guessCountry(domain);
  console.log("CRAWLER: About to call Gemini, HTML length:", trimmed.length);
  console.log("CRAWLER: HTML preview:", trimmed.substring(0, 500));
  const partial = await extractBranchesFromHTML(trimmed, company, country, domain);
  console.log("CRAWLER: Gemini returned", partial.length, "branches");

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
    return await withTimeout(doCrawl(domain), 25_000);
  } catch (error) {
    console.log("CRAWLER: Timeout or error:", error);
    return makeFallbackResult(domain);
  }
}
