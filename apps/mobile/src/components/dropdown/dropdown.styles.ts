import { StyleSheet } from 'react-native';

import {
  Opacity,
  Radius,
  Sizes,
  Spacing,
  Typography,
  type Theme,
} from '@/constants/theme';

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
    placeholder: {
      ...Typography.bodyStrong,
      color: theme.textSecondary,
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
      overflow: 'hidden',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    optionDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    optionSelected: {
      backgroundColor: theme.accentSurface,
    },
    optionLabel: {
      ...Typography.body,
      color: theme.text,
    },
    optionCheck: {
      ...Typography.bodyStrong,
      color: theme.primary,
    },
    empty: {
      ...Typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.lg,
    },
    pressed: {
      opacity: Opacity.pressed,
    },
  });
