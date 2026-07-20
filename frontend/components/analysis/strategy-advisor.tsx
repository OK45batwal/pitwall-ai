"use client";

import { useEffect, useState, useMemo } from "react";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Zap, Shield } from "lucide-react";
import {
  type Driver,
  type Position,
  type Weather,
  type Lap,
  fetchDrivers,
  fetchPositions,
  fetchWeather,
  fetchLaps,
  driverColor,
} from "@/lib/openf1";

interface Props {
  sessionKey: number | null;
}

interface StrategyAdvice {
  driver: Driver;
  position: number;
  trackTemp: number;
  tireAge: number;
  compound: string;
  rainRisk: number;
  underCutOpportunity: number;
  overCutOpportunity: number;
  coverRisk: number;
  pitPriority: number;
  recommendedLap: number | null;
  strategyNotes: string[];
}

export function StrategyAdvisor({ sessionKey }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionKey) return;
    setLoading(true);
    Promise.all([
      fetchDrivers(sessionKey),
      fetchPositions(sessionKey),
      fetchWeather(sessionKey),
      fetchLaps(sessionKey),
    ])
      .then(([d, p, w, l]) => {
        setDrivers(d);
        setPositions(p);
        setWeather(Array.isArray(w) ? w[w.length - 1] : w);
        setLaps(l);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionKey]);

  const advices = useMemo<StrategyAdvice[]>(() => {
    if (!drivers.length || !positions.length) return [];

    const currentLap = Math.max(...laps.map((l) => l.lap_number), 1);
    const trackTemp = weather?.track_temp ?? 38;
    const rainRisk = weather?.rainfall ?? 0;

    return drivers.slice(0, 16).map((driver) => {
      const pos = positions.find((p) => p.driver_number === driver.driver_number);
      const position = pos?.position ?? 99;

      const driverLaps = laps
        .filter((l) => l.driver_number === driver.driver_number && !l.is_pit_out_lap)
        .sort((a, b) => b.lap_number - a.lap_number);

      const latestLap = driverLaps[0];
      const tireAge = latestLap
        ? Math.max(0, currentLap - (latestLap.lap_number - latestLap.tyre_age_at_start))
        : 5;
      const compound = latestLap?.compound ?? "MEDIUM";

      const competitorBehind = positions.find(
        (p) => p.position === position + 1 && !p.retired
      );
      const competitorAhead = positions.find(
        (p) => p.position === position - 1 && !p.retired
      );

      const baseScore = 100 - position * 4;
      const tempPenalty = trackTemp > 45 ? (trackTemp - 45) * 0.5 : 0;
      const agePenalty = tireAge * 0.4;
      const rainBonus = rainRisk * 15;
      const pitPriority = Math.max(
        0,
        Math.min(100, baseScore - tempPenalty - agePenalty + rainBonus)
      );

      const baseOptimalLap = 18 + tireAge * 0.2 + (trackTemp - 38) * 0.1;
      const recommendedLap =
        currentLap < 60
          ? Math.round(Math.max(currentLap + 3, baseOptimalLap))
          : null;

      const undercutScore =
        position <= 5 && currentLap <= 20 && tireAge > 12
          ? Math.max(
              0,
              Math.min(
                100,
                85 - (position - 1) * 10 + (tireAge - 12) * 3 - ((competitorBehind?.pits ?? 0) * 15)
              )
            )
          : 0;

      const overcutScore =
        position >= 5 && currentLap >= 18 && tireAge < 10
          ? Math.max(
              0,
              Math.min(
                100,
                70 - (position - 5) * 5 + (12 - tireAge) * 4 + ((competitorAhead?.pits ?? 0) * 20)
              )
            )
          : 0;

      const coverRisk =
        competitorBehind && competitorBehind.pits > (pos?.pits ?? 0)
          ? Math.min(100, 60 + competitorBehind.pits * 20)
          : 0;

      const notes: string[] = [];
      if (rainRisk > 0.2) notes.push("Wet conditions — monitor Inter/Wet timing");
      if (tireAge > 25) notes.push("High degradation — early stop window");
      if (position <= 3 && currentLap <= 20) notes.push("Front-runner strategy locked");
      if (undercutScore > 70) notes.push("Strong undercut opportunity");
      if (overcutScore > 60) notes.push("Overcut viable against ahead car");
      if (coverRisk > 70) notes.push("Cover stop from behind — priority pit");
      if (recommendedLap && Math.abs(recommendedLap - currentLap) <= 3)
        notes.push(`Optimal pit window NOW — Lap ${recommendedLap}`);

      return {
        driver,
        position,
        trackTemp,
        tireAge,
        compound,
        rainRisk,
        underCutOpportunity: undercutScore,
        overCutOpportunity: overcutScore,
        coverRisk,
        pitPriority,
        recommendedLap,
        strategyNotes: notes,
      };
    });
  }, [drivers, positions, weather, laps]);

  const sorted = [...advices].sort((a, b) => b.pitPriority - a.pitPriority);

  const avgTrackTemp = weather?.track_temp ?? 38;
  const avgRainRisk = weather?.rainfall ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">AI Strategy Advisor</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time pit priority &amp; undercut/overcut scores
            {weather && (
              <span className="ml-2 text-slate-600">
                • Track {avgTrackTemp}C • Rain {Math.round(avgRainRisk * 100)}%
              </span>
            )}
          </p>
        </div>
        {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-electricBlue border-t-transparent" />}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "P1 Priority",
            value: sorted[0]?.driver.last_name ?? "—",
            sub: sorted[0] ? `Lap ${sorted[0].recommendedLap ?? "—"}` : "",
            icon: Shield,
            color: "text-amber",
          },
          {
            label: "Cover Risk",
            value: advices.filter((a) => a.coverRisk > 70).length > 0
              ? advices.find((a) => a.coverRisk > 70)?.driver.last_name ?? "—"
              : "None",
            sub: advices.filter((a) => a.coverRisk > 70).length > 0
              ? `${advices.filter((a) => a.coverRisk > 70).length} cars at risk`
              : "Track clear",
            icon: AlertTriangle,
            color: advices.filter((a) => a.coverRisk > 70).length > 0 ? "text-signalRed" : "text-racingGreen",
          },
          {
            label: "Wet Alert",
            value: avgRainRisk > 0.2 ? "Active" : "Clear",
            sub: avgRainRisk > 0.2 ? `${Math.round(avgRainRisk * 100)}% rainfall` : "No rain expected",
            icon: Zap,
            color: avgRainRisk > 0.2 ? "text-electricBlue" : "text-slate-400",
          },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
            <div className="flex items-center gap-2">
              <Icon size={14} className={color} />
              <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
            </div>
            <p className={`mt-1 font-mono text-base font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-600">{sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {sorted.map((advice) => {
          const isPriority = advice.pitPriority > 80;
          const hasNotes = advice.strategyNotes.length > 0;

          return (
            <div
              key={advice.driver.driver_number}
              className={`rounded-xl border p-4 transition-all ${
                isPriority
                  ? "border-electricBlue/30 bg-electricBlue/5"
                  : "border-white/[0.05] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.04] font-mono text-sm font-black text-slate-400">
                    P{advice.position}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: driverColor(advice.driver) }}
                      />
                      <p className="text-sm font-semibold text-white">{advice.driver.full_name}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {advice.driver.team_name} •{" "}
                      <span className={`uppercase font-mono ${
                        advice.compound === "SOFT" ? "text-signalRed" :
                        advice.compound === "MEDIUM" ? "text-amber" :
                        advice.compound === "HARD" ? "text-slate-300" :
                        "text-electricBlue"
                      }`}>
                        {advice.compound}
                      </span>
                      {" "}• Age {advice.tireAge}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {advice.recommendedLap && (
                    <div className="text-center">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pit</p>
                      <p className={`font-mono text-lg font-black ${Math.abs(advice.recommendedLap - (advice.trackTemp / 1)) <= 3 ? "text-racingGreen" : "text-slate-300"}`}>
                        {advice.recommendedLap}
                      </p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority</p>
                    <div className="mt-0.5 h-2 w-12 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${advice.pitPriority}%`,
                          background: advice.pitPriority > 80 ? "#2dd4ff" : advice.pitPriority > 60 ? "#19d084" : "#64748b",
                        }}
                      />
                    </div>
                    <p className="font-mono text-xs text-slate-400">{advice.pitPriority}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className={`rounded-lg border p-2 text-center ${
                  advice.underCutOpportunity > 60
                    ? "border-racingGreen/30 bg-racingGreen/5"
                    : "border-white/[0.04]"
                }`}>
                  <div className="flex items-center justify-center gap-1">
                    <TrendingDown size={11} className={advice.underCutOpportunity > 60 ? "text-racingGreen" : "text-slate-600"} />
                    <p className="text-[9px] uppercase tracking-wider text-slate-600">Undercut</p>
                  </div>
                  <p className={`mt-1 font-mono text-sm font-black ${advice.underCutOpportunity > 60 ? "text-racingGreen" : "text-slate-500"}`}>
                    {advice.underCutOpportunity > 0 ? `${advice.underCutOpportunity}%` : "—"}
                  </p>
                </div>
                <div className={`rounded-lg border p-2 text-center ${
                  advice.overCutOpportunity > 60
                    ? "border-electricBlue/30 bg-electricBlue/5"
                    : "border-white/[0.04]"
                }`}>
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp size={11} className={advice.overCutOpportunity > 60 ? "text-electricBlue" : "text-slate-600"} />
                    <p className="text-[9px] uppercase tracking-wider text-slate-600">Overcut</p>
                  </div>
                  <p className={`mt-1 font-mono text-sm font-black ${advice.overCutOpportunity > 60 ? "text-electricBlue" : "text-slate-500"}`}>
                    {advice.overCutOpportunity > 0 ? `${advice.overCutOpportunity}%` : "—"}
                  </p>
                </div>
                <div className={`rounded-lg border p-2 text-center ${
                  advice.coverRisk > 60
                    ? "border-signalRed/30 bg-signalRed/5"
                    : "border-white/[0.04]"
                }`}>
                  <div className="flex items-center justify-center gap-1">
                    <AlertTriangle size={11} className={advice.coverRisk > 60 ? "text-signalRed" : "text-slate-600"} />
                    <p className="text-[9px] uppercase tracking-wider text-slate-600">Cover</p>
                  </div>
                  <p className={`mt-1 font-mono text-sm font-black ${advice.coverRisk > 60 ? "text-signalRed" : "text-slate-500"}`}>
                    {advice.coverRisk > 0 ? `${advice.coverRisk}%` : "—"}
                  </p>
                </div>
              </div>

              {hasNotes && (
                <div className="mt-3 space-y-1">
                  {advice.strategyNotes.slice(0, 2).map((note, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`h-1 w-1 rounded-full ${
                        note.includes("NOW") ? "bg-racingGreen" :
                        note.includes("Strong") || note.includes("Overcut viable") ? "bg-electricBlue" :
                        note.includes("Cover") ? "bg-signalRed" :
                        note.includes("Wet") ? "bg-amber" :
                        "bg-slate-600"
                      }`} />
                      <span className="text-slate-400">{note}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {advices.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Brain size={32} className="text-slate-600" />
          <p className="mt-3 text-sm text-slate-400">Select a live session to see strategy advice</p>
          <p className="mt-1 text-xs text-slate-600">AI-powered pit priority and opportunity analysis</p>
        </div>
      )}
    </div>
  );
}
