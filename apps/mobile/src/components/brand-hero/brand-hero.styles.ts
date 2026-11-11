import { StyleSheet } from 'react-native';

import { Spacing, StaticColors } from '@/constants/theme';

export const styles = StyleSheet.create({
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.huge,
    padding: Spacing.huge,
  },
  wordmark: {
    color: StaticColors.white,
    fontSize: 40,
    lineHeight: 46,
    fontWeight: 700,
    letterSpacing: 0.2,
  },
});
