import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET as factorsGET } from '../app/api/news/factors/route';

function makeReq(origin = 'http://localhost') {
  return { nextUrl: { origin } } as any;
}

describe('API /api/news/factors', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns heuristic factors and headers when LLM unavailable', async () => {
    // Stub fetch to return articles for /api/news and 500 for ollama
    // @ts-ignore
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/news')) {
        return new Response(JSON.stringify({ articles: [
          { title: 'Ferrari brings upgrade', url: '#' },
          { title: 'Engine issues for HAM', url: '#' },
        ] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      // ollama or others: return 500
      return new Response('error', { status: 500 });
    });

    const res = await factorsGET(makeReq());
    expect(res).toBeInstanceOf(Response);
    const body = await res.json();
    expect(Array.isArray(body.factors)).toBe(true);
    expect(body.source).toBe('heuristic');
    expect(typeof body.updatedAt).toBe('string');
    expect(res.headers.get('X-Analysis-Source')).toBe('heuristic');
  });
});

