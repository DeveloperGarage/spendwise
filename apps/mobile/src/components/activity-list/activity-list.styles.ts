import { StyleSheet } from 'react-native';

import { Radius, Spacing, Typography, type Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    list: {
      gap: Spacing.md,
    },
    card: {
      padding: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1,
      backgroundColor: theme.surface,
      borderColor: theme.border,
      gap: Spacing.xxs,
    },
    cardVoided: {
      opacity: 0.85,
    },
    title: {
      ...Typography.bodyStrong,
      color: theme.text,
    },
    titleVoided: {
      color: theme.textSecondary,
    },
    at: {
      ...Typography.caption,
      color: theme.textSecondary,
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
  });