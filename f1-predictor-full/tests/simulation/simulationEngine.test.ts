import { describe, expect, it } from "vitest";

import {
  defaultDriverProfiles,
  defaultRaceConfiguration,
  simulateRace,
} from "../../lib/simulationEngine";

describe("simulationEngine", () => {
  it("returns deterministic results for the same seed", async () => {
    const configuration = {
      ...defaultRaceConfiguration,
      laps: 12,
      weather: "sunny" as const,
      safetyCarProbability: 0.1,
    };

    const drivers = defaultDriverProfiles.slice(0, 6).map((profile) => ({
      profile,
      strengthsEnabled: [],
      weaknessesEnabled: [],
    }));

    const first = await simulateRace({ configuration, drivers }, { randomSeed: 42 });
    const second = await simulateRace({ configuration, drivers }, { randomSeed: 42 });

    const orderOne = first.result.finishingOrder.map((entry) => entry.driverId);
    const orderTwo = second.result.finishingOrder.map((entry) => entry.driverId);

    expect(orderOne).toEqual(orderTwo);
    expect(first.laps).toHaveLength(configuration.laps);
  });

  it("applies perk adjustments to driver performance", async () => {
    const configuration = {
      ...defaultRaceConfiguration,
      laps: 18,
      weather: "sunny" as const,
      safetyCarProbability: 0,
    };

    const max = defaultDriverProfiles.find((driver) => driver.id === "max-verstappen");
    const leclerc = defaultDriverProfiles.find((driver) => driver.id === "charles-leclerc");
    const norris = defaultDriverProfiles.find((driver) => driver.id === "lando-norris");

    expect(max).toBeDefined();
    expect(leclerc).toBeDefined();
    expect(norris).toBeDefined();

    const baselineDrivers = [max!, leclerc!, norris!].map((profile) => ({
      profile,
      strengthsEnabled: [],
      weaknessesEnabled: [],
    }));

    const adjustedDrivers = [
      { profile: max!, strengthsEnabled: [], weaknessesEnabled: ["max-tire-spike"] },
      {
        profile: leclerc!,
        strengthsEnabled: ["leclerc-pole-threat", "leclerc-turn-in"],
        weaknessesEnabled: [],
      },
      { profile: norris!, strengthsEnabled: [], weaknessesEnabled: [] },
    ];

    const baseline = await simulateRace({ configuration, drivers: baselineDrivers }, { randomSeed: 314 });
    const adjusted = await simulateRace({ configuration, drivers: adjustedDrivers }, { randomSeed: 314 });

    const baselineMax = baseline.result.finishingOrder.find((entry) => entry.driverId === "max-verstappen");
    const adjustedMax = adjusted.result.finishingOrder.find((entry) => entry.driverId === "max-verstappen");
    const baselineLeclerc = baseline.result.finishingOrder.find((entry) => entry.driverId === "charles-leclerc");
    const adjustedLeclerc = adjusted.result.finishingOrder.find((entry) => entry.driverId === "charles-leclerc");

    expect(baselineMax?.position).toBe(1);
    expect((adjustedMax?.totalTime ?? 0) > (baselineMax?.totalTime ?? 0)).toBe(true);
    expect((adjustedLeclerc?.totalTime ?? Infinity) < (baselineLeclerc?.totalTime ?? Infinity)).toBe(true);
    expect((adjustedLeclerc?.gapToLeader ?? Infinity) < (baselineLeclerc?.gapToLeader ?? Infinity)).toBe(true);
  });

  it("supports cancellation via abort signals", async () => {
    const configuration = {
      ...defaultRaceConfiguration,
      laps: 30,
      weather: "overcast" as const,
      safetyCarProbability: 0.4,
    };

    const drivers = defaultDriverProfiles.slice(0, 5).map((profile) => ({
      profile,
      strengthsEnabled: [],
      weaknessesEnabled: [],
    }));

    const controller = new AbortController();
    const completedLaps: number[] = [];

    await expect(
      simulateRace(
        { configuration, drivers },
        {
          randomSeed: 7,
          signal: controller.signal,
          onLapComplete: (lap) => {
            completedLaps.push(lap.lap);
            if (lap.lap === 3) {
              controller.abort();
            }
          },
        }
      )
    ).rejects.toThrowError("Simulation cancelled");

    expect(completedLaps.length).toBeGreaterThanOrEqual(3);
    expect(completedLaps[0]).toBe(1);
  });
});
