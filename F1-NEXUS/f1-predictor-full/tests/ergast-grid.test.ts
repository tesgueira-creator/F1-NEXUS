import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPreferredQualifyingGrid } from '../lib/ergast';

describe('ergast preferred qualifying grid', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('uses next round grid when available, otherwise falls back to last', async () => {
    // Mock fetchErgast via global fetch since ergast uses fetch inside
    // Sequence:
    // 1) /current/next.json -> round 12
    // 2) /current/12/qualifying.json -> empty (no results yet)
    // 3) /current/last/qualifying.json -> has results
    // @ts-ignore
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/current/next.json')) {
        return new Response(JSON.stringify({ MRData: { RaceTable: { Races: [{ round: '12' }] } } }), { status: 200 });
      }
      if (url.includes('/current/12/qualifying.json')) {
        return new Response(JSON.stringify({ MRData: { RaceTable: { Races: [{ QualifyingResults: [] }] } } }), { status: 200 });
      }
      if (url.includes('/current/last/qualifying.json')) {
        return new Response(JSON.stringify({ MRData: { RaceTable: { Races: [{ QualifyingResults: [ { position: '1', Driver: { code: 'VER', familyName: 'Verstappen', driverId: 'max_verstappen' } }, { position: '2', Driver: { code: 'HAM', familyName: 'Hamilton', driverId: 'lewis_hamilton' } } ] }] } } }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    });

    const grid = await getPreferredQualifyingGrid();
    expect(grid.VER).toBe(1);
    expect(grid.HAM).toBe(2);
  });
});

