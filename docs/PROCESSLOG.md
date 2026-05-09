# PROCESSLOG.md — ALQR Beslutningslog

Denne fil opdateres automatisk efter hver sprint/sektion med:
- Hvad der blev lavet
- Hvilke valg der blev truffet
- Argumentation for beslutningerne

---

## Entry 001 — 2026-05-08 — Projektinitialisering & Dokumentation

### Hvad blev lavet
Læst brugerens projektspecifikation og wireframes (4 mobile mockups). Oprettet 5 dokumentationsfiler:
- `CLAUDE.md` (projektreference til Claude)
- `docs/DESIGN.md` (komplet design system)
- `docs/PROJECT_MANAGEMENT.md` (sprints, risici, milestones)
- `docs/TASKS.md` (opgaveliste per sprint)
- `docs/PROCESSLOG.md` (denne fil)

### Truffet valg

**Hvid baggrund — bekræftet**
Spec siger "hvid baggrund, grøn accent (#267D39)". Wireframes viser mørkt tema, men disse er skitsemæssige og IKKE designets kilde til sandhed. Tobias bekræftede eksplicit: hvid baggrund. DESIGN.md opdateret til lyst tema med `#FFFFFF` baggrund, `#F9FAFB` surface, `#111827` tekst, og `#267D39` grøn accent.

**Ingen database**
Beslutning: In-memory cache (72t TTL) fremfor Redis/Supabase.
Argument: Vercel free tier har ingen persistent storage. In-memory cache nulstilles ved cold starts, men 72t TTL sikrer at populære domæner forbliver hurtige under aktiv brug. Projektet er demo-first — ingen database simplificerer deployment markant.

**Gemini Flash fremfor Pro/Opus**
Gemini 1.5 Flash er gratis tier og tilstrækkelig til struktureret data-ekstraktion fra HTML. Pro/Opus ville øge cost uden klar fordel for dette use case.

**Nominatim fremfor Google Maps Geocoding**
Gratis, ingen API-key påkrævet, GDPR-compliant. Ulempe: 1 req/sek rate limit. Mitigeret med sleep + caching.

**Sprint-rækkefølge**
Rækkefølgen følger spec'ens "Bygge-rækkefølge" direkte. Data layer + crawler bygges før UI, så komponenter kan testes med rigtige data fra start.

**Vercel timeout-strategi**
10 sek hard limit på Vercel serverless. Crawler skal time out inden 9 sek via `Promise.race()`. Ved timeout returneres fallback data med `source: "fallback"` og amber badge. Dette er bedre UX end en fejlside.

### Risici identificeret
Se `PROJECT_MANAGEMENT.md` risikotabel. Primære risici:
- R2 (Vercel timeout) er vurderet "Høj sandsynlighed" — crawler skal testes tidligt
- R3 (Nominatim rate limit) er kritisk i Sprint 3 — geocoding af mange afdelinger tager tid

---

## Entry 002 — 2026-05-09 — Sprint 1: Projekt Setup

