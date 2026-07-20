"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Activity } from "lucide-react";
import {
  type Driver,
  type CarData,
  fetchDrivers,
  fetchCarData,
  driverColor,
} from "@/lib/openf1";

interface Props {
  sessionKey: number | null;
}

const TOOLTIP_STYLE = {
  background: "rgba(9, 11, 16, 0.94)",
  border: "1px solid rgba(148, 163, 184, 0.24)",
  borderRadius: 8,
  color: "#e5edf8",
};

interface TelemetrySet {
  driver: Driver;
  samples: CarData[];
  speedTrace: Array<{ sample: number; speed: number | null; throttle: number | null; brake: number | null }>;
  maxSpeed: number;
  avgSpeed: number;
}

export function TelemetryComparison({ sessionKey }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [telemetryData, setTelemetryData] = useState<Map<number, CarData[]>>(new Map());
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<"speed" | "throttle" | "brake">("speed");
  const [lapFilter, setLapFilter] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionKey) return;
    fetchDrivers(sessionKey)
      .then(setDrivers)
      .catch(() => {});
  }, [sessionKey]);

  useEffect(() => {
    if (!sessionKey || selected.length === 0) return;
    setLoading(true);

    Promise.all(selected.map((dn) => fetchCarData(sessionKey, dn)))
      .then((allData) => {
        const map = new Map<number, CarData[]>();
        selected.forEach((dn, i) => map.set(dn, allData[i]));
        setTelemetryData(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionKey, selected]);

  const sets = useMemo<TelemetrySet[]>(() => {
    return selected
      .map((dn) => {
        const driver = drivers.find((d) => d.driver_number === dn);
        const samples = telemetryData.get(dn) ?? [];
        if (!driver || samples.length === 0) return null;

        const speedTrace = samples.slice(-100).map((s, i) => ({
          sample: i,
          speed: s.speed,
          throttle: s.throttle,
          brake: s.brake,
        }));

        const speeds = samples.map((s) => s.speed).filter((s) => s > 0);
        const maxSpeed = Math.max(...speeds, 0);
        const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

        return { driver, samples, speedTrace, maxSpeed, avgSpeed };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [selected, drivers, telemetryData]);

  const mergedData = useMemo(() => {
    if (sets.length === 0) return [];
    const maxLen = Math.max(...sets.map((s) => s.speedTrace.length));
    return Array.from({ length: maxLen }, (_, i) => {
      const point: Record<string, number | string | null> = { sample: i };
      sets.forEach((s) => {
        const d = s.speedTrace[i];
        const key = s.driver.last_name ?? String(s.driver.driver_number);
        point[`${key}_speed`] = d?.speed ?? null;
        point[`${key}_throttle`] = d?.throttle ?? null;
        point[`${key}_brake`] = d?.brake ?? null;
      });
      return point;
    });
  }, [sets]);

  const chartColor = ["#2dd4ff", "#ff8700", "#ff254a", "#19d084", "#ffbd45", "#6412ff"];

  function toggleDriver(dn: number) {
    setSelected((prev) => {
      if (prev.includes(dn)) return prev.filter((d) => d !== dn);
      if (prev.length >= 4) return [...prev.slice(1), dn];
      return [...prev, dn];
    });
  }

  const dataKey = (name: string) => `${name}_${chartType}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Telemetry Comparison</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {selected.length === 0 ? "Select up to 4 drivers to compare" : `${selected.length} driver${selected.length > 1 ? "s" : ""} selected`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["speed", "throttle", "brake"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                chartType === type
                  ? "bg-electricBlue/20 text-electricBlue border border-electricBlue/30"
                  : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {drivers.slice(0, 20).map((driver) => {
          const isSelected = selected.includes(driver.driver_number);
          return (
            <button
              key={driver.driver_number}
              onClick={() => toggleDriver(driver.driver_number)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                isSelected
                  ? "border-electricBlue/40 bg-electricBlue/10 text-white shadow-[0_0_12px_rgba(45,212,255,0.15)]"
                  : "border-white/[0.06] bg-white/[0.03] text-slate-400 hover:border-white/[0.12] hover:text-white"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: isSelected ? driverColor(driver) : "#444" }}
              />
              {driver.last_name ?? driver.driver_number}
              <span className="text-slate-600">#{driver.driver_number}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-electricBlue border-t-transparent" />
        </div>
      )}

      {sets.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sets.map((s, i) => (
              <div
                key={s.driver.driver_number}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: chartColor[i] }} />
                  <p className="text-sm font-semibold text-white">
                    {s.driver.last_name}
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Top speed</p>
                    <p className="font-mono font-bold text-white">{Math.round(s.maxSpeed)} km/h</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Avg speed</p>
                    <p className="font-mono font-bold text-white">{Math.round(s.avgSpeed)} km/h</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Samples</p>
                    <p className="font-mono text-slate-300">{s.samples.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Team</p>
                    <p className="text-slate-300">{s.driver.team_name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={mergedData}>
                <CartesianGrid stroke="rgba(148,163,184,.1)" />
                <XAxis dataKey="sample" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  domain={[0, chartType === "speed" ? "auto" : 100]}
                  label={chartType === "speed" ? { value: "km/h", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 10 } : undefined}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                {sets.map((s, i) => (
                  <Line
                    key={s.driver.driver_number}
                    type="monotone"
                    dataKey={dataKey(s.driver.last_name ?? String(s.driver.driver_number))}
                    stroke={chartColor[i]}
                    strokeWidth={1.8}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {chartType === "speed" && sets.length === 2 && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Delta Analysis</h3>
              <div className="space-y-2">
                {sets[0].speedTrace.map((pt, i) => {
                  const other = sets[1].speedTrace[i];
                  if (!pt.speed || !other?.speed) return null;
                  const delta = pt.speed - other.speed;
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-500">Sample {i}</span>
                      <span className={`font-mono font-bold ${delta > 0 ? "text-racingGreen" : "text-signalRed"}`}>
                        {delta > 0 ? "+" : ""}{delta.toFixed(1)} km/h
                      </span>
                    </div>
                  );
                }).filter(Boolean).slice(0, 20)}
              </div>
            </div>
          )}
        </>
      )}

      {selected.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Activity size={32} className="text-slate-600" />
          <p className="mt-3 text-sm text-slate-400">Click driver buttons above to compare telemetry</p>
          <p className="mt-1 text-xs text-slate-600">Select up to 4 drivers — speed, throttle, and brake traces</p>
        </div>
      )}
    </div>
  );
}
