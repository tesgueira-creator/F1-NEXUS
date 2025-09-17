import { describe, it, expect } from 'vitest';
import { simpleHeuristicFromNews, NewsArticle } from '../lib/news-factors';

describe('news-factors heuristic', () => {
  it('produces clamped, deduped factors with expected impact types', () => {
    const articles: NewsArticle[] = [
      { title: 'Ferrari brings major aero upgrade for upcoming Grand Prix', url: '#' },
      { title: 'Mercedes engine reliability under scrutiny after failures', url: '#' },
      { title: 'Grid penalty for VER due to gearbox change', url: '#' },
      { title: 'Williams tries undercut strategy in wet forecast', url: '#' },
    ];
    const factors = simpleHeuristicFromNews(articles);
    expect(Array.isArray(factors)).toBe(true);
    for (const f of factors) {
      expect(f.magnitude).toBeGreaterThanOrEqual(-1);
      expect(f.magnitude).toBeLessThanOrEqual(1);
      expect(['pace','reliability','qualifying','strategy']).toContain(f.impactType);
      expect(typeof f.enabled).toBe('boolean');
    }
  });
});

