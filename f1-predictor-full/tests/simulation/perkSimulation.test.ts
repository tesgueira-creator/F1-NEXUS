import { beforeEach, describe, expect, it } from "vitest";

import { simulateGrid } from "../../lib/simulation";
import { useSimulationStore } from "../../stores/simulationStore";

const getDriverScores = (driverId: string) => {
  const result = simulateGrid(useSimulationStore.getState().activeDrivers).find(
    (entry) => entry.driverId === driverId
  );

  if (!result) {
    throw new Error(`Driver ${driverId} not found in simulation results`);
  }

  return result;
};

describe("simulation perks integration", () => {
  beforeEach(() => {
    useSimulationStore.getState().resetAll();
  });

  it("reduces projected score when a strength is deactivated", () => {
    const store = useSimulationStore.getState();
    const baseline = getDriverScores("max-verstappen");

    const strength = store
      .getDriverById("max-verstappen")
      ?.perks.find((perk) => perk.type === "strength");

    expect(strength?.enabled).toBe(true);

    if (!strength) throw new Error("Max Verstappen should have strengths available");

    store.togglePerk("max-verstappen", strength.id);

    const updated = getDriverScores("max-verstappen");

    expect(updated.perkScore).toBeLessThan(baseline.perkScore);
    expect(updated.totalScore).toBeLessThan(baseline.totalScore);
  });

  it("applies penalty when a weakness is enabled", () => {
    const store = useSimulationStore.getState();
    const baseline = getDriverScores("charles-leclerc");

    const weakness = store
      .getDriverById("charles-leclerc")
      ?.perks.find((perk) => perk.type === "weakness");

    expect(weakness?.enabled).toBe(false);

    if (!weakness) throw new Error("Charles Leclerc should have weaknesses available");

    store.togglePerk("charles-leclerc", weakness.id);

    const updated = getDriverScores("charles-leclerc");

    expect(updated.perkScore).toBeLessThan(baseline.perkScore);
    expect(updated.totalScore).toBeLessThan(baseline.totalScore);
  });

  it("combines strengths removals and weaknesses additions cumulatively", () => {
    const store = useSimulationStore.getState();
    const baseline = getDriverScores("max-verstappen");

    const maxStrengths =
      store.getDriverById("max-verstappen")?.perks.filter((perk) => perk.type === "strength") ?? [];
    const maxWeaknesses =
      store.getDriverById("max-verstappen")?.perks.filter((perk) => perk.type === "weakness") ?? [];

    const strengthTotal = maxStrengths.reduce((acc, perk) => acc + perk.weight, 0);
    const weaknessTotal = maxWeaknesses.reduce((acc, perk) => acc + perk.weight, 0);

    maxStrengths.forEach((perk) => store.togglePerk("max-verstappen", perk.id));
    maxWeaknesses.forEach((perk) => store.togglePerk("max-verstappen", perk.id));

    const updated = getDriverScores("max-verstappen");

    expect(baseline.perkScore).toBeCloseTo(strengthTotal, 3);
    expect(updated.perkScore).toBeCloseTo(-weaknessTotal, 3);
    expect(baseline.totalScore - updated.totalScore).toBeCloseTo(
      strengthTotal + weaknessTotal,
      3
    );
  });
});
