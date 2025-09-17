import { DriverMetrics } from "./driver-data";

export type TrackProfile = "balanced" | "power" | "technical";
export type WeatherProfile = "dry" | "mixed" | "wet";
export type TyreStress = "low" | "medium" | "high";
export type SafetyCarProfile = "low" | "medium" | "high";

export type RaceContext = {
  trackProfile: TrackProfile;
  weather: WeatherProfile;
  tyreStress: TyreStress;
  safetyCar: SafetyCarProfile;
  runs: number;
  randomness: number;
  seed?: number;
};

export type DriverSimulationInput = DriverMetrics & { isActive?: boolean };

export type DriverSimulationResult = {
  id: string;
  name: string;
  team: string;
  code: string;
  winProbability: number;
  podiumProbability: number;
  averageFinish: number;
  expectedPoints: number;
  dnfProbability: number;
  bestFinish: number;
  worstFinish: number;
  consistencyIndex: number;
};

export type SimulationSummary = {
  id: number;
  runs: number;
  context: RaceContext;
  results: DriverSimulationResult[];
  predictedWinner: DriverSimulationResult | null;
  predictedPodium: DriverSimulationResult[];
};

type MetricRange = { min: number; max: number };

type InternalDriverState = {
  id: string;
  name: string;
  team: string;
  code: string;
  metrics: DriverMetrics;
};

type AggregatedStats = {
  wins: number;
  podiums: number;
  points: number;
  dnfs: number;
  totalFinish: number;
  totalFinishSquared: number;
  bestFinish: number;
  worstFinish: number;
};

const POINTS_TABLE = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

const TRACK_WEIGHTS: Record<TrackProfile, { straightline: number; cornering: number }> = {
  balanced: { straightline: 1, cornering: 1 },
  power: { straightline: 1.25, cornering: 0.9 },
  technical: { straightline: 0.92, cornering: 1.25 }
};

const WEATHER_WEIGHTS: Record<WeatherProfile, { wetSkill: number; noise: number }> = {
  dry: { wetSkill: 0.85, noise: 0.85 },
  mixed: { wetSkill: 1, noise: 1 },
  wet: { wetSkill: 1.25, noise: 1.2 }
};

const TYRE_STRESS_FACTORS: Record<TyreStress, number> = {
  low: 0.92,
  medium: 1,
  high: 1.12
};

const SAFETY_CAR_FACTORS: Record<SafetyCarProfile, number> = {
  low: 0.88,
  medium: 1,
  high: 1.18
};

