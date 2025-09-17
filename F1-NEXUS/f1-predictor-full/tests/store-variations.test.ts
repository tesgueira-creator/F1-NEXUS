import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSimulationStore } from '../stores/simulationStore';

describe('simulationStore variations', () => {
  beforeEach(() => {
    // reset store state
    const { reset } = useSimulationStore.getState();
    reset();
  });

  it('fetchNewsFactors updates variations state', async () => {
    const payload = { factors: [
      { id: 'f1', label: 'Upgrade', description: 'Red Bull aero package', impactType: 'pace', targets: [{type:'team', id:'Red Bull'}], magnitude: 0.2, enabled: true },
      { id: 'f2', label: 'Reliability', description: 'HAM PU issue', impactType: 'reliability', targets: [{type:'driver', id:'HAM'}], magnitude: -0.3, enabled: true },
    ]};
    // mock fetch
    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    const { fetchNewsFactors } = useSimulationStore.getState();
    await fetchNewsFactors();
    const { variations, variationsLoading, variationsError } = useSimulationStore.getState();
    expect(variationsLoading).toBe(false);
    expect(variationsError).toBeNull();
    expect(Array.isArray(variations)).toBe(true);
    expect(variations.length).toBe(2);
  });

  it('respects cooldown between subsequent analyses', async () => {
    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ factors: [] }) });
    const { fetchNewsFactors } = useSimulationStore.getState();
    await fetchNewsFactors();
    const before = useSimulationStore.getState().variationsUpdatedAt;
    await fetchNewsFactors();
    // On second call within cooldown, variationsUpdatedAt should remain unchanged
    const after = useSimulationStore.getState().variationsUpdatedAt;
    expect(after).toBe(before);
  });
});
