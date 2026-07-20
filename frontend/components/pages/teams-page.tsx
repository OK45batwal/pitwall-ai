'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Users, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { F1_2026_STANDINGS, F1_2026_TEAM_STANDINGS, F1_2026_DRIVERS } from '@/datasets/f1-2026-data';
import { F1_2025_STANDINGS, F1_2025_TEAM_STANDINGS } from '@/datasets/f1-2026-data';
import type { Driver } from '@/lib/openf1';
import { fetchDrivers } from '@/lib/openf1';

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

function MetricBar({ value, max = 600, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
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

    const driverPoints = new Map<number, number>();
    const driverPositions = new Map<number, number>();
    const driverWins = new Map<number, number>();
    const driverPodiums = new Map<number, number>();

    const sorted = [...intervals].sort((a: any, b: any) => (a.position ?? 99) - (b.position ?? 99));
    sorted.forEach((entry: any, idx: number) => {
      const current = driverPoints.get(entry.driver_number) ?? 0;
      const gap = (entry.gap_to_leader ?? Infinity);
      const estimatedPoints = gap < 10000 ? Math.max(0, 25 - idx * (idx > 0 ? 1 : 0)) : 0;
      driverPoints.set(entry.driver_number, current + estimatedPoints);
      if (!driverPositions.has(entry.driver_number)) {
        driverPositions.set(entry.driver_number, entry.position ?? idx + 1);
        if (entry.position === 1) driverWins.set(entry.driver_number, (driverWins.get(entry.driver_number) ?? 0) + 1);
        if (entry.position && entry.position <= 3) driverPodiums.set(entry.driver_number, (driverPodiums.get(entry.driver_number) ?? 0) + 1);
      }
    });

    return { driverPoints, driverPositions, driverWins, driverPodiums, drivers: driversRes };
  } catch {
    return null;
  }
}

export default function TeamsPage() {
  const [year, setYear] = useState<2025 | 2026>(2026);
  const [activeTab, setActiveTab] = useState<'drivers' | 'teams'>('drivers');
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

  const sortedDrivers = [...driverStandings].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'points') cmp = (b.points - a.points);
    else if (sortBy === 'wins') cmp = (b.wins - a.wins);
    else cmp = a.team.localeCompare(b.team);
    return sortDir === 'desc' ? cmp : -cmp;
  });

  const sortedTeams = [...teamStandings].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'points') cmp = b.points - a.points;
    else if (sortBy === 'wins') cmp = b.wins - a.wins;
    else cmp = b.podiums - a.podiums;
    return sortDir === 'desc' ? cmp : -cmp;
  });

  const prevYear = year === 2026 ? 2025 : 2024;
  const nextYear = year === 2026 ? undefined : 2026;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Standings</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-400 text-sm">F1 Championship {year}</p>
              {year === 2026 && <LiveIndicator live={isLive} />}
              {lastUpdated && isLive && (
                <span className="text-xs text-gray-600">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
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
          {!nextYear && (
            <span className="px-3 py-1.5 rounded text-sm text-gray-600">Latest</span>
          )}
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

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('drivers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'drivers' ? 'bg-electricBlue/20 text-electricBlue border border-electricBlue/30' : 'text-gray-400 hover:text-white'}`}
        >
          <Users size={16} />
          Drivers
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'teams' ? 'bg-electricBlue/20 text-electricBlue border border-electricBlue/30' : 'text-gray-400 hover:text-white'}`}
        >
          <Trophy size={16} />
          Teams
        </button>
      </div>

      {activeTab === 'drivers' && (
        <>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Sort:</span>
            {(['points', 'wins', 'team'] as const).map(s => (
              <button key={s} onClick={() => { if (sortBy === s) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortBy(s); setSortDir('desc'); } }}
                className={`px-3 py-1 rounded text-xs font-medium transition ${sortBy === s ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {s} {sortBy === s ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </button>
            ))}
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">Pos</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-500">Team</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-500">Pts</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-500 hidden sm:table-cell">W</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-500 hidden sm:table-cell">P</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-500 hidden md:table-cell">FL</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-500 hidden md:table-cell">Pole</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-500 hidden lg:table-cell">DNF</th>
                </tr>
              </thead>
              <tbody>
                {sortedDrivers.map((entry) => {
                  const color = TEAM_COLORS[entry.team] ?? '#888888';
                  return (
                    <tr key={entry.driver} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                      <td className="px-4 py-3"><PositionBadge pos={entry.position} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                          <span className="font-semibold text-white text-sm">{entry.driver}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400">{entry.team}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-bold text-electricBlue">{entry.points}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className="font-mono text-amber-400 font-bold">{entry.wins}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className="font-mono text-gray-300">{entry.podiums}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className="font-mono text-cyan-400">{entry.fastestLaps ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className="font-mono text-purple-400">{entry.poles ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className={`font-mono ${(entry.dnf ?? 0) > 0 ? 'text-red-400' : 'text-gray-500'}`}>{entry.dnf ?? 0}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'teams' && (
        <>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Sort:</span>
            {(['points', 'wins', 'podiums'] as const).map(s => (
              <button key={s} onClick={() => { if (sortBy === s) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortBy(s as any); setSortDir('desc'); } }}
                className={`px-3 py-1 rounded text-xs font-medium transition ${sortBy === s ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {s} {sortBy === s ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedTeams.map(entry => {
              const color = TEAM_COLORS[entry.team] ?? '#888888';
              return (
                <div key={entry.team} className="relative overflow-hidden rounded-xl bg-white/[0.03] border border-white/10 p-5 hover:border-white/20 transition">
                  <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-5" style={{ background: color }} />
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-black text-2xl ${entry.position === 1 ? 'text-amber-400' : entry.position === 2 ? 'text-gray-300' : entry.position === 3 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {entry.position}
                      </span>
                      <div>
                        <h3 className="text-white font-semibold text-base">{entry.team}</h3>
                        <p className="text-xs text-gray-500">{entry.wins} wins · {entry.podiums} podiums</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-white">{entry.points}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">PTS</div>
                    </div>
                  </div>
                  <MetricBar value={entry.points} max={600} color={color} />
                  {entry.trend && (
                    <div className={`mt-2 text-xs font-bold ${entry.trend.startsWith('+') ? 'text-green-400' : entry.trend.startsWith('-') ? 'text-red-400' : 'text-gray-400'}`}>
                      {entry.trend} from prev year
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}