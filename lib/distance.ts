export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function findNearestBranch<T extends { lat: number; lng: number }>(
  userLat: number,
  userLng: number,
  branches: T[]
): { branch: T; distanceKm: number } | null {
  if (branches.length === 0) return null;

  let nearest = branches[0];
  let minDist = haversineDistance(userLat, userLng, nearest.lat, nearest.lng);

  for (let i = 1; i < branches.length; i++) {
    const dist = haversineDistance(userLat, userLng, branches[i].lat, branches[i].lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = branches[i];
    }
  }

  return { branch: nearest, distanceKm: minDist };
}
