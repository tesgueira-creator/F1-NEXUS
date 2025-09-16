export type WeatherCondition = "sunny" | "overcast" | "light-rain" | "heavy-rain";

export interface RaceConfiguration {
  track: string;
  laps: number;
  weather: WeatherCondition;
  temperature: number;
  safetyCarProbability: number;
}

export interface DriverStats {
  qualifying: number;
  race: number;
  tireManagement: number;
  wetSkill: number;
  consistency: number;
  aggression: number;
}

export type DriverStatKey = keyof DriverStats;

export interface DriverPerkDefinition {
  key: string;
  label: string;
  description: string;
  appliesTo: DriverStatKey;
  modifier: number;
}

export interface DriverProfile {
  id: string;
  name: string;
  team: string;
  stats: DriverStats;
  strengths: DriverPerkDefinition[];
  weaknesses: DriverPerkDefinition[];
}

export interface SimulationDriverSetup {
  profile: DriverProfile;
  strengthsEnabled: string[];
  weaknessesEnabled: string[];
}

export interface LapTimeEntry {
  driverId: string;
  name: string;
  time: number;
}

export interface LapStanding {
  driverId: string;
  name: string;
  team: string;
  position: number;
  gapToLeader: number | null;
}

export interface SimulationLap {
  lap: number;
  order: LapStanding[];
  lapTimes: LapTimeEntry[];
  events: string[];
}

export interface FinishingOrderEntry extends LapStanding {
  status: string;
  totalTime: number | null;
  points: number;
}

export interface SimulationResultSummary {
  finishingOrder: FinishingOrderEntry[];
  fastestLap: {
    driverId: string;
    name: string;
    lap: number;
    time: number;
  } | null;
  retirements: Array<{ driverId: string; name: string; lap: number }>;
}

export interface SimulationOutput {
  laps: SimulationLap[];
  result: SimulationResultSummary;
  meta: {
    seed: number;
    totalLaps: number;
    completedLaps: number;
    track: string;
    weather: WeatherCondition;
  };
}

export interface SimulationOptions {
  randomSeed?: number;
  signal?: AbortSignal;
  onLapComplete?: (lap: SimulationLap) => void;
}

export interface SimulationContext {
  configuration: RaceConfiguration;
  drivers: SimulationDriverSetup[];
}

const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

export const defaultRaceConfiguration: RaceConfiguration = {
  track: "Interlagos",
  laps: 71,
  weather: "sunny",
  temperature: 28,
  safetyCarProbability: 0.18,
};

