# ALQR – Active Location QR – Technical Spec (Demo)

## Project overview

ALQR is a location-based QR routing service. One QR code, one URL — but the landing page detects the user's geographic position and shows contact information for the nearest branch of a given company. The company doesn't need to register or integrate anything; ALQR scrapes their public website for branch data.

**Physical use case:** The QR code is meant to be printed/applied physically — on company vehicles, machinery, flyers, stickers, business cards, etc. The primary pitch for GSV is QR codes on their trucks and equipment. A truck with a QR code drives through Greve, a worker scans it → gets GSV Greve contact info. The same truck drives to Aarhus, someone scans it → gets GSV Aarhus. Same QR, different result based on location.

This spec is for a **demo/prototype** meant to be shown to a marketing director at GSV Materieludlejning. It must look polished, professional, and work flawlessly on mobile.

---

## Tech stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Map:** Leaflet with OpenStreetMap tiles (free, open source)
- **Geocoding:** Nominatim reverse geocoding (free) for country detection
- **QR generation:** `qrcode` npm package
- **AI for crawling:** Google Gemini API (free tier) — parses HTML from company websites and extracts structured branch data (name, address, phone, email)
- **Crawling:** `cheerio` for HTML parsing, `fetch` for HTTP requests
- **Hosting:** Vercel (free tier)
- **Database/cache:** Vercel KV or JSON file cache for crawled branch data

---

## Design system

### Colors
- **Background:** `#FFFFFF` (white)
- **Primary/accent:** `#267D39` (green — buttons, links, active states, badges)
- **Primary hover:** `#1E6330` (darker green)
- **Text primary:** `#1A1A1A`
- **Text secondary:** `#6B7280`
- **Text on primary:** `#FFFFFF`
- **Border:** `#E5E7EB`
- **Surface/cards:** `#F9FAFB`
- **Error/warning:** `#DC2626`
- **Demo badge:** `#F59E0B` (amber) with `#92400E` text

### Typography
- Font: `Inter` or system sans-serif
- Headings: 600 weight
- Body: 400 weight, 16px base
- Small/labels: 14px

### Spacing
- Mobile-first, max-width container: 640px centered
- Card padding: 24px
- Section gaps: 32px
- Border radius on cards: 12px
- Border radius on buttons: 8px

### Buttons
- Primary: bg `#267D39`, text white, padding 12px 24px, rounded 8px
- Secondary: border `#267D39`, text `#267D39`, bg transparent
- Full width on mobile

---

## Pages & screens

### 1. Landing page (`/`)
**Purpose:** Entry point. Explains what ALQR is. Links to the simulator demo.

**Content:**
- ALQR logo/wordmark at top
- Slogan: "Scan og du vil finde"
- Brief one-paragraph explanation of what ALQR does
- Three CTA buttons:
  - "Opret QR-kode" → goes to `/create` (primary)
  - "Prøv demo med simulator" → goes to `/demo`
  - "Scan QR-kode" → goes to `/scan?domain=gsv.dk` (real flow)
- Footer: "Fortroligt — ALQR © 2026"

### 2. Simulator page (`/demo`)
**Purpose:** The key selling tool. Interactive map where user clicks to set their simulated position, then sees the nearest branch.

