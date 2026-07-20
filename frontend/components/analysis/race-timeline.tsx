"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  type RaceControl,
  type PitStop,
  type Driver,
  type Weather,
  type Position,
  type Interval,
  fetchRaceControl,
  fetchPitStops,
  fetchDrivers,
  fetchWeather,
  fetchPositions,
  fetchIntervals,
  driverColor,
} from "@/lib/openf1";

interface Props {
  sessionKey: number | null;
  refreshInterval?: number;
}

type TimelineEvent = {
  id: string;
  lap: number | null;
  time: Date;
  type: "flag" | "pit" | "position" | "weather" | "overtake" | "incident";
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  driverNumber?: number;
  driverName?: string;
  color?: string;
};

const FLAG_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  GREEN: { label: "Green Flag", color: "#19d084", bg: "bg-racingGreen/10", icon: "🟢" },
  YELLOW: { label: "Yellow Flag", color: "#ffbd45", bg: "bg-amber/10", icon: "🟡" },
  SC: { label: "Safety Car", color: "#ffbd45", bg: "bg-amber/10", icon: "🚨" },
  VSC: { label: "Virtual Safety Car", color: "#ffbd45", bg: "bg-amber/10", icon: "⚠️" },
  RED: { label: "Red Flag", color: "#ff254a", bg: "bg-signalRed/10", icon: "🔴" },
  CHEQUERED: { label: "Checkered Flag", color: "#ffffff", bg: "bg-white/10", icon: "🏁" },
};

