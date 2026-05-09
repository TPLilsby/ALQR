import * as cheerio from "cheerio";
import { CrawlResult, Branch, DataSource } from "@/types/branch";
import { extractBranchesFromHTML, trimHTML } from "./ai-extract";
import { fallbackBranches } from "@/data/fallback-branches";

const LINK_PATTERN = /(afdeling|location|branch|kontakt|find)/i;

const PROBE_PATHS = ["gsv-afdelinger", "afdelinger", "kontakt", "locations", "branches"];

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
    } catch {}
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

  // Trin 1: find første 200-OK kandidat (linket fra forside + probe-paths)
  const linkedUrls = findCandidateUrls(homepageHtml, baseUrl);
  const probeUrls = PROBE_PATHS.map((p) => `${baseUrl}/${p}/`);
  const candidateUrls = [...new Set([...linkedUrls, ...probeUrls])];

  let overviewUrl: string | null = null;
  let overviewHtml: string | null = null;

  for (const url of candidateUrls) {
    const html = await fetchPage(url);
    console.log(`CRAWLER: ${url} →`, html ? `200 (${html.length} chars)` : "null/404");
    if (html) {
      overviewUrl = url;
      overviewHtml = html;
      break;
    }
  }

  // Trin 2: parse oversigts-siden for undersider (generisk — matcher hvilken som helst oversigt)
  let htmlToSend: string;

  if (overviewUrl && overviewHtml) {
    const $overview = cheerio.load(overviewHtml);
    const branchUrls: string[] = [];

    $overview("a[href]").each((_, el) => {
      const href = $overview(el).attr("href") ?? "";
      try {
        const abs = new URL(href, overviewUrl!).href;
        if (abs.startsWith(overviewUrl!) && abs !== overviewUrl) {
          branchUrls.push(abs);
        }
      } catch {}
    });

    const uniqueBranchUrls = [...new Set(branchUrls)].slice(0, 30);
    console.log("CRAWLER: Found branch URLs:", uniqueBranchUrls);

    if (uniqueBranchUrls.length > 0) {
      // Trin 3: fetch alle branch-sider parallelt
      const branchResults = await Promise.all(
        uniqueBranchUrls.map(async (url) => ({ url, html: await fetchPage(url) }))
      );
      const validBranches = branchResults.filter((r): r is { url: string; html: string } => r.html !== null);
      console.log("CRAWLER: Fetched", validBranches.length, "branch pages");

      // Trin 4: udtræk kun kontaktinfo fra div.text-block__body per side
      const blocks = validBranches.map(({ url, html }) => {
        const $p = cheerio.load(html);
        const texts: string[] = [];
        $p("div.text-block__body").each((_, el) => {
          const text = $p(el).text().trim();
          if (text) texts.push(text);
        });
        const content = texts.length > 0 ? texts.join("\n") : trimHTML(html).slice(0, 2000);
        return `---PAGE: ${url}---\n${content}`;
      });

      htmlToSend = blocks.join("\n\n");
      console.log("CRAWLER: Compact text length:", htmlToSend.length);
    } else {
      // Ingen undersider — send oversigts-siden direkte
      console.log("CRAWLER: No branch sub-pages found, using overview page directly");
      htmlToSend = trimHTML(overviewHtml);
    }
  } else {
    // Ingen kandidat fandt noget — fald tilbage til forsiden
    console.log("CRAWLER: No candidate pages found, using homepage");
    htmlToSend = trimHTML(homepageHtml);
  }

  const $home = cheerio.load(homepageHtml);
  const company =
    $home("meta[property='og:site_name']").attr("content") ||
    $home("title").text().split(/[|\-–]/)[0].trim() ||
    domain;

  const country = guessCountry(domain);
  console.log("CRAWLER: About to call Gemini, HTML length:", htmlToSend.length);
  console.log("CRAWLER: HTML preview:", htmlToSend.substring(0, 500));
  const partial = await extractBranchesFromHTML(htmlToSend, company, country, domain);
  console.log("CRAWLER: Gemini returned", partial.length, "branches");

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
    return await withTimeout(doCrawl(domain), 50_000);
  } catch (error) {
    console.log("CRAWLER: Timeout or error:", error);
    return makeFallbackResult(domain);
  }
}
