import {
  F1_2026_DRIVERS,
  F1_2026_TEAMS,
  F1_2026_CALENDAR,
  F1_2026_STANDINGS,
  F1_2026_TEAM_STANDINGS,
  F1_2026_RACE_RESULTS,
} from "@/datasets/f1-2026-data";

export { F1_2026_DRIVERS, F1_2026_TEAMS, F1_2026_CALENDAR, F1_2026_STANDINGS, F1_2026_TEAM_STANDINGS, F1_2026_RACE_RESULTS };

export type Driver = {
  id: string;
  number: number;
  code: string;
  name: string;
  team: string;
  teamShort: string;
  color: string;
  points: number;
  form: number;
  tireDeg: number;
  consistency: number;
  nationality: string;
  podiums: number;
  wins: number;
  fastestLaps: number;
  poles: number;
  dnf: number;
  age: number;
  debut: number;
};

const TEAM_COLORS: Record<string, string> = {
  "McLaren": "#ff8700",
  "Ferrari": "#e80020",
  "Mercedes": "#27f4d2",
  "Red Bull Racing": "#3671c6",
  "Aston Martin": "#229971",
  "Alpine": "#ff87bc",
  "Williams": "#6412ff",
  "RB": "#6e0000",
  "Haas F1 Team": "#b9b9b9",
  "Audi": "#52e252",
  "Cadillac": "#000e2e",
};

const TEAM_SHORT: Record<string, string> = {
  "McLaren": "MCL",
  "Ferrari": "FER",
  "Mercedes": "MER",
  "Red Bull Racing": "RBR",
  "Aston Martin": "AMR",
  "Alpine": "ALP",
  "Williams": "WIL",
  "RB": "RB",
  "Haas F1 Team": "HAS",
  "Audi": "AUD",
  "Cadillac": "CAD",
};

const AGES: Record<string, number> = {
  "Lando Norris": 25,
  "Oscar Piastri": 24,
  "Charles Leclerc": 28,
  "Lewis Hamilton": 41,
  "George Russell": 27,
  "Andrea Kimi Antonelli": 18,
  "Max Verstappen": 28,
  "Isack Hadjar": 21,
  "Fernando Alonso": 44,
  "Lance Stroll": 31,
  "Pierre Gasly": 29,
  "Franco Colapinto": 22,
  "Alexander Albon": 29,
  "Carlos Sainz": 30,
  "Liam Lawson": 23,
  "Arvid Lindblad": 18,
  "Esteban Ocon": 28,
  "Oliver Bearman": 20,
  "Nico Hulkenberg": 37,
  "Gabriel Bortoleto": 21,
  "Valtteri Bottas": 35,
  "Sergio Perez": 35,
};

const NATIONALITIES: Record<string, string> = {
  "Lando Norris": "British",
  "Oscar Piastri": "Australian",
  "Charles Leclerc": "Monegasque",
  "Lewis Hamilton": "British",
  "George Russell": "British",
  "Andrea Kimi Antonelli": "Italian",
  "Max Verstappen": "Dutch",
  "Isack Hadjar": "French",
  "Fernando Alonso": "Spanish",
  "Lance Stroll": "Canadian",
  "Pierre Gasly": "French",
  "Franco Colapinto": "Argentine",
  "Alexander Albon": "Thai-British",
  "Carlos Sainz": "Spanish",
  "Liam Lawson": "New Zealander",
  "Arvid Lindblad": "Swedish",
  "Esteban Ocon": "French",
  "Oliver Bearman": "British",
  "Nico Hulkenberg": "German",
  "Gabriel Bortoleto": "Brazilian",
  "Valtteri Bottas": "Finnish",
  "Sergio Perez": "Mexican",
};

