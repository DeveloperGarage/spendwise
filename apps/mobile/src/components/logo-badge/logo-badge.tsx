import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Text } from 'react-native';

import { StaticColors } from '@/constants/theme';

import { createStyles } from './logo-badge.styles';

/** Spendwise brand gradient. Theme-independent by design. */
export const BRAND_GRADIENT = StaticColors.brandGradient;

type LogoBadgeProps = {
  /** Square side length in px. Radius and glyph scale from this. */
  size?: number;
};

/** The Spendwise mark: a solid brand-gradient square with the ₹ glyph. */
export function LogoBadge({ size = 64 }: LogoBadgeProps) {
  const styles = useMemo(() => createStyles(size), [size]);

  return (
    <LinearGradient
      colors={BRAND_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.base}>
      <Text style={styles.glyph}>₹</Text>
    </LinearGradient>
  );
}
