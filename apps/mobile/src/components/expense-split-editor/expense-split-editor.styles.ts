import {Opacity, Radius, Sizes, Spacing, StaticColors, Typography, Theme} from "@/constants/theme";
import {Platform, StyleSheet} from "react-native";

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    sectionLabel: {
      ...Typography.overline,
      color: theme.textSecondary,
      marginBottom: Spacing.sm,
    },

    // ----- Split mode segmented control -----
    segmentGroup: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundElement,
      borderRadius: Radius.lg,
      padding: Spacing.xxs,
      marginBottom: Spacing.lg,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
    },
    segmentActive: {
      backgroundColor: theme.surface,
    },
    segmentText: {
      ...Typography.bodyStrong,
      color: theme.textSecondary,
    },
    segmentTextActive: {
      color: theme.primary,
    },

    // ----- Members -----
    membersCard: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.lg,
      overflow: 'hidden',
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
    memberToggle: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    checkbox: {
      width: Sizes.checkbox,
      height: Sizes.checkbox,
      borderRadius: Radius.sm,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    checkboxCheck: {
      color: StaticColors.white,
      fontSize: 13,
      lineHeight: 16,
      fontWeight: 700,
    },
    memberName: {
      flex: 1,
      ...Typography.bodyStrong,
      color: theme.text,
    },
    memberAmount: {
      ...Typography.bodyStrong,
      color: theme.text,
    },
    memberAmountZero: {
      color: theme.textSecondary,
    },

    // ----- Inline editable share (exact / percent modes) -----
    editWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    editInput: {
      ...Typography.bodyStrong,
      color: theme.text,
      textAlign: 'right',
      width: 72,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.md,
      ...Platform.select({
        web: { outlineStyle: 'none' } as object,
      }),
    },
    editAffix: {
      ...Typography.body,
      color: theme.textSecondary,
    },
    resolvedShare: {
      ...Typography.caption,
      color: theme.textSecondary,
      minWidth: 64,
      textAlign: 'right',
    },

    pressed: {
      opacity: Opacity.pressed,
    },
  });
