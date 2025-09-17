// Unified F1 Simulation Interface
// Provides consistent API for enhanced simulation with performance monitoring

import { DriverMetrics } from "./driver-data";
import { RaceContext, SimulationSummary } from "./prediction";
import { runPredictionOptimized } from "./prediction-optimized";

export interface SimulationOptions {
  useWorker?: boolean;
  enablePerformanceMonitoring?: boolean;
  workerPath?: string;
  timeout?: number;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

export interface SimulationResult extends SimulationSummary {
  performanceMetrics: {
    executionTime: number;
    simulationsPerSecond: number;
    memoryUsage: number;
    cacheHits?: number;
    vectorizationEfficiency?: number;
    totalExecutionTime?: number;
    totalMemoryUsage?: number;
    uiThreadTime?: number;
    method: 'worker' | 'main-thread' | 'optimized';
  };
}

export class F1SimulationManager {
  private worker: Worker | null = null;
  private performanceMonitor = new PerformanceMonitor();

  constructor(private options: SimulationOptions = {}) {
    this.options = {
      useWorker: true,
      enablePerformanceMonitoring: true,
      workerPath: '/worker-enhanced.ts',
      timeout: 60000,
      ...options
    };
  }

  async runSimulation(
    drivers: DriverMetrics[],
    context: RaceContext
  ): Promise<SimulationResult> {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    try {
      let result: SimulationSummary;
      let method: 'worker' | 'main-thread' | 'optimized';

      if (this.options.useWorker) {
        result = await this.runWorkerSimulation(drivers, context);
        method = 'worker';
      } else {
        // Use optimized main-thread implementation
        result = runPredictionOptimized(drivers, context);
        method = 'optimized';
      }

      // Add comprehensive performance metrics
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const baseMetrics = (result as any).performanceMetrics || {
        executionTime: endTime - startTime,
        simulationsPerSecond: result.runs / ((endTime - startTime) / 1000),
        memoryUsage: endMemory - startMemory
      };

      const enhancedResult: SimulationResult = {
        ...result,
        performanceMetrics: {
          ...baseMetrics,
          totalExecutionTime: endTime - startTime,
          totalMemoryUsage: endMemory - startMemory,
          uiThreadTime: method === 'worker' ?
            (endTime - startTime) - baseMetrics.executionTime : 0,
          method
        }
      };

      if (this.options.enablePerformanceMonitoring) {
        this.logPerformanceMetrics(enhancedResult);
      }

      return enhancedResult;

    } catch (error) {
      const simulationError = error instanceof Error ? error : new Error('Unknown simulation error');
      this.options.onError?.(simulationError);
      throw simulationError;
    }
  }

  private async runWorkerSimulation(
    drivers: DriverMetrics[],
    context: RaceContext
  ): Promise<SimulationSummary> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        this.worker = new Worker(this.options.workerPath!);
      }

      const timeout = setTimeout(() => {
        this.cleanup();
        reject(new Error('Simulation timeout'));
      }, this.options.timeout);

      const messageHandler = (e: MessageEvent) => {
        if (e.data.type === 'progress' && this.options.onProgress) {
          this.options.onProgress(e.data.progress);
        } else if (e.data.type === 'result') {
          clearTimeout(timeout);
          this.worker!.removeEventListener('message', messageHandler);
          resolve(e.data.result);
        } else if (e.data.type === 'error') {
          clearTimeout(timeout);
          this.worker!.removeEventListener('message', messageHandler);
          reject(new Error(e.data.error));
        }
      };

      const errorHandler = (error: ErrorEvent) => {
        clearTimeout(timeout);
        this.worker!.removeEventListener('message', messageHandler);
        reject(new Error(`Worker error: ${error.message}`));
      };

      this.worker.addEventListener('message', messageHandler);
      this.worker.addEventListener('error', errorHandler);

