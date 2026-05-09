# CLAUDE.md — ALQR Project Reference

## Hvad er ALQR?
Active Location QR — én QR-kode der finder nærmeste afdeling automatisk.
Scan-flow: QR-scan → GDPR consent → geolokation → find nærmeste branch → vis kontaktinfo.

## Tech Stack
- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS (dark theme, grøn accent #267D39)
- **Kort:** Leaflet + OpenStreetMap (client-side only, dynamic import)
- **QR:** `qrcode` npm package
- **AI:** Google Gemini API (server-side kun, GEMINI_API_KEY env var)
- **HTML-parsing:** `cheerio`
- **Geocoding:** Nominatim (OSM, gratis, rate-limit: 1 req/sek)
- **Cache:** In-memory Map (72t TTL) — ingen database
- **Deployment:** Vercel (10 sek serverless timeout — kritisk!)

## Filstruktur
```
/app
  /page.tsx                 # Landing (/)
  /create/page.tsx          # Opret QR (/create)
  /demo/page.tsx            # Simulator (/demo)
  /scan/page.tsx            # Scan-flow (/scan?domain=gsv.dk)
  /api/crawl/route.ts       # POST {domain} → branches[]

/lib
  crawler.ts                # Crawl hjemmeside, find kontaktsider
  ai-extract.ts             # Gemini API → struktureret data
  geocode.ts                # Nominatim geocoding
  cache.ts                  # In-memory cache, 72t TTL
  distance.ts               # Haversine distance beregning

/data
  fallback-branches.ts      # Hardcoded GSV + Kiloutou data

/components
  BranchCard.tsx            # Afdelingskort (adresse, tlf, email, kilde)
  DataSourceBadge.tsx       # Grøn "Live data" / amber "Forudindlæst data"
  ConsentBanner.tsx         # GDPR consent overlay
  DemoBanner.tsx            # Amber demo-banner øverst
  Map.tsx                   # Leaflet kort (dynamic import!)
  QRCode.tsx                # QR-kode renderer
  StepIndicator.tsx         # 1→2→3 progress indikator
```

## Kritiske Regler

### Crawler & data source
- Fallback data (hardcoded) bruges KUN hvis crawleren fejler
- Amber badge vises ALTID ved fallback: "⚠ Bruger forudindlæst data — live crawling fejlede"
- Grøn badge vises ved live data: "✓ Live data fra [domæne]"
- `source` field på branch-objekter: `"crawled" | "cached" | "fallback"`

### Vercel timeout
- Serverless functions har 10 sek max
- Crawler skal time out og falde tilbage til fallback inden 9 sek
- Brug `Promise.race()` med timeout wrapper

### Leaflet / SSR
- Leaflet virker kun client-side — ALTID `dynamic(() => import(...), { ssr: false })`
- Undgå `window is not defined` fejl

### Gemini API
- Alle kald i `/api/` routes — aldrig client-side
- Key: `process.env.GEMINI_API_KEY`
- Model: `gemini-1.5-flash` (gratis tier)

### Nominatim geocoding
- Rate limit: 1 request/sekund
- User-Agent header påkrævet: `ALQR/1.0 (tl@veng.it)`
- Tilføj `await sleep(1100)` mellem kald

## Design System
Se `docs/DESIGN.md` for fuld reference.
- Baggrund: `#FFFFFF` (hvid)
- Surface/kort: `#F9FAFB` (gray-50) med `border-gray-200` kant
- Accent grøn: `#267D39` (green-brand)
- Tekst primær: `#111827` (gray-900)
- Demo banner: `#FEF3C7` (amber-100) med `#92400E` tekst
- Mobile-first — alt designes til 390px bredde

## Sider & Routes
| Route | Side |
|-------|------|
| `/` | Landing page |
| `/create` | Opret QR-kode |
| `/demo` | Simulator (klikbart kort) |
| `/scan?domain=gsv.dk` | Rigtig scan-flow |

## API
```
POST /api/crawl
Body: { domain: string }
Response: {
  branches: Branch[],
  source: "crawled" | "cached" | "fallback",
  crawledAt: string
}

Branch: {
  name: string,
  address: string,
  phone?: string,
  email?: string,
  lat: number,
  lng: number,
  sourceUrl?: string
}
```

## Sprint Oversigt
1. Projekt setup
2. Data layer + fallback data
3. Crawler + AI extract + geocode + cache
4. API route `/api/crawl`
5. Delte komponenter
6. Landing page
7. Create page
8. Demo/simulator
9. Scan-flow
10. Test + polish

## Dokumentation
- `docs/PROJECT_MANAGEMENT.md` — risici, sprints, milestones
- `docs/TASKS.md` — opgaver per sprint
- `docs/PROCESSLOG.md` — beslutningslog (opdateres løbende)
- `docs/DESIGN.md` — design system reference
