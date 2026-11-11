import { StyleSheet } from 'react-native';

import { Radius, Sizes, Spacing, Typography, type Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
    },
    card: {
      width: '100%',
      maxWidth: Sizes.contentMaxWidth,
      paddingHorizontal: Spacing.xxl,
      paddingTop: Spacing.huge,
      gap: Spacing.lg,
    },
    title: {
      ...Typography.title,
      color: theme.text,
    },
    subtitle: {
      ...Typography.body,
      color: theme.textSecondary,
    },
    input: {
      minHeight: Sizes.buttonHeight,
      borderRadius: Radius.lg,
      borderWidth: 1,
      paddingHorizontal: Spacing.lg,
      fontSize: Typography.subheading.fontSize,
      color: theme.text,
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    error: {
      ...Typography.caption,
      color: theme.negative,
    },
  });
