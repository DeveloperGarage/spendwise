import { StyleSheet } from 'react-native';

import { Radius, Spacing, Typography, type Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      gap: Spacing.lg,
    },
    totalCard: {
      padding: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      gap: Spacing.xxs,
    },
    totalLabel: {
      ...Typography.caption,
      color: theme.textSecondary,
      textTransform: 'uppercase',
    },
    totalValue: {
      ...Typography.heading,
      color: theme.text,
    },
    section: {
      gap: Spacing.sm,
    },
    sectionTitle: {
      ...Typography.caption,
      color: theme.textSecondary,
      textTransform: 'uppercase',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
    },
    rowName: {
      ...Typography.body,
      color: theme.text,
      flex: 1,
    },
    rowAmount: {
      ...Typography.bodyStrong,
      color: theme.text,
    },
    loading: {
      ...Typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.xxl,
    },
    error: {
      ...Typography.body,
      color: theme.negative,
      textAlign: 'center',
      paddingVertical: Spacing.xxl,
    },
    empty: {
      ...Typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.xxl,
    },
  });