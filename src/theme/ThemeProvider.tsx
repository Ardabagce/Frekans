import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette, type Palette } from './palette';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  palette: Palette;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  cyclePreference: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ORDER: ThemePreference[] = ['system', 'light', 'dark'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  // Faz 2'de kalıcı ayarlara taşınacak.
  const [preference, setPreference] = useState<ThemePreference>('system');

  const value = useMemo<ThemeContextValue>(() => {
    const resolved = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
    return {
      palette: resolved === 'dark' ? darkPalette : lightPalette,
      preference,
      setPreference,
      cyclePreference: () =>
        setPreference((p) => ORDER[(ORDER.indexOf(p) + 1) % ORDER.length] ?? 'system'),
    };
  }, [preference, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme, ThemeProvider içinde kullanılmalı');
  return ctx;
}
