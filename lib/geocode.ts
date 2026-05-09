import { Branch } from "@/types/branch";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "ALQR/1.0 (tl@veng.it)";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function geocodeAddress(
  address: string,
  country: string
): Promise<{ lat: number; lng: number } | null> {
  const q = `${address}, ${country}`;
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(q)}&format=json&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function geocodeBranches(
  branches: Branch[],
  maxBranches = 5
): Promise<Branch[]> {
  const results: Branch[] = [];
  for (const branch of branches.slice(0, maxBranches)) {
    const coords = await geocodeAddress(branch.address, branch.country);
    if (coords) {
      results.push({ ...branch, lat: coords.lat, lng: coords.lng });
    }
    await sleep(1100);
  }
  return results;
}
