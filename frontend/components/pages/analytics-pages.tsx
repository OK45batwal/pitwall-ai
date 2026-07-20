"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  CloudRain,
  Droplets,
  Flag,
  Gauge,
  Heart,
  Radio,
  Settings,
  Shield,
  Star,
  Thermometer,
  Trophy,
  User,
  Wind,
} from "lucide-react";
import {
  type Session,
  type Driver,
  type Position,
  type Weather,
  type Lap,
  fetchSessions,
  fetchDrivers,
  fetchPositions,
  fetchIntervals,
  fetchWeather,
  fetchLaps,
  driverColor,
} from "@/lib/openf1";
import {
  LapDeltaChart,
  PitStopChart,
  RaceSimulationChart,
  SectorComparisonChart,
  TeamTrendChart,
  TireWearChart,
  WeatherImpactChart,
  WinProbabilityChart,
} from "@/components/charts/telemetry-charts";
import { TrackVisualization3D } from "@/components/track/track-visualization-3d";
import { drivers, leaderboard, predictionCards, predictionSummary, teams, weatherImpact, championshipStandings } from "@/lib/mock-data";

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-racingGreen opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-racingGreen" />
    </span>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 backdrop-blur-md ${className}`}>
      {children}
    </div>
  );
}

function MetricBar({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-mono text-white">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

interface LiveState {
  session: Session | null;
  drivers: Driver[];
  positions: Position[];
  weather: Weather | null;
  laps: Lap[];
  loading: boolean;
  error: string | null;
}

function useLiveData(sessionKey: number | null = null) {
  const [state, setState] = useState<LiveState>({
    session: null, drivers: [], positions: [], weather: null, laps: [], loading: true, error: null,
  });

  async function load() {
    if (!sessionKey) return;
    try {
      const [drivers, positions, weather, laps] = await Promise.all([
        fetchDrivers(sessionKey),
        fetchPositions(sessionKey),
        fetchWeather(sessionKey),
        fetchLaps(sessionKey),
      ]);
      setState({
        session: null,
        drivers,
        positions: positions.sort((a, b) => (a.position ?? 99) - (b.position ?? 99)),
        weather: Array.isArray(weather) ? weather[weather.length - 1] : weather,
        laps,
        loading: false,
        error: null,
      });
    } catch (e: unknown) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [sessionKey]);

  return state;
}

export function LiveRacePage() {
  const { drivers: liveDrivers, positions, loading, error } = useLiveData(null);

  const merged = positions.map((pos) => {
    const driver = liveDrivers.find((d) => d.driver_number === pos.driver_number);
    return { ...pos, driver };
  }).sort((a, b) => (a.position ?? 99) - (b.position ?? 99));

  return (
    <PageFrame title="Live Race Tracker" kicker="Real-time telemetry" icon={Radio}>
      {loading && <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-electricBlue border-t-transparent" /></div>}
      {error && <div className="rounded-xl border border-signalRed/30 bg-signalRed/10 px-4 py-3 text-sm text-signalRed">Demo mode — {error}</div>}
      <section className="grid gap-5 xl:grid-cols-[.7fr_1.3fr]">
        <SectionCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Live Positions</h2>
            {merged.length > 0 && <LiveDot />}
          </div>
          <div className="space-y-1.5">
            {(merged.length > 0 ? merged : leaderboard.map((d, i) => ({ position: i + 1, driver_number: 0, interval: null, gap_to_leader: null, retired: false, pits: 0, stop: 0, driver: null }))).slice(0, 15).map((entry: any, i: number) => (
              <div key={i} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
                <span className={`font-mono text-sm font-black ${(entry as any).position === 1 ? "text-amber" : "text-slate-400"}`}>
                  P{(entry as any).position}
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: (entry as any).driver ? driverColor((entry as any).driver) : "#888" }} />
                  <span className="text-sm font-semibold text-white">
                    {(entry as any).driver?.full_name ?? (entry as any).name ?? `Driver ${(entry as any).driver_number}`}
                  </span>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  {(entry as any).gap_to_leader != null ? `+${((entry as any).gap_to_leader / 1000).toFixed(3)}s` : (entry as any).gap ?? "Leader"}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard className="p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Lap Delta</h2>
            <p className="mt-0.5 text-xs text-slate-500">WebSocket live feed</p>
          </div>
          <LapDeltaChart />
        </SectionCard>
      </section>
      <SectionCard className="p-4">
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">3D Track Positioning</h2>
          <p className="mt-0.5 text-xs text-slate-500">Live car vectors</p>
        </div>
        <TrackVisualization3D
          drivers={liveDrivers.length > 0 ? liveDrivers.slice(0, 10) : drivers.map((d, i) => ({
            driver_number: 100 + i,
            full_name: d.name,
            team_name: d.team,
            team_color: d.color.replace("#", ""),
            first_name: d.name.split(" ")[0],
            last_name: d.name.split(" ")[1] ?? "",
            country_code: "GBR",
            code: d.code,
            headshot_url: "",
          }))}
          sessionKey={null}
        />
      </SectionCard>
      <section className="grid gap-5 xl:grid-cols-2">
        <SectionCard><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Sector Comparison</h2><SectorComparisonChart /></SectionCard>
        <SectionCard><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Pit Stop Analysis</h2><PitStopChart /></SectionCard>
      </section>
    </PageFrame>
  );
}

export function DriverAnalyticsPage() {
  return (
    <PageFrame title="Driver Analytics" kicker="Pace, degradation, consistency" icon={Gauge}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {drivers.map((driver) => (
          <SectionCard key={driver.id}>
            <div className="mb-4 flex items-center justify-between">
              <div className="h-3 w-3 rounded-full" style={{ background: driver.color }} />
              <Star size={16} className="text-amber" />
            </div>
            <div className="text-lg font-black text-white">{driver.code}</div>
            <div className="text-sm text-slate-400">{driver.name}</div>
            <div className="mt-4 space-y-2 text-sm">
              <MetricBar label="Form" value={driver.form} color={driver.color} />
              <MetricBar label="Consistency" value={driver.consistency} color="#2dd4ff" />
              <div className="flex justify-between text-slate-400"><span>Tire deg</span><span className="font-mono text-white">{driver.tireDeg}s/lap</span></div>
            </div>
          </SectionCard>
        ))}
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <SectionCard><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Driver Pace Consistency</h2><LapDeltaChart /></SectionCard>
        <SectionCard><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Tire Degradation</h2><TireWearChart /></SectionCard>
      </section>
    </PageFrame>
  );
}

export function TeamPerformancePage() {
  return (
    <PageFrame title="Team Performance" kicker="Aero, strategy, pit execution" icon={Shield}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {teams.map((team) => (
          <SectionCard key={team.name}>
            <div className="text-lg font-black text-white">{team.name}</div>
            <div className="text-xs text-slate-500">{team.powerUnit}</div>
            <div className="mt-4 space-y-2">
              <MetricBar label="Aero" value={team.aero} color={team.color} />
              <MetricBar label="Strategy" value={team.strategy} color="#2dd4ff" />
              <MetricBar label="Pit Crew" value={team.pitCrew} color="#ff254a" />
            </div>
            <div className="mt-4 font-mono text-sm text-racingGreen">{team.trend}% trend</div>
          </SectionCard>
        ))}
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <SectionCard><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Team Performance Trends</h2><TeamTrendChart /></SectionCard>
        <SectionCard><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Pit Stop Execution</h2><PitStopChart /></SectionCard>
      </section>
    </PageFrame>
  );
}

export function AIPredictionPage() {
  return (
    <PageFrame title="AI Prediction Center" kicker="Ensemble race intelligence" icon={Brain}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {predictionCards.map((card) => (
          <SectionCard key={card.label}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{card.label}</div>
                <div className="mt-3 text-xl font-black text-white">{card.value}</div>
              </div>
              <div className="rounded-lg bg-electricBlue/10 px-2 py-1 font-mono text-sm text-electricBlue">{card.probability}%</div>
            </div>
            <p className="mt-4 text-sm text-slate-400">{card.detail}</p>
          </SectionCard>
        ))}
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <SectionCard><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Winner Probability</h2><WinProbabilityChart /></SectionCard>
        <SectionCard><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Optimal Pit Strategy</h2><RaceSimulationChart /></SectionCard>
      </section>
    </PageFrame>
  );
}

export function HistoricalRacePage() {
  return (
    <PageFrame title="Historical Race Analysis" kicker="Model backtests and season form" icon={Activity}>
      <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <SectionCard><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Team Performance Trends</h2><TeamTrendChart /></SectionCard>
        <SectionCard>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Championship Points Impact</h2>
          <div className="space-y-3">
            {championshipStandings.map((row) => (
              <div key={row.driver} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                <div><div className="font-semibold text-white">{row.driver}</div><div className="text-xs text-slate-500">{row.team}</div></div>
                <div className="font-mono text-electricBlue">{row.points} pts</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <SectionCard><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Lap Delta Archive</h2><LapDeltaChart /></SectionCard>
        <SectionCard><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Race Simulation Replay</h2><RaceSimulationChart /></SectionCard>
      </section>
    </PageFrame>
  );
}

export function WeatherPage() {
  return (
    <PageFrame title="Weather Impact Analysis" kicker="Track evolution and rain crossover" icon={CloudRain}>
      <section className="grid gap-4 md:grid-cols-3">
        {weatherImpact.slice(2).map((item) => (
          <SectionCard key={item.hour}>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{item.hour}</div>
            <div className="mt-3 text-2xl font-black text-white">{item.rain}% rain</div>
            <div className="mt-2 text-sm text-slate-400">Track {item.trackTemp}C, wind {item.wind}kph</div>
          </SectionCard>
        ))}
      </section>
      <SectionCard><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Weather Impact Model</h2><WeatherImpactChart /></SectionCard>
      <SectionCard><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Rain Strategy Decision</h2><RaceSimulationChart /></SectionCard>
    </PageFrame>
  );
}

export function ProfilePage() {
  return (
    <PageFrame title="User Profile" kicker="Race engineer workspace" icon={User}>
      <section className="grid gap-5 xl:grid-cols-[.7fr_1.3fr]">
        <SectionCard>
          <div className="grid h-20 w-20 place-items-center rounded-xl bg-signalRed text-2xl font-black text-white shadow-[0_0_25px_rgba(255,37,74,0.4)]">RE</div>
          <h2 className="mt-4 text-2xl font-black text-white">Race Engineer</h2>
          <p className="text-sm text-slate-400">Senior strategy analyst, OpenF1 data feed</p>
          <div className="mt-5 space-y-2 text-sm text-slate-300">
            <div className="flex justify-between"><span>Data source</span><span>OpenF1 v1</span></div>
            <div className="flex justify-between"><span>Saved simulations</span><span>12</span></div>
            <div className="flex justify-between"><span>Alert channels</span><span>3</span></div>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Watch List</h2>
            <Heart size={18} className="text-signalRed" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {drivers.slice(0, 4).map((driver) => (
              <div key={driver.id} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{driver.name}</div>
                    <div className="text-xs text-slate-500">{driver.team}</div>
                  </div>
                  <span className="font-mono text-electricBlue">{driver.code}</span>
                </div>
                <MetricBar label="Watch priority" value={driver.form} color={driver.color} />
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </PageFrame>
  );
}

export function SettingsPage() {
  return (
    <PageFrame title="Settings" kicker="Display and notification controls" icon={Settings}>
      <section className="grid gap-5 xl:grid-cols-3">
        {["Carbon Black", "Electric Blue", "Signal Red"].map((theme) => (
          <SectionCard key={theme}>
            <div className="text-lg font-black text-white">{theme}</div>
            <p className="mt-2 text-sm text-slate-400">Dashboard accent preset for telemetry screens.</p>
            <button className="mt-4 rounded-lg border border-white/[0.1] bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              Apply Theme
            </button>
          </SectionCard>
        ))}
      </section>
      <SectionCard>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Notifications</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {["Safety car risk", "Pit window open", "Rain crossover"].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
              <span className="text-sm font-semibold text-slate-200">{item}</span>
              <span className="h-6 w-11 rounded-full bg-electricBlue/30 p-1">
                <span className="block h-4 w-4 translate-x-5 rounded-full bg-electricBlue shadow-[0_0_8px_rgba(45,212,255,0.5)]" />
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Data Source</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="text-sm font-bold text-white">OpenF1 API</p>
            <p className="mt-1 text-xs text-slate-400">Historical (2023+) + live subscriptions</p>
            <p className="mt-2 font-mono text-xs text-electricBlue">https://api.openf1.org/v1</p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="text-sm font-bold text-white">Ergast API</p>
            <p className="mt-1 text-xs text-slate-400">Legacy historical data</p>
            <p className="mt-2 font-mono text-xs text-electricBlue">https://api.jolpi.ca/ergast/f1</p>
          </div>
        </div>
      </SectionCard>
    </PageFrame>
  );
}

function PageFrame({ children, icon: Icon, kicker, title }: { children: React.ReactNode; icon: typeof Trophy; kicker: string; title: string }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-electricBlue/20 to-electricBlue/5 text-electricBlue shadow-[0_0_20px_rgba(45,212,255,0.15)]">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-electricBlue">{kicker}</p>
          <h1 className="text-2xl font-black text-white md:text-3xl">{title}</h1>
        </div>
      </div>
      {children}
    </div>
  );
}
