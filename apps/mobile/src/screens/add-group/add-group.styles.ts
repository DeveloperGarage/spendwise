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
    // ----- Header -----
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

    // ----- Fields -----
    fieldBlock: {
      marginBottom: Spacing.lg,
    },
    sectionLabel: {
      ...Typography.caption,
      color: theme.textSecondary,
      marginBottom: Spacing.sm,
    },
    input: {
      ...Typography.body,
      color: theme.text,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      minHeight: Sizes.buttonHeight,
    },

    // ----- Members -----
    membersCard: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      marginBottom: Spacing.lg,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    memberRowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    memberAvatar: {
      width: Sizes.avatarSm,
      height: Sizes.avatarSm,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.avatarSurface,
    },
    memberAvatarText: {
      ...Typography.subheading,
      color: theme.primary,
    },
    memberName: {
      flex: 1,
      ...Typography.bodyStrong,
      color: theme.text,
    },
    memberRemove: {
      ...Typography.heading,
      color: theme.textSecondary,
    },
    membersEmpty: {
      ...Typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.xl,
    },

    // ----- Email member input -----
    emailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    emailInput: {
      flex: 1,
    },
    confirmButton: {
      width: Sizes.buttonHeight,
      height: Sizes.buttonHeight,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
    },
    confirmButtonDisabled: {
      opacity: Opacity.disabled,
    },
    confirmButtonText: {
      ...Typography.heading,
      color: theme.primaryText,
    },

    // ----- Footer -----
    footer: {
      paddingTop: Spacing.md,
    },

    pressed: {
      opacity: Opacity.pressed,
    },
  });
