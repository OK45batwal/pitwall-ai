"use client";

import { useEffect, useState, useMemo } from "react";
import { Timer } from "lucide-react";
import {
  type Driver,
  type Lap,
  type PitStop,
  type Weather,
  fetchDrivers,
  fetchLaps,
  fetchPitStops,
  fetchWeather,
  driverColor,
} from "@/lib/openf1";

interface Props {
  sessionKey: number | null;
}

interface DriverStrategy {
  driver: Driver;
  currentLap: number;
  currentStint: number;
  compound: string;
  tireAge: number;
  avgLapTime: number;
  degradation: number;
  pitStops: PitStop[];
  optimalPitLap: number | null;
  underCutScore: number;
  overCutScore: number;
  windowStatus: "open" | "approaching" | "closed";
}

const DEGRADATION: Record<string, number> = {
  SOFT: 0.048, MEDIUM: 0.028, HARD: 0.016, INTERMEDIATE: 0.035, WET: 0.06,
};

export function PitWindowCalculator({ sessionKey }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [pitStops, setPitStops] = useState<PitStop[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionKey) return;
    setLoading(true);
    Promise.all([
      fetchDrivers(sessionKey),
      fetchLaps(sessionKey),
      fetchPitStops(sessionKey),
      fetchWeather(sessionKey),
    ])
      .then(([d, l, p, w]) => {
        setDrivers(d);
        setLaps(l);
        setPitStops(p);
        setWeather(Array.isArray(w) ? w[w.length - 1] : w);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionKey]);

  const strategies = useMemo<DriverStrategy[]>(() => {
    if (!laps.length || !drivers.length) return [];

    const currentLap = Math.max(...laps.map((l) => l.lap_number), 1);
    const rainFactor = weather && weather.rainfall > 0.1 ? 1.4 : 1.0;

    return drivers.slice(0, 16).map((driver) => {
      const driverLaps = laps
        .filter((l) => l.driver_number === driver.driver_number && !l.is_pit_out_lap)
        .sort((a, b) => a.lap_number - b.lap_number);

      const currentStintLaps = driverLaps.filter((l) => l.lap_number >= currentLap - 5);
      const avgLapTime = currentStintLaps.length > 0
        ? currentStintLaps.reduce((s, l) => s + (l.lap_time ?? 0), 0) / currentStintLaps.length
        : 82000;

      const latestLap = driverLaps[driverLaps.length - 1];
      const compound = latestLap?.compound ?? "MEDIUM";
      const stintStart = latestLap?.lap_number ?? 1;
      const tireAge = Math.max(0, currentLap - stintStart + (latestLap?.tyre_age_at_start ?? 0));
      const baseDeg = DEGRADATION[compound] ?? 0.028;
      const degradation = baseDeg * rainFactor * (1 + tireAge * 0.01);

      const driverPits = pitStops.filter((p) => p.driver_number === driver.driver_number);
      const nextPit = driverPits.length > 0 ? driverPits[driverPits.length - 1].lap_number : null;

      const idealWindow = 18 + tireAge * 0.18;
      const remainingLaps = Math.max(0, 78 - currentLap);
      const optimalPitLap = remainingLaps > 5 ? Math.round(idealWindow) : null;

      const underCutScore = optimalPitLap && currentLap <= 18
        ? Math.max(0, Math.round(100 - Math.abs(currentLap - optimalPitLap) * 6))
        : 0;

      const overCutScore = optimalPitLap && currentLap >= 20 && tireAge < 15
        ? Math.max(0, Math.round(100 - Math.abs(currentLap - optimalPitLap) * 5))
        : 0;

      let windowStatus: "open" | "approaching" | "closed" = "closed";
      if (optimalPitLap) {
        const diff = optimalPitLap - currentLap;
        if (diff <= 0) windowStatus = "open";
        else if (diff <= 4) windowStatus = "approaching";
      }

      return {
        driver,
        currentLap,
        currentStint: driverPits.length + 1,
        compound,
        tireAge,
        avgLapTime,
        degradation,
        pitStops: driverPits,
        optimalPitLap,
        underCutScore,
        overCutScore,
        windowStatus,
      };
    });
  }, [drivers, laps, pitStops, weather]);

  const sortedByWindow = [...strategies].sort((a, b) => {
    if (a.windowStatus === "open" && b.windowStatus !== "open") return -1;
    if (b.windowStatus === "open" && a.windowStatus !== "open") return 1;
    if (a.windowStatus === "approaching" && b.windowStatus === "closed") return -1;
    if (b.windowStatus === "approaching" && a.windowStatus === "closed") return 1;
    return (a.optimalPitLap ?? 99) - (b.optimalPitLap ?? 99);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Pit Window Calculator</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Live degradation & optimal stop timing
            {weather && weather.rainfall > 0.05 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-electricBlue/15 px-2 py-0.5 text-electricBlue">
                <span className="h-1 w-1 rounded-full bg-electricBlue" /> Rain factor active
              </span>
            )}
          </p>
        </div>
        {loading && <div className="h-4 w-4 animate-spin rounded-full border border-electricBlue border-t-transparent" />}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Window Open", count: strategies.filter((s) => s.windowStatus === "open").length, color: "text-racingGreen" },
          { label: "Approaching", count: strategies.filter((s) => s.windowStatus === "approaching").length, color: "text-amber" },
          { label: "Track Position", count: strategies.length, color: "text-slate-400" },
        ].map(({ label, count, color }) => (
          <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-center">
            <p className={`text-2xl font-black ${color}`}>{count}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {sortedByWindow.map((s) => (
          <div
            key={s.driver.driver_number}
            className={`rounded-xl border px-4 py-3 transition-all ${
              s.windowStatus === "open"
                ? "border-racingGreen/30 bg-racingGreen/5"
                : s.windowStatus === "approaching"
                ? "border-amber/30 bg-amber/5"
                : "border-white/[0.05] bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: driverColor(s.driver) }}
                />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {s.driver.full_name}
                    <span className="ml-2 font-mono text-xs text-slate-500">#{s.driver.driver_number}</span>
                  </p>
                  <p className="text-xs text-slate-500">{s.driver.team_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        s.compound === "SOFT" ? "bg-signalRed/20 text-signalRed" :
                        s.compound === "MEDIUM" ? "bg-amber/20 text-amber" :
                        s.compound === "HARD" ? "bg-white/20 text-slate-300" :
                        "bg-electricBlue/20 text-electricBlue"
                      }`}
                    >
                      {s.compound.slice(0, 1)}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      Lap {s.currentLap} • Age {s.tireAge}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                    {(s.avgLapTime / 1000).toFixed(3)}s avg • {s.pitStops.length} stops
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  {s.optimalPitLap ? (
                    <div className="flex items-center gap-2">
                      <div>
                        <p className={`font-mono text-sm font-bold ${
                          s.windowStatus === "open" ? "text-racingGreen" :
                          s.windowStatus === "approaching" ? "text-amber" : "text-slate-400"
                        }`}>
                          Lap {s.optimalPitLap}
                        </p>
                        <p className="text-[10px] text-slate-500">optimal stop</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        s.windowStatus === "open" ? "bg-racingGreen/20 text-racingGreen" :
                        s.windowStatus === "approaching" ? "bg-amber/20 text-amber" :
                        "bg-white/10 text-slate-500"
                      }`}>
                        {s.windowStatus === "open" ? "Open" : s.windowStatus === "approaching" ? "Soon" : "Wait"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Finishing on track</p>
                  )}
                </div>

                <div className="flex shrink-0 gap-3">
                  <div className="text-center">
                    <p className={`text-xs font-bold ${s.underCutScore > 60 ? "text-racingGreen" : s.underCutScore > 30 ? "text-amber" : "text-slate-500"}`}>
                      {s.underCutScore > 0 ? `${s.underCutScore}%` : "—"}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-slate-600">Undercut</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-bold ${s.overCutScore > 60 ? "text-electricBlue" : s.overCutScore > 30 ? "text-amber" : "text-slate-500"}`}>
                      {s.overCutScore > 0 ? `${s.overCutScore}%` : "—"}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-slate-600">Overcut</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full bg-white/10">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, s.tireAge * 2.5)}%`,
                    background: s.tireAge > 30 ? "#ff254a" : s.tireAge > 18 ? "#ffbd45" : "#19d084",
                  }}
                />
              </div>
              <span className="shrink-0 font-mono text-[10px] text-slate-500">
                {(s.degradation * 100).toFixed(2)}% deg/lap
              </span>
            </div>
          </div>
        ))}
      </div>

      {strategies.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Timer size={32} className="text-slate-600" />
          <p className="mt-3 text-sm text-slate-400">Select a live session to see pit windows</p>
          <p className="mt-1 text-xs text-slate-600">Real-time degradation analysis from OpenF1 lap data</p>
        </div>
      )}
    </div>
  );
}
