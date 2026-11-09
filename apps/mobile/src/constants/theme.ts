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
<<<<<<< Updated upstream
=======
    infoSurface: '#E9F2FE',
    infoAccent: '#3B82F6',
    danger: '#E5484D',
>>>>>>> Stashed changes
    border: '#E2E3EC',
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
<<<<<<< Updated upstream
=======
    infoSurface: '#192B40',
    infoAccent: '#5B9DF9',
    danger: '#FF6369',
>>>>>>> Stashed changes
    border: '#312E47',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
