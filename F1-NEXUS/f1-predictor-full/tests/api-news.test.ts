import { describe, it, expect, beforeEach } from 'vitest';
// Import the route handler
import { GET as newsGET } from '../app/api/news/route';

function makeRequest(url: string) {
  return { url } as any;
}

describe('API /api/news', () => {
  beforeEach(() => {
    // ensure no key to avoid external calls
    // @ts-ignore
    delete process.env.NEWSAPI_KEY;
  });

  it('returns JSON with updatedAt and diagnostic headers (cache/missing)', async () => {
    const req = makeRequest('http://localhost/api/news?cacheOnly=1');
    const res = await newsGET(req);
    expect(res).toBeInstanceOf(Response);
    const json = await res.json();
    expect(json).toHaveProperty('articles');
    // Headers always present
    expect(res.headers.get('X-RateLimit-Note')).toBeTruthy();
    expect(res.headers.get('X-Requests-Today')).toBeTruthy();
    // X-Updated-At may be empty on cold start
    expect(res.headers.has('X-Updated-At')).toBe(true);
    // Body includes updatedAt
    expect(json).toHaveProperty('updatedAt');
  });
});