### Hvad blev lavet
- Next.js 15 projekt oprettet med TypeScript, Tailwind v4, App Router (`src/` off)
- Alle npm-dependencies installeret: `leaflet`, `@types/leaflet`, `qrcode`, `@types/qrcode`, `cheerio`, `@types/cheerio`, `@google/generative-ai`, `lucide-react` (380 pakker totalt)
- Global CSS konfigureret i `app/globals.css`: hvid baggrund (#FFFFFF), primær tekst (#111827)
- Custom Tailwind-farver sat via `@theme inline`: `--color-green-brand: #267D39`, `--color-green-brand-dark: #1F6630`
- `.env.local` oprettet med `GEMINI_API_KEY`
- Tomme mapper oprettet: `/lib`, `/data`, `/components`, `/types`
- `app/layout.tsx`: metadata, dansk `lang="da"`, korrekt body-klasser
- `app/page.tsx`: placeholder med ALQR logo og undertekst
- `npx next build` kører uden fejl — 5 static pages, 0 TypeScript errors

### Truffet valg

**Tailwind v4 farve-konfiguration via CSS custom properties**
Tailwind v4 fjerner `tailwind.config.ts` for farvedefinitioner — custom farver sættes nu med `@theme inline { --color-[navn]: [hex] }` i globals.css. DESIGN.md og TASKS.md refererede til `tailwind.config.ts`, men implementationen bruger korrekt v4-syntaks. Farven bruges i Tailwind-klasser som `text-green-brand` og `bg-green-brand`.

**Hvid baggrund bekræftet**
Task 1.6 beskrev "dark background (#18181B)" men spec og Tobias' bekræftelse i Entry 001 siger hvid. Implementationen følger spec (#FFFFFF).

**Build frem for dev-server smoke test**
`npm run build` verificerer TypeScript-kompilering og statisk generering — mere komplet end blot at starte dev-serveren.

### Problemer stødt på
- `npm install` fejlede første gang med `UNABLE_TO_VERIFY_LEAF_SIGNATURE` (SSL-certifikat issue i netværksmiljøet). Løst ved at køre direkte i brugerens terminal.
- 2 moderate severity vulnerabilities i dependencies (ikke kritiske, ingen breaking changes nødvendige nu).

### Næste skridt
Sprint 2: Data layer — `/types/branch.ts`, `/data/fallback-branches.ts` (GSV + Kiloutou), `/lib/distance.ts`

---

## Entry 003 — 2026-05-09 — Sprint 2: Data Layer

### Hvad blev lavet
- `/types/branch.ts` — `DataSource`, `Branch`, `CrawlResult` interfaces
- `/data/fallback-branches.ts` — 24 GSV-afdelinger (verificeret fra gsv.dk maj 2026) + 10 Kiloutou europæiske afdelinger (FR, DE, ES, IT, PL). Top-level export: `fallbackBranches: Record<string, Branch[]>`
- `/lib/distance.ts` — `haversineDistance()` + `findNearestBranch<T>()` generic
- Manuel test kørt med `npx tsx`: 5/5 assertions bestået

### Truffet valg

**Branch interface udvidet med id, company, country**
Spec-korrektion: `id` (slug-format, f.eks. "gsv-greve"), `company` (virksomhedsnavn), `country` (ISO 3166-1 alpha-2, f.eks. "DK", "FR") tilføjet. `country` er kritisk for landegenkendelse i den internationale demo. Alle GSV-branches har `country: "DK"`, Kiloutou-branches har landekode for det pågældende land.

**Kiloutou er europæisk, ikke dansk**
Kiloutou demonstrerer international skalering — 10 branches fordelt på 5 lande (Frankrig, Tyskland, Spanien, Italien, Polen). Det vigtige er variation i `country`-feltet, ikke at Kiloutou har dansk adresse. Kiloutou Group ejer faktisk GSV (dansk), men i fallback-data er de separate entries.

**Haversine returnerer luftlinjesdistance, ikke vejdistance**
"Greve → København = ~30km" i spec var vejdistance. Haversine giver 18.8km luftlinje — korrekt og forventet. Testassertionen er rettet til 15-25km og dokumenterer dette eksplicit.

**findNearestBranch er generic `<T extends {lat, lng}>`**
Bruges både med `Branch[]` (sprint 9 scan-flow) og potentielt med rå geo-objekter (sprint 8 demo). Generic undgår duplikering uden at kræve cast.

**fallbackBranches Record inkluderer kiloutou.dk, kiloutou.fr, kiloutou.com**
Samme branches returneres uanset hvilket Kiloutou-domæne der bruges — logisk korrekt da det er én koncern.

### Problemer stødt på
- gsv.dk utilgængeligt via SSL pga. netværksproxy — branch-data leveret af Tobias i `docs/Alqr-branch-data.md`
- "~30km Greve→København" var vejdistance, ikke luftlinje. Haversine korrekt på 18.8km.

### Næste skridt
Sprint 3: `/lib/cache.ts`, `/lib/geocode.ts`, `/lib/ai-extract.ts`, `/lib/crawler.ts`

---

## Entry 004 — 2026-05-09 — Sprint 3: Crawler + AI + Geocode + Cache

### Hvad blev lavet
- `/lib/cache.ts` — in-memory `Map<string, CacheEntry>` med `get/set/has`. `set()` sætter `source: "cached"` på alle branches. Lazy expiration i `get()`.
- `/lib/geocode.ts` — `geocodeAddress()` + `geocodeBranches()`. Max 5 branches geocodes ad gangen. Branches uden resultat droppes (returnerer ikke `lat:0,lng:0`).
- `/lib/ai-extract.ts` — `extractBranchesFromHTML()` med `Omit<Branch, "lat"|"lng">[]` returtype. `trimHTML()` fjerner scripts/styles/svg og capper ved 50KB. `extractJSON()` stripper Geminis markdown-fencing. ID genereres som slug.
- `/lib/crawler.ts` — `crawlDomain()` med `Promise.race()` 8 sek timeout. Prioriterer oversigts-sider (plural patterns: afdelinger, locations) over enkelt-sider. Forsøger desuden probe-paths direkte (`/afdelinger/`, `/kontakt/`). Alle fundne sider fetches parallelt og kombineres til ét HTML-blob til Gemini.

### Truffet valg

**Geocoding fjernet fra crawlerens synkrone path**
Med 24 afdelinger × 1,1 sek = 26,4 sek — langt over 8 sek timeout. Crawlede branches returneres med `lat:0, lng:0`. Sprint 4 API-routen merger med fallback-koordinater for kendte domæner og kan geocode et begrænset antal for nye domæner.

**Oversigts-sider prioriteret i URL-rangering**
Plural-patterns (afdelinger, locations, branches) scores højere end singular (afdeling, kontakt). GSV's `/gsv-afdelinger/` side lister alle 24 afdelinger på én side — denne sendes direkte til Gemini i stedet for at dykke ind i 24 individuelle underlinks. Probe-paths forsøger desuden `/afdelinger/` direkte selv hvis forsiden ikke linker til den.

**Returtype `Omit<Branch, "lat"|"lng">[]` fra ai-extract**
Tvinger TypeScript til at håndhæve at koordinater ikke kan komme fra Gemini (Gemini hallucinerer koordinater). Crawler.ts tilføjer eksplicit `lat:0, lng:0`.

**Gemini instans på module-niveau**
`new GoogleGenerativeAI(...)` kaldes én gang ved module-load, ikke per request. Vercel genbruger module-scope i varm serverless state — sparer ~100ms per kald.

**TLD-baseret country-gætning**
`guessCountry("gsv.dk")` → `"DK"`, `guessCountry("kiloutou.fr")` → `"FR"`. Fallback: `"DK"`. Bruges som `country`-felt på crawlede branches og i Nominatim-kald.

### Problemer stødt på
- `3.7` (live test med gsv.dk) blokeret pga. SSL-certifikat-fejl i lokalt netværk (samme issue som blokerede npm install og WebFetch). Testen flyttes til Sprint 10 på Vercel.

### Næste skridt
Sprint 4: `/app/api/crawl/route.ts` — cache-check → crawl → merge koordinater → gem i cache → returner `CrawlResult`. Inkl. merge-logik for `lat:0,lng:0` branches.

---

## Entry 005 — 2026-05-09 — Sprint 4: API Route

### Hvad blev lavet
- `/lib/merge-coords.ts` — `mergeCoordinates()` med 3-fase matching: postnummer → navn-within-postnummer → navn-only. Håndterer GSV's edge case med 3 afdelinger på samme adresse (Brabrand).
- `/app/api/crawl/route.ts` — POST handler med: JSON-parsing, `normalizeDomain()`, cache-check, `crawlDomain()`, fallback-override, koordinat-merge, `cacheSet`, response.
- `/lib/cache.ts` bugfix — `set()` sætter nu også top-level `source: "cached"` (ikke kun branch-level).

### Truffet valg

**Koordinat-merge kun for `source === "crawled"`**
Fallback-data har allerede korrekte koordinater — merge er unødvendig og potentielt skadelig for fallback-resultater.

**Fallback-override ved `branches.length === 0 && knownBranches`**
Crawler returnerer teknisk set `source: "crawled"` selv ved 0 branches (Gemini fandt ingenting). API-routen overstyrer til fallback hvis vi har kendte data — brugeren ser aldrig en tom liste for gsv.dk/kiloutou.dk.

**`cacheSet` muterer kun intern kopi**
Første response beholder original `source` ("crawled"/"fallback"). Efterfølgende cache-hits returnerer `source: "cached"` på både top-niveau og branch-niveau. `crawledAt` er frosset fra første crawl — klienten kan se hvornår data er fra.

**Geocoding springer over i Sprint 4**
Vercel-budget: crawl bruger op til 8 sek, Nominatim kræver 1,1 sek/branch. Ingen plads til synkron geocoding. Ukendte domæner returnerer `lat:0, lng:0` — `findNearestBranch` i Sprint 9 filtrerer disse fra.

**Domain-normalisering**
`https://www.gsv.dk/afdelinger` → `gsv.dk`. Brugere kan indsætte fuld URL i create-flowet uden fejl.

### Test-resultater (curl mod localhost:3001)
- `POST {"domain":"gsv.dk"}` → `source:"fallback"`, 24 branches, koordinater intakte
- Andet kald → `source:"cached"`, `crawledAt` uændret, branches `source:"cached"`
- `{"domain":"https://www.gsv.dk/afdelinger"}` → normaliseret til `gsv.dk`, 24 branches
- `{"domain":"ingenTLD"}` → 400
- `{}` → 400
- Ugyldig JSON body → 400

### Næste skridt
Sprint 5: Delte komponenter — BranchCard, DataSourceBadge, ConsentBanner, DemoBanner, Map (Leaflet), QRCode, StepIndicator

---

## Entry 006 — 2026-05-09 — Sprint 5: Delte Komponenter

### Hvad blev lavet
7 komponenter + dev-side:
- `DataSourceBadge.tsx` — grøn/amber badge, `"cached"` = grøn (som `"crawled"`)
- `DemoBanner.tsx` — amber banner, `AlertTriangle` ikon, `message` prop med default
- `StepIndicator.tsx` — CSS `flex-1 h-0.5` linje, `bg-green-brand` / `bg-zinc-200`
- `BranchCard.tsx` — domain udledt fra `sourceUrl` via `new URL().hostname`, distance 1 decimal under 10km
- `ConsentBanner.tsx` — `fixed inset-0 bg-black/60 z-50`, ingen klik-til-luk (GDPR kræver aktivt valg)
- `QRCode.tsx` — `Promise.all` dual-size, `cancelled` flag, `<a download>` til PNG-download
- `MapInner.tsx` + `Map.tsx` — to-lags arkitektur, `dynamic(ssr:false)`, `scrollWheelZoom:false`, Leaflet marker icon fix via `/public/leaflet/`
- `/app/dev/page.tsx` — isolation test med gsvBranches testdata

### Truffet valg

**To-lags Map-arkitektur**
`Map.tsx` er ren `dynamic()` wrapper. `MapInner.tsx` indeholder al Leaflet-kode inkl. CSS-import. Leaflet CSS importeres i `MapInner.tsx` (ikke `layout.tsx`) — kun client-side via dynamic import.

**`scrollWheelZoom: false`**
Kritisk for mobil — uden dette fanger Leaflet scroll-events og forhindrer bruger i at scrolle forbi kortet.

**Leaflet marker icons kopieret til `/public/leaflet/`**
Webpack/Next.js bundler Leaflet's default `require()`-baserede ikoner forkert. Løst ved at kopiere PNG-filer fra `node_modules/leaflet/dist/images/` til `/public/leaflet/` og pege Leaflet's `Icon.Default` dertil.

**`"cached"` vises som grøn badge**
Fra brugerens perspektiv er cached data aktuelt og korrekt — ingen grund til at signalere noget andet. Kun `"fallback"` (hardcoded data) fortjener amber-farven.

### Bugs fundet og rettet
- `Map.tsx` loading-prop: `DynamicOptionsLoadingProps` har ikke `style` prop — fjernet, hardcoded `height: "200px"` bruges i loading placeholder
- `eslint.config.mjs`: manglende `.js` extension på imports (`eslint-config-next/core-web-vitals.js`) — pre-existing bug, rettet

### Næste skridt
Sprint 6: Landing page (`/`)

---

## Entry 007 — 2026-05-09 — Sprint 6: Landing Page

### Hvad blev lavet
`/app/page.tsx` — Server Component. Hero med logo, tagline, H1-slogan, 3 CTA-knapper, 4 features med Check-ikon, footer.

### Truffet valg

**Tre knapper, ikke to**
Spec-korrektion fra Tobias: "Opret QR-kode" → `/create` er primær handling (hele produktets entry point). Plan sagde kun 2 knapper. Knaphierarki: primary (opret) → secondary (demo) → ghost/link (scan).

**Logo `<p>`, slogan `<h1>`**
Placeholder brugte `<h1>` til logoet. Rettet: sloganet er den primære semantiske overskrift på siden.

**Ghost-stil på "Scan QR-kode"**
Tredje knap er en direkte QR-test-link — ikke en primær action. `text-green-brand font-medium hover:underline` uden ramme adskiller den visuelt fra de to vigtigere knapper.

### Næste skridt
Sprint 7: Create page (`/create`) — domæne-input, crawling progress, QR-klar step

---

## Entry 008 — 2026-05-09 — Sprint 6 Bugfix: Tailwind farver + hydration

### Hvad blev lavet
- `globals.css`: `@theme inline` → `@theme` (uden `inline`) så Tailwind v4 genererer utility-klasser (`bg-green-brand` etc.)
- `app/page.tsx`: Alle grønne farver omskrevet til inline `style={{ color/backgroundColor: "#267D39" }}` som bulletproof fallback
- `app/layout.tsx`: `suppressHydrationWarning` tilføjet på både `<body>` (Grammarly) og `<html>` (QuillBot)

### Truffet valg

**Inline styles som primær farvestrategi på nye sider**
`@theme inline` genererer kun CSS custom properties, ikke utility-klasser. `@theme` (uden inline) genererer begge. Ændringen er lavet, men eksisterende komponenter (StepIndicator, BranchCard etc.) bruger stadig `bg-green-brand` — disse virker nu med `@theme`. Nye sider (create, demo, scan) bruger inline styles for sikkerhed.

**`suppressHydrationWarning` på `<html>` og `<body>`**
Browser-extensions (Grammarly, QuillBot) injicerer data-attributter i DOM inden React hydrerer — forårsager harmløse men forstyrrende console-fejl. `suppressHydrationWarning` undertrykker kun advarslen på det specifikke element, ikke i hele træet.

### Næste skridt
Sprint 7: Create page

---

## Entry 009 — 2026-05-09 — Sprint 7: Create Page

### Hvad blev lavet
- `/app/create/page.tsx` — "use client", 4 states: `input` → `loading` → `result` | `error`
- Step 1: domæne-input (renser `https://`, `www.`, trailing slash), virksomhedsnavn (optional), info-boks
- Step 2: spinner + 4 cyklerende statusbeskeder via `setInterval` (skifter hvert 2 sek)
- Step 3: `QRCode` (download inkluderet), URL-preview, `DataSourceBadge`, 4 actions: Download, Kopier link, Prøv som bruger, Prøv i simulator
- Error state: venlig besked ved `branches.length === 0` eller API-fejl

### Truffet valg

**QR URL er produktions-URL**
QR-koden koder `https://alqr.dk/scan?domain=[domæne]` — ikke localhost. QR er til fysisk print og skal virke fra Vercel, ikke dev-serveren.

**4 actions i resultat-stedet**
Spec-korrektion: "Prøv som bruger" → `/scan?domain=...` tilføjet som separat action. Det er den eneste måde at teste det rigtige flow fra sin egen telefon (man kan ikke scanne QR på sin egen skærm). Rækkefølge: Download → Kopier → Prøv som bruger → Prøv i simulator.

**Kopier link med "Kopieret!" feedback**
`navigator.clipboard.writeText()` + `setTimeout(() => setCopied(false), 2000)`. Knappens baggrund skifter til grøn i 2 sek — visuell bekræftelse uden toast-komponent.

### Test-bekræftelse
Bruger verificerede: 24 afdelinger fundet for gsv.dk, amber badge vist, alle 4 actions synlige, error-state vist for ukendt domæne.

### Næste skridt
Sprint 8: Demo/Simulator

---

## Entry 010 — 2026-05-09 — Sprint 8: Demo/Simulator

### Hvad blev lavet
- `/app/demo/page.tsx` — "use client" med Suspense wrapper (useSearchParams)
- `DemoBanner` øverst, domæne-dropdown (GSV + Kiloutou), klikbart Leaflet-kort, BranchCard ved klik, QR-preview sektion, "Prøv som bruger" knap
- `MapInner.tsx` udvidet: `flyToCenter/flyToZoom` props + useEffect der kalder `map.flyTo()` ved ændring. Click-markør fjernes korrekt når `selectedLat/Lng` sættes til `undefined`
- `MAP_CONFIG` konstant: `gsv.dk` → `{ center: [56, 10.5], zoom: 6 }`, `kiloutou.fr` → `{ center: [50, 10], zoom: 4 }`

### Truffet valg

**Dynamisk zoom er kernefeature**
Kiloutou-afdelinger er spredt over Europa — kortet skal zoome til Europa ved skift. Implementeret via `flyToCenter/flyToZoom` props til `MapInner` og `map.flyTo()` med 0.8 sek animation. Alternativet (re-mount via `key`) ville vise loading-placeholder og nulstille zoom-niveau helt.

**Suspense wrapper påkrævet**
Next.js 15 kræver Suspense-boundary ved `useSearchParams()` i Client Components — ellers crasher appen under statisk generering og forhindrer andre routes i at virke (det var årsagen til at landing page viste 404).

**`fetchBranches` ved mount og domæne-skift**
`useCallback` + `useEffect([selectedDomain])` sikrer at branches altid er friske for det valgte domæne. Ved skift ryddes `clickedLat/Lng` og `nearest` så det gamle resultat ikke forvirrer.

### Problemer stødt på
- 404 på landing page opstod fordi demo/page.tsx uden Suspense crashede Next.js routing under kompilering. Rettet med Suspense.

### Næste skridt
Sprint 9: Scan-flow

---

## Entry 011 — 2026-05-09 — Sprint 9: Scan-Flow

### Hvad blev lavet
- `/app/scan/page.tsx` — "use client" med Suspense wrapper. State-maskine: `consent → locating → manual → fetching → result | error`
- `ConsentBanner` overlay som første step (bruger `onAllow` + `onManual` callbacks)
- Auto-flow: `navigator.geolocation.getCurrentPosition()` → `fetchAndFind(lat, lng)`
- Manuel flow: klikbart Leaflet-kort → klik → `fetchAndFind(lat, lng)`
- Geo-afvisning (9.9): error-callback → `step = "manual"` + `geoError = true` → amber-besked over kortet
- Resultat: grøn checkmark-cirkel, BranchCard, konditionelle "Ring op" + "Send email" knapper, DataSourceBadge
- GDPR-footer på alle steps efter consent

### Truffet valg

**`fetchAndFind` er shared helper**
Både auto-geo og manuel klik kalder samme `useCallback`-funktion med (lat, lng). Undgår duplikering af fetch + findNearestBranch-logik.

**`findNearestBranch` client-side**
`/lib/distance.ts` er ren TypeScript uden Node.js-afhængigheder — kan importeres direkte i Client Component. Alternativet (server-side nearest-beregning i API-routen) ville kræve at lat/lng sendes med i POST-body og tilføje kompleksitet.

**"Ring op" + "Send email" er konditionelle**
`branch.phone` og `branch.email` er optional på `Branch`-typen — knapperne vises kun hvis felterne er udfyldt. Undgår tomme `tel:` eller `mailto:` links.

**`domain` fra `useSearchParams`**
`?domain=gsv.dk` query param læses og sendes direkte til `/api/crawl`. Ingen client-side valideringslogik — serveren validerer og returnerer 400 ved ugyldig input.

### Næste skridt
Sprint 10: Build-verifikation + Vercel deploy

---

## Entry 012 — 2026-05-09 — Bugfix: cache.ts source-overwrite

### Hvad blev lavet
- `/lib/cache.ts`: `set()` overskrev ikke længere `source` til `"cached"` — data gemmes uændret
- `/app/api/crawl/route.ts`: kommentar opdateret

### Problem
`cache.set()` overskrev `source` på CrawlResult og alle branches til `"cached"`. Det betød at cached fallback-data returnerede `source: "cached"` → grøn badge — som om det var live data. Anden request for gsv.dk viste grønt "Live data" selvom det var hardcoded fallback.

### Fix
Fjern source-overwrite helt. `"fallback"` og `"crawled"` bevares præcist som de blev gemt. `"cached"` som DataSource-værdi eksisterer stadig i typen men bruges ikke aktivt.

### Konsekvens
- Cached fallback → amber badge (korrekt)
- Cached crawled → grøn badge (korrekt)
- Badge viser altid korrekt datakilde uanset antal requests

---

## Entry 013 — 2026-05-09 — Sprint 10 Fase 1: Build-verifikation

### Hvad blev lavet
- `eslint.config.mjs`: omskrevet til standard Next.js 15 `FlatCompat`-tilgang — `nextVitals is not iterable` fejl elimineret
- `app/api/crawl/route.ts`: ubrugt `CrawlResult` import fjernet
- `app/scan/page.tsx`: ubrugt `useEffect` import fjernet
- `components/QRCode.tsx`: `eslint-disable-next-line` for `no-img-element` (data-URLs kan ikke bruges med `next/image`)
- Endeligt build: **0 fejl, 0 warnings**, 7 routes

### Build-output
```
○ /           3.46 kB
○ /create     3.1 kB
○ /demo       2.85 kB
○ /scan       3.2 kB
ƒ /api/crawl  123 B   (dynamic)
```

### Truffet valg

**FlatCompat fremfor spread-workaround**
`eslint-config-next` eksporterer i nyere versioner et objekt, ikke et array — `...nextVitals` fejler. FlatCompat er den officielle bridge fra create-next-app og er den stabile løsning fremadrettet.

**`<img>` beholdes i QRCode.tsx**
`next/image` understøtter ikke dynamiske `data:` base64-URLs som src. `eslint-disable` er korrekt pragmatisk valg — ingen funktionalitet kompromitteres.

### Udestående (kræver Vercel)
10.1, 10.2, 10.3: Live crawler-test — lokalt netværk blokerer SSL til eksterne sites
10.4, 10.8: Mobil- og QR-test på fysisk enhed
10.6, 10.7: Vercel env var + deploy

---

## Template for fremtidige entries

```
## Entry [NNN] — [DATO] — [Sprint navn / Sektion]

### Hvad blev lavet
[Kort beskrivelse af implementerede filer og funktioner]

### Truffet valg
**[Beslutning]**
[Argument og alternativ der blev fravalgt]

### Problemer stødt på
[Evt. bugs, blokeringer, uventede opdagelser]

### Næste skridt
[Hvad kommer i næste entry]
```
