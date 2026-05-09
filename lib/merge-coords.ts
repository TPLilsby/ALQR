import { Branch } from "@/types/branch";

function extractPostalCode(address: string): string | null {
  const match = address.match(/\b(\d{4,5})\b/);
  return match ? match[1] : null;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(gsv|materieludlejning|kiloutou)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function mergeCoordinates(
  crawled: Branch[],
  known: Branch[]
): Branch[] {
  return crawled.map((branch) => {
    if (branch.lat !== 0 || branch.lng !== 0) return branch;

    const postalCode = extractPostalCode(branch.address);

    // Fase 1: match på postnummer
    const postalCandidates = postalCode
      ? known.filter((k) => extractPostalCode(k.address) === postalCode)
      : [];

    if (postalCandidates.length === 1) {
      return { ...branch, lat: postalCandidates[0].lat, lng: postalCandidates[0].lng };
    }

    if (postalCandidates.length > 1) {
      // Fase 2: navn-match inden for postnummer-kandidater
      const normalizedName = normalizeName(branch.name);
      const nameMatch = postalCandidates.find((k) => {
        const kn = normalizeName(k.name);
        return kn.includes(normalizedName) || normalizedName.includes(kn);
      });
      const winner = nameMatch ?? postalCandidates[0];
      return { ...branch, lat: winner.lat, lng: winner.lng };
    }

    // Fase 3: navn-only match (ingen postnummer fundet)
    const normalizedName = normalizeName(branch.name);
    const nameOnlyMatch = known.find((k) => {
      const kn = normalizeName(k.name);
      return kn.includes(normalizedName) || normalizedName.includes(kn);
    });
    if (nameOnlyMatch) {
      return { ...branch, lat: nameOnlyMatch.lat, lng: nameOnlyMatch.lng };
    }

    return branch;
  });
}
