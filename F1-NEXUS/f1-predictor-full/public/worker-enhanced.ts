// Enhanced TypeScript Web Worker for F1 Monte Carlo Simulation
// Handles all simulation logic with optimized performance and comprehensive metrics

interface DriverMetrics {
  id: string;
  name: string;
  team: string;
  code: string;
  country: string;
  number: number;
  gridPosition: number;
  qualyGapMs: number;
  longRunPaceDelta: number;
  straightlineIndex: number;
  corneringIndex: number;
  pitStopMedian: number;
  dnfRate: number;
  wetSkill: number;
  consistency: number;
  tyreManagement: number;
  aggression: number;
  experience: number;
  speedTrapKph: number;
  ergastId?: string;
  constructorId?: string;
  standingsPoints?: number;
  standingsWins?: number;
  isActive?: boolean; // Add optional isActive property
}

type TrackProfile = "balanced" | "power" | "technical";
type WeatherProfile = "dry" | "mixed" | "wet";
type TyreStress = "low" | "medium" | "high";
type SafetyCarProfile = "low" | "medium" | "high";

interface RaceContext {
  trackProfile: TrackProfile;
  weather: WeatherProfile;
  tyreStress: TyreStress;
  safetyCar: SafetyCarProfile;
  runs: number;
  randomness: number;
}

interface DriverSimulationResult {
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
}

interface SimulationSummary {
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
  };
}

// Constants and lookup tables
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

// Optimized random number generation
class RandomGenerator {
  private seed: number;

  constructor(seed: number = Math.random()) {
    this.seed = seed;
  }

  // Mulberry32 PRNG - fast and high quality
  next(): number {
    this.seed |= 0;
    this.seed = (this.seed + 0x6D2B79F5) | 0;
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Box-Muller transform for normal distribution
  normal(mean: number = 0, std: number = 1): number {
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * std + mean;
  }
}

// Optimized normalization with caching
class Normalizer {
  private cache = new Map<string, { min: number; max: number; range: number }>();

  normalize(value: number, key: string, invert: boolean = false): number {
    if (!this.cache.has(key)) {
      throw new Error(`Normalizer not initialized for key: ${key}`);
    }

    const { min, max, range } = this.cache.get(key)!;
    if (range === 0) return 0.5; // Avoid division by zero

    let normalized = (value - min) / range;
    if (invert) normalized = 1 - normalized;

    return Math.max(0, Math.min(1, normalized));
  }

  setRange(key: string, values: number[]): void {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    this.cache.set(key, { min, max, range });
  }

  getStats(key: string): { min: number; max: number; range: number } | null {
    return this.cache.get(key) || null;
  }
}

// Performance monitoring
class PerformanceMonitor {
  private startTime: number;
  private memoryStart: number;

  constructor() {
    this.startTime = performance.now();
    this.memoryStart = (performance as any).memory?.usedJSHeapSize || 0;
  }

  getMetrics(): { executionTime: number; memoryUsage: number; simulationsPerSecond: number } {
    const executionTime = performance.now() - this.startTime;
    const memoryUsage = ((performance as any).memory?.usedJSHeapSize || 0) - this.memoryStart;

    return {
      executionTime,
      memoryUsage,
      simulationsPerSecond: 0 // Will be calculated after simulation
    };
  }
}

// Main simulation engine
class F1SimulationEngine {
  private random: RandomGenerator;
  private normalizer: Normalizer;
  private monitor: PerformanceMonitor;

  constructor(seed: number = 42) {
    this.random = new RandomGenerator(seed);
    this.normalizer = new Normalizer();
    this.monitor = new PerformanceMonitor();
  }

  // Build normalizers from driver data
  private buildNormalizers(drivers: DriverMetrics[]): void {
    const metrics = {
      qualyGap: drivers.map(d => d.qualyGapMs),
      longRun: drivers.map(d => d.longRunPaceDelta),
      straightline: drivers.map(d => d.straightlineIndex),
      cornering: drivers.map(d => d.corneringIndex),
      pitStop: drivers.map(d => d.pitStopMedian),
      grid: drivers.map(d => d.gridPosition),
      speedTrap: drivers.map(d => d.speedTrapKph)
    };

    Object.entries(metrics).forEach(([key, values]) => {
      this.normalizer.setRange(key, values);
    });
  }

