import { StyleSheet } from 'react-native';

import { Opacity, Radius, Sizes, Spacing, Typography, type Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      minHeight: Sizes.buttonHeight,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: {
      backgroundColor: theme.primary,
    },
    secondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pressed: {
      opacity: Opacity.pressedSubtle,
    },
    disabled: {
      opacity: Opacity.disabled,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    label: {
      ...Typography.button,
    },
    labelPrimary: {
      color: theme.primaryText,
    },
    labelSecondary: {
      color: theme.text,
    },
  });
