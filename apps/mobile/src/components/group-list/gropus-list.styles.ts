import {Opacity, Radius, Sizes, Spacing, Typography, Theme} from "@/constants/theme";
import {StyleSheet} from "react-native";

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
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
    }
  });