# TASKS.md — ALQR Sprint Opgaver

**Legende:** ⬜ Ikke startet | 🔄 I gang | ✅ Færdig | ❌ Blokeret

---

## Sprint 1 — Projekt Setup ✅ Færdig (2026-05-09)

- ✅ `1.1` Kør `npx create-next-app@latest alqr` med TypeScript, Tailwind, App Router, src/ off
- ✅ `1.2` Installer npm packages: `leaflet @types/leaflet qrcode @types/qrcode cheerio @types/cheerio @google/generative-ai lucide-react`
- ✅ `1.3` Konfigurer farver — Tailwind v4: `green-brand: '#267D39'` sat via `@theme inline` i `globals.css`
- ✅ `1.4` Opret `.env.local` med `GEMINI_API_KEY=...`
- ✅ `1.5` Opret mappestruktur: `/lib`, `/data`, `/components`, `/types`
- ✅ `1.6` Sæt global CSS: hvid baggrund (`#FFFFFF`), `text-gray-900`, fjern default margins
- ✅ `1.7` Verificer `npm run build` kører uden fejl (5 static pages, 0 TypeScript errors)

---

## Sprint 2 — Data Layer ✅ Færdig (2026-05-09)

- ✅ `2.1` Opret `/types/branch.ts` — `Branch` (m. id, company, country), `CrawlResult`, `DataSource`
- ✅ `2.2` Opret `/data/fallback-branches.ts` med GSV Materieludlejning — alle 24 danske afdelinger
- ✅ `2.3` Tilføj Kiloutou — 10 europæiske afdelinger (FR, DE, ES, IT, PL) til fallback-branches.ts
- ✅ `2.4` Opret `/lib/distance.ts` — `haversineDistance` + `findNearestBranch<T>` generic
- ✅ `2.5` Unit-test: 5/5 tests bestået (luftlinje Greve→Kbh=18.8km, Aarhus→Odense=87.2km)

---

## Sprint 3 — Crawler + AI + Geocode + Cache ✅ Færdig (2026-05-09)

- ✅ `3.1` Opret `/lib/cache.ts` — `Map<string, CacheEntry>`, get/set/has, 72t TTL, lazy expiration
- ✅ `3.2` Opret `/lib/geocode.ts` — Nominatim, `ALQR/1.0 (tl@veng.it)` UA, 1100ms sleep, max 5 branches
- ✅ `3.3` Opret `/lib/ai-extract.ts` — Gemini 1.5 Flash, `extractBranchesFromHTML`, `trimHTML`
- ✅ `3.4` Gemini prompt: udtræk ALLE afdelinger, returnér raw JSON array (ikke markdown)
- ✅ `3.5` Opret `/lib/crawler.ts` — oversigts-sider prioriteret, probe-paths, parallel fetch, 8 sek timeout
- ✅ `3.6` Timeout wrapper via `Promise.race()` — fallback ved timeout eller fejl
- ⬜ `3.7` Test crawler manuelt med gsv.dk — **blokeret** (SSL-certifikat fejl i lokalt netværk, flyttes til Sprint 10 på Vercel)

---

## Sprint 4 — API Route ✅ Færdig (2026-05-09)

- ✅ `4.1` Opret `/app/api/crawl/route.ts` med POST handler (Next.js 15 App Router)
- ✅ `4.2` Flow: cache-check → crawlDomain → fallback-override → mergeCoordinates → cacheSet
- ✅ `4.3` Fallback aktiveres ved: crawl timeout/fejl ELLER branches.length === 0 + kendt domæne
- ✅ `4.4` Returner `{ branches, source, crawledAt, domain }` — source:"cached" ved cache-hit
- ✅ `4.5` Test: gsv.dk → source:"fallback", 24 branches, koordinater OK
- ✅ `4.6` Test: cache-hit → source:"cached" (top-level + branches). Ugyldig input → 400. Domain-normalisering OK

---

## Sprint 5 — Delte Komponenter ✅ Færdig (2026-05-09)

- ✅ `5.1` `BranchCard.tsx` — distance badge, tel/mailto links, domain fra sourceUrl, DataSourceBadge
- ✅ `5.2` `DataSourceBadge.tsx` — grøn (crawled/cached) / amber (fallback), domain-tekst optional
- ✅ `5.3` `ConsentBanner.tsx` — fixed overlay, GDPR bullets, obligatorisk valg
- ✅ `5.4` `DemoBanner.tsx` — amber banner, AlertTriangle ikon, optional message prop
- ✅ `5.5` `Map.tsx` + `MapInner.tsx` — to-lags arkitektur, dynamic(ssr:false), clickable/readonly modes
- ✅ `5.6` `QRCode.tsx` — dual-size (200/400px), cancelled-flag pattern, download via <a download>
- ✅ `5.7` `StepIndicator.tsx` — 3 trin, CSS linje, completed/active/pending states
- ✅ `5.8` `/app/dev/page.tsx` — alle 7 komponenter i isolation med GSV-testdata

