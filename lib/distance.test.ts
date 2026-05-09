// Manuel unit-test — kør med: npx tsx lib/distance.test.ts
// Slet denne fil efter sprint 2 er verificeret.
import { haversineDistance, findNearestBranch } from "./distance";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

const greve_kbh = haversineDistance(55.5833, 12.2833, 55.66, 12.55);
// Luftlinje Greve→København SV ~19km (vejdistance er ~30km — Haversine måler fugleflugt)
assert(greve_kbh >= 15 && greve_kbh <= 25, `Greve→København luftlinje ~19km (fik ${greve_kbh}km)`);

const same = haversineDistance(55.5833, 12.2833, 55.5833, 12.2833);
assert(same === 0, `Identiske koordinater = 0km (fik ${same}km)`);

const aarhus_odense = haversineDistance(56.1567, 10.1233, 55.3833, 10.35);
assert(aarhus_odense >= 85 && aarhus_odense <= 100, `Aarhus→Odense ~90km (fik ${aarhus_odense}km)`);

const noResult = findNearestBranch(55.5833, 12.2833, []);
assert(noResult === null, "Tom branches array returnerer null");

const branches = [
  { id: "a", lat: 55.5833, lng: 12.2833 },
  { id: "b", lat: 55.66, lng: 12.55 },
];
const nearest = findNearestBranch(55.5833, 12.2833, branches);
assert(nearest?.branch.id === "a", `Finder nærmeste branch korrekt (fik ${nearest?.branch.id})`);

console.log("\nAlle tests bestået ✓");
