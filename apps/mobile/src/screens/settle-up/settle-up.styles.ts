import { Platform, StyleSheet } from 'react-native';

import { Radius, Spacing, Typography, type Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
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
    amountCard: {
      backgroundColor: theme.accentSurface,
      borderRadius: Radius.xl,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.xl,
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    amountLabel: {
      ...Typography.overline,
      color: theme.primary,
      textAlign: 'center',
    },
    amountInput: {
      ...Typography.display,
      color: theme.text,
      textAlign: 'center',
      marginTop: Spacing.sm,
      paddingVertical: 0,
      minWidth: 160,
      ...Platform.select({
        web: { outlineStyle: 'none' } as object,
      }),
    },
    fieldBlock: {
      marginBottom: Spacing.lg,
    },
    sectionLabel: {
      ...Typography.overline,
      color: theme.textSecondary,
      marginBottom: Spacing.sm,
    },
    error: {
      ...Typography.body,
      color: theme.negative,
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
  });