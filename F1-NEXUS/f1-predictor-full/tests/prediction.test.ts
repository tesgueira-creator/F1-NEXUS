import { describe, it, expect } from 'vitest';
import { runPrediction } from '../lib/prediction';
import { driverData } from '../lib/driver-data';

describe('runPrediction', () => {
  it('should return a valid simulation summary', () => {
    const drivers = driverData.slice(0, 5).map(d => ({ ...d, isActive: true }));
    const context = {
      trackProfile: 'balanced' as const,
      weather: 'dry' as const,
      tyreStress: 'medium' as const,
      safetyCar: 'medium' as const,
      runs: 100,
      randomness: 0.5
    };

    const result = runPrediction(drivers, context);

    expect(result).toHaveProperty('id');
    expect(result.results).toHaveLength(5);
    expect(result.predictedWinner).toBeDefined();
    expect(result.predictedPodium).toHaveLength(3);
    expect(result.results[0].winProbability).toBeGreaterThanOrEqual(0);
    expect(result.results[0].winProbability).toBeLessThanOrEqual(1);
  });

  it('should handle no active drivers', () => {
    const drivers = driverData.slice(0, 2).map(d => ({ ...d, isActive: false }));
    const context = {
      trackProfile: 'balanced' as const,
      weather: 'dry' as const,
      tyreStress: 'medium' as const,
      safetyCar: 'medium' as const,
      runs: 100,
      randomness: 0.5
    };

    const result = runPrediction(drivers, context);

    expect(result.results).toHaveLength(0);
    expect(result.predictedWinner).toBeNull();
  });

  it('should sort results by win probability', () => {
    const drivers = driverData.slice(0, 3).map(d => ({ ...d, isActive: true }));
    const context = {
      trackProfile: 'balanced' as const,
      weather: 'dry' as const,
      tyreStress: 'medium' as const,
      safetyCar: 'medium' as const,
      runs: 1000,
      randomness: 0.1
    };

    const result = runPrediction(drivers, context);

    for (let i = 1; i < result.results.length; i++) {
      expect(result.results[i - 1].winProbability).toBeGreaterThanOrEqual(result.results[i].winProbability);
    }
  });
});