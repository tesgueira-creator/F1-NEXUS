export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

type NewsApiArticle = {
  title: string;
  description?: string;
  url: string;
  source?: { name?: string };
  publishedAt?: string;
};

const NEWS_ENDPOINT = "https://newsapi.org/v2/everything";
const MAX_PER_DAY = parseInt(process.env.NEWSAPI_MAX_PER_DAY || "80", 10);

type CacheState = {
  day: string; // YYYY-MM-DD
  count: number;
  last?: any;
  lastAt?: number;
};

let CACHE: CacheState = { day: new Date().toISOString().slice(0, 10), count: 0 };

function notSameDay(a: string, b: string) {
  return a !== b;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "(Formula 1 OR F1 OR Grand Prix)";
  const language = searchParams.get("language") || "en";
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 50);
  const from = searchParams.get("from") || undefined;
  const sortBy = searchParams.get("sortBy") || "publishedAt";
  const useCacheOnly = searchParams.get("cacheOnly") === "1";

  const today = new Date().toISOString().slice(0, 10);
  if (notSameDay(CACHE.day, today)) {
    CACHE = { day: today, count: 0, last: CACHE.last, lastAt: CACHE.lastAt };
  }

  if (!process.env.NEWSAPI_KEY) {
    const updatedAt = CACHE.lastAt ? new Date(CACHE.lastAt).toISOString() : null;
    return new NextResponse(
      JSON.stringify({ articles: CACHE.last?.articles ?? [], updatedAt, note: "Missing NEWSAPI_KEY; returning cached (if any)." }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Note': 'missing-key',
          'X-Requests-Today': String(CACHE.count),
          'X-Updated-At': updatedAt || ''
        }
      }
    );
  }

  if (CACHE.count >= MAX_PER_DAY || useCacheOnly) {
    const updatedAt = CACHE.lastAt ? new Date(CACHE.lastAt).toISOString() : null;
    return new NextResponse(
      JSON.stringify({ articles: CACHE.last?.articles ?? [], cached: true, updatedAt }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Note': 'cache-return',
          'X-Requests-Today': String(CACHE.count),
          'X-Updated-At': updatedAt || ''
        }
      }
    );
  }

  const params = new URLSearchParams({
    q,
    language,
    sortBy,
    pageSize: String(pageSize),
  });
  if (from) params.set("from", from);

  const url = `${NEWS_ENDPOINT}?${params.toString()}`;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(url, {
      headers: { "X-Api-Key": String(process.env.NEWSAPI_KEY) },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(id);
    const json = await res.json();
    const articles = (json.articles || []).map((a: NewsApiArticle) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      source: a.source?.name,
      publishedAt: a.publishedAt,
    }));
    CACHE.count += 1;
    CACHE.last = { articles };
    CACHE.lastAt = Date.now();
    const updatedAt = new Date(CACHE.lastAt).toISOString();
    return new NextResponse(
      JSON.stringify({ articles, updatedAt }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Note': 'ok',
          'X-Requests-Today': String(CACHE.count),
          'X-Updated-At': updatedAt
        }
      }
    );
  } catch (e: any) {
    const updatedAt = CACHE.lastAt ? new Date(CACHE.lastAt).toISOString() : null;
    return new NextResponse(
      JSON.stringify({ articles: CACHE.last?.articles ?? [], updatedAt, error: e?.message ?? String(e) }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Note': 'error-cache-return',
          'X-Requests-Today': String(CACHE.count),
          'X-Updated-At': updatedAt || ''
        }
      }
    );
  }
}