export function RaceTimeline({ sessionKey, refreshInterval = 5000 }: Props) {
  const [raceControl, setRaceControl] = useState<RaceControl[]>([]);
  const [pitStops, setPitStops] = useState<PitStop[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [intervals, setIntervals] = useState<Interval[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(["flag", "pit", "incident", "position"]));
  const [flagState, setFlagState] = useState<string>("GREEN");
  const prevPositionsRef = useRef<Map<number, number>>(new Map());

  async function load() {
    if (!sessionKey) return;
    setLoading(true);
    try {
      const [rc, ps, d, w, pos, ints] = await Promise.all([
        fetchRaceControl(sessionKey),
        fetchPitStops(sessionKey),
        fetchDrivers(sessionKey),
        fetchWeather(sessionKey),
        fetchPositions(sessionKey),
        fetchIntervals(sessionKey),
      ]);
      setRaceControl(rc);
      setPitStops(ps);
      setDrivers(d);
      setWeather(Array.isArray(w) ? w[w.length - 1] : w);
      setPositions(pos);
      setIntervals(ints);

      const lastFlag = rc.length > 0 ? rc[rc.length - 1] : null;
      if (lastFlag?.flag) setFlagState(lastFlag.flag);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!sessionKey) return;
    load();
    const id = setInterval(load, refreshInterval);
    return () => clearInterval(id);
  }, [sessionKey, refreshInterval]);

  const events = useMemo<TimelineEvent[]>(() => {
    const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));
    const evs: TimelineEvent[] = [];

    raceControl.forEach((msg) => {
      const driver = driverMap.get(msg.driver_number ?? 0);
      const config = FLAG_CONFIG[msg.flag ?? "YELLOW"] ?? FLAG_CONFIG.YELLOW;
      const severity: TimelineEvent["severity"] =
        msg.flag === "RED"
          ? "critical"
          : msg.flag === "SC"
          ? "high"
          : msg.flag === "YELLOW"
          ? "medium"
          : "low";

      evs.push({
        id: `rc-${msg.date}`,
        lap: msg.lap_number ?? null,
        time: new Date(msg.date),
        type: "flag",
        severity,
        title: config.label,
        description: msg.message,
        color: config.color,
      });
    });

    pitStops.forEach((stop) => {
      const driver = driverMap.get(stop.driver_number);
      evs.push({
        id: `pit-${stop.date}`,
        lap: stop.lap_number,
        time: new Date(stop.date),
        type: "pit",
        severity: "low",
        title: `Pit Stop #${stop.stop_number}`,
        description: `${stop.pit_duration.toFixed(2)}s pit duration`,
        driverNumber: stop.driver_number,
        driverName: driver?.full_name,
        color: driver ? driverColor(driver) : undefined,
      });
    });

    positions.forEach((pos) => {
      const prevPos = prevPositionsRef.current.get(pos.driver_number);
      if (prevPos && prevPos !== pos.position && !pos.retired) {
        const driver = driverMap.get(pos.driver_number);
        const diff = prevPos - pos.position;
        if (diff > 0) {
          evs.push({
            id: `pos-${pos.driver_number}-${Date.now()}`,
            lap: null,
            time: new Date(),
            type: "overtake",
            severity: diff >= 3 ? "high" : diff >= 2 ? "medium" : "low",
            title: `P${prevPos} → P${pos.position}`,
            description: `${driver?.full_name ?? `Driver #${pos.driver_number}`} gains ${diff} position${diff > 1 ? "s" : ""}`,
            driverNumber: pos.driver_number,
            driverName: driver?.full_name,
            color: driver ? driverColor(driver) : undefined,
          });
        }
      }
      prevPositionsRef.current.set(pos.driver_number, pos.position);
    });

    if (weather) {
      evs.push({
        id: `weather-${weather.date}`,
        lap: null,
        time: new Date(weather.date),
        type: "weather",
        severity: weather.rainfall > 0.2 ? "high" : weather.rainfall > 0.05 ? "medium" : "info",
        title: "Weather Update",
        description: `${weather.track_temp}°C track, ${Math.round(weather.rainfall * 100)}% rain, ${weather.wind_speed} km/h wind`,
        color: weather.rainfall > 0.2 ? "#2dd4ff" : "#64748b",
      });
    }

    return evs.sort((a, b) => b.time.getTime() - a.time.getTime());
  }, [raceControl, pitStops, drivers, weather, positions]);

  const filteredEvents = events.filter((e) => activeFilters.has(e.type));
  const groupedByLap = useMemo(() => {
    const groups = new Map<number | null, TimelineEvent[]>();
    filteredEvents.forEach((e) => {
      const key = e.lap;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    });
    return [...groups.entries()].sort(([a], [b]) => (b ?? 0) - (a ?? 0));
  }, [filteredEvents]);

  function toggleFilter(type: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  const flagConfig = FLAG_CONFIG[flagState] ?? FLAG_CONFIG.GREEN;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Race Timeline</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {events.length} events • Live incident feed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${flagConfig.bg}`}>
            <span className="text-base">{flagConfig.icon}</span>
            <span className="text-xs font-bold" style={{ color: flagConfig.color }}>
              {flagConfig.label}
            </span>
          </div>
          {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-electricBlue border-t-transparent" />}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { type: "flag", label: "Flags", icon: "🚩" },
          { type: "pit", label: "Pit Stops", icon: "⛽" },
          { type: "overtake", label: "Overtakes", icon: "📈" },
          { type: "weather", label: "Weather", icon: "🌤️" },
        ].map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => toggleFilter(type)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              activeFilters.has(type)
                ? "border-electricBlue/40 bg-electricBlue/10 text-electricBlue"
                : "border-white/[0.06] bg-white/[0.03] text-slate-500"
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-white/[0.06]" />
        <div className="space-y-3">
          {groupedByLap.slice(0, 25).map(([lap, lapEvents]) => (
            <div key={lap ?? "now"}>
              <div className="mb-2 flex items-center gap-3">
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-carbon text-xs font-bold text-slate-400">
                  {lap ?? "NOW"}
                </div>
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[10px] uppercase tracking-widest text-slate-600">
                  Lap {lap ?? "LIVE"}
                </span>
              </div>
              <div className="ml-6 space-y-1.5">
                {lapEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-all hover:bg-white/[0.02] ${
                      event.severity === "critical"
                        ? "border-signalRed/30 bg-signalRed/5"
                        : event.severity === "high"
                        ? "border-amber/20 bg-amber/5"
                        : "border-white/[0.05] bg-white/[0.02]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                        event.severity === "critical"
                          ? "bg-signalRed animate-pulse"
                          : event.severity === "high"
                          ? "bg-amber animate-pulse"
                          : event.severity === "medium"
                          ? "bg-amber/60"
                          : "bg-slate-600"
                      }`}
                      style={{ marginTop: 8 }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-sm font-semibold"
                          style={{ color: event.color ?? "#e5edf8" }}
                        >
                          {event.title}
                        </p>
                        {event.driverName && (
                          <div className="flex items-center gap-1.5">
                            {event.color && (
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: event.color }}
                              />
                            )}
                            <span className="text-xs text-slate-500">{event.driverName}</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{event.description}</p>
                      <p className="mt-1 text-[10px] text-slate-600">
                        {event.time.toLocaleTimeString()}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        event.severity === "critical"
                          ? "bg-signalRed/20 text-signalRed"
                          : event.severity === "high"
                          ? "bg-amber/20 text-amber"
                          : event.severity === "medium"
                          ? "bg-white/10 text-slate-400"
                          : "bg-white/5 text-slate-600"
                      }`}
                    >
                      {event.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {events.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-slate-500">No events recorded yet</p>
          <p className="mt-1 text-xs text-slate-600">Events will appear here as the race progresses</p>
        </div>
      )}
    </div>
  );
}
