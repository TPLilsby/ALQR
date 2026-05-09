import { Branch, DataSource } from "@/types/branch";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const SYSTEM_PROMPT = `Du er en præcis data-ekstraktor. Din opgave er at udtrække information om ALLE fysiske afdelinger fra virksomhedens hjemmeside-HTML.

VIGTIGT: Returnér KUN et raw JSON array — ingen \`\`\`json blokke, ingen forklaring, ingen kommentarer.

Udtræk ALLE afdelinger du kan finde. For hver afdeling:
{
  "name": "afdelingens navn",
  "address": "fuld adresse med vej, postnummer og by",
  "phone": "telefonnummer eller null",
  "email": "emailadresse eller null",
  "sourceUrl": "URL til afdelingens side eller null"
}

Regler:
- Udtræk ALLE afdelinger — ikke kun de første
- Kun lokationer med en fysisk adresse (vej + postnummer)
- Returnér ikke koordinater — det håndteres separat
- Returnér [] hvis ingen afdelinger kan identificeres`;

interface RawBranch {
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  sourceUrl?: string | null;
}

function isValidRawBranch(obj: unknown): obj is RawBranch {
  if (typeof obj !== "object" || obj === null) return false;
  const b = obj as Record<string, unknown>;
  return (
    typeof b.name === "string" &&
    b.name.length > 0 &&
    typeof b.address === "string" &&
    b.address.length > 0
  );
}

function extractJSON(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw.trim();
}

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function trimHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .slice(0, 30_000);
}

export async function extractBranchesFromHTML(
  html: string,
  company: string,
  country: string,
  domain: string
): Promise<Omit<Branch, "lat" | "lng">[]> {
  console.log("AI-EXTRACT: Called with HTML length:", html.length);
  const prompt = `${SYSTEM_PROMPT}\n\nFirma: ${company}\nLand: ${country}\nDomæne: ${domain}\n\nHTML:\n${html}`;
  try {
    console.log("AI-EXTRACT: Calling Gemini API, key exists:", !!process.env.GEMINI_API_KEY);
    const response = await fetch(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", response.status, err);
      return [];
    }
    const data = await response.json();
    const raw: string = data.candidates[0].content.parts[0].text;
    const json = extractJSON(raw);
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRawBranch).map((b) => ({
      id: `${toSlug(company)}-${toSlug(b.name)}`,
      name: b.name,
      company,
      address: b.address,
      country,
      phone: b.phone ?? undefined,
      email: b.email ?? undefined,
      sourceUrl: b.sourceUrl ?? `https://${domain}`,
      source: "crawled" as DataSource,
    }));
  } catch {
    return [];
  }
}
