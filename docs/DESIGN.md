# DESIGN.md — ALQR Design System

## Overordnet Stil
Lyst tema, hvid baggrund, grøn accent (#267D39). Spec er kilde til sandhed — wireframes viser mørkt tema men IGNORERES.
Mobile-first — primær viewport: 390×844 (iPhone 14 Pro).

---

## Farver

| Token | Hex | Tailwind | Brug |
|-------|-----|----------|------|
| Background | `#FFFFFF` | `bg-white` | Sidebaggrund |
| Surface | `#F9FAFB` | `bg-gray-50` | Kort, inputs |
| Surface Raised | `#F3F4F6` | `bg-gray-100` | Hover states, nested kort |
| Accent Green | `#267D39` | custom `green-brand` | Primary buttons, logofarve, checkmarks |
| Accent Green Hover | `#1F6630` | custom `green-brand-dark` | Button hover state |
| Accent Green Light | `#DCFCE7` | `bg-green-100` | Grøn badge baggrund, info-boks |
| Text Primary | `#111827` | `text-gray-900` | Overskrifter, vigtig tekst |
| Text Secondary | `#6B7280` | `text-gray-500` | Beskrivende tekst, labels |
| Text Muted | `#9CA3AF` | `text-gray-400` | Placeholders, metadata |
| Border | `#E5E7EB` | `border-gray-200` | Kortgrænser, input borders |
| Demo Banner BG | `#FEF3C7` | `bg-amber-100` | DEMO-TILSTAND banner |
| Demo Banner Text | `#92400E` | `text-amber-800` | Demo banner tekst |
| Demo Banner Border | `#FCD34D` | `border-amber-300` | Demo banner kant |
| Fallback Badge BG | `#FEF3C7` | `bg-amber-100` | "Forudindlæst data" badge |
| Fallback Badge Text | `#92400E` | `text-amber-800` | Fallback badge tekst |
| Live Badge BG | `#DCFCE7` | `bg-green-100` | "Live data" badge |
| Live Badge Text | `#166534` | `text-green-800` | Live badge tekst |
| Error | `#EF4444` | `text-red-500` | Fejlmeddelelser |

### Tailwind Config (tailwind.config.ts)
```ts
colors: {
  'green-brand': '#267D39',
  'green-brand-dark': '#1F6630',
}
```

---

## Typografi

| Element | Størrelse | Vægt | Farve |
|---------|-----------|------|-------|
| Logo "ALQR" | `text-3xl` (30px) | `font-bold` | `#267D39` |
| Logo subtitle | `text-sm` | `font-normal` | `text-gray-500` |
| H1 Slogan | `text-2xl` (24px) | `font-bold` | `text-gray-900` |
| H2 Sektion | `text-xl` (20px) | `font-semibold` | `text-gray-900` |
| H3 Korttitel | `text-lg` (18px) | `font-semibold` | `text-gray-900` |
| Body | `text-base` (16px) | `font-normal` | `text-gray-500` |
| Small/Meta | `text-sm` (14px) | `font-normal` | `text-gray-400` |
| Font: | System default — `font-sans` | | |

---

## Spacing & Layout

- Max bredde på mobil: `max-w-md` (448px), centreret
- Side-padding: `px-4` (16px)
- Sektionsafstand: `gap-4` eller `space-y-4`
- Kortpadding: `p-4` indvendigt
- Border radius på kort: `rounded-xl` (12px)
- Border radius på buttons: `rounded-lg` (8px)
- Border radius på inputs: `rounded-lg` (8px)

---

## Komponenter

### Primary Button
```
bg-green-brand text-white font-semibold
px-6 py-3 rounded-lg w-full
hover:opacity-90 active:scale-95
transition-all
```

### Secondary Button (outline)
```
border border-green-brand text-green-brand font-semibold
px-6 py-3 rounded-lg w-full
hover:bg-green-brand/10
```

### Ghost Button
```
text-green-brand font-medium
px-4 py-2
hover:underline
```

### Input Field
```
bg-white border border-gray-200 text-gray-900
px-4 py-3 rounded-lg w-full
placeholder:text-gray-400
focus:outline-none focus:border-green-brand focus:ring-1 focus:ring-green-brand/30
shadow-sm
```

### Kort / Card
```
bg-white border border-gray-200
rounded-xl p-4 shadow-sm
```

---

## Side-layouts

### Side 1: Landing Page (`/`)
```
[Topbar med logo ALQR]
[Hero section]
  - Logo + tagline: "Active Location QR"
  - H1: "Scan og du vil finde"
  - Beskrivelse (1 linje)
  - [Prøv demo med simulator] — primary button
  - [Scan QR-kode] — secondary button
[Features liste]
  ✓ Finder nærmeste afdeling
  ✓ Ingen registrering nødvendig
  ✓ Virker internationalt
  ✓ 100% GDPR-compliant
[Footer: "Fortroligt — ALQR © 2026"]
```

### Side 2: Simulator (`/demo`)
```
[DEMO-TILSTAND amber banner — fuld bredde]
  "⚠ DEMO-TILSTAND"
  "Simuleret position. I det færdige produkt bruges din rigtige placering automatisk."
[Domæne-dropdown: "GSV Materieludlejning ▼"]
[OpenStreetMap — klikbar, 200px høj]
  Placeholder tekst: "Klik for at sætte position"
  Grøn pin marker ved klik
  Label under marker (bynavn)
[Nærmeste afdeling kort]
  "Nærmeste afdeling:"
  Firmanavn (H3)
  Adresse, tlf, email
  "Se på [domæne] →" link
  [X km væk] badge + [Kilde: gsv.dk] attribution
[QR-kode sektion]
  QR placeholder
  "Denne QR-kode ville i det færdige produkt sende brugeren direkte til nærmeste afdeling."
```

### Side 3A: Consent Dialog (`/scan`)
```
[Mørk overlay/modal — centered]
[Pin ikon — hvid cirkel]
"Brug din placering?"
Beskrivelse: "ALQR vil gerne bruge din placering for at finde den nærmeste afdeling af [firma]."
✓ Din placering gemmes ikke
✓ Deles ikke med tredjepart
✓ Behandles kun i din browser
[Tillad placering] — primary button
[Vælg manuelt i stedet] — secondary button
```

### Side 3B: Resultat (`/scan` efter consent)
```
[Logo ALQR — grøn]
[Checkmark ikon — grøn cirkel]
"Nærmeste afdeling fundet"
[Resultat kort]
  Firmanavn (subtitle)
  Afdelingsnavn (H2)
  Adresse
  Telefon
  Email
  [Ring op] — primary green
  [Send email] — secondary green outline
  "Se på gsv.dk →" link
  "Kilde: gsv.dk"
[GDPR note: "Din placering blev ikke gemt • Læs vores privatlivspolitik"]
[Footer: "Drevet af ALQR • Scan og du vil finde"]
```

### Side 4A: Opret QR (`/create`)
```
[Logo ALQR]
"Opret QR-kode"
[StepIndicator: 1 → 2 → 3]
[Input: "Virksomhedens hjemmeside" placeholder "f.eks. gsv.dk"]
[Input: "Virksomhedsnavn (valgfrit)" placeholder "f.eks. GSV Materieludlejning"]
[Info-boks grøn/mint:
  "Systemet finder automatisk virksomhedens afdelinger via deres eksisterende hjemmeside."]
[Generer QR-kode] — primary button
```

### Side 4B: QR Klar (`/create` step 3)
```
[Logo ALQR]
"Din QR-kode er klar"
[StepIndicator: ✓ ✓ 3]
[QR-kode billede — stor]
[Firmanavn under QR]
[Badge: "✓ 24 afdelinger fundet i DK via gsv.dk"]
[Download QR-kode] — primary button
[Kopier link] — secondary outline
[Prøv i simulator] — ghost/outline
[URL preview: "alqr.dk/s?d=gsv.dk"]
```

---

## Step Indicator
3 trin, forbundet med linje:
- Completed: grøn cirkel med hvidt ✓
- Active: grøn cirkel med hvidt tal
- Pending: grå cirkel (zinc-700) med grå tal

---

## DataSourceBadge

### Live data (crawled/cached)
```
bg-green-100 text-green-800 border border-green-200
rounded-full px-3 py-1 text-xs font-medium
"✓ Live data fra gsv.dk"
```

### Fallback data
```
bg-amber-100 text-amber-800 border border-amber-200
rounded-full px-3 py-1 text-xs font-medium
"⚠ Bruger forudindlæst data — live crawling fejlede"
```

---

## Demo Banner
```
bg-amber-100 border-b border-amber-300 text-amber-800
px-4 py-3 w-full
Ikon: ⚠ (eller Warning SVG)
Tekst bold: "DEMO-TILSTAND"
Tekst normal: "Simuleret position. I det færdige produkt bruges din rigtige placering automatisk."
```

---

## Ikoner
Brug `lucide-react` library:
- Pin/location: `MapPin`
- Telefon: `Phone`
- Email: `Mail`
- Check: `Check`, `CheckCircle`
- Warning: `AlertTriangle`
- Download: `Download`
- Copy: `Copy`
- External link: `ExternalLink`
- Chevron/dropdown: `ChevronDown`
- QR: `QrCode`

---

## Animationer
- Button press: `active:scale-95 transition-transform duration-75`
- Fade in resultat: `animate-fadeIn` (custom, 300ms)
- Kort hover: `hover:border-zinc-600 transition-colors`
- Loading spinner: standard Tailwind `animate-spin`

---

## Mobile-First Regler
1. Alle layouts er single-column under `md:`
2. Touch targets minimum 44×44px
3. Ingen hover-only states — alt skal virke med tap
4. Font minimum 16px for inputs (undgår iOS zoom)
5. `viewport` meta tag: `width=device-width, initial-scale=1`
6. Bottom safe area padding på scan-flow: `pb-safe`

---

## QR-kode Specifikationer
- Størrelse til display: 200×200px
- Størrelse til download: 400×400px (high-res)
- Fejlkorrektion: Level M (15%)
- Farver: sort på hvid (printer-venligt)
- Format: PNG download
- URL-format i QR: `https://alqr.dk/s?d=[domæne]`
