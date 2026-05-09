import { CrawlResult } from "@/types/branch";

const TTL_MS = 72 * 60 * 60 * 1000;

interface CacheEntry {
  data: CrawlResult;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

export function get(key: string): CrawlResult | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function set(key: string, data: CrawlResult): void {
  store.set(key, { data, expiresAt: Date.now() + TTL_MS });
}

export function has(key: string): boolean {
  return get(key) !== null;
}
