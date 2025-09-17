import { create } from "zustand";
import { persist } from "zustand/middleware";

import { driverData, DriverMetrics, parseDriversFromCSV } from "lib/driver-data";
import { buildDriversFromErgast, getPreferredQualifyingGrid, getNextRaceInfo } from "lib/ergast";
import { determineTrackProfile } from "lib/circuit-profile";
import { RaceContext, SimulationSummary, runPrediction } from "lib/prediction";
import { runPredictionOptimized } from "lib/prediction-optimized";
import type { NewsFactor, VariationTarget } from "lib/news-factors";

type DriverSelection = DriverMetrics & { isActive: boolean };

type State = {
  drivers: DriverSelection[];
  context: RaceContext;
  result: SimulationSummary | null;
  history: SimulationSummary[];
  isRunning: boolean;
  progress: number | null;
  autoTrackProfileLabel: string | null;
  autoTrackProfileAt: number | null;
  nextRaceCircuit: string | null;
  nextRaceCountry: string | null;
  nextRaceLocality: string | null;
  variations: NewsFactor[];
  variationsLoading: boolean;
  variationsError: string | null;
  variationsUpdatedAt: number | null;
  variationsSource: 'ollama' | 'heuristic' | null;
  fetchNewsFactors: () => Promise<void>;
  toggleVariation: (id: string) => void;
  clearVariations: () => void;
  replaceDrivers: (drivers: DriverMetrics[]) => void;
  loadDriversCSVText: (csvText: string) => Promise<void>;
  cancelSimulation: () => void;
  loadFromErgast: () => Promise<void>;
  toggleDriver: (id: string) => void;
  selectAll: () => void;
  clearAll: () => void;
  setContext: (update: Partial<RaceContext>) => void;
  runSimulation: () => Promise<void>;
  reset: () => void;
};

const DEFAULT_CONTEXT: RaceContext = {
  trackProfile: "balanced",
  weather: "dry",
  tyreStress: "medium",
  safetyCar: "medium",
  runs: 3000,
  randomness: 0.65
};

function createInitialDrivers(): DriverSelection[] {
  return driverData.map(driver => ({ ...driver, isActive: true }));
}

