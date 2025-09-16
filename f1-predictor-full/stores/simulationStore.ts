import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  defaultDriverProfiles,
  defaultRaceConfiguration,
  findDriverProfile,
  simulateRace,
  type DriverProfile,
  type RaceConfiguration,
  type SimulationLap,
  type SimulationResultSummary,
  type SimulationDriverSetup,
} from "../lib/simulationEngine";

export type SelectedDriver = {
  id: string;
  strengthsEnabled: string[];
  weaknessesEnabled: string[];
};

export type SimulationStatus = "idle" | "running" | "completed" | "cancelled" | "failed";

export interface SimulationRun {
  id: string;
  status: SimulationStatus;
  startedAt: number;
  finishedAt?: number;
  configuration: RaceConfiguration;
  lineup: SelectedDriver[];
  laps: SimulationLap[];
  result: SimulationResultSummary | null;
  message?: string;
  seed?: number;
}

interface SimulationState {
  configuration: RaceConfiguration;
  availableDrivers: DriverProfile[];
  lineup: SelectedDriver[];
  currentRun: SimulationRun | null;
  history: SimulationRun[];
  isRunning: boolean;
  statusMessage: string | null;
  runError: string | null;
  abortController: AbortController | null;
  runSimulation: (seed?: number) => Promise<void>;
  cancelSimulation: () => void;
  updateConfiguration: (config: Partial<RaceConfiguration>) => void;
  toggleDriver: (driverId: string) => void;
  toggleStrength: (driverId: string, strengthKey: string) => void;
  toggleWeakness: (driverId: string, weaknessKey: string) => void;
  resetLineup: () => void;
  resetHistory: () => void;
  clearCurrentRun: () => void;
  setStatusMessage: (message: string | null) => void;
}

function cloneConfiguration(configuration: RaceConfiguration): RaceConfiguration {
  return { ...configuration };
}

function cloneLineup(lineup: SelectedDriver[]): SelectedDriver[] {
  return lineup.map((driver) => ({
    id: driver.id,
    strengthsEnabled: [...driver.strengthsEnabled],
    weaknessesEnabled: [...driver.weaknessesEnabled],
  }));
}

function sanitizeConfiguration(
  current: RaceConfiguration,
  update: Partial<RaceConfiguration>
): RaceConfiguration {
  const next = { ...current, ...update };

  if (update.track !== undefined) {
    next.track = update.track.trimStart();
  }

  if (update.laps !== undefined) {
    const laps = Math.round(update.laps);
    next.laps = Math.max(5, isNaN(laps) ? current.laps : laps);
  }

  if (update.temperature !== undefined) {
    const temperature = Math.round(update.temperature);
    next.temperature = Math.min(60, Math.max(-10, isNaN(temperature) ? current.temperature : temperature));
  }

  if (update.safetyCarProbability !== undefined) {
    const value = Number(update.safetyCarProbability);
    next.safetyCarProbability = Math.min(0.9, Math.max(0, isNaN(value) ? current.safetyCarProbability : value));
  }

  if (update.weather !== undefined) {
    next.weather = update.weather;
  }

  return next;
}

function buildSimulationDrivers(
  lineup: SelectedDriver[],
  available: DriverProfile[]
): SimulationDriverSetup[] {
  return lineup
    .map((selection) => {
      const profile = available.find((driver) => driver.id === selection.id);
      if (!profile) {
        return null;
      }
      return {
        profile,
        strengthsEnabled: [...selection.strengthsEnabled],
        weaknessesEnabled: [...selection.weaknessesEnabled],
      } satisfies SimulationDriverSetup;
    })
    .filter((driver): driver is SimulationDriverSetup => driver !== null);
}