**CRITICAL: Demo badge**
A persistent amber/yellow banner at the top of this page:
```
⚠️ DEMO-TILSTAND — Simuleret position. I det færdige produkt finder systemet automatisk din rigtige placering.
```
This banner must be:
- Always visible (sticky top)
- Amber background (#FEF3C7), dark amber text (#92400E)
- Cannot be dismissed
- Clear that the map/click-to-set-position is NOT part of the final product

**Layout:**
- Demo banner (sticky top)
- Dropdown to select company: "GSV Materieludlejning" or "Kiloutou" (hardcoded options)
- Interactive map (Leaflet/OpenStreetMap) taking up ~50% of viewport height
  - User clicks anywhere on map to set simulated position
  - A pin/marker appears where they clicked
  - Map starts centered on Denmark (lat 56.0, lng 10.5, zoom 7)
  - If user selects Kiloutou, map zooms out to show Europe
- Result card below map showing:
  - "Nærmeste afdeling:" heading
  - Branch name
  - Address
  - Phone number
  - Email
  - Distance from simulated position (in km)
  - Link: "Se på [virksomhedens] hjemmeside →" (opens the real branch page)
  - Small text: "Kilde: gsv.dk" or "Kilde: kiloutou.fr"
- Below the result card:
  - A generated QR code image that encodes the URL for the real scan flow (e.g. `https://[domain]/scan?domain=gsv.dk`)
  - Label: "Denne QR-kode printes fysisk — f.eks. på køretøjer, maskiner eller flyers. Scan den for at prøve det rigtige flow."
  - **"Prøv som bruger" button** next to/below the QR code — this opens `/scan?domain=gsv.dk` directly in the browser. This is essential because you can't scan a QR code on your own phone's screen. If demoing from a laptop, the marketing director can scan the QR from the screen with their phone. If demoing from a phone, the button is the way to test the real flow.

**Mobile behavior:**
- Map takes ~40vh
- Result card scrolls below map
- Everything stacks vertically
- Buttons are full width

### 3. Scan/redirect page (`/scan?domain=gsv.dk`)
**Purpose:** The actual product flow. User lands here from a QR scan.

**Flow:**
1. Cookie/consent banner appears:
   - "ALQR vil gerne bruge din placering for at finde den nærmeste afdeling af [virksomhed]. Din placering gemmes ikke og deles ikke med tredjepart."
   - Two buttons: "Tillad placering" (primary) / "Vælg manuelt" (secondary)
2. If user allows location:
   - Browser geolocation API fires
   - Loading spinner: "Finder nærmeste afdeling..."
   - Result card appears (same design as simulator result)
3. If user chooses manual:
   - Dropdown/search with regions or cities
   - User picks one, result card appears
4. If geolocation fails:
   - Friendly error: "Vi kunne ikke finde din placering. Vælg venligst manuelt."
   - Falls back to manual selection

**Privacy:**
- No location data is sent to any server
- Geolocation is done client-side only
- Nearest branch calculation is done client-side
- Consent text is clear and visible

### 4. Create QR page (`/create`)
**Purpose:** The page where you generate an ALQR code for a company. Enter a domain, system finds branches, generates QR code.

**Flow (3 steps with step indicator):**

**Step 1: Input**
- Input field: "Virksomhedens hjemmeside" — placeholder: "f.eks. gsv.dk"
- Input field: "Virksomhedsnavn (valgfrit)" — placeholder: "f.eks. GSV Materieludlejning"
- Info box (green/light): "Systemet finder automatisk virksomhedens afdelinger via deres eksisterende hjemmeside."
- Button: "Generer QR-kode" (primary)

**Step 2: Processing (real crawling)**
- Spinner/progress animation
- Status text updating based on actual crawler progress:
  - "Henter [domæne]..."
  - "Søger efter afdelinger på hjemmesiden..."
  - "Analyserer kontaktoplysninger med AI..."
  - "Geokoder adresser..."
  - "Fandt [N] afdelinger i [lande]"
  - "Genererer QR-kode..."
- This is a real crawl — calls POST `/api/crawl` with the domain
- Typically takes 3-8 seconds depending on site size

**Step 3: Result**
- Generated QR code displayed large and centered
- Company name below QR code
- **Data source indicator (DataSourceBadge):**
  - If crawled live: "✓ Live data — [N] afdelinger fundet via [domæne]" (green)
  - If from cache: "✓ Cachelagret data fra [domæne] — hentet [dato]" (green)
  - If fallback: "⚠ Bruger forudindlæst data — live crawling fejlede" (amber)
- Three action buttons:
  - "Download QR-kode" (primary) — downloads QR as high-res PNG, ready for physical printing (vehicles, flyers, stickers etc.)
  - "Kopier link" (secondary) — copies the scan URL to clipboard
  - "Prøv som bruger" (tertiary) — opens `/scan?domain=gsv.dk` directly to test the real flow
  - "Prøv i simulator" (tertiary) — opens `/demo` with this company preselected
- Small note below buttons: "QR-koden er designet til fysisk print — f.eks. på køretøjer, maskiner, flyers eller skilte."
- URL display at bottom showing the encoded URL: `alqr.dk/s?d=gsv.dk`

**Fallback behavior:** If the crawler fails or the domain is unknown and has no fallback data, show a friendly error: "Vi kunne ikke finde afdelinger på [domæne]. Tjek at adressen er korrekt, eller prøv igen senere." For GSV and Kiloutou there is always hardcoded fallback data available.

**Mobile behavior:**
- All inputs and buttons full width
- QR code centered, sized to ~60% of screen width
- Step indicator compact but visible

---

## Data pipeline: Crawler → AI → Cache → Fallback

The demo includes a **real working crawler** that fetches branch data from company websites. This is the core magic of ALQR and must work live in the demo.

### How the crawler works

**Step 1: Fetch the website**
- User enters a domain (e.g. `gsv.dk`) on the `/create` page
- Backend API route fetches the website HTML
- Crawler looks for links to branch/contact/location pages (common patterns: `/kontakt`, `/afdelinger`, `/locations`, `/find-us`, etc.)
- Follows those links and collects HTML from each branch page

**Step 2: AI extraction via Google Gemini (free tier)**
- Sends collected HTML to Gemini API with a prompt like:
```
Extract all branch/location data from this HTML. Return JSON array with objects containing:
- name (branch name)
- address (full street address)
- phone (phone number)
- email (email address)
- city (city name)
- country_code (ISO 2-letter, e.g. "DK", "FR", "DE")

Only include actual physical branch locations with contact info. Ignore headquarters, warehouses, or pages without contact details.
```
- Gemini parses the messy HTML and returns clean structured data
- This is where AI shines — it handles any website structure without custom regex per site

**Step 3: Geocoding**
- For each extracted branch, geocode the address via Nominatim to get lat/lng coordinates
- Cache the geocoded results

**Step 4: Cache**
- Store crawled + geocoded branch data in Vercel KV or a JSON cache
- Cache TTL: 72 hours (re-crawl after that)
- On subsequent requests for the same domain, serve from cache instantly

### API route structure
```
POST /api/crawl
  Body: { domain: "gsv.dk" }
  Response: { branches: Branch[], source: "crawled" | "cached" | "fallback" }
```

The `source` field indicates where the data came from — this is used by the frontend to show a data source indicator.

### Fallback with hardcoded data

If the crawler or AI fails for any reason (network error, rate limit, Gemini down, unparseable site), the system falls back to hardcoded data. **This must be clearly visible in the UI.**

**Fallback indicator (CRITICAL):**
When hardcoded/fallback data is used, show a small but visible banner on the result:
- Color: amber/orange background (#FEF3C7), dark amber text (#92400E)  
- Text: "⚠ Bruger cachelagret data — live crawling fejlede"
- Placed above or inside the result card
- This tells the developer (you, Tobias) that something went wrong and needs debugging

When live crawled data is used, show a subtle success indicator:
- Small green text: "✓ Live data fra [domæne]"
- This confirms the crawler is working as intended

### Hardcoded fallback data

Maintain hardcoded JSON for two companies as fallback:

**GSV Materieludlejning** — all 24 Danish branches
Scrape the real data from: https://www.gsv.dk/en/gsv-afdelinger/
Each branch has a dedicated page with address, phone, email.

**Kiloutou** — 8-10 European locations as examples
Include a spread across France, Germany, Spain, Italy, Poland.
These demonstrate international/cross-border functionality.

### Branch data format
```typescript
interface Branch {
  id: string;
  company: string;       // "GSV" or "Kiloutou"
  name: string;          // "GSV Greve"
  address: string;       // "Ventrupvej 4, 2670 Greve"
  phone: string;         // "+45 43 99 72 74"
  email: string;         // "greve@gsv.dk"
  lat: number;           // 55.5833
  lng: number;           // 12.2833
  country: string;       // "DK"
  url: string;           // "https://www.gsv.dk/gsv-afdelinger/gsv-i-greve/"
}

interface CrawlResult {
  branches: Branch[];
  source: "crawled" | "cached" | "fallback";
  crawledAt?: string;    // ISO timestamp
  domain: string;
}
```

---

## Core logic

### Nearest branch calculation (client-side)
```typescript
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestBranch(
  userLat: number,
  userLng: number,
  branches: Branch[],
  filterCountry?: string
): Branch {
  // If country filter is provided, only search within that country
  const candidates = filterCountry
    ? branches.filter(b => b.country === filterCountry)
    : branches;

  return candidates.reduce((nearest, branch) => {
    const dist = haversineDistance(userLat, userLng, branch.lat, branch.lng);
    const nearestDist = haversineDistance(userLat, userLng, nearest.lat, nearest.lng);
    return dist < nearestDist ? branch : nearest;
  });
}
```

### Country detection
Use Nominatim reverse geocoding to detect country from coordinates:
```
GET https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json
```
Response includes `address.country_code` (e.g. "dk", "de", "fr").

For the demo with hardcoded data, we can simplify: check which country's branches are closest, or use a simple bounding box check.

---

## QR code generation

Generate QR codes on both the `/create` page and the `/demo` page. The QR encodes:
```
https://[your-vercel-domain]/scan?domain=gsv.dk
```

Use the `qrcode` npm package to generate as SVG or canvas.
QR code should be displayed with ALQR branding (green #267D39 color, not default black).
On the `/create` page, offer download as PNG.

---

## Responsive breakpoints

- Mobile first: default styles are for mobile (< 640px)
- Tablet: 640px+ — slight padding increases
- Desktop: 1024px+ — max-width container centered, map can be side-by-side with results

Key mobile considerations:
- Map must be touch-friendly (pinch zoom, tap to place marker)
- Buttons minimum 48px tap target
- Result card full width with comfortable padding
- Consent banner must not obscure the whole screen on small devices
- Text readable without zooming (16px minimum body)

---

## File structure
```
/app
  /page.tsx                 — Landing page
  /create/page.tsx          — Create/generate QR code page
  /demo/page.tsx            — Simulator demo page
  /scan/page.tsx            — Real scan/redirect page
  /api
    /crawl/route.ts         — POST endpoint: crawl domain → return branches
/components
  /BranchCard.tsx           — Result card showing branch info
  /ConsentBanner.tsx        — GDPR consent overlay
  /DataSourceBadge.tsx      — Shows "✓ Live data" or "⚠ Fallback data" indicator
  /DemoBanner.tsx           — Amber demo-mode warning
  /Map.tsx                  — Leaflet map component
  /QRCode.tsx               — QR code display component
  /ManualSelector.tsx       — Manual city/region picker
  /StepIndicator.tsx        — Step 1-2-3 progress indicator
/data
  /fallback-branches.ts     — Hardcoded fallback data (GSV + Kiloutou)
/lib
  /crawler.ts               — Website crawler: fetch pages, find branch links
  /ai-extract.ts            — Gemini API integration: HTML → structured branch data
  /geocode.ts               — Nominatim geocoding: address → lat/lng
  /geo.ts                   — Haversine distance + nearest branch logic
  /country.ts               — Country detection helper
  /cache.ts                 — Cache layer (Vercel KV or in-memory)
/public
  /logo.svg                 — ALQR logo (simple text-based is fine)
```

---

## Important notes

1. **The crawler must work live.** This is not a hardcoded-only demo. The crawler should fetch real data from GSV's website and parse it with Gemini. Hardcoded data is ONLY a fallback if the live crawler fails — and when fallback is used, it must be visibly indicated in the UI so the developer knows something broke.

2. **The simulator is demo-only.** Make it VERY clear with the amber banner that click-to-set-position is for demonstration purposes. The real product uses the user's actual GPS.

3. **Mobile is the priority.** The marketing director will likely see this on a phone or have it demoed on a phone. Every screen must look perfect on mobile.

4. **Source attribution is mandatory.** Every result card must show where the data comes from and link to the original page. This is both ethical and looks professional.

5. **GDPR consent flow must work.** Even in the demo, showing a proper consent flow demonstrates professionalism and forethought.

6. **Keep it fast.** Crawling may take a few seconds on first request — show a proper loading state with progress. Subsequent requests should be instant from cache.

7. **Language:** All UI text in Danish.

8. **QR codes are physical.** The core use case is QR codes printed/applied on physical surfaces — primarily company vehicles and machinery (e.g., lakeret on GSV trucks next to the logo and phone number), but also flyers, stickers, business cards, signage. The demo must communicate this clearly. The `/create` page generates QR codes meant for printing/download, not for scanning on the same device.

9. **"Prøv som bruger" button is essential.** Since you can't scan a QR code displayed on your own phone screen, every place a QR is shown must also have a direct button/link to open the scan flow. This allows the demo to work on a single device.

10. **Gemini API key.** The Gemini API key should be stored as a Vercel environment variable (`GEMINI_API_KEY`). Never expose it client-side. All AI calls happen server-side in the API route.

11. **Vercel function timeout.** Vercel free tier has a 10-second timeout on serverless functions. The crawler must complete within this window. If a site has many pages, limit crawling to the most relevant pages (contact, locations, branches). Cache aggressively.

---

## Future features — NOT part of this demo (v1)

⛔ **Do NOT build any of these in the first version.** These are documented here for context only — so you understand the bigger vision, but do not implement them. Focus 100% on the core demo described above.

**Personaliserede QR-koder per sælger:**
A QR code tied to a specific salesperson rather than just a company. When scanned, it shows that salesperson's direct contact info instead of the nearest branch. This would require a salesperson management layer and a different URL scheme (e.g. `/scan?seller=hans-jensen`).

**Merchandise/distribution features:**
Generating QR codes optimized for specific physical formats — fridge magnets, stickers for candy tins, printable inserts for Christmas gifts, newsletter-ready formats. This would require export options for different sizes/formats and possibly integration with print services.

**Dual QR types:**
Offering two QR codes per company — one classic (goes to homepage) and one ALQR (location-based routing). This would be a simple addition to the `/create` page but is not needed for the demo.

**These features may be added in v2+ after the demo has been presented and validated.**