import { buildDriversFromErgast } from './ergast';
import { driverData } from './driver-data';

export type RosterDriver = {
  id: string; // app id (code lowercased)
  code: string; // e.g., VER
  name: string; // Full name
  team: string; // Canonical team name
};

export type Roster = {
  drivers: RosterDriver[];
  byCode: Map<string, RosterDriver>;
  byName: Map<string, RosterDriver>;
  teamSynonyms: Map<string, string>; // synonym -> canonical team name
};

const TEAM_CANONICAL = [
  'Red Bull', 'Ferrari', 'Mercedes', 'McLaren', 'Aston Martin',
  'Alpine', 'Williams', 'RB', 'Haas', 'Sauber'
];

const TEAM_SYNONYMS: Record<string, string[]> = {
  'Red Bull': ['Red Bull Racing', 'RBR', 'RedBull'],
  'Ferrari': ['Scuderia Ferrari'],
  'Mercedes': ['Mercedes-AMG', 'AMG'],
  'McLaren': ['McLaren F1'],
  'Aston Martin': ['Aston Martin Aramco', 'AMR'],
  'Alpine': ['BWT Alpine', 'Renault'],
  'Williams': ['Williams Racing'],
  'RB': ['Visa Cash App RB', 'AlphaTauri', 'Toro Rosso'],
  'Haas': ['Haas F1 Team'],
  'Sauber': ['Stake', 'Sauber F1', 'Kick Sauber', 'Stake F1 Team']
};

function canonicalTeamName(name: string): string {
  const n = name || '';
  for (const canon of TEAM_CANONICAL) {
    const variants = [canon, ...(TEAM_SYNONYMS[canon] || [])];
    for (const v of variants) {
      if (n.toLowerCase().includes(v.toLowerCase())) return canon;
    }
  }
  return n || '';
}

function normalize(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .toLowerCase();
}

export async function getRoster(): Promise<Roster> {
  try {
    const ergast = await buildDriversFromErgast();
    const drivers: RosterDriver[] = ergast.map(d => ({
      id: d.id,
      code: d.code?.toUpperCase() || d.id.toUpperCase(),
      name: d.name,
      team: canonicalTeamName(d.team || ''),
    }));
    return buildIndexes(drivers);
  } catch {
    const drivers: RosterDriver[] = driverData.map(d => ({
      id: d.id,
      code: d.code?.toUpperCase() || d.id.toUpperCase().slice(0,3),
      name: d.name,
      team: canonicalTeamName(d.team),
    }));
    return buildIndexes(drivers);
  }
}

function buildIndexes(drivers: RosterDriver[]): Roster {
  const byCode = new Map<string, RosterDriver>();
  const byName = new Map<string, RosterDriver>();
  for (const d of drivers) {
    byCode.set(d.code.toUpperCase(), d);
    byName.set(normalize(d.name), d);
    // add simple first/last name keys
    const [first, ...rest] = d.name.split(' ');
    const last = rest.at(-1) || '';
    if (first) byName.set(normalize(first), d);
    if (last) byName.set(normalize(last), d);
  }
  const teamSynonyms = new Map<string, string>();
  for (const [canon, syns] of Object.entries(TEAM_SYNONYMS)) {
    teamSynonyms.set(normalize(canon), canon);
    for (const s of syns) teamSynonyms.set(normalize(s), canon);
  }
  return { drivers, byCode, byName, teamSynonyms };
}

export function resolveTargetsFromText(text: string, roster: Roster) {
  const targets: { type: 'driver' | 'team'; id: string }[] = [];
  const t = normalize(text || '');
  // drivers by code
  for (const [code, d] of roster.byCode.entries()) {
    if (t.includes(code.toLowerCase())) targets.push({ type: 'driver', id: code });
  }
  // drivers by name
  for (const [key, d] of roster.byName.entries()) {
    if (key.length >= 3 && t.includes(key)) targets.push({ type: 'driver', id: d.code });
  }
  // teams by synonyms
  for (const [syn, canon] of roster.teamSynonyms.entries()) {
    if (t.includes(syn)) targets.push({ type: 'team', id: canon });
  }
  // dedupe
  const seen = new Set<string>();
  return targets.filter(x => {
    const k = `${x.type}:${x.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