export const useSimulationStore = create<State>()(
  persist(
    (set, get) => ({
      drivers: createInitialDrivers(),
      context: DEFAULT_CONTEXT,
      result: null,
      history: [],
      isRunning: false,
      progress: null,
      autoTrackProfileLabel: null,
      autoTrackProfileAt: null,
      nextRaceCircuit: null,
      nextRaceCountry: null,
      nextRaceLocality: null,
      variations: [],
      variationsLoading: false,
      variationsError: null,
      variationsUpdatedAt: null,
      variationsSource: null,
      replaceDrivers: (driversIn: DriverMetrics[]) =>
        set(() => ({ drivers: driversIn.map(d => ({ ...d, isActive: true })) })),
      loadDriversCSVText: async (csvText: string) => {
        try {
          const parsed = parseDriversFromCSV(csvText);
          set(() => ({ drivers: parsed.map(d => ({ ...d, isActive: true })) }));
        } catch (e: any) {
          throw new Error(e?.message || 'CSV inválido');
        }
      },
      cancelSimulation: () => {
        const w: any = (get() as any)._workerRef;
        const t: any = (get() as any)._workerTimeout;
        if (t) { try { clearTimeout(t); } catch {} }
        if (w) { try { w.terminate(); } catch {} }
        set({ isRunning: false, progress: null });
        (set as any)({ _workerRef: null, _workerTimeout: null });
      },
      fetchNewsFactors: async () => {
        const COOLDOWN_MS = 30000;
        const last = get().variationsUpdatedAt;
        const now = Date.now();
        if (last && (now - last) < COOLDOWN_MS) {
          const rem = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
          set({ variationsError: `Aguarde ${rem}s para nova análise.` });
          return;
        }
        set({ variationsLoading: true, variationsError: null });
        try {
          const res = await fetch('/api/news/factors', { cache: 'no-store' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          const factors: NewsFactor[] = json.factors || [];
          const src = (json.source === 'ollama' || json.source === 'heuristic') ? json.source : null;
          set({ variations: factors, variationsLoading: false, variationsUpdatedAt: Date.now(), variationsSource: src });
        } catch (e: any) {
          console.warn('Failed to fetch news factors', e);
          set({ variationsLoading: false, variationsError: e?.message || 'Falha a obter fatores' });
        }
      },
      toggleVariation: (id: string) => set(state => ({ variations: state.variations.map(v => v.id === id ? { ...v, enabled: !v.enabled } : v) })),
      clearVariations: () => set({ variations: [] }),
      loadFromErgast: async () => {
        try {
          const [drivers, lastQuali, nextInfo] = await Promise.all([
            buildDriversFromErgast(),
            getPreferredQualifyingGrid(),
            getNextRaceInfo(),
          ]);
          const mapped: DriverSelection[] = drivers.map((d) => ({
            id: d.id,
            name: d.name,
            code: d.code,
            team: d.team,
            country: d.nationality || "",
            number: d.number,
            gridPosition: lastQuali[d.code?.toUpperCase()] || 0,
            qualyGapMs: 0,
            longRunPaceDelta: 0,
            straightlineIndex: 80,
            corneringIndex: 80,
            pitStopMedian: 2.4,
            dnfRate: typeof d.dnfRate === "number" ? d.dnfRate : 0.04,
            wetSkill: 0.8,
            consistency: 0.8,
            tyreManagement: 0.8,
            aggression: 0.6,
            experience: 0.6,
            speedTrapKph: 330,
            ergastId: d.driverId,
            constructorId: d.constructorId,
            standingsPoints: d.standingsPoints,
            standingsWins: d.standingsWins,
            isActive: true,
          }));
          // Optionally auto-adjust track profile only if user hasn't changed it (still balanced)
          set(state => {
            const nextProfile = determineTrackProfile(nextInfo);
            const context = state.context.trackProfile === 'balanced'
              ? { ...state.context, trackProfile: nextProfile }
              : state.context;
            const auto = state.context.trackProfile === 'balanced'
              ? { autoTrackProfileLabel: `${nextProfile} | ${nextInfo.circuitName || nextInfo.circuitId || ''}`, autoTrackProfileAt: Date.now() }
              : { autoTrackProfileLabel: state.autoTrackProfileLabel, autoTrackProfileAt: state.autoTrackProfileAt };
            return {
              drivers: mapped,
              context,
              ...auto,
              nextRaceCircuit: nextInfo.circuitName || nextInfo.circuitId || null,
              nextRaceCountry: nextInfo.country || null,
              nextRaceLocality: nextInfo.locality || null,
            };
          });
        } catch (err) {
          console.error("Failed to load from Ergast", err);
        }
      },
      toggleDriver: id =>
        set(state => ({
          drivers: state.drivers.map(driver =>
            driver.id === id ? { ...driver, isActive: !driver.isActive } : driver
          )
        })),
      selectAll: () =>
        set(state => ({
          drivers: state.drivers.map(driver => ({ ...driver, isActive: true }))
        })),
      clearAll: () =>
        set(state => ({
          drivers: state.drivers.map(driver => ({ ...driver, isActive: false }))
        })),
      setContext: update =>
        set(state => ({
          context: { ...state.context, ...update }
        })),
      runSimulation: async () => {
        let { drivers, context } = get();
        // If we don't have Ergast-backed data yet, try to load it now
        const missingPoints = drivers.every(d => d.standingsPoints == null);
        if (missingPoints) {
          try {
            const [fresh, lastQuali, nextInfo] = await Promise.all([
              buildDriversFromErgast(),
              getPreferredQualifyingGrid(),
              getNextRaceInfo(),
            ]);
            const map = new Map(fresh.map(d => [d.id, d] as const));
            drivers = drivers.map(d => {
              const e = map.get(d.id);
              if (!e) return d;
              return {
                ...d,
                name: e.name || d.name,
                team: e.team || d.team,
                number: e.number || d.number,
                dnfRate: typeof e.dnfRate === 'number' ? e.dnfRate : d.dnfRate,
                ergastId: e.driverId,
                constructorId: e.constructorId ?? d.constructorId,
                standingsPoints: e.standingsPoints,
                standingsWins: e.standingsWins,
                gridPosition: lastQuali[e.code?.toUpperCase() || d.code?.toUpperCase()] || d.gridPosition,
                isActive: true,
              };
            });
            // If still balanced, auto adjust profile
            set(state => {
              const nextProfile = determineTrackProfile(nextInfo);
              const context = state.context.trackProfile === 'balanced'
                ? { ...state.context, trackProfile: nextProfile }
                : state.context;
              const auto = state.context.trackProfile === 'balanced'
                ? { autoTrackProfileLabel: `${nextProfile} | ${nextInfo.circuitName || nextInfo.circuitId || ''}`, autoTrackProfileAt: Date.now() }
                : { autoTrackProfileLabel: state.autoTrackProfileLabel, autoTrackProfileAt: state.autoTrackProfileAt };
              return {
                drivers,
                context,
                ...auto,
                nextRaceCircuit: nextInfo.circuitName || nextInfo.circuitId || null,
                nextRaceCountry: nextInfo.country || null,
                nextRaceLocality: nextInfo.locality || null,
              };
            });
          } catch (e) {
            console.warn('Could not refresh drivers from Ergast:', e);
          }
        }
        const activeDrivers = drivers.filter(driver => driver.isActive);
        if (activeDrivers.length < 2) {
          return;
        }
        set({ isRunning: true });

        // apply variations to build effective drivers/context
        const enabledFactors = get().variations.filter(v => v.enabled);

        function targetMatches(targets: VariationTarget[] | undefined, driver: DriverSelection): boolean {
          if (!targets || targets.length === 0) return true;
          return targets.some(t => {
            if (t.type === 'driver') return driver.code.toUpperCase() === String(t.id).toUpperCase();
            if (t.type === 'team') return driver.team.toLowerCase().includes(String(t.id).toLowerCase());
            return false;
          });
        }

        const effectiveDrivers: DriverSelection[] = activeDrivers.map(d => ({ ...d }));
        let randomnessBump = 0;

        for (const f of enabledFactors) {
          if (f.impactType === 'strategy') {
            randomnessBump += f.magnitude * 0.15; // strategy can increase/decrease randomness
          }
        }

        // Reliability and Qualifying adjustments per driver
        for (const f of enabledFactors) {
          for (const d of effectiveDrivers) {
            if (!targetMatches(f.targets, d)) continue;
            if (f.impactType === 'reliability') {
              d.dnfRate = Math.max(0, Math.min(0.6, d.dnfRate + f.magnitude * 0.05));
            } else if (f.impactType === 'qualifying') {
              const delta = Math.round(f.magnitude * -2); // positive => better grid (lower position)
              d.gridPosition = Math.max(1, d.gridPosition + delta);
            }
          }
        }

        // Pace adjustments affect weights below (worker) or scoring indirectly (non-worker via longRunPaceDelta tweak)
        const paceMultipliers = new Map<string, number>();
        for (const d of effectiveDrivers) paceMultipliers.set(d.id, 1);
        for (const f of enabledFactors) {
          if (f.impactType !== 'pace') continue;
          for (const d of effectiveDrivers) {
            if (!targetMatches(f.targets, d)) continue;
            const prev = paceMultipliers.get(d.id) || 1;
            paceMultipliers.set(d.id, Math.max(0.6, Math.min(1.5, prev * (1 + f.magnitude * 0.12))));
          }
        }

        // Always use enhanced Web Worker for consistent performance and advanced features
        const worker = new Worker('/worker-enhanced.ts');
        const labels = effectiveDrivers.map(d => d.id);

        // Enhanced weighting with pace multipliers and standings
        const maxPts = Math.max(1, ...effectiveDrivers.map(d => d.standingsPoints ?? 0));
        let weights = effectiveDrivers.map(d => {
          const pts = d.standingsPoints ?? 0.5;
          const base = Math.max(0.1, pts / maxPts);
          const pace = paceMultipliers.get(d.id) || 1;
          return base * pace;
        });

        // Normalize weights
        const wmax = Math.max(...weights, 1);
        weights = weights.map(w => Math.max(0.05, w / wmax));
        const taxaAbandono = effectiveDrivers.map(d => d.dnfRate);

        // Enhanced context with all parameters
        const enhancedContext = {
          ...context,
          randomness: Math.max(0, Math.min(1, context.randomness + randomnessBump))
        };

        // Performance monitoring
        const startTime = performance.now();
        const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

        // Safety timeout with enhanced error handling
        const timeout = setTimeout(() => {
          try { worker.terminate(); } catch {}
          set({ isRunning: false, progress: null });
          console.warn('Enhanced simulation worker timed out');
        }, 60000); // Increased timeout for enhanced features

        ;(set as any)({ _workerRef: worker, _workerTimeout: timeout });

        try {
          // Send enhanced data to worker
          worker.postMessage({
            drivers: effectiveDrivers,
            context: enhancedContext,
            seed: Date.now() % 1000000 // Better seed generation
          });
        } catch (err) {
          clearTimeout(timeout);
          console.error('Failed to start enhanced simulation worker', err);
          set({ isRunning: false, progress: null });
          return;
        }

        worker.onmessage = (e) => {
          // Handle progress updates
          if (e.data && typeof e.data.progress === 'number') {
            set({ progress: e.data.progress });
            return;
          }

          // Handle errors
          if (e.data.type === 'error') {
            clearTimeout(timeout);
            console.error('Simulation worker error:', e.data.error);
            set({ isRunning: false, progress: null });
            return;
          }

          // Handle successful completion
          clearTimeout(timeout);
          const summary = e.data.result;

          // Add performance metrics
          const endTime = performance.now();
          const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

          const enhancedSummary = {
            ...summary,
            performanceMetrics: {
              ...summary.performanceMetrics,
              totalExecutionTime: endTime - startTime,
              totalMemoryUsage: endMemory - startMemory,
              uiThreadTime: (endTime - startTime) - summary.performanceMetrics.executionTime
            }
          };

          set(state => ({
            result: enhancedSummary,
            history: [enhancedSummary, ...state.history].slice(0, 10),
            isRunning: false,
            progress: null
          }));

          try { worker.terminate(); } catch {}
          ;(set as any)({ _workerRef: null, _workerTimeout: null });

          // Log performance metrics
          console.log('🚀 Simulation completed:', {
            runs: summary.runs,
            executionTime: `${summary.performanceMetrics.executionTime.toFixed(2)}ms`,
            simulationsPerSecond: `${summary.performanceMetrics.simulationsPerSecond.toFixed(0)} sim/s`,
            memoryUsage: `${(summary.performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
          });
        };

        worker.onerror = (error) => {
          clearTimeout(timeout);
          console.error('Worker error:', error);
          set({ isRunning: false, progress: null });
        };
      },
      reset: () =>
        set({
          drivers: createInitialDrivers(),
          context: DEFAULT_CONTEXT,
          result: null,
          history: [],
          isRunning: false,
          progress: null,
          variations: []
        })
    }),
    {
      name: "simulation-store-v2",
      partialize: state => ({
        drivers: state.drivers,
        context: state.context,
        result: state.result,
        history: state.history,
        autoTrackProfileLabel: state.autoTrackProfileLabel,
        autoTrackProfileAt: state.autoTrackProfileAt,
        nextRaceCircuit: state.nextRaceCircuit,
        nextRaceCountry: state.nextRaceCountry,
        nextRaceLocality: state.nextRaceLocality,
        variations: state.variations,
        variationsUpdatedAt: state.variationsUpdatedAt,
        variationsSource: state.variationsSource,
      })
    }
  )
);
