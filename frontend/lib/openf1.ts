const BASE = "https://api.openf1.org/v1";

export interface Session {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  year: number;
  country_name: string;
  location: string;
  circuit_short_name: string;
  date_start: string;
  date_end: string;
  gmt_offset: string;
}

export interface Driver {
  driver_number: number;
  full_name: string;
  team_name: string;
  team_color: string;
  first_name: string;
  last_name: string;
  country_code: string;
  headshot_url: string;
  code?: string;
}

export interface Position {
  driver_number: number;
  position: number;
  interval: number | null;
  gap_to_leader: number | null;
}

export interface Lap {
  driver_number: number;
  lap_number: number;
  stint: number;
  lap_time: number;
  sector1_time: number | null;
  sector2_time: number | null;
  sector3_time: number | null;
  speed_i1: number | null;
  speed_i2: number | null;
  speed_fl: number | null;
  compound: string;
  tyre_age_at_start: number;
  is_pit_out_lap: boolean;
  driver_out: boolean;
}

export interface CarData {
  driver_number: number;
  speed: number;
  rpm: number;
  gear: number;
  throttle: number;
  brake: number;
  drs: number;
  ers_deployment: number;
  date: string;
}

export interface Weather {
  air_temp: number;
  track_temp: number;
  humidity: number;
  pressure: number;
  rainfall: number;
  wind_speed: number;
  wind_direction: number;
  date: string;
}

export interface Interval {
  driver_number: number;
  elapsed_ms: number;
  lap_ms: number;
  is_pit: boolean;
  gap_to_leader: number | null;
}

export interface RaceControl {
  flag: string;
  category: string;
  message: string;
  driver_number: number | null;
  lap_number: number | null;
  date: string;
}

export interface PitStop {
  driver_number: number;
  lap_number: number;
  stop_number: number;
  pit_duration: number;
  date: string;
}

export interface TeamRadio {
  driver_number: number;
  recording_url: string;
  date: string;
}

export interface Location {
  driver_number: number;
  x: number;
  y: number;
  z: number;
  date: string;
  session_key: number;
}

export interface Meeting {
  meeting_key: number;
  year: number;
  country_name: string;
  location: string;
  circuit_short_name: string;
  circuit_country: string;
  circuit_latitude: number;
  circuit_longitude: number;
  date_start: string;
  sessions: Session[];
}

export async function fetchSessions(year?: number): Promise<Session[]> {
  const params = year ? `?year=${year}` : "";
  const res = await fetch(`${BASE}/sessions${params}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`sessions failed: ${res.status}`);
  return res.json();
}

export async function fetchLatestSession(): Promise<Session | null> {
  const sessions = await fetchSessions();
  if (!sessions.length) return null;
  return sessions[sessions.length - 1];
}

export async function fetchDrivers(sessionKey: number): Promise<Driver[]> {
  const res = await fetch(`${BASE}/drivers?session_key=${sessionKey}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`drivers failed: ${res.status}`);
  return res.json();
}

export async function fetchPositions(sessionKey: number): Promise<Position[]> {
  const res = await fetch(`${BASE}/position?session_key=${sessionKey}`, { next: { revalidate: 4 } });
  if (!res.ok) throw new Error(`position failed: ${res.status}`);
  return res.json();
}

export async function fetchIntervals(sessionKey: number): Promise<Interval[]> {
  const res = await fetch(`${BASE}/intervals?session_key=${sessionKey}`, { next: { revalidate: 4 } });
  if (!res.ok) throw new Error(`intervals failed: ${res.status}`);
  return res.json();
}

export async function fetchLaps(sessionKey: number, driverNumber?: number): Promise<Lap[]> {
  let url = `${BASE}/laps?session_key=${sessionKey}`;
  if (driverNumber) url += `&driver_number=${driverNumber}`;
  const res = await fetch(url, { next: { revalidate: 15 } });
  if (!res.ok) throw new Error(`laps failed: ${res.status}`);
  return res.json();
}

export async function fetchCarData(sessionKey: number, driverNumber?: number): Promise<CarData[]> {
  let url = `${BASE}/car_data?session_key=${sessionKey}`;
  if (driverNumber) url += `&driver_number=${driverNumber}`;
  const res = await fetch(url, { next: { revalidate: 4 } });
  if (!res.ok) throw new Error(`car_data failed: ${res.status}`);
  return res.json();
}

export async function fetchWeather(sessionKey: number): Promise<Weather[]> {
  const res = await fetch(`${BASE}/weather?session_key=${sessionKey}`, { next: { revalidate: 10 } });
  if (!res.ok) throw new Error(`weather failed: ${res.status}`);
  return res.json();
}

export async function fetchRaceControl(sessionKey: number): Promise<RaceControl[]> {
  const res = await fetch(`${BASE}/race_control?session_key=${sessionKey}`, { next: { revalidate: 5 } });
  if (!res.ok) throw new Error(`race_control failed: ${res.status}`);
  return res.json();
}

export async function fetchPitStops(sessionKey: number): Promise<PitStop[]> {
  const res = await fetch(`${BASE}/pit?session_key=${sessionKey}`, { next: { revalidate: 10 } });
  if (!res.ok) throw new Error(`pit failed: ${res.status}`);
  return res.json();
}

export async function fetchMeetings(year?: number): Promise<Meeting[]> {
  const params = year ? `?year=${year}` : "";
  const res = await fetch(`${BASE}/meetings${params}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`meetings failed: ${res.status}`);
  return res.json();
}

export async function fetchLocation(sessionKey: number, driverNumber?: number): Promise<Location[]> {
  let url = `${BASE}/location?session_key=${sessionKey}`;
  if (driverNumber) url += `&driver_number=${driverNumber}`;
  const res = await fetch(url, { next: { revalidate: 3 } });
  if (!res.ok) throw new Error(`location failed: ${res.status}`);
  return res.json();
}

export const TEAM_COLORS: Record<string, string> = {
  "Red Bull Racing": "#3671c6",
  "Ferrari": "#e80020",
  "Mercedes": "#27f4d2",
  "McLaren": "#ff8700",
  "Aston Martin": "#229971",
  "Alpine": "#ff87bc",
  "Williams": "#6412ff",
  "Haas F1 Team": "#b9b9b9",
  "Kick Sauber": "#52e252",
  "RB": "#6e0000",
};

export function driverColor(driver: Driver): string {
  if (driver.team_color && driver.team_color.length === 6) {
    return `#${driver.team_color}`;
  }
  return TEAM_COLORS[driver.team_name] ?? "#888888";
}

export function mergePositions(positions: Position[], intervals: Interval[]) {
  const map = new Map(intervals.map(i => [i.driver_number, i]));
  return positions.map(p => {
    const int = map.get(p.driver_number);
    return { ...p, interval_ms: int?.lap_ms ?? null, gap_to_leader: int?.gap_to_leader ?? null };
  }).sort((a, b) => a.position - b.position);
}
