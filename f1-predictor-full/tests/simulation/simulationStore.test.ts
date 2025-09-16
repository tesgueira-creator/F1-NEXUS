import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as simulationEngine from "../../lib/simulationEngine";
import { useSimulationStore } from "../../stores/simulationStore";

describe("useSimulationStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useSimulationStore.persist?.clearStorage?.();
    act(() => {
      useSimulationStore.setState({
        configuration: { ...simulationEngine.defaultRaceConfiguration },
        lineup: [],
        history: [],
        currentRun: null,
        isRunning: false,
        statusMessage: null,
        runError: null,
        abortController: null,
      });
    });
  });

  it("runs a full simulation and stores the result", async () => {
    const store = useSimulationStore.getState();
    const driverIds = store.availableDrivers.slice(0, 3).map((driver) => driver.id);

    act(() => {
      store.updateConfiguration({ laps: 10, weather: "sunny", safetyCarProbability: 0.05 });
      driverIds.forEach((id) => store.toggleDriver(id));
    });

    await act(async () => {
      await store.runSimulation(2024);
    });

    const state = useSimulationStore.getState();
    expect(state.isRunning).toBe(false);
    expect(state.currentRun?.status).toBe("completed");
    expect(state.currentRun?.result?.finishingOrder.length).toBeGreaterThan(0);
    expect(state.currentRun?.laps.length).toBe(state.currentRun?.configuration.laps);
    expect(state.history).toHaveLength(1);
    expect(state.history[0]?.status).toBe("completed");
  });

  it("cancels an ongoing simulation and preserves partial data", async () => {
    const store = useSimulationStore.getState();
    const driverIds = store.availableDrivers.slice(0, 4).map((driver) => driver.id);

    act(() => {
      store.updateConfiguration({ laps: 28, weather: "overcast", safetyCarProbability: 0.3 });
      driverIds.forEach((id) => store.toggleDriver(id));
    });

    const simulateSpy = vi
      .spyOn(simulationEngine, "simulateRace")
      .mockImplementation(async (context, options = {}) => {
        const lapSnapshot = {
          lap: 1,
          order: context.drivers.map((driver, index) => ({
            driverId: driver.profile.id,
            name: driver.profile.name,
            team: driver.profile.team,
            position: index + 1,
            gapToLeader: index === 0 ? 0 : Number((index * 0.5).toFixed(3)),
          })),
          lapTimes: context.drivers.map((driver, index) => ({
            driverId: driver.profile.id,
            name: driver.profile.name,
            time: Number((90 + index).toFixed(3)),
          })),
          events: ["Volta simulada"],
        };

        options.onLapComplete?.(lapSnapshot);
        await new Promise((resolve) => setTimeout(resolve, 5));

        if (options.signal?.aborted) {
          throw new Error("Simulation cancelled");
        }

        const finishingOrder = lapSnapshot.order.map((entry, index) => ({
          ...entry,
          gapToLeader: index === 0 ? null : entry.gapToLeader,
          status: index === 0 ? "Vencedor" : "Terminou",
          totalTime: 5000 + index,
          points: index === 0 ? 25 : index === 1 ? 18 : 15,
        }));

        return {
          laps: [lapSnapshot],
          result: {
            finishingOrder,
            fastestLap: null,
            retirements: [],
          },
          meta: {
            seed: 1,
            totalLaps: context.configuration.laps,
            completedLaps: 1,
            track: context.configuration.track,
            weather: context.configuration.weather,
          },
        };
      });

    try {
      await act(async () => {
        const promise = store.runSimulation(99);
        await new Promise((resolve) => setTimeout(resolve, 1));
        store.cancelSimulation();
        await promise;
      });
    } finally {
      simulateSpy.mockRestore();
    }

    const state = useSimulationStore.getState();
    expect(state.isRunning).toBe(false);
    expect(state.currentRun?.status).toBe("cancelled");
    expect(state.currentRun?.laps.length).toBeGreaterThan(0);
    expect(state.history.at(-1)?.status).toBe("cancelled");
  });

  it("manages driver roster and perk toggles", () => {
    const store = useSimulationStore.getState();
    const target = store.availableDrivers[0]!;
    const strength = target.strengths[0]?.key;
    const weakness = target.weaknesses[0]?.key;

    act(() => {
      store.toggleDriver(target.id);
    });

    let state = useSimulationStore.getState();
    expect(state.lineup.some((driver) => driver.id === target.id)).toBe(true);

    if (strength) {
      act(() => {
        store.toggleStrength(target.id, strength);
      });
      state = useSimulationStore.getState();
      expect(state.lineup.find((driver) => driver.id === target.id)?.strengthsEnabled).toContain(strength);
      act(() => {
        store.toggleStrength(target.id, strength);
      });
      state = useSimulationStore.getState();
      expect(state.lineup.find((driver) => driver.id === target.id)?.strengthsEnabled).not.toContain(strength);
    }

    if (weakness) {
      act(() => {
        store.toggleWeakness(target.id, weakness);
      });
      state = useSimulationStore.getState();
      expect(state.lineup.find((driver) => driver.id === target.id)?.weaknessesEnabled).toContain(weakness);
      act(() => {
        store.toggleWeakness(target.id, weakness);
      });
      state = useSimulationStore.getState();
      expect(state.lineup.find((driver) => driver.id === target.id)?.weaknessesEnabled).not.toContain(weakness);
    }

    act(() => {
      store.toggleDriver(target.id);
    });

    state = useSimulationStore.getState();
    expect(state.lineup.some((driver) => driver.id === target.id)).toBe(false);
  });

  it("sanitises configuration updates", () => {
    const store = useSimulationStore.getState();
    act(() => {
      store.updateConfiguration({ laps: 2, temperature: 120, safetyCarProbability: 2, track: "  Monza" });
    });
    const state = useSimulationStore.getState();
    expect(state.configuration.laps).toBeGreaterThanOrEqual(5);
    expect(state.configuration.temperature).toBeLessThanOrEqual(60);
    expect(state.configuration.safetyCarProbability).toBeLessThanOrEqual(0.9);
    expect(state.configuration.track.startsWith("Monza")).toBe(true);
  });
});
