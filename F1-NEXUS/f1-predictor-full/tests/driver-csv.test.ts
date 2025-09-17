import { describe, it, expect } from 'vitest';
import { parseDriversFromCSV } from '../lib/driver-data';

const headers = 'driver_name,team_name,grid_position,qualy_gap_ms,fp_longrun_pace_s,straightline_index,cornering_index,pit_crew_mean_s,dnf_rate,sc_prob,rain_prob,speed_trap_kph';

describe('parseDriversFromCSV', () => {
  it('parses valid CSV and maps to metrics', () => {
    const csv = [
      headers,
      'Max Verstappen,Red Bull,1,0,-0.2,92,96,2.27,0.02,0.1,0.1,342',
      'Lewis Hamilton,Mercedes,5,0.12,0.07,82,91,2.39,0.03,0.2,0.1,336',
    ].join('\n');
    const drivers = parseDriversFromCSV(csv);
    expect(drivers.length).toBe(2);
    expect(drivers[0].name).toBe('Max Verstappen');
    expect(drivers[0].code).toBe('VER');
    expect(drivers[0].straightlineIndex).toBe(92);
  });

  it('throws on missing headers', () => {
    const bad = 'driver_name,team_name\nFoo,Bar';
    expect(() => parseDriversFromCSV(bad)).toThrow();
  });
});

