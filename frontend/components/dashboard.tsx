"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, CloudRain, Droplets, Radio, Thermometer, Trophy, Wind } from "lucide-react";
import {
  type Session, type Driver, type Position, type Weather, type PitStop,
  type RaceControl, type Interval, type Lap,
  fetchSessions, fetchDrivers, fetchPositions, fetchIntervals, fetchWeather,
  fetchPitStops, fetchRaceControl, fetchLaps, driverColor, mergePositions,
} from "@/lib/openf1";
import { TrackLayoutMap } from "@/components/track/track-layout-map";
import { PitWindowCalculator } from "@/components/analysis/pit-window-calculator";
import { TelemetryComparison } from "@/components/analysis/telemetry-comparison";
import { StrategyAdvisor } from "@/components/analysis/strategy-advisor";
import { RaceTimeline } from "@/components/analysis/race-timeline";
import { LapDeltaChart, buildLapDeltaData, TireWearChart } from "@/components/charts/telemetry-charts";
import { leaderboard } from "@/lib/mock-data";

interface State {
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
  sessionKey: number | null;
}

export function Dashboard() {
  const [s, set] = useState<State>({
    session: null, sessions: [], drivers: [], positions: [], intervals: [],
    weather: null, pitStops: [], raceControl: [], laps: [],
    loading: true, error: null, sessionKey: null,
  });

  async function loadSessions() {
    try {
      const all = await fetchSessions(2025);
      const race = all.filter(r => r.session_type === "Race" || r.session_type === "Qualifying");
      const latest = race[race.length - 1] ?? all[all.length - 1];
      if (latest) await loadSession(latest.session_key, all);
      else set(p => ({ ...p, sessions: all, loading: false }));
    } catch (e: unknown) {
      set(p => ({ ...p, loading: false, error: (e as Error).message }));
    }
  }

  async function loadSession(key: number, existing?: Session[]) {
    try {
      const [drivers, positions, intervals, weather, pitStops, raceControl, laps] = await Promise.all([
        fetchDrivers(key), fetchPositions(key), fetchIntervals(key),
        fetchWeather(key), fetchPitStops(key), fetchRaceControl(key), fetchLaps(key),
      ]);
      const sessions = existing ?? s.sessions;
      const session = sessions.find(x => x.session_key === key) ?? null;
      set(p => ({
        ...p, sessions, session, sessionKey: key,
        drivers,
        positions: positions.sort((a, b) => (a.position ?? 99) - (b.position ?? 99)),
        intervals, weather: Array.isArray(weather) ? weather[weather.length - 1] : null,
        pitStops, raceControl: raceControl.slice(-15), laps,
        loading: false, error: null,
      }));
    } catch (e: unknown) {
      set(p => ({ ...p, loading: false, error: (e as Error).message }));
    }
  }

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => {
    if (!s.sessionKey) return;
    const id = setInterval(() => loadSession(s.sessionKey!), 4000);
    return () => clearInterval(id);
  }, [s.sessionKey]);

  const mergedPositions = useMemo(() => s.positions.length > 0
    ? mergePositions(s.positions, s.intervals).map(p => ({
        ...p,
        driver: s.drivers.find(d => d.driver_number === p.driver_number) ?? null,
      }))
    : [], [s.positions, s.intervals, s.drivers]);

  const lapDeltaData = useMemo(() =>
    s.laps.length > 0 && s.drivers.length > 0 ? buildLapDeltaData(s.laps, s.drivers) : [],
  [s.laps, s.drivers]);

  const displayPositions = mergedPositions.length > 0
    ? mergedPositions
    : leaderboard.map((d, i) => ({
        position: i + 1, driver_number: 0, interval: null, gap_to_leader: null,
        driver: null, name: d.name, team: d.team, color: d.color,
      }));

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Loading */}
      {s.loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-electricBlue border-t-transparent" />
        </div>
      )}

      {/* Error */}
      {s.error && (
        <div className="flex items-center gap-3 rounded-xl border border-signalRed/25 bg-signalRed/8 px-4 py-3 text-sm text-signalRed">
          <AlertTriangle size={15} />
          OpenF1 unavailable — demo mode ({s.error})
        </div>
      )}

      {/* Session bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl glass-panel px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Trophy size={20} className="text-amber" />
            <div>
              <h2 className="text-lg font-black text-white">{s.session?.circuit_short_name ?? "Grand Prix"}</h2>
              <p className="text-xs text-slate-500">{s.session?.session_name ?? "Session"} &middot; {s.session?.location ?? ""}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="f1-live-dot" />
            <span className="text-xs font-semibold text-racingGreen">LIVE</span>
            <span className="text-xs text-slate-600">Lap {s.laps.length > 0 ? Math.max(...s.laps.map(l => l.lap_number)) : "--"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="appearance-none rounded-lg border px-3 py-1.5 pr-8 text-xs font-medium bg-white/[0.04] text-white cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
            value={s.sessionKey ?? ""}
            onChange={e => loadSession(Number(e.target.value))}
          >
            {s.sessions.slice(-10).map(x => (
              <option key={x.session_key} value={x.session_key}>
                {x.circuit_short_name ?? x.location} — {x.session_name}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="-ml-7 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([
          { label: "Drivers", value: s.drivers.length ? String(s.drivers.length) : "10", sub: "on track", icon: Radio },
          { label: "Track", value: s.weather ? `${s.weather.track_temp}°C` : "—", sub: "temperature", icon: Thermometer },
          { label: "Air", value: s.weather ? `${s.weather.air_temp}°C` : "—", sub: "ambient", icon: CloudRain },
          { label: "Wind", value: s.weather ? `${s.weather.wind_speed} km/h` : "—", sub: `${s.weather?.humidity ?? "--"}% humidity`, icon: Wind },
        ] as const).map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center gap-3">
              <Icon size={16} className="text-slate-500 shrink-0" />
              <div>
                <p className="stat-label">{label}</p>
                <p className="stat-value text-white">{value}</p>
                <p className="stat-sub">{sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content: positions + track */}
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="panel-title">Live Positions</h3>
              <p className="panel-sub">Real-time driver standings</p>
            </div>
            <span className="f1-live-dot" />
          </div>
          <div className="space-y-1">
            {displayPositions.slice(0, 15).map((entry, i) => {
              const d = entry.driver as Driver | null;
              return (
                <div
                  key={entry.driver_number ?? i}
                  className={`f1-timing-row ${entry.position === 1 ? "podium-1" : entry.position === 2 ? "podium-2" : entry.position === 3 ? "podium-3" : ""}`}
                >
                  <span className={`font-mono text-sm font-bold ${entry.position === 1 ? "text-amber" : "text-slate-400"}`}>
                    P{entry.position}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d ? driverColor(d) : entry.color ?? "#888" }} />
                    <span className="text-sm font-semibold text-white truncate">
                      {d?.name_acronym ?? d?.code ?? d?.full_name ?? entry.name ?? `#${entry.driver_number}`}
                    </span>
                    <span className="hidden sm:inline text-[10px] text-slate-600 truncate">
                      {d?.team_name ?? entry.team ?? ""}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-right text-electricBlue">
                    {entry.interval != null ? `${(entry.interval / 1e3).toFixed(3)}s` : "--"}
                  </span>
                  <span className="font-mono text-xs text-right text-slate-500">
                    {entry.gap_to_leader != null ? `+${(entry.gap_to_leader / 1e3).toFixed(3)}s` : "Leader"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="mb-3">
            <h3 className="panel-title">Track Layout</h3>
            <p className="panel-sub">{s.session?.circuit_short_name ?? "Circuit"}</p>
          </div>
          <TrackLayoutMap sessionKey={s.sessionKey} drivers={s.drivers.slice(0, 14)} />
        </div>
      </div>

      {/* Weather row + Race control */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {s.weather && (
          <div className="glass-card rounded-xl p-4">
            <h3 className="panel-title mb-3">Track Conditions</h3>
            <div className="grid grid-cols-5 gap-2">
              {([
                ["Track", `${s.weather.track_temp}°C`, Thermometer],
                ["Air", `${s.weather.air_temp}°C`, CloudRain],
                ["Rain", `${Math.round(s.weather.rainfall * 100)}%`, Droplets],
                ["Wind", `${s.weather.wind_speed} km/h`, Wind],
                ["Humidity", `${s.weather.humidity}%`, Droplets],
              ] as const).map(([label, value, Icon]) => (
                <div key={label} className="text-center">
                  <Icon size={13} className="mx-auto text-slate-500" />
                  <p className="mt-1 text-[10px] text-slate-500">{label}</p>
                  <p className="font-mono text-sm font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {s.raceControl.length > 0 && (
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="panel-title">Race Control</h3>
              {s.raceControl.some(m => m.flag === "SC" || m.flag === "RED") && (
                <span className="session-badge flag-sc"><span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse" /> Caution</span>
              )}
            </div>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
              {s.raceControl.slice(-8).map((msg, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-white/[0.015] px-2.5 py-1.5">
                  <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    msg.flag === "GREEN" ? "flag-green" :
                    msg.flag === "SC" || msg.flag === "VSC" ? "flag-sc" :
                    msg.flag === "RED" ? "flag-red" :
                    msg.flag === "YELLOW" ? "flag-yellow" : "bg-white/10 text-slate-400"
                  }`}>
                    {msg.flag ?? "UNK"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300 truncate">{msg.message}</p>
                    {msg.lap_number && <p className="text-[10px] text-slate-600">Lap {msg.lap_number}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Strategy + analysis */}
      {s.sessionKey && (
        <>
          <div className="glass-card rounded-xl p-4">
            <StrategyAdvisor sessionKey={s.sessionKey} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="glass-card rounded-xl p-4">
              <PitWindowCalculator sessionKey={s.sessionKey} />
            </div>
            <div className="glass-card rounded-xl p-4">
              <TelemetryComparison sessionKey={s.sessionKey} />
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <RaceTimeline sessionKey={s.sessionKey} refreshInterval={5000} />
          </div>
        </>
      )}

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass-card rounded-xl p-4">
          <h3 className="panel-title mb-3">
            Lap Delta
            {lapDeltaData.length > 0 && <span className="ml-2 text-[10px] font-normal text-slate-600">(last {lapDeltaData.length} laps)</span>}
          </h3>
          {lapDeltaData.length > 0
            ? <LapDeltaChart data={lapDeltaData} />
            : <p className="text-xs text-slate-600 py-8 text-center">No lap data available yet</p>
          }
        </div>
        <div className="glass-card rounded-xl p-4">
          <h3 className="panel-title mb-3">Tire Wear</h3>
          <TireWearChart />
        </div>
      </div>

    </div>
  );
}
