import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useSimulationStore } from "../stores/simulationStore";

describe("useSimulationStore", () => {
  beforeEach(() => {
    localStorage.clear();
    const { resetAll } = useSimulationStore.getState();
    act(() => {
      resetAll();
    });
  });

  it("manages the lifecycle of a simulation run", () => {
    const { startRun } = useSimulationStore.getState();

    act(() => {
      startRun();
    });

    const afterStart = useSimulationStore.getState();
    expect(afterStart.isRunning).toBe(true);
    expect(afterStart.currentRun).not.toBeNull();
    expect(afterStart.isFinished).toBe(false);

    const initialRunId = afterStart.currentRun?.id;
    expect(typeof initialRunId).toBe("number");

    act(() => {
      useSimulationStore.getState().endRun();
    });

    const afterEnd = useSimulationStore.getState();
    expect(afterEnd.isRunning).toBe(false);
    expect(afterEnd.isFinished).toBe(true);
    expect(afterEnd.currentRun).toBeNull();
    expect(afterEnd.history).toHaveLength(1);
    expect(afterEnd.history[0]?.id).toBe(initialRunId);
  });

  it("tracks driver roster and attribute toggles", () => {
    act(() => {
      useSimulationStore.getState().toggleDriver("Lando Norris", "McLaren");
    });

    let state = useSimulationStore.getState();
    expect(state.activeDrivers).toHaveLength(1);
    expect(state.activeDrivers[0]).toMatchObject({
      name: "Lando Norris",
      team: "McLaren",
      strengthsEnabled: [],
      weaknessesEnabled: [],
    });

    act(() => {
      useSimulationStore.getState().toggleStrength("Lando Norris", "qualifying");
      useSimulationStore.getState().toggleWeakness("Lando Norris", "tire-wear");
    });

    state = useSimulationStore.getState();
    expect(state.activeDrivers[0]?.strengthsEnabled).toContain("qualifying");
    expect(state.activeDrivers[0]?.weaknessesEnabled).toContain("tire-wear");

    act(() => {
      useSimulationStore.getState().toggleStrength("Lando Norris", "qualifying");
      useSimulationStore.getState().toggleWeakness("Lando Norris", "tire-wear");
    });

    state = useSimulationStore.getState();
    expect(state.activeDrivers[0]?.strengthsEnabled).not.toContain("qualifying");
    expect(state.activeDrivers[0]?.weaknessesEnabled).not.toContain("tire-wear");

    act(() => {
      useSimulationStore.getState().resetDrivers();
    });

    state = useSimulationStore.getState();
    expect(state.activeDrivers).toHaveLength(0);
  });
});