export const drivers: Driver[] = F1_2026_DRIVERS.map((d, i) => {
  const standing = F1_2026_STANDINGS.find((s) => s.driver === d.full_name);
  const color = TEAM_COLORS[d.team_name] ?? "#888888";
  const form = standing ? Math.min(99, Math.max(50, 85 - standing.position * 3 + Math.round(Math.random() * 10))) : 75 + Math.round(Math.random() * 15);
  return {
    id: String(d.driver_number),
    number: d.driver_number,
    code: d.code ?? d.last_name.slice(0, 3).toUpperCase() ?? "UNK",
    name: d.full_name,
    team: d.team_name,
    teamShort: TEAM_SHORT[d.team_name] ?? d.team_name.slice(0, 3).toUpperCase(),
    color,
    points: standing?.points ?? 0,
    form,
    tireDeg: standing ? 0.10 + (standing.dnf * 0.03) + Math.random() * 0.08 : 0.16,
    consistency: standing ? Math.max(72, 92 - standing.dnf * 5 - standing.position * 1.5) : 85,
    nationality: NATIONALITIES[d.full_name] ?? "Unknown",
    podiums: standing?.podiums ?? 0,
    wins: standing?.wins ?? 0,
    fastestLaps: standing?.fastestLaps ?? 0,
    poles: standing?.poles ?? 0,
    dnf: standing?.dnf ?? 0,
    age: AGES[d.full_name] ?? 27,
    debut: 2026,
  };
});

export const teams = F1_2026_TEAMS;

export const leaderboard = drivers
  .map((d, i) => ({
    ...d,
    position: i + 1,
    gap: i === 0 ? "Leader" : `+${((i * 2.438 + 0.612) * (Math.random() * 0.3 + 0.85)).toFixed(3)}`,
  }))
  .sort((a, b) => b.points - a.points)
  .map((d, i) => ({ ...d, position: i + 1 }));

export const winProbability = drivers
  .sort((a, b) => b.points - a.points)
  .slice(0, 6)
  .map((driver, i) => {
    const probs = [28, 24, 18, 14, 10, 6];
    return { name: driver.code, probability: probs[i], fill: driver.color };
  });

export const lapDeltas = Array.from({ length: 28 }, (_, lap) => ({
  lap: lap + 1,
  NOR: +(0.18 * Math.sin(lap / 3) + lap * 0.008).toFixed(3),
  VER: +(0.12 * Math.cos(lap / 3.4) + lap * 0.006).toFixed(3),
  LEC: +(0.16 * Math.sin(lap / 4.2) + lap * 0.011).toFixed(3),
  RUS: +(0.14 * Math.cos(lap / 5) + lap * 0.01).toFixed(3),
}));

export const sectorComparison = drivers.slice(0, 5).map((driver, index) => ({
  driver: driver.code,
  S1: +(18.4 + index * 0.12 + Math.sin(index) * 0.08).toFixed(3),
  S2: +(34.1 + index * 0.19 + Math.cos(index) * 0.12).toFixed(3),
  S3: +(20.8 + index * 0.1 + Math.sin(index / 2) * 0.06).toFixed(3),
}));

export const tireWear = Array.from({ length: 34 }, (_, lap) => ({
  lap: lap + 1,
  soft: Math.max(28, 100 - lap * 2.55 - Math.sin(lap) * 2),
  medium: Math.max(42, 100 - lap * 1.55 - Math.cos(lap / 2) * 1.5),
  hard: Math.max(55, 100 - lap * 0.92 - Math.sin(lap / 3)),
}));

export const raceSimulation = Array.from({ length: 58 }, (_, lap) => ({
  lap: lap + 1,
  baseline: +(72.4 + Math.sin(lap / 4) * 0.35 + lap * 0.028).toFixed(3),
  undercut: +(72.2 + Math.sin(lap / 4.4) * 0.3 + lap * 0.021 - (lap > 17 ? 0.52 : 0)).toFixed(3),
  overcut: +(72.3 + Math.cos(lap / 4.8) * 0.28 + lap * 0.024 - (lap > 22 ? 0.34 : 0)).toFixed(3),
}));

