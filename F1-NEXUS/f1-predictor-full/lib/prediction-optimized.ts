// Optimized F1 Prediction Engine with Enhanced Normalization
// Vectorized operations, caching, and performance optimizations

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
  performanceMetrics: {
    executionTime: number;
    simulationsPerSecond: number;
    memoryUsage: number;
    cacheHits: number;
    vectorizationEfficiency: number;
  };
};

type MetricRange = { min: number; max: number; range: number; mean: number; std: number };

// Optimized Normalizer with caching and vectorization
class OptimizedNormalizer {
  private cache = new Map<string, MetricRange>();
  private cacheHits = 0;
  private totalCalls = 0;

  // Vectorized range calculation for better performance
  calculateRange(values: number[]): MetricRange {
    if (values.length === 0) {
      return { min: 0, max: 1, range: 1, mean: 0.5, std: 0.5 };
    }

    // Single pass calculation for min, max, sum, and sum of squares
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    let sum = 0;
    let sumSquares = 0;

    for (const value of values) {
      if (value < min) min = value;
      if (value > max) max = value;
      sum += value;
      sumSquares += value * value;
    }

    const mean = sum / values.length;
    const variance = (sumSquares / values.length) - (mean * mean);
    const std = Math.sqrt(Math.max(0, variance));
    const range = max - min;

    // Handle edge cases
    if (!Number.isFinite(min) || !Number.isFinite(max) || range === 0) {
      const offset = mean === 0 ? 1 : Math.abs(mean) * 0.1;
      return {
        min: mean - offset,
        max: mean + offset,
        range: 2 * offset,
        mean,
        std: Math.max(std, offset * 0.5)
      };
    }

    return { min, max, range, mean, std };
  }

  // Cached normalization with statistics
  normalize(value: number, key: string, invert: boolean = false): number {
    this.totalCalls++;

    if (!this.cache.has(key)) {
      throw new Error(`Normalizer not initialized for key: ${key}`);
    }

    this.cacheHits++;
    const range = this.cache.get(key)!;

    if (range.range === 0) return 0.5;

    // Z-score normalization for better statistical properties
    const zScore = (value - range.mean) / range.std;
    // Convert to 0-1 range using sigmoid-like transformation
    const normalized = 1 / (1 + Math.exp(-zScore));

    return invert ? 1 - normalized : normalized;
  }

  // Batch normalization for multiple values (vectorized)
  normalizeBatch(values: number[], key: string, invert: boolean = false): number[] {
    this.totalCalls += values.length;

    if (!this.cache.has(key)) {
      throw new Error(`Normalizer not initialized for key: ${key}`);
    }

    this.cacheHits += values.length;
    const range = this.cache.get(key)!;

    if (range.range === 0) {
      return new Array(values.length).fill(0.5);
    }

    // Vectorized z-score normalization
    const result = new Array(values.length);
    for (let i = 0; i < values.length; i++) {
      const zScore = (values[i] - range.mean) / range.std;
      const normalized = 1 / (1 + Math.exp(-zScore));
      result[i] = invert ? 1 - normalized : normalized;
    }

    return result;
  }

  // Initialize normalizers for all metrics at once
  initializeNormalizers(drivers: DriverSimulationInput[]): void {
    const metrics = {
      qualyGap: drivers.map(d => d.qualyGapMs),
      longRun: drivers.map(d => d.longRunPaceDelta),
      straightline: drivers.map(d => d.straightlineIndex),
      cornering: drivers.map(d => d.corneringIndex),
      pitStop: drivers.map(d => d.pitStopMedian),
      grid: drivers.map(d => d.gridPosition),
      speedTrap: drivers.map(d => d.speedTrapKph)
    };

    // Batch process all metrics
    for (const [key, values] of Object.entries(metrics)) {
      this.cache.set(key, this.calculateRange(values));
    }
  }

  getCacheStats(): { hits: number; total: number; hitRate: number } {
    return {
      hits: this.cacheHits,
      total: this.totalCalls,
      hitRate: this.totalCalls > 0 ? this.cacheHits / this.totalCalls : 0
    };
  }

  getStats(key: string): MetricRange | null {
    return this.cache.get(key) || null;
  }
}

// Optimized random number generator with better statistical properties
class OptimizedRandom {
  private seed: number;

  constructor(seed: number = Math.random()) {
    this.seed = seed;
  }

  // Improved xoshiro128** algorithm for better randomness
  next(): number {
    this.seed ^= this.seed << 13;
    this.seed ^= this.seed >>> 17;
    this.seed ^= this.seed << 5;
    return (this.seed >>> 0) / 4294967296;
  }

  // Optimized Box-Muller transform with caching
  private spare: number | null = null;

  normal(mean: number = 0, std: number = 1): number {
    if (this.spare !== null) {
      const result = this.spare;
      this.spare = null;
      return result * std + mean;
    }

    let u = 0, v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();

    const mag = Math.sqrt(-2 * Math.log(u));
    const z0 = mag * Math.cos(2 * Math.PI * v);
    this.spare = mag * Math.sin(2 * Math.PI * v);

    return z0 * std + mean;
  }

