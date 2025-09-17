export type DriverMetrics = {
  id: string;
  name: string;
  code: string;
  team: string;
  country: string;
  number: number;
  gridPosition: number;
  qualyGapMs: number;
  longRunPaceDelta: number;
  straightlineIndex: number;
  corneringIndex: number;
  pitStopMedian: number;
  dnfRate: number;
  wetSkill: number;
  consistency: number;
  tyreManagement: number;
  aggression: number;
  experience: number;
  speedTrapKph: number;
  // Optional fields when loading from Ergast
  ergastId?: string;
  constructorId?: string;
  standingsPoints?: number;
  standingsWins?: number;
};

export const driverData: DriverMetrics[] = [
  {
    id: "ver",
    name: "Max Verstappen",
    code: "VER",
    team: "Red Bull Racing",
    country: "Netherlands",
    number: 1,
    gridPosition: 1,
    qualyGapMs: 0,
    longRunPaceDelta: -0.18,
    straightlineIndex: 92,
    corneringIndex: 96,
    pitStopMedian: 2.27,
    dnfRate: 0.02,
    wetSkill: 0.95,
    consistency: 0.97,
    tyreManagement: 0.9,
    aggression: 0.68,
    experience: 0.83,
    speedTrapKph: 342
  },
  {
    id: "nor",
    name: "Lando Norris",
    code: "NOR",
    team: "McLaren",
    country: "United Kingdom",
    number: 4,
    gridPosition: 2,
    qualyGapMs: 0.065,
    longRunPaceDelta: -0.05,
    straightlineIndex: 88,
    corneringIndex: 92,
    pitStopMedian: 2.36,
    dnfRate: 0.03,
    wetSkill: 0.86,
    consistency: 0.9,
    tyreManagement: 0.82,
    aggression: 0.62,
    experience: 0.62,
    speedTrapKph: 340
  },
  {
    id: "lec",
    name: "Charles Leclerc",
    code: "LEC",
    team: "Ferrari",
    country: "Monaco",
    number: 16,
    gridPosition: 3,
    qualyGapMs: 0.08,
    longRunPaceDelta: 0.02,
    straightlineIndex: 86,
    corneringIndex: 94,
    pitStopMedian: 2.38,
    dnfRate: 0.04,
    wetSkill: 0.82,
    consistency: 0.86,
    tyreManagement: 0.78,
    aggression: 0.7,
    experience: 0.7,
    speedTrapKph: 339
  },
  {
    id: "sai",
    name: "Carlos Sainz",
    code: "SAI",
    team: "Ferrari",
    country: "Spain",
    number: 55,
    gridPosition: 4,
    qualyGapMs: 0.11,
    longRunPaceDelta: 0.04,
    straightlineIndex: 84,
    corneringIndex: 90,
    pitStopMedian: 2.35,
    dnfRate: 0.05,
    wetSkill: 0.78,
    consistency: 0.88,
    tyreManagement: 0.81,
    aggression: 0.64,
    experience: 0.78,
    speedTrapKph: 337
  },
  {
    id: "ham",
    name: "Lewis Hamilton",
    code: "HAM",
    team: "Mercedes",
    country: "United Kingdom",
    number: 44,
    gridPosition: 5,
    qualyGapMs: 0.12,
    longRunPaceDelta: 0.07,
    straightlineIndex: 82,
    corneringIndex: 91,
    pitStopMedian: 2.39,
    dnfRate: 0.03,
    wetSkill: 0.94,
    consistency: 0.93,
    tyreManagement: 0.83,
    aggression: 0.58,
    experience: 0.97,
    speedTrapKph: 336
  },
  {
    id: "rus",
    name: "George Russell",
    code: "RUS",
    team: "Mercedes",
    country: "United Kingdom",
    number: 63,
    gridPosition: 6,
    qualyGapMs: 0.14,
    longRunPaceDelta: 0.09,
    straightlineIndex: 83,
    corneringIndex: 89,
    pitStopMedian: 2.33,
    dnfRate: 0.04,
    wetSkill: 0.82,
    consistency: 0.87,
    tyreManagement: 0.79,
    aggression: 0.66,
    experience: 0.68,
    speedTrapKph: 336
  },
  {
    id: "pia",
    name: "Oscar Piastri",
    code: "PIA",
    team: "McLaren",
    country: "Australia",
    number: 81,
    gridPosition: 7,
    qualyGapMs: 0.16,
    longRunPaceDelta: 0.1,
    straightlineIndex: 87,
    corneringIndex: 88,
    pitStopMedian: 2.37,
    dnfRate: 0.06,
    wetSkill: 0.77,
    consistency: 0.82,
    tyreManagement: 0.76,
    aggression: 0.69,
    experience: 0.45,
    speedTrapKph: 339
  },
  {
    id: "per",
    name: "Sergio Pérez",
    code: "PER",
    team: "Red Bull Racing",
    country: "Mexico",
    number: 11,
    gridPosition: 8,
    qualyGapMs: 0.18,
    longRunPaceDelta: 0.08,
    straightlineIndex: 90,
    corneringIndex: 85,
    pitStopMedian: 2.28,
    dnfRate: 0.05,
    wetSkill: 0.74,
    consistency: 0.8,
    tyreManagement: 0.79,
    aggression: 0.54,
    experience: 0.88,
    speedTrapKph: 341
  },
  {
    id: "alo",
    name: "Fernando Alonso",
    code: "ALO",
    team: "Aston Martin",
    country: "Spain",
    number: 14,
    gridPosition: 9,
    qualyGapMs: 0.2,
    longRunPaceDelta: 0.11,
    straightlineIndex: 83,
    corneringIndex: 87,
    pitStopMedian: 2.4,
    dnfRate: 0.04,
    wetSkill: 0.9,
    consistency: 0.91,
    tyreManagement: 0.85,
    aggression: 0.6,
    experience: 0.99,
    speedTrapKph: 334
  },
  {
    id: "oco",
    name: "Esteban Ocon",
    code: "OCO",
    team: "Alpine",
    country: "France",
    number: 31,
    gridPosition: 10,
    qualyGapMs: 0.22,
    longRunPaceDelta: 0.15,
    straightlineIndex: 79,
    corneringIndex: 83,
    pitStopMedian: 2.41,
    dnfRate: 0.07,
    wetSkill: 0.76,
    consistency: 0.78,
    tyreManagement: 0.74,
    aggression: 0.58,
    experience: 0.72,
    speedTrapKph: 333
  },
  {
    id: "gas",
    name: "Pierre Gasly",
    code: "GAS",
    team: "Alpine",
    country: "France",
    number: 10,
    gridPosition: 11,
    qualyGapMs: 0.25,
    longRunPaceDelta: 0.17,
    straightlineIndex: 78,
    corneringIndex: 82,
    pitStopMedian: 2.42,
    dnfRate: 0.08,
    wetSkill: 0.75,
    consistency: 0.76,
    tyreManagement: 0.73,
    aggression: 0.62,
    experience: 0.74,
    speedTrapKph: 332
  },
  {
    id: "hul",
    name: "Nico Hülkenberg",
    code: "HUL",
    team: "Haas",
    country: "Germany",
    number: 27,
    gridPosition: 12,
    qualyGapMs: 0.27,
    longRunPaceDelta: 0.2,
    straightlineIndex: 80,
    corneringIndex: 80,
    pitStopMedian: 2.45,
    dnfRate: 0.06,
    wetSkill: 0.72,
    consistency: 0.74,
    tyreManagement: 0.7,
    aggression: 0.6,
    experience: 0.85,
    speedTrapKph: 332
  }
];

