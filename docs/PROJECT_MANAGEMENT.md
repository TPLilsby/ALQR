# PROJECT_MANAGEMENT.md — ALQR

## Projektbeskrivelse
**ALQR (Active Location QR)** er en lokationsbaseret QR-routing service.
Én QR-kode → scan → find nærmeste afdeling automatisk.
Målgruppe: Virksomheder med fysiske køretøjer, maskiner, flyers.

**Projektstart:** 2026-05-08
**Ansvarlig:** Tobias Lilsby (tl@veng.it)
**Deployment:** Vercel (free tier)

---

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| M1 | Projekt setup + dokumentation | ✅ Klar |
| M2 | Data layer + crawler fungerer | ✅ Klar |
| M3 | Alle 4 sider bygget | ✅ Klar |
| M4 | Live crawler testet med gsv.dk | ⬜ Afventer Vercel |
| M5 | Deployment på Vercel | ⬜ Afventer Vercel |

---

## Sprint Plan

### Sprint 1 — Projekt Setup
**Mål:** Fungerende Next.js projekt med Tailwind og alle dependencies installeret.
**Estimat:** 30 min
**Indhold:**
- `npx create-next-app@latest` med TypeScript + Tailwind + App Router
- Installer: `leaflet @types/leaflet qrcode @types/qrcode cheerio @types/cheerio @google/generative-ai lucide-react`
- Konfigurer `tailwind.config.ts` med `green-brand` farve
- Sæt `GEMINI_API_KEY` i `.env.local`
- Grundlæggende mappestruktur

### Sprint 2 — Data Layer
**Mål:** Fallback-data klar + TypeScript typer defineret.
**Estimat:** 1 time
**Indhold:**
- `/data/fallback-branches.ts` med GSV (alle 24 danske afdelinger) + Kiloutou (10 europæiske afdelinger i FR, DE, ES, IT, PL) hardcoded data
- `/types/branch.ts` med `Branch`, `CrawlResult`, `DataSource` typer
- `/lib/distance.ts` med Haversine distance beregning

### Sprint 3 — Crawler + AI + Geocode + Cache
**Mål:** Live crawler fungerer end-to-end.
**Estimat:** 3-4 timer (mest komplekse sprint)
**Indhold:**
- `/lib/cache.ts` — in-memory Map med 72t TTL
- `/lib/geocode.ts` — Nominatim geocoding med rate limiting
- `/lib/ai-extract.ts` — Gemini API HTML → Branch[] parsing
- `/lib/crawler.ts` — crawl + find kontaktsider + timeout handling

### Sprint 4 — API Route
**Mål:** `/api/crawl` endpoint fungerer og returnerer branches.
**Estimat:** 1 time
**Indhold:**
- `/app/api/crawl/route.ts`
- Timeout wrapper (max 9 sek)
- Fallback logic
- `source` field i response

### Sprint 5 — Delte Komponenter
**Mål:** Alle genbrugelige komponenter bygget og testet visuelt.
**Estimat:** 2 timer
**Indhold:**
- `BranchCard.tsx`
- `DataSourceBadge.tsx`
- `ConsentBanner.tsx`
- `DemoBanner.tsx`
- `Map.tsx` (Leaflet, dynamic import)
- `QRCode.tsx`
- `StepIndicator.tsx`

### Sprint 6 — Landing Page
**Mål:** `/` ser perfekt ud på mobil.
**Estimat:** 1 time
**Indhold:**
- Hero med slogan og CTA'er
- Features liste
- Footer

### Sprint 7 — Create Page
**Mål:** `/create` med live crawling og QR-generering fungerer.
**Estimat:** 2 timer
**Indhold:**
- Step 1: Domæne-input
- Step 2: Crawling progress (real-time feedback)
- Step 3: QR-kode klar med download + "Prøv i simulator"
- DataSourceBadge integration

### Sprint 8 — Demo/Simulator
**Mål:** `/demo` med klikbart kort og live branch-opdatering.
**Estimat:** 2 timer
**Indhold:**
- DemoBanner
- Domæne-dropdown
- Klikbart Leaflet-kort
- Automatisk find nærmeste afdeling ved klik
- QR-kode preview

### Sprint 9 — Scan-Flow
**Mål:** `/scan?domain=gsv.dk` virker som det rigtige produkt.
**Estimat:** 2 timer
**Indhold:**
- GDPR consent overlay
- Geolokation API
- Manuel position-valg fallback
- Resultat-side med Ring op/Send email

### Sprint 10 — Test + Polish
**Mål:** Live crawler verificeret, UI poleret, deployment klar.
**Estimat:** 2 timer
**Indhold:**
- Test crawler med gsv.dk live
- Test crawler med kiloutou.dk live
- Mobil-test (Safari iOS)
- Vercel deployment
- Environment variables sat på Vercel

---

## Risici

| ID | Risiko | Sandsynlighed | Konsekvens | Mitigering |
|----|--------|---------------|------------|------------|
| R1 | Gemini API gratis tier rate-limit overskredet | Medium | Høj | Cache 72t, én request per domæne |
| R2 | Vercel 10 sek timeout overskrides | Høj | Høj | `Promise.race()` med 9 sek timeout → fallback |
| R3 | Nominatim rate-limit (1 req/sek) | Høj | Medium | `sleep(1100)` mellem kald, batch geocoding |
| R4 | Firmaers hjemmesider blokerer crawling | Medium | Medium | Fallback data + User-Agent header |
| R5 | Gemini parser forkerte adresser | Medium | Høj | Valider lat/lng via Nominatim (mangler koordinater = skip) |
| R6 | Leaflet SSR crash (window undefined) | Lav | Medium | `dynamic(() => import(...), { ssr: false })` |
| R7 | iOS Safari geolokation kræver HTTPS | Lav | Høj | Vercel giver HTTPS automatisk |
| R8 | Cheerio parser variabel HTML-struktur | Høj | Medium | Gemini AI håndterer variation — ikke regex |

---

## Definition of Done
- ✅ Kode bygger uden TypeScript fejl
- ✅ Alle 4 sider bygget (`/`, `/create`, `/demo`, `/scan`)
- ✅ Fallback badge vises korrekt ved crawler-fejl
- ✅ Download QR-kode virker
- ✅ GDPR consent flow virker
- ⬜ Crawler returnerer live data fra gsv.dk (afventer Vercel — SSL-issue lokalt)
- ⬜ Live badge vises korrekt ved succesfuld crawling (afventer Vercel)
- ⬜ Deployment på Vercel uden fejl
- ⬜ Mobil-test på fysisk enhed (390px, Safari iOS)

---

## Tekniske Beslutninger (log)
Se `docs/PROCESSLOG.md` for detaljeret beslutningslog.

| Beslutning | Valg | Alternativ |
|------------|------|------------|
| Database | Ingen (in-memory cache) | Redis, Supabase |
| AI model | Gemini 1.5 Flash (gratis) | GPT-4o, Claude |
| Geocoding | Nominatim (gratis) | Google Maps API |
| Kort | Leaflet + OSM | Google Maps, Mapbox |
| Hosting | Vercel free | Netlify, Railway |
| Auth | Ingen — demo-first | NextAuth |