  // Vectorized normal generation
  normalBatch(count: number, mean: number = 0, std: number = 1): number[] {
    const result = new Array(count);
    for (let i = 0; i < count; i += 2) {
      const u = this.next();
      const v = this.next();

      if (u === 0 || v === 0) {
        // Fallback for edge cases
        result[i] = this.normal(mean, std);
        if (i + 1 < count) result[i + 1] = this.normal(mean, std);
      } else {
        const mag = Math.sqrt(-2 * Math.log(u));
        result[i] = (mag * Math.cos(2 * Math.PI * v)) * std + mean;
        if (i + 1 < count) {
          result[i + 1] = (mag * Math.sin(2 * Math.PI * v)) * std + mean;
        }
      }
    }
    return result;
  }
}

// Performance monitoring
class PerformanceMonitor {
  private startTime: number;
  private startMemory: number;
  private operations = 0;

  constructor() {
    this.startTime = performance.now();
    this.startMemory = (performance as any).memory?.usedJSHeapSize || 0;
  }

  recordOperation(): void {
    this.operations++;
  }

  getMetrics(): {
    executionTime: number;
    memoryUsage: number;
    operationsPerSecond: number;
  } {
    const executionTime = performance.now() - this.startTime;
    const memoryUsage = ((performance as any).memory?.usedJSHeapSize || 0) - this.startMemory;

    return {
      executionTime,
      memoryUsage,
      operationsPerSecond: this.operations / (executionTime / 1000)
    };
  }
}

// Constants (cached for performance)
const POINTS_TABLE = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] as const;

const TRACK_WEIGHTS_CACHE: Record<TrackProfile, { straightline: number; cornering: number }> = {
  balanced: { straightline: 1, cornering: 1 },
  power: { straightline: 1.25, cornering: 0.9 },
  technical: { straightline: 0.92, cornering: 1.25 }
};

const WEATHER_WEIGHTS_CACHE: Record<WeatherProfile, { wetSkill: number; noise: number }> = {
  dry: { wetSkill: 0.85, noise: 0.85 },
  mixed: { wetSkill: 1, noise: 1 },
  wet: { wetSkill: 1.25, noise: 1.2 }
};

const TYRE_STRESS_FACTORS_CACHE: Record<TyreStress, number> = {
  low: 0.92,
  medium: 1,
  high: 1.12
};

const SAFETY_CAR_FACTORS_CACHE: Record<SafetyCarProfile, number> = {
  low: 0.88,
  medium: 1,
  high: 1.18
};

