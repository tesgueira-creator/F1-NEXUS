// Performance Benchmarking System for F1 Simulation Worker
// Comprehensive performance testing and metrics collection

interface BenchmarkConfig {
  name: string;
  drivers: number;
  runs: number;
  context: any;
  iterations: number;
}

interface BenchmarkResult {
  name: string;
  avgExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  stdDevExecutionTime: number;
  simulationsPerSecond: number;
  memoryUsage: number;
  iterations: number;
  timestamp: number;
}

interface PerformanceReport {
  summary: {
    totalBenchmarks: number;
    averageSimulationsPerSecond: number;
    bestPerformance: string;
    worstPerformance: string;
    memoryEfficiency: number;
  };
  results: BenchmarkResult[];
  recommendations: string[];
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];
  private worker: Worker | null = null;

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker(): void {
    // Use the enhanced TypeScript worker
    this.worker = new Worker('/worker-enhanced.ts');
  }

  private createMockDrivers(count: number): any[] {
    const drivers = [];
    for (let i = 0; i < count; i++) {
      drivers.push({
        id: `driver_${i}`,
        name: `Driver ${i}`,
        team: `Team ${Math.floor(i / 2)}`,
        code: `D${i.toString().padStart(2, '0')}`,
        country: 'Test',
        number: i + 1,
        gridPosition: i + 1,
        qualyGapMs: Math.random() * 1000,
        longRunPaceDelta: (Math.random() - 0.5) * 2,
        straightlineIndex: 70 + Math.random() * 30,
        corneringIndex: 70 + Math.random() * 30,
        pitStopMedian: 20 + Math.random() * 5,
        dnfRate: Math.random() * 0.1,
        wetSkill: 0.7 + Math.random() * 0.3,
        consistency: 0.7 + Math.random() * 0.3,
        tyreManagement: 0.7 + Math.random() * 0.3,
        aggression: 0.5 + Math.random() * 0.5,
        experience: 0.5 + Math.random() * 0.5,
        speedTrapKph: 320 + Math.random() * 20,
        isActive: true
      });
    }
    return drivers;
  }

  private createBenchmarkConfigs(): BenchmarkConfig[] {
    return [
      {
        name: 'Small Race (10 drivers, 1k runs)',
        drivers: 10,
        runs: 1000,
        context: {
          trackProfile: 'balanced',
          weather: 'dry',
          tyreStress: 'medium',
          safetyCar: 'medium',
          runs: 1000,
          randomness: 0.5
        },
        iterations: 5
      },
      {
        name: 'Medium Race (20 drivers, 5k runs)',
        drivers: 20,
        runs: 5000,
        context: {
          trackProfile: 'technical',
          weather: 'mixed',
          tyreStress: 'high',
          safetyCar: 'low',
          runs: 5000,
          randomness: 0.7
        },
        iterations: 3
      },
      {
        name: 'Large Race (30 drivers, 10k runs)',
        drivers: 30,
        runs: 10000,
        context: {
          trackProfile: 'power',
          weather: 'wet',
          tyreStress: 'low',
          safetyCar: 'high',
          runs: 10000,
          randomness: 0.3
        },
        iterations: 2
      },
      {
        name: 'Stress Test (40 drivers, 15k runs)',
        drivers: 40,
        runs: 15000,
        context: {
          trackProfile: 'balanced',
          weather: 'dry',
          tyreStress: 'medium',
          safetyCar: 'medium',
          runs: 15000,
          randomness: 0.8
        },
        iterations: 2
      }
    ];
  }

  private async runSingleBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
    const executionTimes: number[] = [];
    const memoryUsages: number[] = [];

    for (let i = 0; i < config.iterations; i++) {
      const drivers = this.createMockDrivers(config.drivers);
      const startTime = performance.now();
      const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const result = await this.runWorkerSimulation(drivers, config.context);

      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

      executionTimes.push(endTime - startTime);
      memoryUsages.push(endMemory - startMemory);
    }

    // Calculate statistics
    const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const minExecutionTime = Math.min(...executionTimes);
    const maxExecutionTime = Math.max(...executionTimes);
    const variance = executionTimes.reduce((acc, time) => acc + Math.pow(time - avgExecutionTime, 2), 0) / executionTimes.length;
    const stdDevExecutionTime = Math.sqrt(variance);

    const simulationsPerSecond = (config.runs * config.iterations) / (executionTimes.reduce((a, b) => a + b, 0) / 1000);
    const avgMemoryUsage = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;

    return {
      name: config.name,
      avgExecutionTime,
      minExecutionTime,
      maxExecutionTime,
      stdDevExecutionTime,
      simulationsPerSecond,
      memoryUsage: avgMemoryUsage,
      iterations: config.iterations,
      timestamp: Date.now()
    };
  }

  private runWorkerSimulation(drivers: any[], context: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Simulation timeout'));
      }, 120000); // 2 minute timeout

      const messageHandler = (e: MessageEvent) => {
        if (e.data.type === 'result') {
          clearTimeout(timeout);
          this.worker!.removeEventListener('message', messageHandler);
          resolve(e.data.result);
        } else if (e.data.type === 'error') {
          clearTimeout(timeout);
          this.worker!.removeEventListener('message', messageHandler);
          reject(new Error(e.data.error));
        }
      };

      this.worker.addEventListener('message', messageHandler);
      this.worker.postMessage({ drivers, context, seed: Math.random() });
    });
  }

  async runFullBenchmark(): Promise<PerformanceReport> {
    console.log('🚀 Starting F1 Simulation Performance Benchmark...');

    const configs = this.createBenchmarkConfigs();
    this.results = [];

    for (const config of configs) {
      console.log(`📊 Running benchmark: ${config.name}`);
      try {
        const result = await this.runSingleBenchmark(config);
        this.results.push(result);
        console.log(`✅ ${config.name}: ${(result.simulationsPerSecond).toFixed(0)} sim/s`);
      } catch (error) {
        console.error(`❌ Failed ${config.name}:`, error);
      }
    }

    return this.generateReport();
  }

  private generateReport(): PerformanceReport {
    if (this.results.length === 0) {
      throw new Error('No benchmark results available');
    }

    const avgSimulationsPerSecond = this.results.reduce((acc, result) =>
      acc + result.simulationsPerSecond, 0) / this.results.length;

    const bestPerformance = this.results.reduce((best, current) =>
      current.simulationsPerSecond > best.simulationsPerSecond ? current : best);

    const worstPerformance = this.results.reduce((worst, current) =>
      current.simulationsPerSecond < worst.simulationsPerSecond ? current : worst);

    const totalMemory = this.results.reduce((acc, result) => acc + result.memoryUsage, 0);
    const memoryEfficiency = totalMemory / this.results.length;

    const recommendations = this.generateRecommendations();

    return {
      summary: {
        totalBenchmarks: this.results.length,
        averageSimulationsPerSecond: avgSimulationsPerSecond,
        bestPerformance: bestPerformance.name,
        worstPerformance: worstPerformance.name,
        memoryEfficiency
      },
      results: this.results,
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const avgSimPerSec = this.results.reduce((acc, r) => acc + r.simulationsPerSecond, 0) / this.results.length;

    if (avgSimPerSec < 1000) {
      recommendations.push('⚠️ Performance is below optimal. Consider optimizing the simulation algorithm.');
    } else if (avgSimPerSec > 5000) {
      recommendations.push('✅ Excellent performance! The simulation engine is highly optimized.');
    } else {
      recommendations.push('👍 Good performance. Minor optimizations may be beneficial.');
    }

    const memoryIntensive = this.results.filter(r => r.memoryUsage > 50 * 1024 * 1024); // 50MB
    if (memoryIntensive.length > 0) {
      recommendations.push('💾 High memory usage detected. Consider implementing memory pooling for large simulations.');
    }

    const highVariance = this.results.filter(r => r.stdDevExecutionTime / r.avgExecutionTime > 0.2);
    if (highVariance.length > 0) {
      recommendations.push('📈 High execution time variance detected. Consider warming up the JavaScript engine or optimizing garbage collection.');
    }

    const slowLargeSimulations = this.results.filter(r => r.name.includes('Large') && r.simulationsPerSecond < 2000);
    if (slowLargeSimulations.length > 0) {
      recommendations.push('🐌 Large simulations are slow. Consider implementing parallel processing or algorithm optimizations.');
    }

    return recommendations;
  }

  // Utility method to compare with previous benchmarks
  compareWithPrevious(previousResults: BenchmarkResult[]): string[] {
    const comparisons: string[] = [];

    for (const current of this.results) {
      const previous = previousResults.find(p => p.name === current.name);
      if (previous) {
        const simPerSecDiff = current.simulationsPerSecond - previous.simulationsPerSecond;
        const percentChange = (simPerSecDiff / previous.simulationsPerSecond) * 100;

        if (Math.abs(percentChange) > 5) {
          const direction = percentChange > 0 ? 'faster' : 'slower';
          comparisons.push(`${current.name}: ${(Math.abs(percentChange)).toFixed(1)}% ${direction}`);
        }
      }
    }

    return comparisons;
  }

  cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Export for use in main application
export { PerformanceBenchmark, BenchmarkConfig, BenchmarkResult, PerformanceReport };

// Auto-run benchmark if this script is executed directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment - can run benchmark
  const benchmark = new PerformanceBenchmark();

  // Add to window for manual triggering
  (window as any).runPerformanceBenchmark = async () => {
    try {
      const report = await benchmark.runFullBenchmark();
      console.log('📈 Performance Benchmark Report:', report);

      // Display results in a user-friendly format
      console.table(report.results.map(r => ({
        'Benchmark': r.name,
        'Avg Time (ms)': r.avgExecutionTime.toFixed(2),
        'Sim/s': r.simulationsPerSecond.toFixed(0),
        'Memory (MB)': (r.memoryUsage / (1024 * 1024)).toFixed(2)
      })));

      return report;
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      throw error;
    }
  };

  console.log('🎯 Performance benchmark ready. Run window.runPerformanceBenchmark() to start.');
}