      this.worker.postMessage({
        drivers: drivers.map(d => ({ ...d, isActive: true })), // Ensure isActive is set
        context,
        seed: Date.now() % 1000000
      });
    });
  }

  private logPerformanceMetrics(result: SimulationResult): void {
    const metrics = result.performanceMetrics;
    console.log('🚀 F1 Simulation Performance Report:');
    console.log(`  Method: ${metrics.method}`);
    console.log(`  Runs: ${result.runs.toLocaleString()}`);
    console.log(`  Execution Time: ${metrics.executionTime.toFixed(2)}ms`);
    console.log(`  Simulations/Second: ${metrics.simulationsPerSecond.toFixed(0)}`);
    console.log(`  Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);

    if (metrics.totalExecutionTime) {
      console.log(`  Total Time: ${metrics.totalExecutionTime.toFixed(2)}ms`);
    }

    if (metrics.uiThreadTime && metrics.uiThreadTime > 0) {
      console.log(`  UI Thread Time: ${metrics.uiThreadTime.toFixed(2)}ms`);
    }

    if (metrics.cacheHits !== undefined) {
      console.log(`  Cache Hit Rate: ${(metrics.cacheHits * 100).toFixed(1)}%`);
    }

    if (metrics.vectorizationEfficiency !== undefined) {
      console.log(`  Vectorization Efficiency: ${metrics.vectorizationEfficiency.toFixed(2)}`);
    }

    // Performance assessment
    const perfScore = this.assessPerformance(metrics);
    console.log(`  Performance Rating: ${perfScore.rating} (${perfScore.score}/10)`);
  }

  private assessPerformance(metrics: SimulationResult['performanceMetrics']): { score: number; rating: string } {
    let score = 5; // Base score

    // Speed assessment
    if (metrics.simulationsPerSecond > 5000) score += 2;
    else if (metrics.simulationsPerSecond > 2000) score += 1;
    else if (metrics.simulationsPerSecond < 500) score -= 2;

    // Memory efficiency
    const memoryMB = metrics.memoryUsage / 1024 / 1024;
    if (memoryMB < 10) score += 1;
    else if (memoryMB > 100) score -= 1;

    // Cache efficiency
    if (metrics.cacheHits && metrics.cacheHits > 0.8) score += 1;
    else if (metrics.cacheHits && metrics.cacheHits < 0.5) score -= 1;

    // UI thread impact
    if (metrics.uiThreadTime && metrics.uiThreadTime < 50) score += 1;

    score = Math.max(1, Math.min(10, score));

    let rating: string;
    if (score >= 8) rating = 'Excellent';
    else if (score >= 6) rating = 'Good';
    else if (score >= 4) rating = 'Fair';
    else rating = 'Needs Optimization';

    return { score, rating };
  }

  // Benchmarking utilities
  async benchmark(
    drivers: DriverMetrics[],
    context: RaceContext,
    iterations: number = 3
  ): Promise<{
    averageResult: SimulationResult;
    performanceStats: {
      avgExecutionTime: number;
      minExecutionTime: number;
      maxExecutionTime: number;
      stdDevExecutionTime: number;
      avgSimulationsPerSecond: number;
      consistencyScore: number;
    };
  }> {
    const results: SimulationResult[] = [];

    for (let i = 0; i < iterations; i++) {
      const result = await this.runSimulation(drivers, context);
      results.push(result);
    }

    // Calculate statistics
    const executionTimes = results.map(r => r.performanceMetrics.executionTime);
    const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const minExecutionTime = Math.min(...executionTimes);
    const maxExecutionTime = Math.max(...executionTimes);
    const variance = executionTimes.reduce((acc, time) => acc + Math.pow(time - avgExecutionTime, 2), 0) / executionTimes.length;
    const stdDevExecutionTime = Math.sqrt(variance);

    const avgSimulationsPerSecond = results.reduce((acc, r) => acc + r.performanceMetrics.simulationsPerSecond, 0) / results.length;
    const consistencyScore = 1 - (stdDevExecutionTime / avgExecutionTime);

    return {
      averageResult: results[0], // Return first result as representative
      performanceStats: {
        avgExecutionTime,
        minExecutionTime,
        maxExecutionTime,
        stdDevExecutionTime,
        avgSimulationsPerSecond,
        consistencyScore: Math.max(0, consistencyScore)
      }
    };
  }

  cleanup(): void {
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch (e) {
        console.warn('Error terminating worker:', e);
      }
      this.worker = null;
    }
  }
}

// Performance monitoring utility
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getAverageMetric(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  getAllMetrics(): Record<string, { average: number; count: number; min: number; max: number }> {
    const result: Record<string, { average: number; count: number; min: number; max: number }> = {};

    for (const [name, values] of this.metrics.entries()) {
      if (values.length === 0) continue;

      result[name] = {
        average: values.reduce((a, b) => a + b, 0) / values.length,
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }

    return result;
  }

  reset(): void {
    this.metrics.clear();
  }
}

// Convenience functions for common use cases
export function createDefaultSimulationManager(): F1SimulationManager {
  return new F1SimulationManager({
    useWorker: true,
    enablePerformanceMonitoring: true,
    onProgress: (progress) => console.log(`Progress: ${progress}%`),
    onError: (error) => console.error('Simulation error:', error)
  });
}

export function createFastSimulationManager(): F1SimulationManager {
  return new F1SimulationManager({
    useWorker: false, // Use optimized main-thread for speed
    enablePerformanceMonitoring: false,
    timeout: 30000
  });
}

export function createBenchmarkSimulationManager(): F1SimulationManager {
  return new F1SimulationManager({
    useWorker: true,
    enablePerformanceMonitoring: true,
    timeout: 120000, // Longer timeout for benchmarks
    onProgress: (progress) => {
      if (progress % 25 === 0) console.log(`Benchmark progress: ${progress}%`);
    }
  });
}

// Export types for external use
export type { DriverMetrics, RaceContext, SimulationSummary };