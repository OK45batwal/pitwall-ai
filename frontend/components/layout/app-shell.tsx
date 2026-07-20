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
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";
import { useState } from "react";

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

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/live-race": "Live Race",
  "/drivers": "Drivers",
  "/teams": "Teams",
  "/strategy": "Strategy",
  "/ai-predictions": "AI Predictions",
  "/history": "Race History",
  "/weather": "Weather",
  "/profile": "Profile",
  "/settings": "Settings",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { config, mounted } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const accentHex = mounted
    ? (config.accent === 'orange' ? '#ff8700' : config.accent === 'blue' ? '#00b8ff' : config.accent === 'red' ? '#e8002d' : '#00da7a')
    : '#ff8700';

  const pageTitle = pageTitles[pathname] ?? "PitWall AI";

  function NavLink({ href, label, icon: Icon, badge }: typeof nav[number]) {
    const active = pathname === href || (pathname === "/" && href === "/dashboard");
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
          active
            ? "text-white"
            : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
        )}
      >
        {active && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute inset-0 rounded-lg"
            style={{ background: `${accentHex}12`, border: `1px solid ${accentHex}25` }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
          />
        )}
        <Icon size={16} className="shrink-0 relative" style={{ color: active ? accentHex : undefined }} />
        <span className="relative">{label}</span>
        {badge && (
          <span
            className="relative ml-auto rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ background: `${accentHex}18`, color: accentHex }}
          >
            {badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 glass-nav lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-6">
          <div className="h-8 w-8 shrink-0 rounded-lg overflow-hidden" style={{ boxShadow: `0 0 12px ${accentHex}30` }}>
            <img src="/logo.png" alt="" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="text-base font-black tracking-tight text-white">
              Pit<span style={{ color: accentHex }}>Wall</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="f1-live-dot" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: accentHex }}>AI Strategy</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {nav.map((item) => <NavLink key={item.href} {...item} />)}
        </nav>

        <div className="px-3 pb-4 space-y-1">
          <NavLink href="/settings" label="Settings" icon={Settings} />
          <div className="mt-3 rounded-lg border p-3" style={{ borderColor: `${accentHex}15`, background: `linear-gradient(135deg, ${accentHex}08, transparent)` }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: accentHex }}>Data Source</p>
            <p className="mt-0.5 text-xs font-semibold text-white">OpenF1 API</p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-56 glass-nav lg:hidden transition-transform duration-200",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-4 pt-5 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 shrink-0 rounded-lg overflow-hidden" style={{ boxShadow: `0 0 12px ${accentHex}30` }}>
              <img src="/logo.png" alt="" className="h-full w-full object-contain" />
            </div>
            <div className="text-base font-black tracking-tight text-white">
              Pit<span style={{ color: accentHex }}>Wall</span>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-slate-500 p-1">
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-0.5 px-3">
          {nav.map((item) => <NavLink key={item.href} {...item} />)}
          <NavLink href="/settings" label="Settings" icon={Settings} />
        </nav>
      </aside>

      <div className="lg:pl-56">
        <header className="sticky top-0 z-20 border-b" style={{ background: 'rgba(6, 8, 15, 0.92)', borderColor: 'var(--border)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-500 p-1 -ml-1">
                <Menu size={18} />
              </button>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: accentHex }}>{pageTitle}</p>
                <h1 className="text-lg font-bold text-white">Strategy Intelligence</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-lg border px-3 py-1.5 sm:flex" style={{ borderColor: 'var(--border)' }}>
                <span className="f1-live-dot" />
                <span className="text-xs font-medium text-slate-500">OpenF1</span>
              </div>
              <Link href="/settings" className="grid h-8 w-8 place-items-center rounded-lg border text-slate-500 hover:text-slate-300 transition" style={{ borderColor: 'var(--border)' }}>
                <Settings size={15} />
              </Link>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto px-5 pb-3 lg:hidden">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition"
                style={pathname === href ? { borderColor: `${accentHex}40`, background: `${accentHex}12`, color: accentHex } : { borderColor: 'var(--border)', color: '#94a3b8' }}
              >
                <Icon size={12} />
                {label}
              </Link>
            ))}
          </div>
        </header>

        <motion.main
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="p-5"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}