import type { TrackProfile } from './prediction';

// Lightweight mapping of circuit IDs/names to a bias profile
// power: long straights, top speed heavy (e.g., Monza, Baku, Spa, Jeddah, Mexico)
// technical: slow/medium corners, traction/downforce sensitive (e.g., Monaco, Singapore, Hungaroring)
// balanced: otherwise

const POWER_HINTS = [
  'monza', 'autodromo_nazionale_di_monza',
  'baku', 'baku_city',
  'spa', 'spa-francorchamps',
  'jeddah', 'jeddah_corniche',
  'mexico', 'hermanos_rodriguez', 'autodromo_hermanos',
  'silverstone', // high-speed balanced; we lean power
];

const TECH_HINTS = [
  'monaco', 'circuit_de_monaco',
  'singapore', 'marina_bay',
  'hungaroring', 'hungary',
  'imola', 'autodromo_enzo_e_dino_ferrari',
  'zandvoort',
];

function norm(s?: string) { return (s || '').toLowerCase().replace(/\s+/g, '_'); }

export function determineTrackProfile(opts: { circuitId?: string; circuitName?: string; country?: string; locality?: string }): TrackProfile {
  const tokens = [opts.circuitId, opts.circuitName, opts.country, opts.locality].map(norm);
  const hay = tokens.join(' ');
  if (POWER_HINTS.some(h => hay.includes(h))) return 'power';
  if (TECH_HINTS.some(h => hay.includes(h))) return 'technical';
  return 'balanced';
}

