"use client";

import { useEffect, useState } from "react";
import {
  fetchSessions,
  fetchLatestSession,
  fetchDrivers,
  fetchPositions,
  fetchIntervals,
  fetchWeather,
  fetchPitStops,
  fetchRaceControl,
  type Session,
  type Driver,
  type Position,
  type Weather,
  type PitStop,
  type RaceControl,
  type Interval,
} from "@/lib/openf1";


function formatLapTime(ms: number | null): string {
  if (ms == null) return "--";
  const s = ms / 1000;
  return `${s.toFixed(3)}s`;
}

function formatGap(gap: number | null | undefined): string {
  if (gap == null) return "Leader";
  if (gap === 0) return "Leader";
  return `+${(gap / 1000).toFixed(3)}s`;
}

interface LiveState {
  session: Session | null;
  drivers: Driver[];
  positions: Position[];
  intervals: Interval[];
  weather: Weather | null;
  telemetry: CarData[];
  pitStops: PitStop[];
  raceControl: RaceControl[];
  loading: boolean;
  error: string | null;
}

export function useLiveSession(sessionKey?: number | null) {
  const [state, setState] = useState<LiveState>({
    session: null,
    drivers: [],
    positions: [],
    intervals: [],
    weather: null,
    telemetry: [],
    pitStops: [],
    raceControl: [],
    loading: true,
    error: null,
  });

  const key = sessionKey ?? "latest";

  async function load() {
    try {
      const [session, drivers, positions, intervals, weather, pitStops, raceControl] =
        await Promise.all([
          sessionKey ? fetchSessions().then(ss => ss.find(s => s.session_key === sessionKey) ?? null) : fetchLatestSession(),
          sessionKey ? fetchDrivers(sessionKey) : Promise.resolve([]),
          sessionKey ? fetchPositions(sessionKey) : Promise.resolve([]),
          sessionKey ? fetchIntervals(sessionKey) : Promise.resolve([]),
          sessionKey ? fetchWeather(sessionKey) : Promise.resolve(null),
          sessionKey ? fetchPitStops(sessionKey) : Promise.resolve([]),
          sessionKey ? fetchRaceControl(sessionKey) : Promise.resolve([]),
        ]);

      setState({
        session,
        drivers,
        positions,
        intervals,
        weather: Array.isArray(weather) ? weather[weather.length - 1] : weather,
        telemetry: [],
        pitStops,
        raceControl,
        loading: false,
        error: null,
      });
    } catch (e: unknown) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [key]);

  return state;
}

export { formatLapTime, formatGap };