export function runPrediction(
  drivers: DriverSimulationInput[],
  context: RaceContext
): SimulationSummary {
  const activeDrivers = drivers.filter(d => d.isActive !== false);
  if (activeDrivers.length < 2) {
    return {
      id: Date.now(),
      runs: 0,
      context,
      results: [],
      predictedWinner: null,
      predictedPodium: []
    };
  }

  const runs = clamp(Math.round(context.runs), 500, 20000);
  const randomness = clamp(context.randomness, 0, 1);

  const normalisers = buildNormalisers(activeDrivers);
  const trackProfile = TRACK_WEIGHTS[context.trackProfile];
  const weatherProfile = WEATHER_WEIGHTS[context.weather];
  const tyreFactor = TYRE_STRESS_FACTORS[context.tyreStress];
  const safetyCarFactor = SAFETY_CAR_FACTORS[context.safetyCar];
  // Reliability amplifier: tougher conditions increase DNF likelihood slightly
  const reliabilityAmplifier =
    1 +
    (context.weather === "wet" ? 0.08 : 0) +
    (context.tyreStress === "high" ? 0.05 : 0) +
    (context.safetyCar === "high" ? 0.02 : context.safetyCar === "medium" ? 0.01 : 0);

  const internalDrivers: InternalDriverState[] = activeDrivers.map(driver => ({
    id: driver.id,
    name: driver.name,
    team: driver.team,
    code: driver.code,
    metrics: driver
  }));

  const stats = new Map<string, AggregatedStats>();
  internalDrivers.forEach(driver => {
    stats.set(driver.id, {
      wins: 0,
      podiums: 0,
      points: 0,
      dnfs: 0,
      totalFinish: 0,
      totalFinishSquared: 0,
      bestFinish: Number.POSITIVE_INFINITY,
      worstFinish: 0
    });
  });

  const baseNoiseSigma = 0.35 + randomness * 0.45;
  const noiseSigma = baseNoiseSigma * weatherProfile.noise * safetyCarFactor;

  const rng = typeof context.seed === 'number' ? mulberry32(context.seed) : Math.random;

  for (let i = 0; i < runs; i += 1) {
    const raceSample = internalDrivers.map(driver => {
      const metrics = driver.metrics;
      const normQualy = normalise(metrics.qualyGapMs, normalisers.qualyGap, true);
      const normLongRun = normalise(metrics.longRunPaceDelta, normalisers.longRun, true);
      const normStraightline = normalise(metrics.straightlineIndex, normalisers.straightline);
      const normCornering = normalise(metrics.corneringIndex, normalisers.cornering);
      const normPitStop = normalise(metrics.pitStopMedian, normalisers.pitStop, true);
      const normGrid = normalise(metrics.gridPosition, normalisers.grid, true);
      const normSpeedTrap = normalise(metrics.speedTrapKph, normalisers.speedTrap);
      const baseReliability = clamp(1 - metrics.dnfRate * reliabilityAmplifier, 0.04, 0.98);
      const tyreBonus = clamp(metrics.tyreManagement * tyreFactor, 0, 1.1);

      const paceScore =
        0.28 * normLongRun +
        0.2 * normQualy +
        0.1 * normGrid +
        0.1 * (normStraightline * trackProfile.straightline) +
        0.1 * (normCornering * trackProfile.cornering) +
        0.06 * (1 - normPitStop) +
        0.05 * normSpeedTrap * trackProfile.straightline +
        0.05 * metrics.consistency +
        0.03 * metrics.aggression +
        0.03 * tyreBonus +
        0.04 * metrics.wetSkill * weatherProfile.wetSkill;

      const randomNoise = randomNormal(0, noiseSigma, rng as () => number);
      const reliabilityCheck = (rng as () => number)();
      const didFinish = reliabilityCheck < baseReliability;
      const finishingScore = didFinish ? paceScore + randomNoise : -5 + randomNoise * 0.5;

      return {
        driver,
        score: finishingScore,
        didFinish,
        reliability: baseReliability
      };
    });

    raceSample.sort((a, b) => b.score - a.score);

    let position = 1;
    for (const sample of raceSample) {
      const driverStats = stats.get(sample.driver.id);
      if (!driverStats) continue;

      if (!sample.didFinish) {
        driverStats.dnfs += 1;
      }

      driverStats.totalFinish += position;
      driverStats.totalFinishSquared += position * position;
      driverStats.bestFinish = Math.min(driverStats.bestFinish, position);
      driverStats.worstFinish = Math.max(driverStats.worstFinish, position);

      if (position === 1) {
        driverStats.wins += 1;
      }
      if (position <= 3) {
        driverStats.podiums += 1;
      }

      if (position <= POINTS_TABLE.length) {
        driverStats.points += POINTS_TABLE[position - 1];
      }

      position += 1;
    }
  }

  const results: DriverSimulationResult[] = internalDrivers
    .map(driver => {
      const driverStats = stats.get(driver.id)!;
      const averageFinish = driverStats.totalFinish / runs;
      const meanSquares = driverStats.totalFinishSquared / runs;
      const variance = Math.max(meanSquares - averageFinish * averageFinish, 0);
      const consistencyIndex = clamp(1 - variance / 12, 0, 1);

      return {
        id: driver.id,
        name: driver.name,
        team: driver.team,
        code: driver.code,
        winProbability: driverStats.wins / runs,
        podiumProbability: driverStats.podiums / runs,
        averageFinish,
        expectedPoints: driverStats.points / runs,
        dnfProbability: driverStats.dnfs / runs,
        bestFinish: driverStats.bestFinish === Number.POSITIVE_INFINITY ? 0 : driverStats.bestFinish,
        worstFinish: driverStats.worstFinish,
        consistencyIndex
      };
    })
    .sort((a, b) => {
      if (b.winProbability !== a.winProbability) {
        return b.winProbability - a.winProbability;
      }
      return a.averageFinish - b.averageFinish;
    });

  return {
    id: Date.now(),
    runs,
    context,
    results,
    predictedWinner: results[0] ?? null,
    predictedPodium: results.slice(0, 3)
  };
}

function buildNormalisers(drivers: DriverSimulationInput[]): Record<
  "qualyGap" | "longRun" | "straightline" | "cornering" | "pitStop" | "grid" | "speedTrap",
  MetricRange
> {
  return {
    qualyGap: rangeOf(drivers, d => d.qualyGapMs),
    longRun: rangeOf(drivers, d => d.longRunPaceDelta),
    straightline: rangeOf(drivers, d => d.straightlineIndex),
    cornering: rangeOf(drivers, d => d.corneringIndex),
    pitStop: rangeOf(drivers, d => d.pitStopMedian),
    grid: rangeOf(drivers, d => d.gridPosition),
    speedTrap: rangeOf(drivers, d => d.speedTrapKph)
  };
}

function rangeOf(drivers: DriverSimulationInput[], selector: (driver: DriverSimulationInput) => number): MetricRange {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const driver of drivers) {
    const value = selector(driver);
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }
  if (min === max) {
    const offset = min === 0 ? 1 : Math.abs(min) * 0.5;
    return { min: min - offset, max: max + offset };
  }
  return { min, max };
}

function normalise(value: number, range: MetricRange, invert = false): number {
  const { min, max } = range;
  if (max === min) {
    return 0.5;
  }
  const ratio = (value - min) / (max - min);
  const bounded = clamp(ratio, 0, 1);
  return invert ? 1 - bounded : bounded;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function mulberry32(a: number) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function randomNormal(mean = 0, standardDeviation = 1, rng: () => number = Math.random): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const mag = Math.sqrt(-2.0 * Math.log(u));
  const z0 = mag * Math.cos(2.0 * Math.PI * v);
  return mean + z0 * standardDeviation;
}