export const defaultDriverProfiles: DriverProfile[] = [
  {
    id: "max-verstappen",
    name: "Max Verstappen",
    team: "Red Bull Racing",
    stats: {
      qualifying: 97,
      race: 98,
      tireManagement: 95,
      wetSkill: 96,
      consistency: 97,
      aggression: 85,
    },
    strengths: [
      {
        key: "max-qualifying-domination",
        label: "Domínio em Qualy",
        description: "Atinge voltas excepcionais em classificação.",
        appliesTo: "qualifying",
        modifier: 6,
      },
      {
        key: "max-race-pace",
        label: "Ritmo Implacável",
        description: "Mantém ritmo de corrida muito acima da média.",
        appliesTo: "race",
        modifier: 5,
      },
    ],
    weaknesses: [
      {
        key: "max-tire-spike",
        label: "Uso agressivo de pneus",
        description: "Pode degradar pneus em stints muito longos.",
        appliesTo: "tireManagement",
        modifier: -5,
      },
    ],
  },
  {
    id: "sergio-perez",
    name: "Sergio Pérez",
    team: "Red Bull Racing",
    stats: {
      qualifying: 86,
      race: 90,
      tireManagement: 94,
      wetSkill: 78,
      consistency: 90,
      aggression: 70,
    },
    strengths: [
      {
        key: "perez-tire-whisperer",
        label: "Gestor de Pneus",
        description: "Cuida dos pneus como poucos, ideal para estratégias longas.",
        appliesTo: "tireManagement",
        modifier: 6,
      },
      {
        key: "perez-safety-calm",
        label: "Calma em Safety Car",
        description: "Mantém a concentração em relargadas caóticas.",
        appliesTo: "consistency",
        modifier: 4,
      },
    ],
    weaknesses: [
      {
        key: "perez-qualy-variability",
        label: "Inconstância em Qualy",
        description: "Tem dificuldade em aquecer pneus em uma volta só.",
        appliesTo: "qualifying",
        modifier: -6,
      },
      {
        key: "perez-wet-struggle",
        label: "Dificuldade na chuva",
        description: "Perde confiança em condições muito molhadas.",
        appliesTo: "wetSkill",
        modifier: -5,
      },
    ],
  },
  {
    id: "charles-leclerc",
    name: "Charles Leclerc",
    team: "Scuderia Ferrari",
    stats: {
      qualifying: 94,
      race: 90,
      tireManagement: 84,
      wetSkill: 82,
      consistency: 86,
      aggression: 88,
    },
    strengths: [
      {
        key: "leclerc-pole-threat",
        label: "Homem da Pole",
        description: "Explosivo em voltas rápidas, especialmente em circuitos de alta aderência.",
        appliesTo: "qualifying",
        modifier: 5,
      },
      {
        key: "leclerc-turn-in",
        label: "Entrada de curva afiada",
        description: "Ganha tempo precioso nas curvas de média velocidade.",
        appliesTo: "race",
        modifier: 3,
      },
    ],
    weaknesses: [
      {
        key: "leclerc-pressure-errors",
        label: "Erros sob pressão",
        description: "A consistência cai quando lidera com pressão intensa.",
        appliesTo: "consistency",
        modifier: -6,
      },
    ],
  },
  {
    id: "carlos-sainz",
    name: "Carlos Sainz",
    team: "Scuderia Ferrari",
    stats: {
      qualifying: 90,
      race: 89,
      tireManagement: 88,
      wetSkill: 80,
      consistency: 92,
      aggression: 78,
    },
    strengths: [
      {
        key: "sainz-strategist",
        label: "Estratéga Nato",
        description: "Executa planos alternativos com precisão.",
        appliesTo: "consistency",
        modifier: 4,
      },
      {
        key: "sainz-tyre-care",
        label: "Cuidado com pneus",
        description: "Gerencia desgaste ao longo de stints longos.",
        appliesTo: "tireManagement",
        modifier: 3,
      },
    ],
    weaknesses: [
      {
        key: "sainz-wet-confidence",
        label: "Confiança limitada na chuva",
        description: "Prefere condições secas para extrair o máximo.",
        appliesTo: "wetSkill",
        modifier: -5,
      },
    ],
  },
  {
    id: "lewis-hamilton",
    name: "Lewis Hamilton",
    team: "Mercedes-AMG",
    stats: {
      qualifying: 91,
      race: 92,
      tireManagement: 90,
      wetSkill: 95,
      consistency: 94,
      aggression: 82,
    },
    strengths: [
      {
        key: "hamilton-wet-master",
        label: "Maestro da Chuva",
        description: "Domina condições molhadas e pistas com baixa aderência.",
        appliesTo: "wetSkill",
        modifier: 6,
      },
      {
        key: "hamilton-racecraft",
        label: "Gestão impecável",
        description: "Leitura de corrida e ritmo muito consistentes.",
        appliesTo: "race",
        modifier: 4,
      },
    ],
    weaknesses: [
      {
        key: "hamilton-start-pickle",
        label: "Largadas médias",
        description: "Nem sempre acerta a reação perfeita na luz verde.",
        appliesTo: "aggression",
        modifier: -4,
      },
    ],
  },
  {
    id: "george-russell",
    name: "George Russell",
    team: "Mercedes-AMG",
    stats: {
      qualifying: 89,
      race: 88,
      tireManagement: 86,
      wetSkill: 84,
      consistency: 88,
      aggression: 84,
    },
    strengths: [
      {
        key: "russell-qualy-focus",
        label: "Concentração em volta rápida",
        description: "Extrai mais uma dezena no momento decisivo.",
        appliesTo: "qualifying",
        modifier: 3,
      },
      {
        key: "russell-consistency",
        label: "Constância",
        description: "Raramente comete erros em ritmo de corrida.",
        appliesTo: "consistency",
        modifier: 3,
      },
    ],
    weaknesses: [
      {
        key: "russell-tyre-nursing",
        label: "Agressivo com pneus",
        description: "Pode degradar mais que o companheiro.",
        appliesTo: "tireManagement",
        modifier: -4,
      },
    ],
  },
  {
    id: "lando-norris",
    name: "Lando Norris",
    team: "McLaren",
    stats: {
      qualifying: 90,
      race: 91,
      tireManagement: 87,
      wetSkill: 88,
      consistency: 89,
      aggression: 85,
    },
    strengths: [
      {
        key: "norris-qualy-punch",
        label: "Explosão em qualy",
        description: "Entrega voltas muito fortes em circuitos de alta aderência.",
        appliesTo: "qualifying",
        modifier: 4,
      },
      {
        key: "norris-wet-touch",
        label: "Sensibilidade na chuva",
        description: "Adapta rapidamente o equilíbrio em pisos molhados.",
        appliesTo: "wetSkill",
        modifier: 4,
      },
    ],
    weaknesses: [
      {
        key: "norris-start-pressure",
        label: "Pressão nas largadas",
        description: "Arrancadas podem ser conservadoras demais.",
        appliesTo: "aggression",
        modifier: -3,
      },
    ],
  },
  {
    id: "oscar-piastri",
    name: "Oscar Piastri",
    team: "McLaren",
    stats: {
      qualifying: 88,
      race: 87,
      tireManagement: 85,
      wetSkill: 82,
      consistency: 84,
      aggression: 80,
    },
    strengths: [
      {
        key: "piastri-qualy-flow",
        label: "Fluidez em qualy",
        description: "Mantém velocidade mesmo em sequências de curvas técnicas.",
        appliesTo: "qualifying",
        modifier: 3,
      },
      {
        key: "piastri-composure",
        label: "Cabeça fria",
        description: "Mantém consistência mesmo quando perseguido.",
        appliesTo: "consistency",
        modifier: 3,
      },
    ],
    weaknesses: [
      {
        key: "piastri-tyre-learning",
        label: "Gestão de pneus em evolução",
        description: "Ainda aprende a lidar com graining em stints longos.",
        appliesTo: "tireManagement",
        modifier: -4,
      },
    ],
  },
  {
    id: "fernando-alonso",
    name: "Fernando Alonso",
    team: "Aston Martin",
    stats: {
      qualifying: 87,
      race: 90,
      tireManagement: 89,
      wetSkill: 92,
      consistency: 93,
      aggression: 86,
    },
    strengths: [
      {
        key: "alonso-racecraft",
        label: "Astúcia em corrida",
        description: "Sempre encontra ritmo quando importa.",
        appliesTo: "race",
        modifier: 5,
      },
      {
        key: "alonso-wet-feel",
        label: "Sensibilidade em pista molhada",
        description: "Explora limites mesmo na chuva forte.",
        appliesTo: "wetSkill",
        modifier: 4,
      },
    ],
    weaknesses: [
      {
        key: "alonso-qualy-ceiling",
        label: "Limite em qualy",
        description: "Pode faltar uma fração de aderência no momento decisivo.",
        appliesTo: "qualifying",
        modifier: -3,
      },
    ],
  },
  {
    id: "esteban-ocon",
    name: "Esteban Ocon",
    team: "Alpine",
    stats: {
      qualifying: 84,
      race: 85,
      tireManagement: 83,
      wetSkill: 85,
      consistency: 86,
      aggression: 82,
    },
    strengths: [
      {
        key: "ocon-defensive",
        label: "Defesa sólida",
        description: "Mantém consistência quando pressionado.",
        appliesTo: "consistency",
        modifier: 3,
      },
      {
        key: "ocon-wet-confidence",
        label: "Confiança na chuva",
        description: "Bom controle em piso úmido.",
        appliesTo: "wetSkill",
        modifier: 3,
      },
    ],
    weaknesses: [
      {
        key: "ocon-tyre-peaks",
        label: "Degradação imprevisível",
        description: "Pode superaquecer pneus traseiros em ritmo forte.",
        appliesTo: "tireManagement",
        modifier: -4,
      },
    ],
  },
];

