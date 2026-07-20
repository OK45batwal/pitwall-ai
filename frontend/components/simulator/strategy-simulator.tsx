"use client";

import { useCallback, useEffect, useState } from "react";
import { Calculator, Save, Shuffle, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RaceSimulationChart, TireWearChart } from "@/components/charts/telemetry-charts";
import {
  type Driver,
  fetchSessions,
  fetchDrivers,
  fetchLaps,
  driverColor,
} from "@/lib/openf1";
import { drivers, savedSimulations } from "@/lib/mock-data";

const compounds = ["Soft", "Medium", "Hard", "Intermediate"];

export function StrategySimulator() {
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const [f1Drivers, setF1Drivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState("nor");
  const [compound, setCompound] = useState("Hard");
  const [stopLap, setStopLap] = useState(18);

  useEffect(() => {
    fetchSessions(2026).then((sessions) => {
      const race = sessions.filter((s) => s.session_type === "Race" || s.session_type === "Qualifying");
      const key = race.length > 0 ? race[race.length - 1].session_key : null;
      setSessionKey(key);
      if (key) {
        fetchDrivers(key).then(setF1Drivers).catch(() => setF1Drivers([]));
      }
    }).catch(() => {});
  }, []);

  const allDrivers = f1Drivers.length > 0
    ? f1Drivers.map((d) => ({
        id: String(d.driver_number),
        name: d.full_name,
        code: d.last_name ?? String(d.driver_number),
        team: d.team_name,
        color: `#${d.team_color ?? "888888"}`,
        points: 0,
        form: 85,
        tireDeg: 0.16,
        consistency: 87,
      }))
    : drivers;

  const selectedDriver = allDrivers.find((d) => d.id === driverId) ?? allDrivers[0];
  const result = useCallback(() => {
    const compoundScore: Record<string, number> = { Soft: -1.3, Medium: -0.2, Hard: 0.8, Intermediate: 2.4 };
    const lapScore = Math.abs(stopLap - 18) * 0.22;
    const delta = +(compoundScore[compound] + lapScore - (selectedDriver.form ?? 80) / 70).toFixed(2);
    const position = Math.max(1, Math.min(8, Math.round(4 + delta - (selectedDriver.consistency ?? 85) / 55)));
    return {
      finalPosition: `P${position}`,
      raceDelta: `${delta > 0 ? "+" : ""}${delta}s`,
      undercut: stopLap <= 18 ? "Strong" : "Weak",
      overcut: stopLap >= 21 ? "Available" : "Limited",
      confidence: Math.max(54, Math.round(92 - Math.abs(stopLap - 18) * 3)),
    };
  }, [compound, selectedDriver, stopLap])();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-electricBlue/20 to-electricBlue/5 text-electricBlue shadow-[0_0_20px_rgba(45,212,255,0.15)]">
          <Radio size={20} />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-electricBlue">Pit Strategy</p>
          <h1 className="text-2xl font-black text-white md:text-3xl">Strategy Simulator</h1>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 backdrop-blur-md space-y-5">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Driver</p>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 text-sm font-semibold text-white backdrop-blur-sm"
            >
              {allDrivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.team}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Tire Compound</p>
            <div className="grid grid-cols-2 gap-2">
              {compounds.map((item) => (
                <button
                  key={item}
                  onClick={() => setCompound(item)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${compound === item ? "border-electricBlue bg-electricBlue/15 text-white shadow-[0_0_15px_rgba(45,212,255,0.15)]" : "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Pit Stop Lap: {stopLap}</p>
            <input
              min={8}
              max={45}
              value={stopLap}
              type="range"
              onChange={(e) => setStopLap(Number(e.target.value))}
              className="w-full accent-electricBlue"
            />
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>Early (Lap 8)</span>
              <span>Optimal (Lap 18)</span>
              <span>Late (Lap 45)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button><Calculator size={15} className="mr-2" />Simulate</Button>
            <Button variant="ghost"><Save size={15} className="mr-2" />Save</Button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Final Position", result.finalPosition],
              ["Race Delta", result.raceDelta],
              ["Undercut", result.undercut],
              ["Confidence", `${result.confidence}%`]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 backdrop-blur-md">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</div>
                <div className="mt-2 text-2xl font-black text-white">{value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Undercut vs Overcut</h2>
              <Shuffle size={16} className="text-electricBlue" />
            </div>
            <RaceSimulationChart />
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 backdrop-blur-md">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Tire Degradation</h2>
            <TireWearChart />
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 backdrop-blur-md">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Saved Simulations</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {savedSimulations.map((sim) => (
                <div key={sim.name} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                  <div className="font-semibold text-white">{sim.name}</div>
                  <div className="mt-2 text-sm text-slate-400">{sim.driver} lap {sim.stopLap} to {sim.compound}</div>
                  <div className="mt-3 flex justify-between font-mono text-sm text-electricBlue">
                    <span>{sim.outcome}</span>
                    <span>{sim.delta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
