import { StyleSheet } from 'react-native';

import { Opacity, Radius, Sizes, Spacing, Typography, type Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      minHeight: Sizes.buttonHeight,
    },
    triggerOpen: {
      borderColor: theme.primary,
    },
    label: {
      ...Typography.body,
      color: theme.textSecondary,
    },
    valueWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    value: {
      ...Typography.bodyStrong,
      color: theme.text,
    },
    caret: {
      ...Typography.bodyStrong,
      color: theme.textSecondary,
    },
    panel: {
      marginTop: Spacing.xs,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.lg,
      padding: Spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    monthLabel: {
      ...Typography.bodyStrong,
      color: theme.text,
    },
    navButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navLabel: {
      ...Typography.heading,
      color: theme.textSecondary,
      lineHeight: 28,
    },
    weekRow: {
      flexDirection: 'row',
    },
    weekday: {
      flex: 1,
      textAlign: 'center',
      ...Typography.small,
      color: theme.textSecondary,
      paddingVertical: Spacing.xs,
    },
    day: {
      flex: 1,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.sm,
    },
    daySelected: {
      backgroundColor: theme.primary,
    },
    dayText: {
      ...Typography.body,
      color: theme.text,
    },
    dayTextMuted: {
      color: theme.textSecondary,
    },
    dayTextSelected: {
      ...Typography.bodyStrong,
      color: theme.primaryText,
    },
    pressed: {
      opacity: Opacity.pressed,
    },
  });
