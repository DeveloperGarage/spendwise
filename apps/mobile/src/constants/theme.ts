/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1C1A2E',
    background: '#F6F7FB',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#6E7191',
    primary: '#6C5CE7',
    primaryText: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#E2E3EC',
    positive: '#15994F',
    negative: '#E5484D',
    avatarSurface: '#E9EEFB',
  },
  dark: {
    text: '#F3F2FB',
    background: '#121122',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#A29FC2',
    primary: '#8B7CFF',
    primaryText: '#14121F',
    surface: '#211F33',
    border: '#312E47',
    positive: '#4ADE80',
    negative: '#FF6369',
    avatarSurface: '#2A2747',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** A resolved color palette (light or dark) as returned by `useTheme`. */
export type Theme = (typeof Colors)[keyof typeof Colors];

/** Colors that stay the same in light and dark mode (e.g. text on the brand gradient). */
export const StaticColors = {
  white: '#FFFFFF',
  onBrandMuted: 'rgba(255,255,255,0.8)',
  onBrandBorder: 'rgba(255,255,255,0.35)',
  brandGradient: ['#6C5CE7', '#8B7CF6'] as const,
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const Radius = {
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const Sizes = {
  avatarSm: 40,
  avatarMd: 44,
  buttonHeight: 56,
  contentMaxWidth: 440,
} as const;

export const Opacity = {
  pressed: 0.7,
  pressedSubtle: 0.85,
  disabled: 0.5,
} as const;

export const Typography = {
  display: { fontSize: 34, lineHeight: 42, fontWeight: 700 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: 700 },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: 700 },
  subheading: { fontSize: 17, lineHeight: 22, fontWeight: 700 },
  button: { fontSize: 17, lineHeight: 22, fontWeight: 700 },
  bodyStrong: { fontSize: 15, lineHeight: 20, fontWeight: 700 },
  body: { fontSize: 14, lineHeight: 20, fontWeight: 500 },
  link: { fontSize: 14, lineHeight: 20, fontWeight: 600 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: 500 },
  small: { fontSize: 12, lineHeight: 16, fontWeight: 500 },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: 700, letterSpacing: 0.8 },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
