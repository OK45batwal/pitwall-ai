"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  CloudRain,
  Droplets,
  Radio,
  Thermometer,
  Timer,
  Trophy,
  Wind,
} from "lucide-react";
import {
  type Session,
  type Driver,
  type Position,
  type Weather,
  type PitStop,
  type RaceControl,
  type Interval,
  type Lap,
  fetchSessions,
  fetchDrivers,
  fetchPositions,
  fetchIntervals,
  fetchWeather,
  fetchPitStops,
  fetchRaceControl,
  fetchLaps,
  driverColor,
  mergePositions,
} from "@/lib/openf1";
import { TrackLayoutMap } from "@/components/track/track-layout-map";
import { PitWindowCalculator } from "@/components/analysis/pit-window-calculator";
import { TelemetryComparison } from "@/components/analysis/telemetry-comparison";
import { StrategyAdvisor } from "@/components/analysis/strategy-advisor";
import { RaceTimeline } from "@/components/analysis/race-timeline";
import { LapDeltaChart, RaceSimulationChart, TireWearChart, WinProbabilityChart } from "@/components/charts/telemetry-charts";
import { drivers, leaderboard, pitTimeline, predictionSummary } from "@/lib/mock-data";

function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-racingGreen opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-racingGreen" />
    </span>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl glass-card ${className}`}>
      {children}
    </div>
  );
}

interface LiveState {
  session: Session | null;
  sessions: Session[];
  drivers: Driver[];
  positions: Position[];
  intervals: Interval[];
  weather: Weather | null;
  pitStops: PitStop[];
  raceControl: RaceControl[];
  laps: Lap[];
  loading: boolean;
  error: string | null;
  selectedSessionKey: number | null;
}

export function Dashboard() {
  const [state, setState] = useState<LiveState>({
    session: null,
    sessions: [],
    drivers: [],
    positions: [],
    intervals: [],
    weather: null,
    pitStops: [],
    raceControl: [],
    laps: [],
    loading: true,
    error: null,
    selectedSessionKey: null,
  });

  async function loadSessions() {
    try {
      const sessions = await fetchSessions(2026);
      const relevant = sessions.filter(
        (s) => s.session_type === "Race" || s.session_type === "Qualifying" || s.session_type === "Practice"
      );
      const latest = relevant.length > 0 ? relevant[relevant.length - 1] : sessions[sessions.length - 1];
      if (latest) {
        await loadSession(latest.session_key, sessions);
      } else {
        setState((s) => ({ ...s, sessions, loading: false }));
      }
    } catch (e: unknown) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }

  async function loadSession(key: number, existingSessions?: Session[]) {
    try {
      const [drivers, positions, intervals, weather, pitStops, raceControl, laps] = await Promise.all([
        fetchDrivers(key),
        fetchPositions(key),
        fetchIntervals(key),
        fetchWeather(key),
        fetchPitStops(key),
        fetchRaceControl(key),
        fetchLaps(key),
      ]);
      const sessions = existingSessions ?? state.sessions;
      const session = sessions.find((s) => s.session_key === key) ?? null;
      const weatherLatest = Array.isArray(weather) ? weather[weather.length - 1] : null;
      setState((s) => ({
        ...s,
        sessions,
        session,
        selectedSessionKey: key,
        drivers,
        positions: positions.sort((a, b) => (a.position ?? 99) - (b.position ?? 99)),
        intervals,
        weather: weatherLatest,
        pitStops,
        raceControl: raceControl.slice(-15),
        laps,
        loading: false,
        error: null,
      }));
    } catch (e: unknown) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (!state.selectedSessionKey) return;
    const id = setInterval(() => loadSession(state.selectedSessionKey!), 4000);
    return () => clearInterval(id);
  }, [state.selectedSessionKey]);

  const mergedPositions = state.positions.length > 0
    ? mergePositions(state.positions, state.intervals).map(p => ({
        ...p,
        driver: state.drivers.find(d => d.driver_number === p.driver_number) ?? null,
      }))
    : [];

  const hasLiveData = state.drivers.length > 0;

  return (
    <div className="space-y-5">
      {state.loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-electricBlue border-t-transparent" />
        </div>
      )}

      {state.error && (
        <div className="flex items-center gap-3 rounded-xl border border-signalRed/30 bg-signalRed/10 px-4 py-3 text-sm text-signalRed">
          <AlertTriangle size={16} />
          OpenF1 unavailable — demo mode active. ({state.error})
        </div>
      )}

      {state.sessions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Session</label>
          <div className="relative">
            <select
              className="appearance-none rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-2 pr-10 text-sm font-semibold text-white backdrop-blur-sm cursor-pointer"
              value={state.selectedSessionKey ?? ""}
              onChange={(e) => loadSession(Number(e.target.value))}
            >
              {state.sessions.slice(-10).map((s) => (
                <option key={s.session_key} value={s.session_key}>
                  {s.circuit_short_name ?? s.location ?? "Session"} — {s.session_name} ({s.year})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          {hasLiveData && <LiveDot />}
          <span className="text-xs text-slate-500">
            {state.session?.date_start ? new Date(state.session.date_start).toLocaleDateString() : ""}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([
          { label: "Race", value: state.session?.circuit_short_name ?? "Monaco GP", sub: state.session?.session_name ?? "Race" },
          { label: "Drivers", value: hasLiveData ? String(state.drivers.length) : "10", sub: "on track" },
          { label: "Safety Car", value: state.raceControl.some((m) => m.flag === "SC" || m.flag === "RED") ? "Active" : "None", sub: state.raceControl.some((m) => m.flag === "SC") ? "Deployed" : "Clear" },
          { label: "Track Temp", value: state.weather ? `${state.weather.track_temp}°C` : "42°C", sub: state.weather ? `Air ${state.weather.air_temp}°C` : "Air 28°C" },
        ] as const).map(({ label, value, sub }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur-sm">
            {label === "Race" && <Trophy size={18} className="text-electricBlue shrink-0" />}
            {label === "Drivers" && <Radio size={18} className="text-electricBlue shrink-0" />}
            {label === "Safety Car" && <AlertTriangle size={18} className="text-electricBlue shrink-0" />}
            {label === "Track Temp" && <Droplets size={18} className="text-electricBlue shrink-0" />}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
              <p className="mt-0.5 text-xl font-black text-white">{value}</p>
              <p className="text-[11px] text-slate-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {state.weather && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {([
            ["Track", `${state.weather.track_temp}°C`],
            ["Air", `${state.weather.air_temp}°C`],
            ["Rain", `${Math.round(state.weather.rainfall * 100)}%`],
            ["Wind", `${state.weather.wind_speed} km/h`],
            ["Humidity", `${state.weather.humidity}%`],
          ] as const).map(([label, value]) => (
            <div key={label} className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <Thermometer size={14} className="text-slate-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500">{label}</p>
                <p className="font-mono text-sm font-bold text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <SectionCard>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Live Positions</h2>
              <p className="mt-0.5 text-xs text-slate-500">Real-time driver standings</p>
            </div>
            {hasLiveData && <LiveDot />}
          </div>
          <div className="space-y-1.5">
            {(mergedPositions.length > 0 ? mergedPositions : leaderboard.map((d, i) => ({
              position: i + 1, driver_number: 0, interval: null, gap_to_leader: null,
              retired: false, pits: 0, stop: 0, driver: null, name: d.name, team: d.team, color: d.color,
            }))).slice(0, 15).map((entry: any, i: number) => (
              <div
                key={entry.driver_number ?? i}
                className="grid grid-cols-[36px_1fr_auto_auto] items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.05]"
              >
                <span className={`font-mono text-sm font-black ${entry.position === 1 ? "text-amber" : "text-slate-400"}`}>
                  P{entry.position}
                </span>
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: entry.driver ? driverColor(entry.driver) : entry.color ?? "#888" }}
                  />
                  <div>
                    <span className="text-sm font-semibold text-white">
                      {entry.driver?.full_name ?? entry.name ?? `Driver ${entry.driver_number}`}
                    </span>
                    <span className="ml-2 text-[10px] text-slate-500">{entry.driver?.team_name ?? entry.team ?? ""}</span>
                  </div>
                </div>
                <span className="font-mono text-xs text-electricBlue">
                  {entry.interval != null ? `${(entry.interval / 1000).toFixed(3)}s` : "--"}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {entry.gap_to_leader != null ? `+${(entry.gap_to_leader / 1000).toFixed(3)}s` : "Leader"}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard className="p-4">
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Track Layout</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {state.session?.circuit_short_name ?? "Real circuit from OpenF1"}
              </p>
            </div>
            <TrackLayoutMap
              sessionKey={state.selectedSessionKey}
              drivers={state.drivers.slice(0, 14)}
            />
          </SectionCard>
        </div>
      </div>

      {state.selectedSessionKey && (
        <>
          <SectionCard>
            <StrategyAdvisor sessionKey={state.selectedSessionKey} />
          </SectionCard>

          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard>
              <PitWindowCalculator sessionKey={state.selectedSessionKey} />
            </SectionCard>
            <SectionCard>
              <TelemetryComparison sessionKey={state.selectedSessionKey} />
            </SectionCard>
          </div>

          <SectionCard>
            <RaceTimeline sessionKey={state.selectedSessionKey} refreshInterval={5000} />
          </SectionCard>
        </>
      )}

      {state.raceControl.length > 0 && (
        <SectionCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Race Control</h2>
            {state.raceControl.some((m) => m.flag === "SC" || m.flag === "RED") && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber">
                <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse" />
                Caution Active
              </span>
            )}
          </div>
          <div className="space-y-2">
            {state.raceControl.slice(-8).map((msg, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  msg.flag === "GREEN" ? "bg-racingGreen/20 text-racingGreen" :
                  msg.flag === "SC" || msg.flag === "VSC" ? "bg-amber/20 text-amber" :
                  msg.flag === "RED" ? "bg-signalRed/20 text-signalRed" :
                  msg.flag === "YELLOW" ? "bg-amber/20 text-amber" :
                  "bg-white/10 text-slate-400"
                }`}>
                  {msg.flag ?? "UNK"}
                </span>
                <div>
                  <p className="text-xs text-white">{msg.message}</p>
                  {msg.lap_number && <p className="mt-0.5 text-[10px] text-slate-500">Lap {msg.lap_number}</p>}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Lap Delta</h2>
          <LapDeltaChart />
        </SectionCard>
        <SectionCard>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Tire Wear</h2>
          <TireWearChart />
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <SectionCard>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Race Simulation</h2>
          <RaceSimulationChart />
        </SectionCard>
        <SectionCard>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Win Probability</h2>
          <WinProbabilityChart />
        </SectionCard>
      </div>
    </div>
  );
}
