const ERGAST_BASE = "https://ergast.com/api/f1";

type ErgastMRData = {
  MRData: any;
};

async function fetchErgast(path: string): Promise<ErgastMRData> {
  const url = `${ERGAST_BASE}${path}`;
  const maxAttempts = 3;
  let attempt = 0;
  let lastErr: any = null;
  while (attempt < maxAttempts) {
    attempt += 1;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 7000);
    try {
      const res = await fetch(url, { cache: "no-store", signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as ErgastMRData;
    } catch (err) {
      clearTimeout(id);
      lastErr = err;
      await new Promise(r => setTimeout(r, 300 * attempt));
    }
  }
  throw new Error(`Ergast request failed after retries: ${lastErr?.message || lastErr}`);
}

export type ErgastDriverLite = {
  driverId: string;
  code?: string;
  givenName: string;
  familyName: string;
  permanentNumber?: string;
  nationality?: string;
};

export type ErgastDriverStanding = {
  position: string;
  points: string;
  wins: string;
  Driver: ErgastDriverLite;
  Constructors: Array<{ constructorId: string; name: string }>;
};

export async function getCurrentDriverStandings(): Promise<ErgastDriverStanding[]> {
  const data = await fetchErgast("/current/driverStandings.json");
  const lists = data.MRData?.StandingsTable?.StandingsLists ?? [];
  const standings = lists[0]?.DriverStandings ?? [];
  return standings as ErgastDriverStanding[];
}

export type ErgastRaceResults = Array<{
  raceName: string;
  round: string;
  Results: Array<{
    position?: string;
    status: string;
    Driver: ErgastDriverLite;
  }>;
}>;

export async function getAllCurrentResults(): Promise<ErgastRaceResults> {
  const data = await fetchErgast("/current/results.json?limit=1000");
  const races = data.MRData?.RaceTable?.Races ?? [];
  return races as ErgastRaceResults;
}

// Heuristic to determine if a status indicates a classified finish
function isClassifiedFinish(status: string): boolean {
  const s = status.toLowerCase();
  if (s.includes("finished")) return true;
  if (/(^|\s)lap(s)?\b/.test(s)) return true; // e.g. "+1 Lap", "2 Laps"
  // Some statuses like "+1 Lap" don't include the word 'finished' in some datasets
  if (s.includes("+" ) && s.includes("lap")) return true;
  return false;
}

export type DriverErgastMetrics = {
  id: string; // preferred ID to use inside the app (code lowercased when available)
  code: string; // 3-letter code when available, otherwise derived from name
  name: string; // Full name
  team: string; // Constructor name
  number: number; // permanent number when available
  nationality?: string;
  driverId: string; // Ergast driverId
  constructorId?: string;
  standingsPosition?: number;
  standingsPoints?: number;
  standingsWins?: number;
  dnfRate?: number; // computed from season-to-date results
};

export async function buildDriversFromErgast(): Promise<DriverErgastMetrics[]> {
  const [standings, results] = await Promise.all([
    getCurrentDriverStandings(),
    getAllCurrentResults(),
  ]);

  // Compute DNF rates from results
  const totals: Record<string, { races: number; dnfs: number }> = {};
  for (const race of results) {
    for (const r of race.Results) {
      const did = r.Driver.driverId;
      if (!totals[did]) totals[did] = { races: 0, dnfs: 0 };
      totals[did].races += 1;
      if (!isClassifiedFinish(r.status)) totals[did].dnfs += 1;
    }
  }

  // Build driver metrics from standings as the base roster
  const drivers: DriverErgastMetrics[] = standings.map((row) => {
    const d = row.Driver;
    const constructorName = row.Constructors?.[0]?.name ?? "";
    const constructorId = row.Constructors?.[0]?.constructorId;
    const code = (d.code && d.code.trim()) || (d.familyName || "UNK").slice(0, 3).toUpperCase();
    const id = (code || d.driverId).toLowerCase();
    const fullName = `${d.givenName} ${d.familyName}`.trim();
    const number = d.permanentNumber ? parseInt(d.permanentNumber, 10) : 0;
    const did = d.driverId;
    const agg = totals[did] || { races: 0, dnfs: 0 };
    const dnfRate = agg.races > 0 ? agg.dnfs / agg.races : 0.0;
    return {
      id,
      code,
      name: fullName,
      team: constructorName,
      number,
      nationality: d.nationality,
      driverId: d.driverId,
      constructorId,
      standingsPosition: parseInt(row.position, 10),
      standingsPoints: parseFloat(row.points),
      standingsWins: parseInt(row.wins, 10),
      dnfRate,
    };
  });

  return drivers;
}

export async function computeWeightsFromErgast(): Promise<Record<string, number>> {
  const standings = await getCurrentDriverStandings();
  // Use current season points as a proxy for strength; add epsilon to avoid zeros
  const map: Record<string, number> = {};
  let max = 0;
  for (const row of standings) {
    const code = (row.Driver.code || row.Driver.familyName.slice(0, 3)).toLowerCase();
    const points = Math.max(0.5, parseFloat(row.points));
    map[code] = points;
    if (points > max) max = points;
  }
  // Normalize weights to [0.1, 1]
  const norm: Record<string, number> = {};
  for (const [k, v] of Object.entries(map)) {
    norm[k] = max > 0 ? Math.max(0.1, v / max) : 1;
  }
  return norm;
}

export type QualifyingEntry = {
  position: string; // "1", "2", ...
  Driver: ErgastDriverLite;
};

export async function getLastQualifyingGrid(): Promise<Record<string, number>> {
  try {
    const data = await fetchErgast("/current/last/qualifying.json");
    const race = data.MRData?.RaceTable?.Races?.[0];
    const list = (race?.QualifyingResults || []) as QualifyingEntry[];
    const map: Record<string, number> = {};
    for (const q of list) {
      const code = (q.Driver.code || q.Driver.familyName?.slice(0, 3) || q.Driver.driverId).toUpperCase();
      const pos = parseInt(q.position, 10);
      if (Number.isFinite(pos)) map[code] = pos;
    }
    return map;
  } catch {
    return {};
  }
}

export async function getNextRaceRound(): Promise<number | null> {
  try {
    const data = await fetchErgast("/current/next.json");
    const race = data.MRData?.RaceTable?.Races?.[0];
    const roundStr = race?.round;
    const round = roundStr ? parseInt(roundStr, 10) : NaN;
    return Number.isFinite(round) ? round : null;
  } catch {
    return null;
  }
}

export async function getQualifyingGridForRound(round: number | string): Promise<Record<string, number>> {
  try {
    const data = await fetchErgast(`/current/${round}/qualifying.json`);
    const race = data.MRData?.RaceTable?.Races?.[0];
    const list = (race?.QualifyingResults || []) as QualifyingEntry[];
    const map: Record<string, number> = {};
    for (const q of list) {
      const code = (q.Driver.code || q.Driver.familyName?.slice(0, 3) || q.Driver.driverId).toUpperCase();
      const pos = parseInt(q.position, 10);
      if (Number.isFinite(pos)) map[code] = pos;
    }
    return map;
  } catch {
    return {};
  }
}

// Preferred grid for the upcoming race: try next round's quali if available; otherwise fallback to last quali
export async function getPreferredQualifyingGrid(): Promise<Record<string, number>> {
  const nextRound = await getNextRaceRound();
  if (nextRound != null) {
    const grid = await getQualifyingGridForRound(nextRound);
    if (Object.keys(grid).length > 0) return grid;
  }
  return getLastQualifyingGrid();
}

export type NextRaceInfo = {
  round: number | null;
  circuitId?: string;
  circuitName?: string;
  country?: string;
  locality?: string;
};

export async function getNextRaceInfo(): Promise<NextRaceInfo> {
  try {
    const data = await fetchErgast("/current/next.json");
    const race = data.MRData?.RaceTable?.Races?.[0];
    const round = race?.round ? parseInt(race.round, 10) : null;
    const circuit = race?.Circuit || {};
    return {
      round,
      circuitId: circuit.circuitId,
      circuitName: circuit.circuitName,
      country: circuit?.Location?.country,
      locality: circuit?.Location?.locality,
    };
  } catch {
    return { round: null };
  }
}
