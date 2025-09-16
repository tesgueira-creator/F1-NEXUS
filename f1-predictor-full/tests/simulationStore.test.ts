import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSimulationStore } from '../stores/simulationStore';

const resetStore = () => {
  useSimulationStore.persist.clearStorage();
  useSimulationStore.setState({
    currentRun: null,
    isRunning: false,
    isFinished: false,
    history: [],
    activeDrivers: [],
  });
};

beforeEach(() => {
  resetStore();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetStore();
});

describe('useSimulationStore', () => {
  it('starts and completes a run while recording history', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const { result } = renderHook(() => useSimulationStore());

    act(() => {
      result.current.startRun();
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.isFinished).toBe(false);
    expect(result.current.currentRun).toEqual({ id: 1700000000000 });

    act(() => {
      result.current.endRun();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.isFinished).toBe(true);
    expect(result.current.history).toEqual([{ id: 1700000000000 }]);

    nowSpy.mockRestore();
  });

  it('toggles drivers and their strengths and weaknesses', () => {
    const { result } = renderHook(() => useSimulationStore());

    act(() => {
      result.current.toggleDriver('Max Verstappen', 'Red Bull');
    });

    expect(result.current.activeDrivers).toHaveLength(1);
    expect(result.current.activeDrivers[0]).toMatchObject({
      name: 'Max Verstappen',
      team: 'Red Bull',
      strengthsEnabled: [],
      weaknessesEnabled: [],
    });

    act(() => {
      result.current.toggleStrength('Max Verstappen', 'qualifying');
      result.current.toggleWeakness('Max Verstappen', 'reliability');
    });

    expect(result.current.activeDrivers[0].strengthsEnabled).toContain('qualifying');
    expect(result.current.activeDrivers[0].weaknessesEnabled).toContain('reliability');

    act(() => {
      result.current.toggleStrength('Max Verstappen', 'qualifying');
      result.current.toggleWeakness('Max Verstappen', 'reliability');
      result.current.toggleDriver('Max Verstappen', 'Red Bull');
    });

    expect(result.current.activeDrivers).toHaveLength(0);
  });

  it('resets the entire run state', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(42);
    const { result } = renderHook(() => useSimulationStore());

    act(() => {
      result.current.startRun();
      result.current.endRun();
      result.current.toggleDriver('Lewis Hamilton', 'Mercedes');
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.activeDrivers).toHaveLength(1);

    act(() => {
      result.current.resetAll();
    });

    expect(result.current.history).toHaveLength(0);
    expect(result.current.currentRun).toBeNull();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isFinished).toBe(false);
    expect(result.current.activeDrivers).toHaveLength(0);

    nowSpy.mockRestore();
  });
});
