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
    list: {
      gap: Spacing.md,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1,
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    icon: {
      width: Sizes.avatarSm,
      height: Sizes.avatarSm,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.avatarSurface,
    },
    iconText: {
      ...Typography.subheading,
      color: theme.primary,
    },
    info: {
      flex: 1,
      gap: Spacing.xxs,
    },
    title: {
      ...Typography.bodyStrong,
      color: theme.text,
    },
    subtitle: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    amountWrap: {
      alignItems: 'flex-end',
      gap: Spacing.xxs,
    },
    relationLabel: {
      ...Typography.small,
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
    pressed: {
      opacity: Opacity.pressed,
    },
    empty: {
      ...Typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.xxl,
    },
  });