---

## Sprint 6 — Landing Page ✅ Færdig (2026-05-09)

- ✅ `6.1` Hero: ALQR logo (`<p>`), tagline, `<h1>` slogan "Scan og du vil finde"
- ✅ `6.2` Tre CTA-knapper: "Opret QR-kode" → /create (primary) + "Prøv demo" → /demo (secondary) + "Scan QR-kode" → /scan?domain=gsv.dk (ghost/link)
- ✅ `6.3` 4 features med `<Check>` ikon fra lucide-react
- ✅ `6.4` Footer: "Fortroligt — ALQR © 2026"
- ✅ `6.5` Server Component, `min-h-screen flex flex-col`, `max-w-md`, touch targets 48px

---

## Sprint 7 — Create Page ✅ Færdig (2026-05-09)

- ✅ `7.1` `/app/create/page.tsx` — step 1: domæne-input + virksomhedsnavn input + info-boks
- ✅ `7.2` Step 2: loading/progress state mens crawler kører (spinner + statusbeskeder)
- ✅ `7.3` Step 3: QR-kode klar — vis QR, DataSourceBadge, antal afdelinger fundet
- ✅ `7.4` Download QR-kode som PNG (via QRCode-komponent)
- ✅ `7.5` "Kopier link" knap (copy to clipboard) med "Kopieret!" feedback
- ✅ `7.6` "Prøv i simulator" knap (→ /demo?domain=...)
- ✅ `7.7` Vis URL preview: `https://alqr.dk/scan?domain=[domæne]` + "Prøv som bruger" knap

---

## Sprint 8 — Demo/Simulator ✅ Færdig (2026-05-09)

- ✅ `8.1` `/app/demo/page.tsx` — DemoBanner øverst, Suspense wrapper
- ✅ `8.2` Domæne-dropdown (GSV + Kiloutou som muligheder)
- ✅ `8.3` Klikbart Leaflet-kort — GSV: Danmark zoom 6, Kiloutou: Europa zoom 4 (animeret flyTo)
- ✅ `8.4` Ved klik: sæt position, beregn nærmeste afdeling, vis BranchCard
- ✅ `8.5` DataSourceBadge i resultatet
- ✅ `8.6` QR-kode preview sektion med forklaring
- ✅ `8.7` "Prøv som bruger" knap (→ /scan?domain=...)

---

## Sprint 9 — Scan-Flow ✅ Færdig (2026-05-09)

- ✅ `9.1` `/app/scan/page.tsx` — læs `?domain=` query param, Suspense wrapper
- ✅ `9.2` Vis ConsentBanner som første step (overlay)
- ✅ `9.3` "Tillad placering" → Geolocation API → fetchAndFind
- ✅ `9.4` "Vælg manuelt" → klikbart Leaflet-kort → fetchAndFind ved klik
- ✅ `9.5` Kald `/api/crawl` med domæne, `findNearestBranch` client-side
- ✅ `9.6` Vis resultat: grøn checkmark, BranchCard, "Ring op" + "Send email" knapper
- ✅ `9.7` DataSourceBadge i resultat
- ✅ `9.8` GDPR footer note på alle steps efter consent
- ✅ `9.9` Geo-afvisning → fallback til manuelt kort med amber-besked

---

## Sprint 10 — Test + Polish 🔄 I gang

- ⬜ `10.1` Live test crawler med gsv.dk — verificer live badge vises (kræver Vercel)
- ⬜ `10.2` Live test crawler med kiloutou.fr (lokalt returnerer fallback — SSL-issue)
- ⬜ `10.3` Test fallback-flow: brug fiktivt domæne, verificer amber badge vises
- ⬜ `10.4` Mobil-test på Safari iOS (geolokation, touch targets, fonts)
- ✅ `10.5` `npm run build` — 0 fejl, 0 warnings, 7 routes (ESLint FlatCompat fix)
- ⬜ `10.6` Sæt `GEMINI_API_KEY` som environment variable på Vercel
- ⬜ `10.7` Deploy til Vercel + verificer alle routes fungerer
- ⬜ `10.8` Test scan-flow på rigtig telefon med rigtig QR-kode
- ⬜ `10.9` Opdater PROCESSLOG.md med endelig status

---