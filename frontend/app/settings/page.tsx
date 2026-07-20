'use client';

import { useState } from 'react';
import { Palette, Type, LayoutGrid, RotateCcw, Check, Monitor, Sun, Layers } from 'lucide-react';
import { useTheme, type ThemeMode, type AccentColor, type FontSize, type ContentDensity, ACCENT_COLORS } from '@/lib/theme-context';

export default function SettingsPage() {
  const { config, updateConfig, resetConfig } = useTheme();
  const [saved, setSaved] = useState(false);

  const modes: { value: ThemeMode; label: string; icon: typeof Monitor; desc: string }[] = [
    { value: 'dark', label: 'Dark', icon: Monitor, desc: 'Classic dark racing theme' },
    { value: 'light', label: 'Light', icon: Sun, desc: 'High contrast light mode' },
    { value: 'carbon', label: 'Carbon', icon: Layers, desc: 'Carbon fiber with glass panels' },
  ];

  const accents: { value: AccentColor; label: string; hex: string }[] = [
    { value: 'orange', label: 'McLaren Orange', hex: '#ff8700' },
    { value: 'blue', label: 'Electric Blue', hex: '#2dd4ff' },
    { value: 'red', label: 'Racing Red', hex: '#ff254a' },
    { value: 'green', label: 'Racing Green', hex: '#19d084' },
  ];

  const fontSizes: { value: FontSize; label: string; sample: string }[] = [
    { value: 'sm', label: 'Compact', sample: 'Aa' },
    { value: 'md', label: 'Standard', sample: 'Aa' },
    { value: 'lg', label: 'Comfortable', sample: 'Aa' },
  ];

  const densities: { value: ContentDensity; label: string; desc: string }[] = [
    { value: 'compact', label: 'Compact', desc: 'More data, less whitespace' },
    { value: 'normal', label: 'Standard', desc: 'Balanced layout' },
    { value: 'spacious', label: 'Spacious', desc: 'Relaxed with breathing room' },
  ];

  const handleChange = (partial: Parameters<typeof updateConfig>[0]) => {
    updateConfig(partial);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[rgb(var(--accent))]">Configuration</p>
          <h1 className="mt-1 text-2xl font-black text-white">Appearance</h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 rounded-lg bg-racingGreen/15 px-3 py-1.5 text-xs font-semibold text-racingGreen">
              <Check size={12} />
              Saved
            </span>
          )}
          <button
            onClick={resetConfig}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgb(var(--accent))]/10">
              <Monitor size={18} className="text-[rgb(var(--accent))]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Theme Mode</h2>
              <p className="text-xs text-slate-500">Choose your display mode</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {modes.map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                onClick={() => handleChange({ mode: value })}
                className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                  config.mode === value
                    ? 'accent-border bg-[rgb(var(--accent))]/5'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]'
                }`}
              >
                {config.mode === value && (
                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[rgb(var(--accent))]">
                    <Check size={10} className="text-black" />
                  </span>
                )}
                <Icon size={20} className={config.mode === value ? 'text-[rgb(var(--accent))]' : 'text-slate-400'} />
                <div className="text-center">
                  <p className={`text-sm font-bold ${config.mode === value ? 'text-white' : 'text-slate-300'}`}>{label}</p>
                  <p className="mt-1 text-[10px] text-slate-600">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgb(var(--accent))]/10">
              <Palette size={18} className="text-[rgb(var(--accent))]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Accent Color</h2>
              <p className="text-xs text-slate-500">Primary highlight color</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {accents.map(({ value, label, hex }) => (
              <button
                key={value}
                onClick={() => handleChange({ accent: value })}
                className={`relative flex items-center gap-3 rounded-xl border p-4 transition ${
                  config.accent === value
                    ? 'border-white/[0.2] bg-white/[0.05]'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]'
                }`}
              >
                <span
                  className="h-8 w-8 shrink-0 rounded-lg shadow-[0_0_12px_rgba(0,0,0,0.3)]"
                  style={{ background: hex, boxShadow: config.accent === value ? `0 0 16px ${hex}60` : 'none' }}
                />
                {config.accent === value && (
                  <span className="absolute right-3 top-3 grid h-4 w-4 place-items-center rounded-full bg-white/20">
                    <Check size={9} className="text-white" />
                  </span>
                )}
                <div className="text-left">
                  <p className={`text-sm font-semibold ${config.accent === value ? 'text-white' : 'text-slate-300'}`}>{label}</p>
                  <p className="font-mono text-[10px] text-slate-600">{hex}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgb(var(--accent))]/10">
              <Type size={18} className="text-[rgb(var(--accent))]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Font Size</h2>
              <p className="text-xs text-slate-500">Adjust text scale</p>
            </div>
          </div>
          <div className="flex gap-3">
            {fontSizes.map(({ value, label, sample }) => (
              <button
                key={value}
                onClick={() => handleChange({ fontSize: value })}
                className={`flex flex-1 flex-col items-center gap-2 rounded-xl border p-4 transition ${
                  config.fontSize === value
                    ? 'accent-border bg-[rgb(var(--accent))]/5'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]'
                }`}
              >
                <span className={`font-bold ${value === 'sm' ? 'text-sm' : value === 'md' ? 'text-base' : 'text-lg'} ${config.fontSize === value ? 'text-white' : 'text-slate-400'}`}>{sample}</span>
                <p className={`text-xs font-semibold ${config.fontSize === value ? 'text-white' : 'text-slate-500'}`}>{label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgb(var(--accent))]/10">
              <LayoutGrid size={18} className="text-[rgb(var(--accent))]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Content Density</h2>
              <p className="text-xs text-slate-500">Spacing between elements</p>
            </div>
          </div>
          <div className="flex gap-3">
            {densities.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => handleChange({ density: value })}
                className={`flex flex-1 flex-col items-center gap-2 rounded-xl border p-4 transition ${
                  config.density === value
                    ? 'accent-border bg-[rgb(var(--accent))]/5'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]'
                }`}
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`h-5 rounded-sm ${config.density === value ? 'bg-[rgb(var(--accent))]' : 'bg-white/20'}`}
                      style={{ width: value === 'compact' ? '20px' : value === 'normal' ? '16px' : '12px', opacity: config.density === value ? 1 : 0.5 }}
                    />
                  ))}
                </div>
                <p className={`text-xs font-semibold ${config.density === value ? 'text-white' : 'text-slate-500'}`}>{label}</p>
                <p className="text-[10px] text-slate-600">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card-subtle rounded-2xl border border-white/[0.07] p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Preview</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Primary', value: 'PitWall AI', color: 'text-white' },
            { label: 'Accent', value: '#ff8700', color: 'text-[rgb(var(--accent))]' },
            { label: 'Secondary', value: 'Carbon fiber', color: 'text-slate-400' },
            { label: 'Glass', value: 'Blur + border', color: 'text-slate-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
              <p className={`mt-1 font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}