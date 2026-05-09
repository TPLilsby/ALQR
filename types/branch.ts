export type DataSource = "crawled" | "cached" | "fallback";

export interface Branch {
  id: string;
  name: string;
  company: string;
  address: string;
  country: string;
  lat: number;
  lng: number;
  phone?: string;
  email?: string;
  sourceUrl?: string;
  source?: DataSource;
}

export interface CrawlResult {
  branches: Branch[];
  source: DataSource;
  crawledAt: string;
  domain: string;
}
