import type { DriverConfig, DriverPerkState } from "../stores/simulationStore";

export type DriverPerkImpact = DriverPerkState & { contribution: number };

export type DriverSimulationResult = {
  driverId: string;
  name: string;
  team: string;
  baseScore: number;
  perkScore: number;
  totalScore: number;
  perkBreakdown: DriverPerkImpact[];
};

export type DriverSimulationStanding = DriverSimulationResult & {
  position: number;
};

const calculateContribution = (perk: DriverPerkState) =>
  (perk.type === "weakness" ? -1 : 1) * perk.weight;

export const calculateDriverScore = (driver: DriverConfig): DriverSimulationResult => {
  const perkBreakdown: DriverPerkImpact[] = driver.perks.map((perk) => ({
    ...perk,
    contribution: perk.enabled ? calculateContribution(perk) : 0,
  }));

  const perkScore = perkBreakdown.reduce((acc, perk) => acc + perk.contribution, 0);
  const totalScore = driver.baseScore + perkScore;

  return {
    driverId: driver.id,
    name: driver.name,
    team: driver.team,
    baseScore: Number(driver.baseScore.toFixed(3)),
    perkScore: Number(perkScore.toFixed(3)),
    totalScore: Number(totalScore.toFixed(3)),
    perkBreakdown,
  };
};

export const simulateGrid = (drivers: DriverConfig[]): DriverSimulationStanding[] =>
  drivers
    .map(calculateDriverScore)
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((result, index) => ({ ...result, position: index + 1 }));