const HISTORY_LIMIT = 10;

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      configuration: { ...defaultRaceConfiguration },
      availableDrivers: defaultDriverProfiles,
      lineup: [],
      currentRun: null,
      history: [],
      isRunning: false,
      statusMessage: null,
      runError: null,
      abortController: null,
      async runSimulation(seed) {
        const state = get();
        if (state.isRunning) {
          return;
        }

        const drivers = buildSimulationDrivers(state.lineup, state.availableDrivers);
        if (drivers.length === 0) {
          set({
            statusMessage: "Selecione pelo menos um piloto para iniciar a corrida.",
            runError: "Nenhum piloto selecionado.",
          });
          return;
        }

        const runId = `run-${Date.now()}`;
        const abortController = new AbortController();
        const configuration = cloneConfiguration(state.configuration);
        const lineup = cloneLineup(state.lineup);

        set({
          currentRun: {
            id: runId,
            status: "running",
            startedAt: Date.now(),
            configuration,
            lineup,
            laps: [],
            result: null,
            message: "Simulação em andamento...",
          },
          isRunning: true,
          statusMessage: "Simulação iniciada...",
          runError: null,
          abortController,
        });

        try {
          const output = await simulateRace(
            { configuration, drivers },
            {
              signal: abortController.signal,
              randomSeed: seed,
              onLapComplete: (lap) => {
                set((current) => {
                  if (!current.currentRun || current.currentRun.id !== runId) {
                    return {};
                  }

                  const laps = [...current.currentRun.laps];
                  const index = laps.findIndex((item) => item.lap === lap.lap);
                  if (index >= 0) {
                    laps[index] = lap;
                  } else {
                    laps.push(lap);
                  }

                  return {
                    currentRun: {
                      ...current.currentRun,
                      laps,
                      message: `Volta ${lap.lap}/${configuration.laps} concluída.`,
                    },
                    statusMessage: `Volta ${lap.lap}/${configuration.laps} concluída.`,
                  };
                });
              },
            }
          );

          set((current) => {
            if (!current.currentRun || current.currentRun.id !== runId) {
              return {
                abortController: null,
                isRunning: false,
                statusMessage: "Simulação concluída.",
              };
            }

            const finishedRun: SimulationRun = {
              ...current.currentRun,
              status: "completed",
              finishedAt: Date.now(),
              laps: output.laps,
              result: output.result,
              message: "Simulação concluída com sucesso.",
              seed: output.meta.seed,
            };

            const history = [...current.history, finishedRun].slice(-HISTORY_LIMIT);

            return {
              currentRun: finishedRun,
              history,
              isRunning: false,
              statusMessage: "Simulação concluída.",
              abortController: null,
            };
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erro desconhecido";

          if (message === "Simulation cancelled") {
            set((current) => {
              if (!current.currentRun || current.currentRun.id !== runId) {
                return {
                  abortController: null,
                  isRunning: false,
                  statusMessage: "Simulação cancelada.",
                };
              }

              const cancelledRun: SimulationRun = {
                ...current.currentRun,
                status: "cancelled",
                finishedAt: Date.now(),
                message: "Simulação cancelada pelo utilizador.",
              };

              const history = [...current.history, cancelledRun].slice(-HISTORY_LIMIT);

              return {
                currentRun: cancelledRun,
                history,
                isRunning: false,
                statusMessage: "Simulação cancelada.",
                abortController: null,
              };
            });
            return;
          }

          set((current) => {
            const hasCurrentRun = current.currentRun && current.currentRun.id === runId;
            const failedRun: SimulationRun | null = hasCurrentRun
              ? {
                  ...current.currentRun!,
                  status: "failed",
                  finishedAt: Date.now(),
                  message,
                }
              : null;

            const history = failedRun
              ? [...current.history, failedRun].slice(-HISTORY_LIMIT)
              : current.history;

            return {
              currentRun: failedRun,
              history,
              isRunning: false,
              statusMessage: "Falha na simulação.",
              runError: message,
              abortController: null,
            };
          });
        }
      },
      cancelSimulation() {
        const controller = get().abortController;
        if (!controller) {
          return;
        }

        set({ statusMessage: "Cancelando simulação..." });
        controller.abort();
      },
      updateConfiguration(update) {
        set((current) => ({
          configuration: sanitizeConfiguration(current.configuration, update),
        }));
      },
      toggleDriver(driverId) {
        set((current) => {
          const isActive = current.lineup.some((driver) => driver.id === driverId);
          if (isActive) {
            return {
              lineup: current.lineup.filter((driver) => driver.id !== driverId),
            };
          }

          const profile = current.availableDrivers.find((driver) => driver.id === driverId);
          if (!profile) {
            return {};
          }

          return {
            lineup: [
              ...current.lineup,
              {
                id: driverId,
                strengthsEnabled: [],
                weaknessesEnabled: [],
              },
            ],
          };
        });
      },
      toggleStrength(driverId, strengthKey) {
        set((current) => {
          const profile = findDriverProfile(driverId);
          if (!profile || !profile.strengths.some((strength) => strength.key === strengthKey)) {
            return {};
          }

          const selection = current.lineup.find((driver) => driver.id === driverId);
          if (!selection) {
            return {};
          }

          const lineup = current.lineup.map((driver) => {
            if (driver.id !== driverId) {
              return driver;
            }

            const hasStrength = driver.strengthsEnabled.includes(strengthKey);
            return {
              ...driver,
              strengthsEnabled: hasStrength
                ? driver.strengthsEnabled.filter((key) => key !== strengthKey)
                : [...driver.strengthsEnabled, strengthKey],
            };
          });

          return { lineup };
        });
      },
      toggleWeakness(driverId, weaknessKey) {
        set((current) => {
          const profile = findDriverProfile(driverId);
          if (!profile || !profile.weaknesses.some((weakness) => weakness.key === weaknessKey)) {
            return {};
          }

          const selection = current.lineup.find((driver) => driver.id === driverId);
          if (!selection) {
            return {};
          }

          const lineup = current.lineup.map((driver) => {
            if (driver.id !== driverId) {
              return driver;
            }

            const hasWeakness = driver.weaknessesEnabled.includes(weaknessKey);
            return {
              ...driver,
              weaknessesEnabled: hasWeakness
                ? driver.weaknessesEnabled.filter((key) => key !== weaknessKey)
                : [...driver.weaknessesEnabled, weaknessKey],
            };
          });

          return { lineup };
        });
      },
      resetLineup() {
        set({ lineup: [] });
      },
      resetHistory() {
        set({ history: [] });
      },
      clearCurrentRun() {
        set({ currentRun: null });
      },
      setStatusMessage(message) {
        set({ statusMessage: message });
      },
    }),
    {
      name: "simulation-store",
      partialize: ({ abortController, ...rest }) => rest,
    }
  )
);
