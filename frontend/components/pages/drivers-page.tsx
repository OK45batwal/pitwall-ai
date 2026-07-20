'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Flag, Timer, Zap, TrendingUp, Medal, RotateCcw, Target, Star, Users, RefreshCw } from 'lucide-react';
import { F1_2026_DRIVERS, F1_2026_STANDINGS, F1_2026_CALENDAR, F1_2026_RACE_RESULTS, F1_2026_TEAMS, F1_2026_TEAM_STANDINGS } from '@/lib/mock-data';
import { F1_2025_STANDINGS, F1_2025_TEAM_STANDINGS } from '@/datasets/f1-2026-data';
import { fetchDrivers } from '@/lib/openf1';
import type { Driver } from '@/lib/openf1';

const TEAM_COLORS: Record<string, string> = {
  "McLaren": "#ff8700",
  "Ferrari": "#e80020",
  "Mercedes": "#27f4d2",
  "Red Bull Racing": "#3671c6",
  "Aston Martin": "#229971",
  "Alpine": "#ff87bc",
  "Williams": "#6412ff",
  "RB": "#6e0000",
  "Haas F1 Team": "#b9b9b9",
  "Audi": "#52e252",
  "Cadillac": "#000e2e",
  "Kick Sauber": "#00e600",
};

const DRIVER_FLAGS: Record<string, string> = {
  "McLaren": "🇬🇧🇦🇺", "Ferrari": "🇲🇨🇬🇧", "Mercedes": "🇮🇹🇬🇧",
  "Red Bull Racing": "🇳🇱🇫🇷", "Aston Martin": "🇪🇸🇨🇦", "Alpine": "🇫🇷",
  "Williams": "🇹🇭🇪🇸", "RB": "🇳🇿🇸🇪", "Haas F1 Team": "🇫🇷🇬🇧",
  "Audi": "🇧🇷🇩🇪", "Cadillac": "🇫🇮🇲🇽", "Kick Sauber": "🇫🇮🇩🇪",
};

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: typeof Trophy }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/[0.05]">
        <Icon size={18} className="text-electricBlue" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black text-white">{value}</p>
        {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

function PositionBadge({ pos }: { pos: number }) {
  const colors = ['text-amber-400', 'text-gray-300', 'text-amber-600', 'text-gray-400', 'text-gray-500'];
  return <span className={`font-mono font-black text-lg ${colors[pos - 1] ?? 'text-gray-600'}`}>{pos}</span>;
}

function LiveIndicator({ live }: { live: boolean }) {
  if (!live) return null;
  return (
    <span className="flex items-center gap-1.5 text-xs text-green-400">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
      </span>
      Live
    </span>
  );
}

async function fetchLiveStandings() {
  try {
    const sessions = await fetch(`https://api.openf1.org/v1/sessions?session_type=R&year=2026&limit=1`);
    if (!sessions.ok) return null;
    const sessionData = await sessions.json();
    if (!sessionData?.length) return null;
    const sessionKey = sessionData[0].session_key;

    const [driversRes, intervalsRes] = await Promise.all([
      fetchDrivers(sessionKey),
      fetch(`https://api.openf1.org/v1/intervals?session_key=${sessionKey}`),
    ]);

    if (!intervalsRes.ok) return null;
    const intervals = await intervalsRes.json();

    const driverPositions = new Map<number, number>();
    const driverPoints = new Map<number, number>();
    const driverWins = new Map<number, number>();
    const driverPodiums = new Map<number, number>();

    const sorted = [...intervals].sort((a: any, b: any) => (a.position ?? 99) - (b.position ?? 99));
    sorted.forEach((entry: any, idx: number) => {
      const gap = (entry.gap_to_leader ?? Infinity);
      const estimatedPoints = gap < 10000 ? Math.max(0, 25 - idx * (idx > 0 ? 1 : 0)) : 0;
      driverPoints.set(entry.driver_number, (driverPoints.get(entry.driver_number) ?? 0) + estimatedPoints);
      if (!driverPositions.has(entry.driver_number)) {
        driverPositions.set(entry.driver_number, entry.position ?? idx + 1);
        if (entry.position === 1) driverWins.set(entry.driver_number, (driverWins.get(entry.driver_number) ?? 0) + 1);
        if (entry.position && entry.position <= 3) driverPodiums.set(entry.driver_number, (driverPodiums.get(entry.driver_number) ?? 0) + 1);
      }
    });

    return { driverPositions, driverPoints, driverWins, driverPodiums, drivers: driversRes };
  } catch {
    return null;
  }
}

export function DriversPage() {
  const [year, setYear] = useState<2025 | 2026>(2026);
  const [sortBy, setSortBy] = useState<'points' | 'wins' | 'team'>('points');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveOverride, setLiveOverride] = useState<typeof F1_2026_STANDINGS | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadLiveData = useCallback(async () => {
    setIsLoading(true);
    try {
      const live = await fetchLiveStandings();
      if (live && live.drivers.length > 0) {
        const override = F1_2026_STANDINGS.map(s => {
          const liveDriver = live.drivers.find((d: Driver) =>
            d.driver_number === s.number ||
            d.full_name === s.driver ||
            d.full_name.includes(s.driver.split(' ')[0])
          );
          if (liveDriver) {
            const livePos = live.driverPositions.get(liveDriver.driver_number);
            const points = live.driverPoints.get(liveDriver.driver_number) ?? s.points;
            return { ...s, position: livePos ?? s.position, points };
          }
          return s;
        }).sort((a, b) => a.position - b.position).map((d, i) => ({ ...d, position: i + 1 }));

        setLiveOverride(override);
        setIsLive(true);
        setLastUpdated(new Date());
      } else {
        setIsLive(false);
        setLiveOverride(null);
      }
    } catch {
      setIsLive(false);
      setLiveOverride(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (year === 2026) {
      loadLiveData();
      const interval = setInterval(loadLiveData, 30000);
      return () => clearInterval(interval);
    } else {
      setIsLive(false);
      setLiveOverride(null);
    }
  }, [year, loadLiveData]);

  const driverStandings = liveOverride ?? (year === 2026 ? F1_2026_STANDINGS : F1_2025_STANDINGS);
  const teamStandings = year === 2026 ? F1_2026_TEAM_STANDINGS : F1_2025_TEAM_STANDINGS;
  const drivers = year === 2026 ? F1_2026_DRIVERS : F1_2026_DRIVERS;

  const sortedDrivers = [...driverStandings].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'points') cmp = (b.points - a.points);
    else if (sortBy === 'wins') cmp = (b.wins - a.wins);
    else cmp = a.team.localeCompare(b.team);
    return sortDir === 'desc' ? cmp : -cmp;
  });

  const topThree = sortedDrivers.slice(0, 3);
  const rest = sortedDrivers.slice(3);

  const prevYear = year === 2026 ? 2025 : 2024;
  const nextYear = year === 2026 ? undefined : 2026;

  const totalPoints = driverStandings.reduce((sum, d) => sum + d.points, 0);
  const totalWins = driverStandings.reduce((sum, d) => sum + d.wins, 0);
  const totalPodiums = driverStandings.reduce((sum, d) => sum + d.podiums, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-electricBlue/20 to-electricBlue/5 text-electricBlue shadow-[0_0_20px_rgba(45,212,255,0.15)]">
            <Star size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-electricBlue">2026 Season</p>
              {year === 2026 && <LiveIndicator live={isLive} />}
            </div>
            <h1 className="text-2xl font-black text-white md:text-3xl">Driver Standings</h1>
            {lastUpdated && isLive && (
              <p className="text-xs text-gray-600 mt-0.5">Updated {lastUpdated.toLocaleTimeString()}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear(prevYear as 2025)}
            className="px-3 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            ← {prevYear}
          </button>
          <span className="px-4 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold text-base">
            {year}
          </span>
          {nextYear && (
            <button
              onClick={() => setYear(nextYear as 2026)}
              className="px-3 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              {nextYear} →
            </button>
          )}
          {!nextYear && <span className="px-3 py-1.5 rounded text-sm text-gray-600">Latest</span>}
          {year === 2026 && (
            <button
              onClick={loadLiveData}
              disabled={isLoading}
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
              title="Refresh live data"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Points" value={totalPoints} sub={`${year} season`} icon={Trophy} />
        <StatCard label="Total Wins" value={totalWins} sub="race victories" icon={Flag} />
        <StatCard label="Total Podiums" value={totalPodiums} sub="top 3 finishes" icon={Medal} />
        <StatCard label="Drivers" value={driverStandings.length} sub="competing" icon={Users} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topThree.map((standing, i) => {
          const driver = drivers.find(d => d.full_name === standing.driver || d.full_name.includes(standing.driver.split(' ')[0]));
          const color = TEAM_COLORS[standing.team] ?? '#888888';
          const medals = ['🥇', '🥈', '🥉'];
          return (
            <div key={standing.driver} className={`relative overflow-hidden rounded-2xl border p-5 ${i === 0 ? 'border-amber/40 bg-amber/5' : 'border-white/10 bg-white/[0.03]'}`}>
              <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-5" style={{ background: color }} />
              <div className="text-center">
                <p className="text-4xl font-black">{medals[i]}</p>
                <div className="mx-auto mt-3 h-14 w-14 rounded-full border-2" style={{ borderColor: color, background: `${color}20` }} />
                <p className="mt-2 font-bold text-white text-sm">{standing.driver}</p>
                <p className="text-xs text-slate-500">{standing.team}</p>
                <p className="mt-3 font-mono text-4xl font-black text-electricBlue">{standing.points}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-600">points</p>
                <div className="mt-3 flex justify-center gap-4 text-xs">
                  <span className="text-amber font-bold">{standing.wins}W</span>
                  <span className="text-slate-400">{standing.podiums}P</span>
                  <span className="text-cyan-400">{standing.fastestLaps ?? 0}FL</span>
                </div>
                <div className="mt-2 flex justify-center gap-2 text-xs text-slate-500">
                  <span>Poles: {standing.poles ?? 0}</span>
                  <span>•</span>
                  <span>DNF: {standing.dnf ?? 0}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">All Drivers ({driverStandings.length})</h2>
          <div className="flex gap-2">
            {(['points', 'wins', 'team'] as const).map(s => (
              <button
                key={s}
                onClick={() => { if (sortBy === s) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortBy(s); setSortDir('desc'); } }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${sortBy === s ? 'bg-electricBlue/20 text-electricBlue border border-electricBlue/30' : 'bg-white/[0.04] text-slate-500 border border-white/[0.06]'}`}
              >
                {s} {sortBy === s ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {sortedDrivers.map(standing => {
            const color = TEAM_COLORS[standing.team] ?? '#888888';
            return (
              <div key={standing.driver} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition">
                <div className="flex items-center gap-3">
                  <PositionBadge pos={standing.position} />
                  <div className="h-8 w-8 rounded-full" style={{ background: color }} />
                  <div>
                    <p className="text-sm font-semibold text-white">{standing.driver}</p>
                    <p className="text-xs text-slate-500">{standing.team}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-electricBlue">{standing.points}</p>
                    <p className="text-[10px] text-slate-600">pts</p>
                  </div>
                  <div className="grid w-20 grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <p className="font-mono font-bold text-amber">{standing.wins}</p>
                      <p className="text-slate-600">W</p>
                    </div>
                    <div>
                      <p className="font-mono font-bold text-slate-300">{standing.podiums}</p>
                      <p className="text-slate-600">P</p>
                    </div>
                    <div>
                      <p className="font-mono font-bold text-cyan-400">{standing.fastestLaps ?? 0}</p>
                      <p className="text-slate-600">FL</p>
                    </div>
                    <div>
                      <p className="font-mono font-bold text-purple-400">{standing.poles ?? 0}</p>
                      <p className="text-slate-600">PO</p>
                    </div>
                  </div>
                  <span className="w-10 rounded-full bg-white/[0.06] px-2 py-1 text-center font-mono text-xs font-bold text-slate-300">
                    #{standing.number}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">2026 Race Calendar</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {F1_2026_CALENDAR.map((race) => {
              const result = F1_2026_RACE_RESULTS[race.round];
              const winnerEntry = result ? result.find(r => r.position === 1) : null;
              return (
                <div key={race.round} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center font-mono text-sm font-bold text-slate-500">R{race.round}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{race.name}</p>
                      <p className="text-xs text-slate-500">{race.circuit} &middot; {race.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {race.status === 'completed' && winnerEntry ? (
                      <p className="text-xs font-semibold text-green-400">{winnerEntry.driver}</p>
                    ) : race.status === 'cancelled' ? (
                      <span className="text-xs font-semibold text-red-400">Cancelled</span>
                    ) : (
                      <p className="text-xs text-slate-400">{new Date(race.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                    )}
                    {race.sprint && <span className="text-[10px] uppercase tracking-wider text-amber">Sprint</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Constructor Standings</h2>
          <div className="space-y-3">
            {teamStandings.slice(0, 11).map(entry => {
              const color = TEAM_COLORS[entry.team] ?? '#888888';
              return (
                <div key={entry.team} className="flex items-center gap-3">
                  <span className={`w-8 text-center font-mono font-black text-lg ${entry.position === 1 ? 'text-amber' : entry.position === 2 ? 'text-slate-300' : entry.position === 3 ? 'text-amber-600' : 'text-slate-500'}`}>
                    {entry.position}
                  </span>
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{entry.team}</p>
                    <p className="text-xs text-slate-500">{entry.wins} wins &middot; {entry.podiums} podiums</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-electricBlue">{entry.points}</p>
                    <p className="text-[10px] text-slate-600">pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}