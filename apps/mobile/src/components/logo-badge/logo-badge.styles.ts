import { StyleSheet } from 'react-native';

import { StaticColors } from '@/constants/theme';

/** Corner radius and glyph scale proportionally with the badge size. */
const RADIUS_RATIO = 0.3;
const GLYPH_RATIO = 0.44;

export const createStyles = (size: number) =>
  StyleSheet.create({
    base: {
      width: size,
      height: size,
      borderRadius: Math.round(size * RADIUS_RATIO),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: StaticColors.onBrandBorder,
    },
    glyph: {
      color: StaticColors.white,
      fontSize: Math.round(size * GLYPH_RATIO),
      fontWeight: 700,
    },
  });
