'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light' | 'carbon';
export type AccentColor = 'orange' | 'blue' | 'red' | 'green';
export type FontSize = 'sm' | 'md' | 'lg';
export type ContentDensity = 'compact' | 'normal' | 'spacious';

export interface ThemeConfig {
  mode: ThemeMode;
  accent: AccentColor;
  fontSize: FontSize;
  density: ContentDensity;
}

interface ThemeContextValue {
  config: ThemeConfig;
  updateConfig: (partial: Partial<ThemeConfig>) => void;
  resetConfig: () => void;
  mounted: boolean;
}

const DEFAULT_CONFIG: ThemeConfig = {
  mode: 'dark',
  accent: 'orange',
  fontSize: 'md',
  density: 'normal',
};

const ACCENT_COLORS = {
  orange: { hex: '#ff8700', css: '255, 135, 0' },
  blue: { hex: '#2dd4ff', css: '45, 212, 255' },
  red: { hex: '#ff254a', css: '255, 37, 74' },
  green: { hex: '#19d084', css: '25, 208, 132' },
};

const STORAGE_KEY = 'pitwall-theme-v2';

const ThemeContext = createContext<ThemeContextValue>({
  config: DEFAULT_CONFIG,
  updateConfig: () => {},
  resetConfig: () => {},
  mounted: false,
});

function loadConfig(): ThemeConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(config: ThemeConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

function applyCSSVars(config: ThemeConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const accent = ACCENT_COLORS[config.accent];
  root.style.setProperty('--accent', accent.css);
  root.style.setProperty('--accent-hex', accent.hex);

  const fontSizes = { sm: '13px', md: '14px', lg: '15px' };
  root.style.fontSize = fontSizes[config.fontSize];

  const densityPadding = { compact: '0.75rem', normal: '1rem', spacious: '1.5rem' };
  root.style.setProperty('--density-padding', densityPadding[config.density]);

  document.body.classList.remove('theme-carbon', 'theme-light');
  if (config.mode === 'carbon') {
    document.body.classList.add('theme-carbon');
  } else if (config.mode === 'light') {
    document.body.classList.add('theme-light');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_CONFIG);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loaded = loadConfig();
    setConfig(loaded);
    applyCSSVars(loaded);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      applyCSSVars(config);
      saveConfig(config);
    }
  }, [config, mounted]);

  const updateConfig = (partial: Partial<ThemeConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return (
    <ThemeContext.Provider value={{ config, updateConfig, resetConfig, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { ACCENT_COLORS };