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
import { lapDeltas, pitStopAnalysis, raceSimulation, sectorComparison, teamTrends, tireWear, weatherImpact, winProbability } from "@/lib/mock-data";

const tooltipStyle = {
  background: "rgba(9, 11, 16, 0.94)",
  border: "1px solid rgba(148, 163, 184, 0.24)",
  borderRadius: 8,
  color: "#e5edf8"
};

export function WinProbabilityChart() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={winProbability} dataKey="probability" nameKey="name" innerRadius={68} outerRadius={96} paddingAngle={3}>
          {winProbability.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function LapDeltaChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={lapDeltas}>
        <CartesianGrid stroke="rgba(148,163,184,.12)" />
        <XAxis dataKey="lap" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="NOR" stroke="#ff8700" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="VER" stroke="#2dd4ff" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="LEC" stroke="#ff254a" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="RUS" stroke="#27f4d2" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TireWearChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={tireWear}>
        <defs>
          <linearGradient id="soft" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#ff254a" stopOpacity={0.65} />
            <stop offset="95%" stopColor="#ff254a" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="medium" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#ffbd45" stopOpacity={0.58} />
            <stop offset="95%" stopColor="#ffbd45" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="hard" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#e2e8f0" stopOpacity={0.48} />
            <stop offset="95%" stopColor="#e2e8f0" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(148,163,184,.12)" />
        <XAxis dataKey="lap" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="soft" stroke="#ff254a" fill="url(#soft)" />
        <Area type="monotone" dataKey="medium" stroke="#ffbd45" fill="url(#medium)" />
        <Area type="monotone" dataKey="hard" stroke="#e2e8f0" fill="url(#hard)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TeamTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={teamTrends}>
        <CartesianGrid stroke="rgba(148,163,184,.12)" />
        <XAxis dataKey="race" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="McLaren" fill="#ff8700" radius={[4, 4, 0, 0]} />
        <Bar dataKey="RedBull" fill="#2dd4ff" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Ferrari" fill="#ff254a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Mercedes" fill="#27f4d2" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RaceSimulationChart() {
  return (
    <ResponsiveContainer width="100%" height={270}>
      <LineChart data={raceSimulation}>
        <CartesianGrid stroke="rgba(148,163,184,.12)" />
        <XAxis dataKey="lap" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" domain={["dataMin - .4", "dataMax + .4"]} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="undercut" stroke="#2dd4ff" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="overcut" stroke="#ff254a" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SectorComparisonChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={sectorComparison}>
        <CartesianGrid stroke="rgba(148,163,184,.12)" />
        <XAxis dataKey="driver" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="S1" fill="#2dd4ff" radius={[4, 4, 0, 0]} />
        <Bar dataKey="S2" fill="#ff254a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="S3" fill="#19d084" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PitStopChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={pitStopAnalysis}>
        <CartesianGrid stroke="rgba(148,163,184,.12)" />
        <XAxis dataKey="team" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="avg" fill="#2dd4ff" radius={[4, 4, 0, 0]} />
        <Bar dataKey="best" fill="#ff254a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeatherImpactChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={weatherImpact}>
        <CartesianGrid stroke="rgba(148,163,184,.12)" />
        <XAxis dataKey="hour" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="rain" stroke="#2dd4ff" fill="#2dd4ff" fillOpacity={0.18} />
        <Area type="monotone" dataKey="trackTemp" stroke="#ff254a" fill="#ff254a" fillOpacity={0.12} />
        <Line type="monotone" dataKey="wind" stroke="#ffbd45" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