interface DriverState {
  id: string;
  name: string;
  team: string;
  stats: DriverStats;
  totalTime: number;
  hasRetired: boolean;
  retirementLap?: number;
  lastLapTime: number;
  gridPosition: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createRandom(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function applyPerks(stats: DriverStats, profile: DriverProfile, strengths: string[], weaknesses: string[]): DriverStats {
  const adjusted: DriverStats = { ...stats };

  for (const key of strengths) {
    const perk = profile.strengths.find((p) => p.key === key);
    if (!perk) continue;
    const current = adjusted[perk.appliesTo];
    adjusted[perk.appliesTo] = clamp(current + perk.modifier, 40, 110);
  }

  for (const key of weaknesses) {
    const perk = profile.weaknesses.find((p) => p.key === key);
    if (!perk) continue;
    const current = adjusted[perk.appliesTo];
    adjusted[perk.appliesTo] = clamp(current + perk.modifier, 40, 110);
  }

  return adjusted;
}

function computeBaseLapTime(configuration: RaceConfiguration) {
  const base = 83 + configuration.laps * 0.15;
  const weatherPenalty =
    configuration.weather === "sunny"
      ? 0
      : configuration.weather === "overcast"
        ? 0.4
        : configuration.weather === "light-rain"
          ? 1.9
          : 3.8;
  return base + weatherPenalty;
}

function weatherReliabilityFactor(weather: WeatherCondition) {
  switch (weather) {
    case "sunny":
      return 1;
    case "overcast":
      return 1.05;
    case "light-rain":
      return 1.1;
    case "heavy-rain":
      return 1.25;
  }
}

function computeWeatherPerformance(stats: DriverStats, weather: WeatherCondition) {
  const wetOffset = stats.wetSkill - 80;
  switch (weather) {
    case "sunny":
      return 0;
    case "overcast":
      return wetOffset * 0.05;
    case "light-rain":
      return wetOffset * 0.12;
    case "heavy-rain":
      return wetOffset * 0.2;
  }
}

export async function simulateRace(
  context: SimulationContext,
  options: SimulationOptions = {}
): Promise<SimulationOutput> {
  const { configuration } = context;
  const seed = options.randomSeed ?? Math.floor(Math.random() * 1_000_000_000);
  const random = createRandom(seed);

  const driverStates: DriverState[] = context.drivers.map((driver) => ({
    id: driver.profile.id,
    name: driver.profile.name,
    team: driver.profile.team,
    stats: applyPerks(driver.profile.stats, driver.profile, driver.strengthsEnabled, driver.weaknessesEnabled),
    totalTime: 0,
    hasRetired: false,
    retirementLap: undefined,
    lastLapTime: 0,
    gridPosition: 0,
  }));

  if (driverStates.length === 0) {
    throw new Error("Nenhum piloto selecionado para simulação.");
  }

  const baseLap = computeBaseLapTime(configuration);
  const weatherBonus = driverStates.map((state) => computeWeatherPerformance(state.stats, configuration.weather));

  const qualifyingOrder = driverStates
    .map((state, index) => ({
      state,
      score:
        state.stats.qualifying * 1.15 +
        state.stats.race * 0.35 +
        state.stats.consistency * 0.2 +
        (random() - 0.5) * 6 +
        index * 0.01,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => {
      entry.state.gridPosition = index + 1;
      return entry.state;
    });

  let previousOrder = qualifyingOrder.map((state) => state.id);

  const laps: SimulationLap[] = [];
  let fastestLap: SimulationResultSummary["fastestLap"] = null;
  const retirements: Array<{ driverId: string; name: string; lap: number }> = [];

  let safetyCarActive = false;
  let safetyCarCountdown = 0;

  for (let lap = 1; lap <= configuration.laps; lap++) {
    if (options.signal?.aborted) {
      throw new Error("Simulation cancelled");
    }

    await new Promise((resolve) => setTimeout(resolve, 0));

    const lapEvents: string[] = [];
    const lapTimes: LapTimeEntry[] = [];

    if (!safetyCarActive) {
      const triggerThreshold = configuration.safetyCarProbability / Math.max(6, configuration.laps);
      if (random() < triggerThreshold) {
        safetyCarActive = true;
        safetyCarCountdown = 1 + Math.floor(random() * 2);
        lapEvents.push("Safety car em pista após incidente.");
      }
    } else {
      safetyCarCountdown -= 1;
      if (safetyCarCountdown <= 0) {
        safetyCarActive = false;
        lapEvents.push("Safety car recolhe aos boxes.");
      }
    }

    const effectiveBaseLap = baseLap + (safetyCarActive ? 7 : 0);
    const temperatureWear = Math.max(0, configuration.temperature - 30) * 0.02;

    for (let index = 0; index < driverStates.length; index++) {
      const state = driverStates[index];
      if (state.hasRetired) {
        continue;
      }

      const reliabilityBase = (100 - state.stats.consistency) / 6200;
      const failureChance = reliabilityBase * weatherReliabilityFactor(configuration.weather);
      if (random() < failureChance) {
        state.hasRetired = true;
        state.retirementLap = lap;
        retirements.push({ driverId: state.id, name: state.name, lap });
        lapEvents.push(`${state.name} abandona na volta ${lap}.`);
        continue;
      }

      const tyreWearLap = Math.max(0, lap - configuration.laps * 0.55);
      const tyrePenalty = tyreWearLap * (1 - state.stats.tireManagement / 105) * 0.18 + temperatureWear;
      const aggressionInfluence = (state.stats.aggression - 75) * 0.02;
      const weatherEffect = weatherBonus[index];
      const basePerformance =
        state.stats.race * 0.92 +
        state.stats.tireManagement * 0.3 +
        state.stats.consistency * 0.22 +
        weatherEffect;
      const randomVariance = (random() - 0.5) * 1.7;

      const lapTime = Math.max(
        effectiveBaseLap - basePerformance * 0.08 - aggressionInfluence + tyrePenalty + randomVariance,
        effectiveBaseLap * 0.6
      );

      state.totalTime += lapTime;
      state.lastLapTime = lapTime;

      const roundedTime = Number(lapTime.toFixed(3));
      lapTimes.push({ driverId: state.id, name: state.name, time: roundedTime });

      if (!fastestLap || lapTime < fastestLap.time) {
        fastestLap = { driverId: state.id, name: state.name, lap, time: roundedTime };
      }
    }

    const orderedStates = driverStates
      .slice()
      .sort((a, b) => {
        if (a.hasRetired && b.hasRetired) {
          return (a.retirementLap ?? Infinity) - (b.retirementLap ?? Infinity);
        }
        if (a.hasRetired) return 1;
        if (b.hasRetired) return -1;
        return a.totalTime - b.totalTime;
      });

    const leader = orderedStates.find((state) => !state.hasRetired);
    const leaderTime = leader?.totalTime ?? 0;

    const order: LapStanding[] = orderedStates.map((state, index) => ({
      driverId: state.id,
      name: state.name,
      team: state.team,
      position: index + 1,
      gapToLeader: state.hasRetired ? null : Number((state.totalTime - leaderTime).toFixed(3)),
    }));

    if (lap > 1) {
      for (const entry of order) {
        const previousIndex = previousOrder.indexOf(entry.driverId);
        if (previousIndex !== -1 && previousIndex + 1 > entry.position) {
          const positionsGained = previousIndex + 1 - entry.position;
          lapEvents.push(
            `${entry.name} ganha ${positionsGained} posição${positionsGained > 1 ? "s" : ""}.`
          );
        }
      }
    }

    previousOrder = order.map((entry) => entry.driverId);
    lapTimes.sort((a, b) => a.time - b.time);

    const lapSnapshot: SimulationLap = {
      lap,
      order,
      lapTimes,
      events: lapEvents,
    };

    laps.push(lapSnapshot);
    options.onLapComplete?.(lapSnapshot);

    if (options.signal?.aborted) {
      throw new Error("Simulation cancelled");
    }
  }

  const orderedStates = driverStates
    .slice()
    .sort((a, b) => {
      if (a.hasRetired && b.hasRetired) {
        return (a.retirementLap ?? Infinity) - (b.retirementLap ?? Infinity);
      }
      if (a.hasRetired) return 1;
      if (b.hasRetired) return -1;
      return a.totalTime - b.totalTime;
    });

  const winner = orderedStates.find((state) => !state.hasRetired);
  const winnerTime = winner?.totalTime ?? 0;

  const finishingOrder: FinishingOrderEntry[] = orderedStates.map((state, index) => {
    const finished = !state.hasRetired;
    const totalTime = finished ? Number(state.totalTime.toFixed(3)) : null;
    const gap = !finished || index === 0 ? null : Number((state.totalTime - winnerTime).toFixed(3));
    return {
      driverId: state.id,
      name: state.name,
      team: state.team,
      position: index + 1,
      gapToLeader: gap,
      status: finished
        ? index === 0
          ? "Vencedor"
          : "Terminou"
        : `Abandonou (Volta ${state.retirementLap ?? configuration.laps})`,
      totalTime,
      points: finished && index < pointsTable.length ? pointsTable[index] : 0,
    };
  });

  const summary: SimulationResultSummary = {
    finishingOrder,
    fastestLap,
    retirements,
  };

  return {
    laps,
    result: summary,
    meta: {
      seed,
      totalLaps: configuration.laps,
      completedLaps: laps.length,
      track: configuration.track,
      weather: configuration.weather,
    },
  };
}

export function findDriverProfile(id: string): DriverProfile | undefined {
  return defaultDriverProfiles.find((driver) => driver.id === id);
}