// Function to load drivers from ETL CSV output
export async function loadDriversFromCSV(url: string): Promise<DriverMetrics[]> {
  const response = await fetch(url);
  const csvText = await response.text();
  return parseDriversFromCSV(csvText);
}

export function parseDriversFromCSV(csvText: string): DriverMetrics[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV vazio ou sem linhas de dados');
  }
  const headers = lines[0].split(',').map(h => h.trim());
  const required = [
    'driver_name','team_name','grid_position','qualy_gap_ms','fp_longrun_pace_s',
    'straightline_index','cornering_index','pit_crew_mean_s','dnf_rate','speed_trap_kph'
  ];
  const missing = required.filter(h => !headers.includes(h));
  if (missing.length) {
    throw new Error(`Cabeçalhos em falta no CSV: ${missing.join(', ')}`);
  }
  const dataLines = lines.slice(1);
  return dataLines.map((line, rowIdx) => {
    const values = line.split(',').map(v => v.trim());
    const obj: any = {};
    headers.forEach((header, i) => {
      obj[header] = values[i];
    });
    const name = obj.driver_name || '';
    if (!name) {
      throw new Error(`Nome do piloto vazio na linha ${rowIdx + 2}`);
    }
    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      code: name.split(' ').pop()?.toUpperCase().slice(0, 3) || 'UNK',
      team: obj.team_name || '',
      country: '',
      number: 0,
      gridPosition: Number.parseInt(obj.grid_position) || 0,
      qualyGapMs: Number.parseFloat(obj.qualy_gap_ms) || 0,
      longRunPaceDelta: Number.parseFloat(obj.fp_longrun_pace_s) || 0,
      straightlineIndex: Number.parseInt(obj.straightline_index) || 0,
      corneringIndex: Number.parseInt(obj.cornering_index) || 0,
      pitStopMedian: Number.parseFloat(obj.pit_crew_mean_s) || 0,
      dnfRate: Number.parseFloat(obj.dnf_rate) || 0,
      wetSkill: 0.8,
      consistency: 0.8,
      tyreManagement: 0.8,
      aggression: 0.6,
      experience: 0.5,
      speedTrapKph: Number.parseInt(obj.speed_trap_kph) || 0
    } as DriverMetrics;
  });
}