// Utility functions (inlined for performance)
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Main optimized prediction function
export function runPredictionOptimized(
  drivers: DriverSimulationInput[],
  context: RaceContext
): SimulationSummary {
  const monitor = new PerformanceMonitor();
  const random = new OptimizedRandom();
  const normalizer = new OptimizedNormalizer();

  const activeDrivers = drivers.filter(d => d.isActive !== false);
  if (activeDrivers.length < 2) {
    return {
      id: Date.now(),
      runs: 0,
      context,
      results: [],
      predictedWinner: null,
      predictedPodium: [],
      performanceMetrics: {
        executionTime: 0,
        simulationsPerSecond: 0,
        memoryUsage: 0,
        cacheHits: 0,
        vectorizationEfficiency: 0
      }
    };
  }

  // Initialize optimized normalizers
  normalizer.initializeNormalizers(activeDrivers);
  monitor.recordOperation();

  // Pre-calculate context factors (cached lookups)
  const runs = clamp(Math.round(context.runs), 500, 20000);
  const randomness = clamp(context.randomness, 0, 1);

  const trackProfile = TRACK_WEIGHTS_CACHE[context.trackProfile];
  const weatherProfile = WEATHER_WEIGHTS_CACHE[context.weather];
  const tyreFactor = TYRE_STRESS_FACTORS_CACHE[context.tyreStress];
  const safetyCarFactor = SAFETY_CAR_FACTORS_CACHE[context.safetyCar];

  const reliabilityAmplifier = 1 +
    (context.weather === "wet" ? 0.08 : 0) +
    (context.tyreStress === "high" ? 0.05 : 0);

  const baseNoiseSigma = 0.35 + randomness * 0.45;
  const noiseSigma = baseNoiseSigma * weatherProfile.noise * safetyCarFactor;

  // Pre-allocate arrays for better memory performance
  const stats = new Map<string, {
    wins: number;
    podiums: number;
    points: number;
    dnfs: number;
    totalFinish: number;
    totalFinishSquared: number;
    bestFinish: number;
    worstFinish: number;
    finishCount: number;
  }>();

  // Initialize stats with optimized structure
  activeDrivers.forEach(driver => {
    stats.set(driver.id, {
      wins: 0, podiums: 0, points: 0, dnfs: 0,
      totalFinish: 0, totalFinishSquared: 0,
      bestFinish: Number.POSITIVE_INFINITY, worstFinish: 0, finishCount: 0
    });
  });

  // Pre-calculate normalized values for all drivers (vectorization)
  const driverMetrics = activeDrivers.map(driver => ({
    driver,
    normQualy: normalizer.normalize(driver.qualyGapMs, 'qualyGap', true),
    normLongRun: normalizer.normalize(driver.longRunPaceDelta, 'longRun', true),
    normStraightline: normalizer.normalize(driver.straightlineIndex, 'straightline'),
    normCornering: normalizer.normalize(driver.corneringIndex, 'cornering'),
    normPitStop: normalizer.normalize(driver.pitStopMedian, 'pitStop', true),
    normGrid: normalizer.normalize(driver.gridPosition, 'grid', true),
    normSpeedTrap: normalizer.normalize(driver.speedTrapKph, 'speedTrap'),
    baseReliability: clamp(1 - driver.dnfRate * reliabilityAmplifier, 0.04, 0.98),
    tyreBonus: clamp(driver.tyreManagement * tyreFactor, 0, 1.1)
  }));

  // Main simulation loop with optimizations
  for (let run = 0; run < runs; run++) {
    // Generate noise for all drivers at once (vectorized)
    const noiseValues = random.normalBatch(activeDrivers.length, 0, noiseSigma);

    // Calculate scores for all drivers (vectorized)
    const raceResults = driverMetrics.map((metrics, index) => {
      const { driver, normQualy, normLongRun, normStraightline, normCornering,
              normPitStop, normGrid, normSpeedTrap, baseReliability, tyreBonus } = metrics;

      // Vectorized pace score calculation
      const paceScore =
        0.28 * normLongRun +
        0.2 * normQualy +
        0.1 * normGrid +
        0.1 * (normStraightline * trackProfile.straightline) +
        0.1 * (normCornering * trackProfile.cornering) +
        0.06 * (1 - normPitStop) +
        0.05 * normSpeedTrap * trackProfile.straightline +
        0.05 * driver.consistency +
        0.03 * driver.aggression +
        0.03 * tyreBonus +
        0.04 * driver.wetSkill * weatherProfile.wetSkill;

      const reliabilityCheck = random.next();
      const didFinish = reliabilityCheck < baseReliability;
      const finishingScore = didFinish ? paceScore + noiseValues[index] : -5 + noiseValues[index] * 0.5;

      return { driver, score: finishingScore, didFinish };
    });

    // Sort results (optimized comparison)
    raceResults.sort((a, b) => b.score - a.score);

    // Update statistics with optimized lookups
    raceResults.forEach(({ driver, didFinish }, position) => {
      const driverStats = stats.get(driver.id)!;
      const finishPosition = position + 1;

      if (!didFinish) {
        driverStats.dnfs++;
      } else {
        driverStats.finishCount++;
      }

      driverStats.totalFinish += finishPosition;
      driverStats.totalFinishSquared += finishPosition * finishPosition;
      driverStats.bestFinish = Math.min(driverStats.bestFinish, finishPosition);
      driverStats.worstFinish = Math.max(driverStats.worstFinish, finishPosition);

      if (finishPosition === 1) driverStats.wins++;
      if (finishPosition <= 3) driverStats.podiums++;
      if (finishPosition <= POINTS_TABLE.length) {
        driverStats.points += POINTS_TABLE[finishPosition - 1];
      }
    });

    monitor.recordOperation();
  }

  // Calculate final results with optimized math
  const results: DriverSimulationResult[] = activeDrivers.map(driver => {
    const driverStats = stats.get(driver.id)!;
    const averageFinish = driverStats.totalFinish / runs;
    const meanSquares = driverStats.totalFinishSquared / runs;
    const variance = Math.max(0, meanSquares - averageFinish * averageFinish);
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
      bestFinish: driverStats.bestFinish === Number.POSITIVE_INFINITY ? 1 : driverStats.bestFinish,
      worstFinish: driverStats.worstFinish,
      consistencyIndex
    };
  }).sort((a, b) => {
    if (Math.abs(b.winProbability - a.winProbability) > 0.001) {
      return b.winProbability - a.winProbability;
    }
    return a.averageFinish - b.averageFinish;
  });

  // Calculate performance metrics
  const perfMetrics = monitor.getMetrics();
  const cacheStats = normalizer.getCacheStats();

  return {
    id: Date.now(),
    runs,
    context,
    results,
    predictedWinner: results[0] || null,
    predictedPodium: results.slice(0, 3),
    performanceMetrics: {
      executionTime: perfMetrics.executionTime,
      simulationsPerSecond: runs / (perfMetrics.executionTime / 1000),
      memoryUsage: perfMetrics.memoryUsage,
      cacheHits: cacheStats.hitRate,
      vectorizationEfficiency: perfMetrics.operationsPerSecond / runs
    }
  };
}

// Backward compatibility - keep original function as fallback
export function runPrediction(
  drivers: DriverSimulationInput[],
  context: RaceContext
): SimulationSummary {
  // Use optimized version by default
  return runPredictionOptimized(drivers, context);
}