  // Optimized pace calculation with vectorized operations
  private calculatePaceScore(
    driver: DriverMetrics,
    context: RaceContext,
    trackProfile: { straightline: number; cornering: number },
    weatherProfile: { wetSkill: number; noise: number },
    tyreFactor: number,
    safetyCarFactor: number,
    reliabilityAmplifier: number,
    noiseSigma: number
  ): { score: number; didFinish: boolean; reliability: number } {
    // Pre-calculate normalized values
    const normQualy = this.normalizer.normalize(driver.qualyGapMs, 'qualyGap', true);
    const normLongRun = this.normalizer.normalize(driver.longRunPaceDelta, 'longRun', true);
    const normStraightline = this.normalizer.normalize(driver.straightlineIndex, 'straightline');
    const normCornering = this.normalizer.normalize(driver.corneringIndex, 'cornering');
    const normPitStop = this.normalizer.normalize(driver.pitStopMedian, 'pitStop', true);
    const normGrid = this.normalizer.normalize(driver.gridPosition, 'grid', true);
    const normSpeedTrap = this.normalizer.normalize(driver.speedTrapKph, 'speedTrap');

    // Calculate base reliability
    const baseReliability = Math.max(0.04, Math.min(0.98, 1 - driver.dnfRate * reliabilityAmplifier));
    const tyreBonus = Math.max(0, Math.min(1.1, driver.tyreManagement * tyreFactor));

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

    // Apply noise and reliability
    const randomNoise = this.random.normal(0, noiseSigma);
    const reliabilityCheck = this.random.next();
    const didFinish = reliabilityCheck < baseReliability;
    const finishingScore = didFinish ? paceScore + randomNoise : -5 + randomNoise * 0.5;

    return {
      score: finishingScore,
      didFinish,
      reliability: baseReliability
    };
  }

  // Main simulation function
  runSimulation(drivers: DriverMetrics[], context: RaceContext): SimulationSummary {
    const startTime = performance.now();
    const activeDrivers = drivers.filter(d => d.isActive !== false);

    if (activeDrivers.length < 2) {
      throw new Error('Need at least 2 active drivers for simulation');
    }

    // Initialize normalizers
    this.buildNormalizers(activeDrivers);

    // Clamp and validate parameters
    const runs = Math.max(500, Math.min(20000, Math.floor(context.runs)));
    const randomness = Math.max(0, Math.min(1, context.randomness));

    // Pre-calculate context factors
    const trackProfile = TRACK_WEIGHTS[context.trackProfile];
    const weatherProfile = WEATHER_WEIGHTS[context.weather];
    const tyreFactor = TYRE_STRESS_FACTORS[context.tyreStress];
    const safetyCarFactor = SAFETY_CAR_FACTORS[context.safetyCar];

    const reliabilityAmplifier = 1 +
      (context.weather === "wet" ? 0.08 : 0) +
      (context.tyreStress === "high" ? 0.05 : 0);

    const baseNoiseSigma = 0.35 + randomness * 0.45;
    const noiseSigma = baseNoiseSigma * weatherProfile.noise * safetyCarFactor;

    // Initialize statistics tracking with optimized data structures
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

    activeDrivers.forEach(driver => {
      stats.set(driver.id, {
        wins: 0,
        podiums: 0,
        points: 0,
        dnfs: 0,
        totalFinish: 0,
        totalFinishSquared: 0,
        bestFinish: Number.POSITIVE_INFINITY,
        worstFinish: 0,
        finishCount: 0
      });
    });

    // Progress reporting
    const progressStep = Math.max(1, Math.floor(runs / 20));

    // Main simulation loop - optimized for performance
    for (let run = 0; run < runs; run++) {
      // Generate race results for this simulation
      const raceResults = activeDrivers.map(driver =>
        this.calculatePaceScore(
          driver, context, trackProfile, weatherProfile,
          tyreFactor, safetyCarFactor, reliabilityAmplifier, noiseSigma
        )
      );

      // Sort by score (higher is better)
      const sortedResults = raceResults
        .map((result, index) => ({ result, driver: activeDrivers[index] }))
        .sort((a, b) => b.result.score - a.result.score);

      // Update statistics
      sortedResults.forEach(({ result, driver }, position) => {
        const driverStats = stats.get(driver.id)!;
        const finishPosition = position + 1;

        if (!result.didFinish) {
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

      // Progress reporting
      if ((run + 1) % progressStep === 0) {
        const progress = Math.floor(((run + 1) / runs) * 100);
        self.postMessage({ type: 'progress', progress });
      }
    }

    // Calculate final results
    const results: DriverSimulationResult[] = activeDrivers.map(driver => {
      const driverStats = stats.get(driver.id)!;
      const averageFinish = driverStats.totalFinish / runs;
      const meanSquares = driverStats.totalFinishSquared / runs;
      const variance = Math.max(0, meanSquares - averageFinish * averageFinish);
      const consistencyIndex = Math.max(0, Math.min(1, 1 - variance / 12));

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
    const executionTime = performance.now() - startTime;
    const performanceMetrics = {
      executionTime,
      simulationsPerSecond: runs / (executionTime / 1000),
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
    };

    return {
      id: Date.now(),
      runs,
      context,
      results,
      predictedWinner: results[0] || null,
      predictedPodium: results.slice(0, 3),
      performanceMetrics
    };
  }
}

// Worker message handler
const simulationEngine = new F1SimulationEngine();

self.onmessage = (e: MessageEvent) => {
  const { drivers, context, seed } = e.data;

  try {
    // Reinitialize engine with new seed if provided
    if (typeof seed === 'number') {
      (simulationEngine as any).random = new RandomGenerator(seed);
      (simulationEngine as any).monitor = new PerformanceMonitor();
    }

    const result = simulationEngine.runSimulation(drivers, context);
    self.postMessage({ type: 'result', result });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown simulation error'
    });
  }
};