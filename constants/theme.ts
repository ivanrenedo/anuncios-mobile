import {
  createContext,
  createElement,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { useProfile } from '@/hooks/useProfile';

export interface ThemeColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  primaryFixed: string;
  primaryFixedDim: string;
  inversePrimary: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  secondaryFixed: string;
  secondaryFixedDim: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  tertiaryFixed: string;
  tertiaryFixedDim: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceBright: string;
  surfaceDim: string;
  surfaceContainer: string;
  surfaceContainerLow: string;
  surfaceContainerLowest: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  inverseSurface: string;
  inverseOnSurface: string;
  surfaceTint: string;
  outline: string;
  outlineVariant: string;
}

export const lightColors: ThemeColors = {
  primary: '#006b5e',
  onPrimary: '#ffffff',
  primaryContainer: '#13c1ac',
  onPrimaryContainer: '#004940',
  primaryFixed: '#69f9e2',
  primaryFixedDim: '#46dcc6',
  inversePrimary: '#46dcc6',
  secondary: '#0058bc',
  onSecondary: '#ffffff',
  secondaryContainer: '#0070eb',
  onSecondaryContainer: '#fefcff',
  secondaryFixed: '#d8e2ff',
  secondaryFixedDim: '#adc6ff',
  tertiary: '#8c5000',
  onTertiary: '#ffffff',
  tertiaryContainer: '#fb9300',
  onTertiaryContainer: '#613600',
  tertiaryFixed: '#ffdcbf',
  tertiaryFixedDim: '#ffb874',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  background: '#faf9fe',
  onBackground: '#1a1b1f',
  surface: '#faf9fe',
  onSurface: '#1a1b1f',
  surfaceVariant: '#e3e2e7',
  onSurfaceVariant: '#3c4a46',
  surfaceBright: '#faf9fe',
  surfaceDim: '#dad9df',
  surfaceContainer: '#eeedf3',
  surfaceContainerLow: '#f4f3f8',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHigh: '#e9e7ed',
  surfaceContainerHighest: '#e3e2e7',
  inverseSurface: '#2f3034',
  inverseOnSurface: '#f1f0f5',
  surfaceTint: '#006b5e',
  outline: '#6c7a76',
  outlineVariant: '#bbcac5',
};

// Dark palette. Note: surface tokens are tuned to the way the app *uses* them
// (surfaceContainerLowest = the "card" surface that should pop above the page),
// not to strict M3 elevation ordering. Accents are brightened for legibility.
export const darkColors: ThemeColors = {
  primary: '#13c1ac',
  onPrimary: '#00201c',
  primaryContainer: '#0a9d8b',
  onPrimaryContainer: '#b6fff3',
  primaryFixed: '#69f9e2',
  primaryFixedDim: '#46dcc6',
  inversePrimary: '#006b5e',
  secondary: '#7fb0ff',
  onSecondary: '#00316e',
  secondaryContainer: '#0070eb',
  onSecondaryContainer: '#dbe8ff',
  secondaryFixed: '#d8e2ff',
  secondaryFixedDim: '#adc6ff',
  tertiary: '#ffb874',
  onTertiary: '#4a2800',
  tertiaryContainer: '#fb9300',
  onTertiaryContainer: '#2a1700',
  tertiaryFixed: '#ffdcbf',
  tertiaryFixedDim: '#ffb874',
  error: '#ff5449',
  onError: '#ffffff',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  background: '#0f1213',
  onBackground: '#e3e2e6',
  surface: '#0f1213',
  onSurface: '#e3e2e6',
  surfaceVariant: '#3f4845',
  onSurfaceVariant: '#bfc9c4',
  surfaceBright: '#353839',
  surfaceDim: '#0f1213',
  surfaceContainer: '#1c1f20',
  surfaceContainerLow: '#171a1b',
  surfaceContainerLowest: '#1e2123',
  surfaceContainerHigh: '#262a2b',
  surfaceContainerHighest: '#313537',
  inverseSurface: '#e3e2e6',
  inverseOnSurface: '#2f3133',
  surfaceTint: '#13c1ac',
  outline: '#89938f',
  outlineVariant: '#3f4845',
};

export type ColorScheme = 'light' | 'dark';

interface ThemeContextValue {
  colors: ThemeColors;
  scheme: ColorScheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  scheme: 'light',
  isDark: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const systemScheme = useColorScheme();
  const preference = profile?.theme_preference ?? 'system';
  const isDark =
    preference === 'dark' ||
    (preference === 'system' && systemScheme === 'dark');
  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      scheme: isDark ? 'dark' : 'light',
      isDark,
    }),
    [isDark]
  );
  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/** Build a StyleSheet from the active palette, memoized per theme. */
export function useThemedStyles<T>(factory: (c: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors]);
}

/**
 * Static light palette kept for backwards compatibility and for module-level
 * accent constants (brand colors). Prefer `useTheme()` inside components.
 */
export const colors: ThemeColors = lightColors;
