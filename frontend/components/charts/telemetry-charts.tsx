"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { type Lap, type Driver, driverColor } from "@/lib/openf1";
import { lapDeltas, pitStopAnalysis, raceSimulation, sectorComparison, teamTrends, tireWear, weatherImpact, winProbability } from "@/lib/mock-data";

const tooltipStyle = {
  background: "rgba(6, 8, 15, 0.96)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: 8,
  color: "#e8eef7",
  fontSize: 12,
};

export function buildLapDeltaData(laps: Lap[], drivers: Driver[]) {
  const byLap = new Map<number, { driver_number: number; lap_time: number }[]>();
  for (const lap of laps) {
    if (lap.lap_time == null || lap.is_pit_out_lap) continue;
    if (!byLap.has(lap.lap_number)) byLap.set(lap.lap_number, []);
    byLap.get(lap.lap_number)!.push({ driver_number: lap.driver_number, lap_time: lap.lap_time });
  }

  const driverCodes = new Map<number, string>();
  for (const d of drivers) {
    driverCodes.set(d.driver_number, d.name_acronym ?? d.code ?? String(d.driver_number));
  }

  const data: Record<string, number | string>[] = [];
  for (const [lapNum, entries] of byLap) {
    const fastest = Math.min(...entries.map(e => e.lap_time));
    const point: Record<string, number | string> = { lap: lapNum };
    for (const e of entries) {
      const code = driverCodes.get(e.driver_number) ?? String(e.driver_number);
      point[code] = +(e.lap_time - fastest).toFixed(3);
    }
    data.push(point);
  }
  return data.slice(-30);
}

export function LapDeltaChart({ data }: { data?: Record<string, number | string>[] }) {
  const chartData = data ?? lapDeltas;
  const keys = Object.keys(chartData[0] ?? {}).filter(k => k !== "lap");
  const colors = ["#ff8000", "#00b8ff", "#dc0000", "#00d2be", "#ff87bc", "#0600ef", "#27e4a6", "#ffb800"];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="rgba(148,163,184,0.06)" />
        <XAxis dataKey="lap" stroke="#7e8a9f" tick={{ fontSize: 11 }} />
        <YAxis stroke="#7e8a9f" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `+${v.toFixed(1)}s`} />
        <Tooltip contentStyle={tooltipStyle} />
        {keys.map((key, i) => (
          <Line key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} strokeWidth={1.5} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TireWearChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={tireWear}>
        <defs>
          <linearGradient id="soft" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#dc0000" stopOpacity={0.5} /><stop offset="95%" stopColor="#dc0000" stopOpacity={0.02} /></linearGradient>
          <linearGradient id="medium" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#ffb800" stopOpacity={0.45} /><stop offset="95%" stopColor="#ffb800" stopOpacity={0.02} /></linearGradient>
          <linearGradient id="hard" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#94a3b8" stopOpacity={0.35} /><stop offset="95%" stopColor="#94a3b8" stopOpacity={0.02} /></linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(148,163,184,0.06)" />
        <XAxis dataKey="lap" stroke="#7e8a9f" tick={{ fontSize: 11 }} />
        <YAxis stroke="#7e8a9f" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="soft" stroke="#dc0000" fill="url(#soft)" strokeWidth={1.5} />
        <Area type="monotone" dataKey="medium" stroke="#ffb800" fill="url(#medium)" strokeWidth={1.5} />
        <Area type="monotone" dataKey="hard" stroke="#94a3b8" fill="url(#hard)" strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TeamTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={teamTrends}>
        <CartesianGrid stroke="rgba(148,163,184,0.06)" />
        <XAxis dataKey="race" stroke="#7e8a9f" tick={{ fontSize: 11 }} />
        <YAxis stroke="#7e8a9f" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="McLaren" fill="#ff8000" radius={[3, 3, 0, 0]} />
        <Bar dataKey="RedBull" fill="#0600ef" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Ferrari" fill="#dc0000" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Mercedes" fill="#00d2be" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RaceSimulationChart() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={raceSimulation}>
        <CartesianGrid stroke="rgba(148,163,184,0.06)" />
        <XAxis dataKey="lap" stroke="#7e8a9f" tick={{ fontSize: 11 }} />
        <YAxis stroke="#7e8a9f" tick={{ fontSize: 11 }} domain={["dataMin - .4", "dataMax + .4"]} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="baseline" stroke="#7e8a9f" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="undercut" stroke="#00b8ff" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="overcut" stroke="#dc0000" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SectorComparisonChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={sectorComparison}>
        <CartesianGrid stroke="rgba(148,163,184,0.06)" />
        <XAxis dataKey="driver" stroke="#7e8a9f" tick={{ fontSize: 11 }} />
        <YAxis stroke="#7e8a9f" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="S1" fill="#00b8ff" radius={[3, 3, 0, 0]} />
        <Bar dataKey="S2" fill="#dc0000" radius={[3, 3, 0, 0]} />
        <Bar dataKey="S3" fill="#00da7a" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PitStopChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={pitStopAnalysis}>
        <CartesianGrid stroke="rgba(148,163,184,0.06)" />
        <XAxis dataKey="team" stroke="#7e8a9f" tick={{ fontSize: 11 }} />
        <YAxis stroke="#7e8a9f" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="avg" fill="#00b8ff" radius={[3, 3, 0, 0]} />
        <Bar dataKey="best" fill="#dc0000" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeatherImpactChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={weatherImpact}>
        <CartesianGrid stroke="rgba(148,163,184,0.06)" />
        <XAxis dataKey="hour" stroke="#7e8a9f" tick={{ fontSize: 11 }} />
        <YAxis stroke="#7e8a9f" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="rain" stroke="#00b8ff" fill="#00b8ff" fillOpacity={0.12} strokeWidth={1.5} />
        <Area type="monotone" dataKey="trackTemp" stroke="#dc0000" fill="#dc0000" fillOpacity={0.08} strokeWidth={1.5} />
        <Line type="monotone" dataKey="wind" stroke="#ffb800" strokeWidth={1.5} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function WinProbabilityChart() {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie data={winProbability} dataKey="probability" nameKey="name" innerRadius={60} outerWidth={85} paddingAngle={2}>
          {winProbability.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
