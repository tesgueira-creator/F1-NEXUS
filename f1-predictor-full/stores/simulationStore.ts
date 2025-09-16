import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";

import {
  driverPerkCatalog,
  getDriverPerkProfile,
  type DriverPerk,
  type DriverPerkProfile,
} from "../data/driverPerks";

export type DriverPerkState = DriverPerk & { enabled: boolean };

export type DriverConfig = {
  id: string;
  name: string;
  team: string;
  baseScore: number;
  perks: DriverPerkState[];
};

type SimulationRun = { id: number };

type State = {
  currentRun: SimulationRun | null;
  isRunning: boolean;
  isFinished: boolean;
  history: SimulationRun[];
  activeDrivers: DriverConfig[];
  startRun: () => void;
  endRun: () => void;
  resetRun: () => void;
  toggleDriver: (driverId: string) => void;
  togglePerk: (driverId: string, perkId: string) => void;
  setPerkEnabled: (driverId: string, perkId: string, enabled: boolean) => void;
  getDriverById: (driverId: string) => DriverConfig | undefined;
  isPerkEnabled: (driverId: string, perkId: string) => boolean;
  resetDrivers: () => void;
  resetAll: () => void;
};

const driverOrder = driverPerkCatalog.reduce<Record<string, number>>(
  (acc, profile, index) => {
    acc[profile.id] = index;
    return acc;
  },
  {}
);

const createDriverState = (profile: DriverPerkProfile): DriverConfig => ({
  id: profile.id,
  name: profile.name,
  team: profile.team,
  baseScore: profile.baseScore,
  perks: profile.perks.map((perk) => ({
    ...perk,
    enabled: perk.type === "strength",
  })),
});

const createInitialActiveDrivers = () => driverPerkCatalog.map(createDriverState);

const sortDrivers = (drivers: DriverConfig[]) =>
  [...drivers].sort((a, b) => driverOrder[a.id] - driverOrder[b.id]);

const normalizeDrivers = (drivers: unknown): DriverConfig[] => {
  if (!Array.isArray(drivers)) {
    return createInitialActiveDrivers();
  }

  const normalized = drivers
    .map((candidate) => {
      if (!candidate || typeof candidate !== "object") return null;

      const maybe = candidate as Partial<DriverConfig> & {
        strengthsEnabled?: string[];
        weaknessesEnabled?: string[];
      };

      const profile =
        (typeof maybe.id === "string" && getDriverPerkProfile(maybe.id)) ||
        driverPerkCatalog.find((entry) => entry.name === maybe.name);

      if (!profile) return null;

      const enabledLookup = new Map<string, boolean>();

      if (Array.isArray(maybe.perks)) {
        for (const perk of maybe.perks) {
          if (
            perk &&
            typeof perk === "object" &&
            typeof (perk as { id?: unknown }).id === "string"
          ) {
            enabledLookup.set(
              (perk as { id: string }).id,
              Boolean((perk as { enabled?: unknown }).enabled)
            );
          }
        }
      } else {
        if (Array.isArray(maybe.strengthsEnabled)) {
          for (const perkId of maybe.strengthsEnabled) {
            if (typeof perkId === "string") {
              enabledLookup.set(perkId, true);
            }
          }
        }
        if (Array.isArray(maybe.weaknessesEnabled)) {
          for (const perkId of maybe.weaknessesEnabled) {
            if (typeof perkId === "string") {
              enabledLookup.set(perkId, true);
            }
          }
        }
      }

      return {
        id: profile.id,
        name: profile.name,
        team: profile.team,
        baseScore: profile.baseScore,
        perks: profile.perks.map((perk) => ({
          ...perk,
          enabled: enabledLookup.has(perk.id)
            ? Boolean(enabledLookup.get(perk.id))
            : perk.type === "strength",
        })),
      } satisfies DriverConfig;
    })
    .filter((driver): driver is DriverConfig => Boolean(driver));

  return normalized.length > 0 ? sortDrivers(normalized) : createInitialActiveDrivers();
};

const fallbackStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useSimulationStore = create<State>()(
  persist(
    (set, get) => ({
      currentRun: null,
      isRunning: false,
      isFinished: false,
      history: [],
      activeDrivers: createInitialActiveDrivers(),
      startRun: () =>
        set({ currentRun: { id: Date.now() }, isRunning: true, isFinished: false }),
      endRun: () => {
        const snapshot = get();
        if (!snapshot.currentRun) return;
        set({
          currentRun: null,
          isRunning: false,
          isFinished: true,
          history: [...snapshot.history, snapshot.currentRun],
        });
      },
      resetRun: () => set({ currentRun: null, isRunning: false, isFinished: false }),
      toggleDriver: (driverId) => {
        const list = get().activeDrivers;
        const exists = list.some((driver) => driver.id === driverId);
        if (exists) {
          set({ activeDrivers: list.filter((driver) => driver.id !== driverId) });
          return;
        }

        const profile = getDriverPerkProfile(driverId);
        if (!profile) return;

        set({ activeDrivers: sortDrivers([...list, createDriverState(profile)]) });
      },
      togglePerk: (driverId, perkId) =>
        set({
          activeDrivers: get().activeDrivers.map((driver) =>
            driver.id !== driverId
              ? driver
              : {
                  ...driver,
                  perks: driver.perks.map((perk) =>
                    perk.id === perkId ? { ...perk, enabled: !perk.enabled } : perk
                  ),
                }
          ),
        }),
      setPerkEnabled: (driverId, perkId, enabled) =>
        set({
          activeDrivers: get().activeDrivers.map((driver) =>
            driver.id !== driverId
              ? driver
              : {
                  ...driver,
                  perks: driver.perks.map((perk) =>
                    perk.id === perkId ? { ...perk, enabled } : perk
                  ),
                }
          ),
        }),
      getDriverById: (driverId) => get().activeDrivers.find((driver) => driver.id === driverId),
      isPerkEnabled: (driverId, perkId) => {
        const driver = get().activeDrivers.find((entry) => entry.id === driverId);
        return driver?.perks.find((perk) => perk.id === perkId)?.enabled ?? false;
      },
      resetDrivers: () => set({ activeDrivers: createInitialActiveDrivers() }),
      resetAll: () =>
        set({
          currentRun: null,
          isRunning: false,
          isFinished: false,
          history: [],
          activeDrivers: createInitialActiveDrivers(),
        }),
    }),
    {
      name: "simulation-store",
      version: 2,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? fallbackStorage : window.localStorage
      ),
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== "object") {
          return {
            currentRun: null,
            isRunning: false,
            isFinished: false,
            history: [],
            activeDrivers: createInitialActiveDrivers(),
          };
        }

        const base = persistedState as Partial<State>;

        return {
          currentRun: base.currentRun ?? null,
          isRunning: base.isRunning ?? false,
          isFinished: base.isFinished ?? false,
          history: Array.isArray(base.history) ? base.history : [],
          activeDrivers: normalizeDrivers(base.activeDrivers),
        };
      },
    }
  )
);

export const selectActiveDrivers = (state: State) => state.activeDrivers;

export const selectDriverById = (driverId: string) => (state: State) =>
  state.getDriverById(driverId);

export const selectPerkEnabled = (driverId: string, perkId: string) => (state: State) =>
  state.isPerkEnabled(driverId, perkId);
