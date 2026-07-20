'use client';

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  Brain,
  CloudRain,
  History,
  Radio,
  Settings,
  Shield,
  Timer,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

const nav: { href: Route; label: string; icon: typeof Activity; badge?: string }[] = [
  { href: "/dashboard", label: "Dashboard", icon: Activity, badge: "Live" },
  { href: "/live-race", label: "Live Race", icon: Radio },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/teams", label: "Teams", icon: Shield },
  { href: "/strategy", label: "Strategy", icon: Timer },
  { href: "/ai-predictions", label: "AI Center", icon: Brain },
  { href: "/history", label: "History", icon: History },
  { href: "/weather", label: "Weather", icon: CloudRain },
];

function Logo({ accentHex, lightMode }: { accentHex: string; lightMode: boolean }) {
  return (
    <div className="relative flex items-center gap-3">
      <div
        className="h-11 w-11 shrink-0 rounded-xl overflow-hidden"
        style={{ boxShadow: `0 0 16px ${accentHex}40` }}
      >
        <img src="/logo.png" alt="PitWall AI" className="h-full w-full object-contain" />
      </div>

      <div>
        <div className={cn("text-lg font-black uppercase tracking-[0.15em]", lightMode ? 'text-[#0f172a]' : 'text-white')}>
          Pit<span style={{ color: accentHex }}>Wall</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: accentHex }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: accentHex }}>AI Strategy</span>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { config, mounted } = useTheme();

  const accentHex = mounted
    ? (config.accent === 'orange' ? '#ff8700' : config.accent === 'blue' ? '#2dd4ff' : config.accent === 'red' ? '#ff254a' : '#19d084')
    : '#ff8700';

  const lightMode = mounted ? config.mode === 'light' : false;

  const bgClass = mounted
    ? (lightMode ? 'bg-[#f8f9fc]' : config.mode === 'carbon' ? 'bg-[#0a0c12]' : 'bg-carbon')
    : 'bg-carbon';

  return (
    <div className={cn("min-h-screen", bgClass)}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 glass-nav lg:block">
        <div className="flex h-full flex-col p-5">
          <Link href="/dashboard" className="mb-8 group">
            <Logo accentHex={accentHex} lightMode={lightMode} />
          </Link>

          <nav className="flex-1 space-y-1">
            {nav.map(({ href, label, icon: Icon, badge }) => {
              const active = pathname === href || (pathname === "/" && href === "/dashboard");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-150",
                    active
                      ? "bg-gradient-to-r from-[rgb(var(--accent))]/12 to-transparent border"
                      : "hover:bg-white/[0.04] border border-transparent"
                  )}
                  style={active ? { borderColor: 'rgba(var(--accent), 0.2)' } : {}}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute left-0 h-6 w-1 rounded-r-full"
                      style={{ background: accentHex, boxShadow: `0 0 10px ${accentHex}80` }}
                      transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                    />
                  )}
                  <Icon
                    size={17}
                    className="shrink-0"
                    style={{ color: active ? accentHex : undefined }}
                  />
                  <span className={cn("flex-1", active ? (lightMode ? 'text-[#0f172a]' : 'text-white') : 'text-slate-500 group-hover:text-slate-300')}>{label}</span>
                  {badge && (
                    <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ background: `${accentHex}20`, color: accentHex }}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition border",
                pathname === "/settings"
                  ? "bg-white/[0.07] text-white border-white/[0.1]"
                  : "text-slate-500 hover:bg-white/[0.04] border-transparent"
              )}
            >
              <Settings size={17} className="shrink-0" />
              Settings
            </Link>
            <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(var(--accent), 0.12)', background: `linear-gradient(145deg, rgba(var(--accent), 0.08), transparent)` }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accentHex }}>Data Source</p>
              <p className={cn("mt-1 text-xs font-semibold", lightMode ? 'text-[#0f172a]' : 'text-white')}>OpenF1 API v1</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Historical + live</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b glass-nav">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: accentHex }}>Race Command</p>
              <h1 className={cn("mt-0.5 text-xl font-black md:text-2xl", lightMode ? 'text-[#0f172a]' : 'text-white')}>Strategy Intelligence</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-xl border px-4 py-2 sm:flex" style={{ borderColor: 'rgba(0,0,0,0.08)', background: lightMode ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)' }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: accentHex }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: accentHex }} />
                </span>
                <span className="text-xs font-semibold text-slate-600">OpenF1 Live</span>
              </div>
              <Link
                href="/profile"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-slate-500 transition"
                style={{ borderColor: 'rgba(0,0,0,0.08)', background: lightMode ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)' }}
              >
                <Users size={17} />
              </Link>
              <Link
                href="/settings"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-slate-500 transition"
                style={{ borderColor: 'rgba(0,0,0,0.08)', background: lightMode ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)' }}
              >
                <Settings size={17} />
              </Link>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto px-6 pb-3 lg:hidden">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition"
                style={pathname === href ? { borderColor: 'rgba(var(--accent), 0.3)', background: 'rgba(var(--accent), 0.1)', color: accentHex } : { borderColor: 'rgba(0,0,0,0.08)', background: lightMode ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)', color: '#94a3b8' }}
              >
                <Icon size={12} />
                {label}
              </Link>
            ))}
          </div>
        </header>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}