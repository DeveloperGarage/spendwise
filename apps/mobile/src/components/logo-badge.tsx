import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';

/** Spendwise brand gradient. Theme-independent by design. */
export const BRAND_GRADIENT = ['#6C5CE7', '#8B7CF6'] as const;

type LogoBadgeProps = {
  /** Square side length in px. Radius and glyph scale from this. */
  size?: number;
};

/** The Spendwise mark: a solid brand-gradient square with the ₹ glyph. */
export function LogoBadge({ size = 64 }: LogoBadgeProps) {
  return (
    <LinearGradient
      colors={BRAND_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: Math.round(size * 0.3) },
      ]}>
      <Text style={[styles.glyph, { fontSize: Math.round(size * 0.44) }]}>₹</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  glyph: {
    color: '#FFFFFF',
    fontWeight: 700,
  },
});
