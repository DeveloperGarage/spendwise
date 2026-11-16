import { StyleSheet } from 'react-native';

import {
  Opacity,
  Radius,
  Spacing,
  Typography,
  type Theme,
} from '@/constants/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    section: {
      gap: Spacing.lg,
    },
    list: {
      gap: Spacing.md,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1,
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    nameBlock: {
      flex: 1,
      gap: Spacing.xxs,
    },
    name: {
      ...Typography.bodyStrong,
      color: theme.text,
    },
    youLabel: {
      ...Typography.small,
      color: theme.textSecondary,
    },
    status: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    amount: {
      ...Typography.bodyStrong,
    },
    amountPositive: {
      color: theme.positive,
    },
    amountNegative: {
      color: theme.negative,
    },
    amountSettled: {
      color: theme.textSecondary,
    },
    suggestionHeading: {
      ...Typography.bodyStrong,
      color: theme.text,
      marginTop: Spacing.sm,
    },
    suggestionList: {
      gap: Spacing.sm,
    },
    suggestionRow: {
      ...Typography.body,
      color: theme.text,
      padding: Spacing.md,
      borderRadius: Radius.lg,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    empty: {
      ...Typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.huge,
    },
    error: {
      ...Typography.body,
      color: theme.negative,
      textAlign: 'center',
      paddingVertical: Spacing.huge,
    },
    loading: {
      ...Typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.huge,
    },
    pressed: {
      opacity: Opacity.pressed,
    },
  });