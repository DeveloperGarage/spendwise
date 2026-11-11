import { StyleSheet } from 'react-native';

import {
  Opacity,
  Radius,
  Sizes,
  Spacing,
  StaticColors,
  Typography,
  type Theme,
} from '@/constants/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.lg,
    },

    // ----- Header -----
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xl,
    },
    headerText: {
      gap: Spacing.xxs,
    },
    greeting: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    name: {
      ...Typography.heading,
      color: theme.text,
    },
    avatar: {
      width: Sizes.avatarMd,
      height: Sizes.avatarMd,
      borderRadius: Radius.full,
      backgroundColor: theme.avatarSurface,
    },

    // ----- Net balance card -----
    balanceCard: {
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.xxl,
    },
    balanceLabel: {
      ...Typography.overline,
      color: StaticColors.onBrandMuted,
    },
    balanceValue: {
      ...Typography.display,
      color: StaticColors.white,
      marginTop: Spacing.sm,
    },
    balanceBreakdown: {
      flexDirection: 'row',
      gap: Spacing.huge,
      marginTop: Spacing.lg,
    },
    balanceColumn: {
      gap: Spacing.xs,
    },
    balanceColumnLabel: {
      ...Typography.small,
      color: StaticColors.onBrandMuted,
    },
    balanceColumnValue: {
      ...Typography.bodyStrong,
      color: StaticColors.white,
    },

    // ----- Groups -----
    groupsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    groupsTitle: {
      ...Typography.subheading,
      color: theme.text,
    },
    seeAll: {
      ...Typography.link,
      color: theme.primary,
    },
    groupList: {
      gap: Spacing.md,
    },
    groupCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1,
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    groupAvatar: {
      width: Sizes.avatarSm,
      height: Sizes.avatarSm,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.avatarSurface,
    },
    groupAvatarText: {
      ...Typography.subheading,
      color: theme.textSecondary,
    },
    groupInfo: {
      flex: 1,
      gap: Spacing.xxs,
    },
    groupName: {
      ...Typography.bodyStrong,
      color: theme.text,
    },
    groupMembers: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    groupAmount: {
      ...Typography.bodyStrong,
    },
    groupAmountPositive: {
      color: theme.positive,
    },
    groupAmountNegative: {
      color: theme.negative,
    },
    pressed: {
      opacity: Opacity.pressed,
    },

    // ----- Footer -----
    footer: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.lg,
    },
  });