export const pitTimeline = [
  { lap: 15, driver: "LEC", compound: "Hard", risk: "Undercut +0.8s" },
  { lap: 18, driver: "NOR", compound: "Hard", risk: "Cover VER" },
  { lap: 20, driver: "VER", compound: "Medium", risk: "Overcut window" },
  { lap: 31, driver: "RUS", compound: "Soft", risk: "Fastest lap attempt" },
];

export const pitStopAnalysis = [
  { team: "McLaren", avg: 2.04, best: 1.89, variance: 0.07 },
  { team: "Ferrari", avg: 2.47, best: 2.21, variance: 0.18 },
  { team: "Mercedes", avg: 2.12, best: 1.95, variance: 0.11 },
  { team: "Red Bull Racing", avg: 2.13, best: 1.92, variance: 0.08 },
  { team: "Aston Martin", avg: 2.62, best: 2.31, variance: 0.22 },
];

export const teamTrends = [
  { race: "AUS", McLaren: 86, Ferrari: 82, Mercedes: 88, RedBull: 84, Aston: 63 },
  { race: "CHN", McLaren: 91, Ferrari: 79, Mercedes: 94, RedBull: 81, Aston: 67 },
  { race: "JPN", McLaren: 88, Ferrari: 81, Mercedes: 96, RedBull: 79, Aston: 71 },
  { race: "MIA", McLaren: 93, Ferrari: 84, Mercedes: 91, RedBull: 77, Aston: 73 },
  { race: "CAN", McLaren: 96, Ferrari: 88, Mercedes: 89, RedBull: 82, Aston: 75 },
];

export const championshipStandings = F1_2026_STANDINGS.map((s) => ({
  position: s.position,
  driver: s.driver,
  team: s.team,
  points: s.points,
  projected: s.points + Math.round((22 - s.position) * 12 * 0.7),
  wins: s.wins,
  podiums: s.podiums,
}));

export const weatherImpact = [
  { hour: "13:00", rain: 8, trackTemp: 42, wind: 13 },
  { hour: "14:00", rain: 14, trackTemp: 39, wind: 16 },
  { hour: "15:00", rain: 22, trackTemp: 36, wind: 19 },
  { hour: "16:00", rain: 34, trackTemp: 32, wind: 21 },
  { hour: "17:00", rain: 28, trackTemp: 31, wind: 18 },
];

export const predictionCards = [
  { label: "Champion", value: "Kimi Antonelli", probability: 52, detail: "Mercedes dominant form + 4 wins this season" },
  { label: "P2 Contender", value: "Lando Norris", probability: 28, detail: "McLaren pace competitive, 2 wins, needs consistency" },
  { label: "Podium Lock", value: "NOR / PIA / ANT", probability: 61, detail: "McLaren-Mercedes 1-2-3 battle shaping up" },
  { label: "Surprise Podium", value: "Oscar Piastri", probability: 34, detail: "1 win, 5 podiums, strong qualifying pace" },
  { label: "Dark Horse", value: "Max Verstappen", probability: 18, detail: "Red Bull improving, 7th but recovering" },
  { label: "Fastest Lap", value: "Kimi Antonelli", probability: 41, detail: "3 season fastest laps, dominant Mercedes straight-line" },
];

export const savedSimulations = [
  { name: "ANT cover NOR", driver: "ANT", stopLap: 18, compound: "Medium", outcome: "P1", delta: "-3.2s" },
  { name: "NOR early pit", driver: "NOR", stopLap: 15, compound: "Hard", outcome: "P2", delta: "-0.9s" },
  { name: "PIA undercut", driver: "PIA", stopLap: 16, compound: "Soft", outcome: "P1", delta: "-5.1s" },
];

export const predictionSummary = {
  race: "Canadian Grand Prix",
  date: "2026-05-24",
  winner: "Kimi Antonelli",
  podium: ["Kimi Antonelli", "Lando Norris", "Oscar Piastri"],
  safetyCar: 42,
  rainImpact: 18,
  fastestLap: "Kimi Antonelli",
  optimalStop: "Lap 19 to medium tire",
  championshipSwing: "+6 pts Antonelli vs Norris",
};
