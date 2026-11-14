import { StyleSheet } from 'react-native';

import {
  Opacity,
  Radius,
  Spacing,
  StaticColors,
  Typography,
  type Theme,
} from '@/constants/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // ----- Header -----
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    backChevron: {
      ...Typography.heading,
      color: theme.text,
    },
    headerTitle: {
      ...Typography.subheading,
      color: theme.text,
    },

    // ----- Scroll body -----
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: Spacing.lg,
    },

    // ----- Balance banner -----
    banner: {
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bannerLabel: {
      ...Typography.caption,
      color: StaticColors.onBrandMuted,
    },
    bannerValue: {
      ...Typography.display,
      color: StaticColors.white,
      marginTop: Spacing.xs,
    },
    bannerPositive: {
      color: theme.positive,
    },
    bannerNegative: {
      color: theme.negative,
    },
    settleButton: {
      backgroundColor: StaticColors.white,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    settleButtonText: {
      ...Typography.bodyStrong,
      color: theme.primary,
    },

    // ----- Tabs -----
    tabs: {
      flexDirection: 'row',
      gap: Spacing.xl,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      marginBottom: Spacing.lg,
    },
    tab: {
      paddingBottom: Spacing.sm,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: theme.primary,
    },
    tabText: {
      ...Typography.body,
      color: theme.textSecondary,
    },
    tabTextActive: {
      ...Typography.bodyStrong,
      color: theme.text,
    },

    // ----- Placeholder tabs -----
    placeholder: {
      ...Typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.huge,
    },

    // ----- Footer -----
    footer: {
      paddingTop: Spacing.md,
    },

    pressed: {
      opacity: Opacity.pressed,
    },
  });
