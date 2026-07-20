"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  type Session,
  type Driver,
  type Position,
  type Interval,
  type Lap,
  type Weather,
  type CarData,
  fetchSessions,
  fetchLatestSession,
  fetchDrivers,
  fetchPositions,
  fetchIntervals,
  fetchLaps,
  fetchWeather,
  fetchCarData,
  driverColor,
  mergePositions,
} from "@/lib/openf1";

export function useSessions(year?: number) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchSessions(year)
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);
  return { sessions, loading };
}

export function useLatestSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchLatestSession()
      .then(setSession)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  return { session, loading };
}

export function useDrivers(sessionKey: number | null) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!sessionKey) return;
    fetchDrivers(sessionKey)
      .then(setDrivers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionKey]);
  return { drivers, loading };
}

export function useLivePositions(sessionKey: number | null, intervalMs = 4000) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const fetch_ = useCallback(async () => {
    if (!sessionKey) return;
    setLoading(true);
    try {
      const [pos, ints] = await Promise.all([fetchPositions(sessionKey), fetchIntervals(sessionKey)]);
      setPositions(mergePositions(pos, ints));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [sessionKey]);

  useEffect(() => {
    if (!sessionKey) return;
    fetch_();
    timer.current = setInterval(fetch_, intervalMs);
    return () => clearInterval(timer.current);
  }, [sessionKey, intervalMs, fetch_]);

  return { positions, loading, refresh: fetch_ };
}

export function useLaps(sessionKey: number | null, driverNumber?: number) {
  const [laps, setLaps] = useState<Lap[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!sessionKey) return;
    fetchLaps(sessionKey, driverNumber)
      .then(setLaps)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionKey, driverNumber]);
  return { laps, loading };
}

export function useWeather(sessionKey: number | null) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!sessionKey) return;
    fetchWeather(sessionKey)
      .then((w) => setWeather(w[w.length - 1] ?? null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionKey]);
  return { weather, loading };
}

export function useLiveTelemetry(sessionKey: number | null, driverNumber?: number) {
  const [telemetry, setTelemetry] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const fetch_ = useCallback(async () => {
    if (!sessionKey) return;
    setLoading(true);
    try {
      const data = await fetchCarData(sessionKey, driverNumber);
      setTelemetry(data.slice(-50));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [sessionKey, driverNumber]);

  useEffect(() => {
    if (!sessionKey) return;
    fetch_();
    timer.current = setInterval(fetch_, 3000);
    return () => clearInterval(timer.current);
  }, [sessionKey, driverNumber, fetch_]);

  return { telemetry, loading, refresh: fetch_ };
}

export { driverColor };
