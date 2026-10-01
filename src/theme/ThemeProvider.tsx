import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { updateSettings, useSettings, type ThemePreference } from '@/game/settings';

import { darkPalette, lightPalette, type Palette } from './palette';

export type { ThemePreference };

type ThemeContextValue = {
  palette: Palette;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const { theme: preference } = useSettings();

  const value = useMemo<ThemeContextValue>(() => {
    const resolved = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
    return {
      palette: resolved === 'dark' ? darkPalette : lightPalette,
      preference,
      setPreference: (theme) => updateSettings({ theme }),
    };
  }, [preference, system]);

  // Web: tarayıcı çubuğu rengi uygulama çubuğuyla aynı olsun
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', value.palette.appBar);
    // Çentik / durum çubuğu ve kenar alanları uygulama çubuğu renginde kalsın
    document.documentElement.style.backgroundColor = value.palette.appBar;
    document.body.style.backgroundColor = value.palette.appBar;
  }, [value.palette.appBar]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme, ThemeProvider içinde kullanılmalı');
  return ctx;
}
