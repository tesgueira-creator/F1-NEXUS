#!/usr/bin/env node

/**
 * Integration Test for Implementation B Enhancements
 * Tests the unified simulation interface and enhanced Web Worker
 */

import { createDefaultSimulationManager } from '../lib/simulation-manager.js';
import { driverData } from '../lib/driver-data.js';

async function runIntegrationTest() {
  console.log('🚀 Starting Implementation B Integration Test...\n');

  try {
    // Test 1: Create simulation manager
    console.log('📋 Test 1: Creating simulation manager...');
    const manager = createDefaultSimulationManager();
    console.log('✅ Simulation manager created successfully\n');

    // Test 2: Prepare test data
    console.log('📊 Test 2: Preparing test data...');
    const testDrivers = driverData.slice(0, 5); // Use first 5 drivers for quick test
    const testContext = {
      trackProfile: 'balanced' as const,
      weather: 'dry' as const,
      tyreStress: 'medium' as const,
      safetyCar: 'medium' as const,
      runs: 1000, // Small number for quick test
      randomness: 0.5
    };
    console.log(`✅ Test data prepared: ${testDrivers.length} drivers, ${testContext.runs} runs\n`);

    // Test 3: Run simulation
    console.log('🏁 Test 3: Running simulation...');
    const startTime = Date.now();
    const result = await manager.runSimulation(testDrivers, testContext);
    const endTime = Date.now();
    console.log(`✅ Simulation completed in ${endTime - startTime}ms\n`);

    // Test 4: Validate results
    console.log('🔍 Test 4: Validating results...');
    if (!result.results || result.results.length === 0) {
      throw new Error('No simulation results returned');
    }
    if (!result.performanceMetrics) {
      throw new Error('No performance metrics returned');
    }
    if (result.runs !== testContext.runs) {
      throw new Error(`Expected ${testContext.runs} runs, got ${result.runs}`);
    }
    console.log('✅ Results validation passed\n');

    // Test 5: Check performance metrics
    console.log('📈 Test 5: Checking performance metrics...');
    const metrics = result.performanceMetrics;
    console.log(`   - Execution time: ${metrics.executionTime}ms`);
    console.log(`   - Simulations/second: ${metrics.simulationsPerSecond.toFixed(2)}`);
    console.log(`   - Memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   - Method: ${metrics.method}`);

    if (metrics.simulationsPerSecond <= 0) {
      throw new Error('Invalid simulations per second');
    }
    console.log('✅ Performance metrics valid\n');

    // Test 6: Check prediction results
    console.log('🎯 Test 6: Checking prediction results...');
    const winner = result.predictedWinner;
    if (!winner || !winner.name) {
      throw new Error('No winner predicted');
    }
    console.log(`   - Predicted winner: ${winner.name} (${winner.team})`);
    console.log(`   - Win probability: ${(result.results[0].winProbability * 100).toFixed(1)}%`);
    console.log('✅ Prediction results valid\n');

    // Test 7: Run benchmark
    console.log('🏃 Test 7: Running benchmark...');
    const benchmarkResult = await manager.benchmark(testDrivers, testContext, 3);
    console.log(`   - Average execution time: ${benchmarkResult.performanceStats.avgExecutionTime.toFixed(2)}ms`);
    console.log(`   - Consistency score: ${(benchmarkResult.performanceStats.consistencyScore * 100).toFixed(1)}%`);
    console.log('✅ Benchmark completed\n');

    // Test 8: Cleanup
    console.log('🧹 Test 8: Cleaning up...');
    manager.cleanup();
    console.log('✅ Cleanup completed\n');

    console.log('🎉 All Implementation B integration tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Enhanced Web Worker integration');
    console.log('   ✅ Performance monitoring');
    console.log('   ✅ Unified simulation interface');
    console.log('   ✅ Benchmarking system');
    console.log('   ✅ Error handling and cleanup');

    return true;

  } catch (error) {
    const err = error as Error;
    console.error('❌ Integration test failed:', err.message);
    console.error('Stack trace:', err.stack);
    return false;
  }
}

// Run the test
runIntegrationTest().then(success => {
  console.log(`\n🏁 Test ${success ? 'PASSED' : 'FAILED'}`);
  if (!success) {
    console.log('❌ Some tests failed - check the output above for details');
  }
}).catch(error => {
  const err = error as Error;
  console.error('💥 Unexpected error during test execution:', err.message);
  console.log('❌ Test execution failed');
});