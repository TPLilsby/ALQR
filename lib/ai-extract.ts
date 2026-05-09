import { GoogleGenerativeAI } from "@google/generative-ai";
import { Branch, DataSource } from "@/types/branch";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });

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
    .slice(0, 50_000);
}

export async function extractBranchesFromHTML(
  html: string,
  company: string,
  country: string,
  domain: string
): Promise<Omit<Branch, "lat" | "lng">[]> {
  const prompt = `${SYSTEM_PROMPT}\n\nFirma: ${company}\nLand: ${country}\nDomæne: ${domain}\n\nHTML:\n${html}`;
  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
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
