import { describe, it, expect } from 'vitest';
import { determineTrackProfile } from '../lib/circuit-profile';

describe('determineTrackProfile', () => {
  it('detects power circuits', () => {
    expect(determineTrackProfile({ circuitName: 'Autodromo Nazionale di Monza' })).toBe('power');
    expect(determineTrackProfile({ circuitId: 'baku_city' })).toBe('power');
  });
  it('detects technical circuits', () => {
    expect(determineTrackProfile({ circuitName: 'Circuit de Monaco' })).toBe('technical');
    expect(determineTrackProfile({ circuitId: 'marina_bay' })).toBe('technical');
  });
  it('defaults to balanced otherwise', () => {
    expect(determineTrackProfile({ circuitName: 'Interlagos' })).toBe('balanced');
  });
});

